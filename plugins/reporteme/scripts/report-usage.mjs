#!/usr/bin/env node
// Hook do plugin Reporte.me (PostToolUse de finish_task/finish_story_run e Stop):
// lê o transcript da sessão, mede o uso de cada execução e envia o snapshot ao
// mcp-server (`PUT /v1/tasks/:code/usage`, `PUT /v1/stories/:code/usage`).
// Autentica com o RECIBO que o `finish_*` devolveu (o login OAuth deixa o token
// com o Claude Code); `REPORTEME_TOKEN` só entra se não houver recibo.
// Reenviar é seguro: o servidor substitui o snapshot, nunca soma.
// Nunca bloqueia o agente: qualquer falha sai com código 0 e uma linha no stderr.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

import {
  assistantMessages,
  buildReports,
  finishResult,
  parseJsonl,
  receiptsFromRows,
} from './usage-segments.mjs'

const BASE_URL = (process.env.REPORTEME_URL || 'https://mcp.reporte.me').replace(/\/+$/, '')
const TOKEN = process.env.REPORTEME_TOKEN

async function readStdin() {
  let data = ''
  for await (const chunk of process.stdin) data += chunk
  return data ? JSON.parse(data) : {}
}

function loadRows(transcriptPath) {
  const rows = parseJsonl(readFileSync(transcriptPath, 'utf8'))
  const subagentsDir = join(dirname(transcriptPath), basename(transcriptPath, '.jsonl'), 'subagents')
  if (existsSync(subagentsDir)) {
    for (const file of readdirSync(subagentsDir)) {
      if (file.endsWith('.jsonl')) rows.push(...parseJsonl(readFileSync(join(subagentsDir, file), 'utf8')))
    }
  }
  return rows
}

async function put(path, bearer, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok && res.status !== 409) {
    process.stderr.write(`reporteme: ${path} → HTTP ${res.status}\n`)
  }
}

async function main() {
  const input = await readStdin()
  const transcript = input.transcript_path
  if (!transcript || !existsSync(transcript)) return

  const rows = loadRows(transcript)
  const { tasks, stories } = buildReports(assistantMessages(rows))
  const receipts = receiptsFromRows(rows)
  // PostToolUse: só o código recém-fechado (e o recibo vem na própria resposta).
  // Stop: tudo o que fechou na sessão.
  const onlyCode =
    input.hook_event_name === 'PostToolUse'
      ? String(input.tool_input?.code ?? input.tool_input?.story_code ?? '').trim().toUpperCase()
      : null
  const fresh = onlyCode ? finishResult(input.tool_response) : null
  if (onlyCode && fresh) receipts.set(onlyCode, fresh)
  const client = `claude-code${process.env.CLAUDE_CODE_VERSION ? ` ${process.env.CLAUDE_CODE_VERSION}` : ''}`

  // Recibo → código canônico devolvido pelo servidor; sem recibo, token do ambiente.
  const target = (code) => {
    const receipt = receipts.get(code)
    if (receipt) return { code: receipt.code, bearer: receipt.receipt }
    return TOKEN ? { code, bearer: TOKEN } : null
  }

  for (const task of tasks) {
    if (onlyCode && task.code !== onlyCode) continue
    if (Object.keys(task.usage).length === 0) continue
    const to = target(task.code)
    if (!to) continue
    await put(`/v1/tasks/${encodeURIComponent(to.code)}/usage`, to.bearer, {
      usage: task.usage,
      source: 'transcript',
      client,
    })
  }
  for (const story of stories) {
    if (onlyCode && story.code !== onlyCode) continue
    const to = target(story.code)
    if (!to) continue
    await put(`/v1/stories/${encodeURIComponent(to.code)}/usage`, to.bearer, {
      overhead: story.overhead,
      source: 'transcript',
      client,
    })
  }
}

main().catch((err) => {
  process.stderr.write(`reporteme: uso não enviado (${err?.message ?? err})\n`)
})
