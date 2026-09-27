#!/usr/bin/env node
// Hook do plugin Reporte.me (PostToolUse de finish_task/finish_story_run e Stop):
// lê o transcript da sessão, mede o uso de cada execução e envia o snapshot ao
// mcp-server (`PUT /v1/tasks/:code/usage`, `PUT /v1/stories/:code/usage`).
// Reenviar é seguro: o servidor substitui o snapshot, nunca soma.
// Nunca bloqueia o agente: qualquer falha sai com código 0 e uma linha no stderr.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

import { assistantMessages, buildReports, parseJsonl } from './usage-segments.mjs'

const BASE_URL = (process.env.REPORTEME_URL || 'https://mcp.reporte.me').replace(/\/+$/, '')
const TOKEN = process.env.REPORTEME_TOKEN

async function readStdin() {
  let data = ''
  for await (const chunk of process.stdin) data += chunk
  return data ? JSON.parse(data) : {}
}

function loadMessages(transcriptPath) {
  const rows = parseJsonl(readFileSync(transcriptPath, 'utf8'))
  const subagentsDir = join(dirname(transcriptPath), basename(transcriptPath, '.jsonl'), 'subagents')
  if (existsSync(subagentsDir)) {
    for (const file of readdirSync(subagentsDir)) {
      if (file.endsWith('.jsonl')) rows.push(...parseJsonl(readFileSync(join(subagentsDir, file), 'utf8')))
    }
  }
  return assistantMessages(rows)
}

async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok && res.status !== 409) {
    process.stderr.write(`reporteme: ${path} → HTTP ${res.status}\n`)
  }
}

async function main() {
  if (!TOKEN) return
  const input = await readStdin()
  const transcript = input.transcript_path
  if (!transcript || !existsSync(transcript)) return

  const { tasks, stories } = buildReports(loadMessages(transcript))
  // PostToolUse: só o código recém-fechado. Stop: tudo o que fechou na sessão.
  const onlyCode =
    input.hook_event_name === 'PostToolUse'
      ? String(input.tool_input?.code ?? input.tool_input?.story_code ?? '').toUpperCase()
      : null
  const client = `claude-code${process.env.CLAUDE_CODE_VERSION ? ` ${process.env.CLAUDE_CODE_VERSION}` : ''}`

  for (const task of tasks) {
    if (onlyCode && task.code !== onlyCode) continue
    if (Object.keys(task.usage).length === 0) continue
    await put(`/v1/tasks/${encodeURIComponent(task.code)}/usage`, { usage: task.usage, source: 'transcript', client })
  }
  for (const story of stories) {
    if (onlyCode && story.code !== onlyCode) continue
    await put(`/v1/stories/${encodeURIComponent(story.code)}/usage`, {
      overhead: story.overhead,
      source: 'transcript',
      client,
    })
  }
}

main().catch((err) => {
  process.stderr.write(`reporteme: uso não enviado (${err?.message ?? err})\n`)
})
