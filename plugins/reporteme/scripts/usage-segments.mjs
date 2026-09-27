// Mede o uso de tokens de cada execução do Reporte.me a partir do transcript do
// Claude Code (o servidor MCP não enxerga o consumo do agente).
//
// Formato (verificado em 2026-09-27): JSONL; entradas `type: "assistant"` trazem
// `message.id`, `message.model`, `message.usage` e `timestamp`. A MESMA mensagem
// aparece uma vez por bloco de conteúdo, com o mesmo usage → deduplicar por
// `message.id`. Subagentes gravam em `<sessão>/subagents/agent-*.jsonl`, mesmo
// formato: entram pela janela de tempo.
//
// Trecho de uma task = mensagens com timestamp entre o `tool_use` de
// `start_task(code)` e o de `finish_task(code)` (inclusive). Overhead da
// história = mensagens entre `queue_story_tasks` e `finish_story_run` que não
// caem em nenhum trecho de task.

const TOOL_SUFFIX = /__(start_task|finish_task|queue_story_tasks|finish_story_run)$/

export function parseJsonl(text) {
  const rows = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try {
      rows.push(JSON.parse(line))
    } catch {
      // linha parcial (arquivo ainda sendo escrito) — ignora
    }
  }
  return rows
}

/** Uma mensagem por `message.id`, com o usage normalizado nos baldes de preço. */
export function assistantMessages(rows) {
  const byId = new Map()
  for (const row of rows) {
    const message = row?.message
    if (row?.type !== 'assistant' || !message?.usage || !message.id) continue
    if (byId.has(message.id)) {
      byId.get(message.id).blocks.push(...(Array.isArray(message.content) ? message.content : []))
      continue
    }
    byId.set(message.id, {
      id: message.id,
      model: message.model ?? 'desconhecido',
      at: Date.parse(row.timestamp),
      usage: normalizeUsage(message.usage),
      blocks: Array.isArray(message.content) ? [...message.content] : [],
    })
  }
  return [...byId.values()].filter((m) => Number.isFinite(m.at)).sort((a, b) => a.at - b.at)
}

export function normalizeUsage(usage) {
  const creation = usage.cache_creation ?? {}
  const has5m = typeof creation.ephemeral_5m_input_tokens === 'number'
  const has1h = typeof creation.ephemeral_1h_input_tokens === 'number'
  return {
    input: usage.input_tokens ?? 0,
    output: usage.output_tokens ?? 0,
    cacheWrite5m: has5m || has1h ? (creation.ephemeral_5m_input_tokens ?? 0) : (usage.cache_creation_input_tokens ?? 0),
    cacheWrite1h: creation.ephemeral_1h_input_tokens ?? 0,
    cacheRead: usage.cache_read_input_tokens ?? 0,
  }
}

/** Chamadas às tools do Reporte.me (nome de plugin vem prefixado: casa pelo sufixo). */
export function reportemeCalls(messages) {
  const calls = []
  for (const message of messages) {
    for (const block of message.blocks) {
      if (block?.type !== 'tool_use' || typeof block.name !== 'string') continue
      if (!block.name.includes('reporteme')) continue
      const match = TOOL_SUFFIX.exec(block.name)
      if (!match) continue
      const code = String(block.input?.code ?? block.input?.story_code ?? '')
        .trim()
        .toUpperCase()
      if (code) calls.push({ tool: match[1], code, at: message.at })
    }
  }
  return calls
}

/** Janela [start, finish] mais recente de cada código (reexecução na mesma sessão = última). */
export function segments(calls, openTool, closeTool) {
  const result = new Map()
  const open = new Map()
  for (const call of calls) {
    if (call.tool === openTool) open.set(call.code, call.at)
    if (call.tool === closeTool && open.has(call.code)) {
      result.set(call.code, { from: open.get(call.code), to: call.at })
      open.delete(call.code)
    }
  }
  return result
}

export function sumUsage(messages) {
  const byModel = {}
  for (const m of messages) {
    const acc = (byModel[m.model] ??= { input: 0, output: 0, cacheWrite5m: 0, cacheWrite1h: 0, cacheRead: 0 })
    for (const key of Object.keys(acc)) acc[key] += m.usage[key]
  }
  return byModel
}

const within = (m, w) => m.at >= w.from && m.at <= w.to

/**
 * Relatórios prontos para enviar: uso por task (trecho próprio) e overhead por
 * história. `messages` já inclui os subagentes.
 */
export function buildReports(messages) {
  const calls = reportemeCalls(messages)
  const taskWindows = segments(calls, 'start_task', 'finish_task')
  const storyWindows = segments(calls, 'queue_story_tasks', 'finish_story_run')

  const tasks = [...taskWindows].map(([code, w]) => ({
    code,
    usage: sumUsage(messages.filter((m) => within(m, w))),
  }))
  const stories = [...storyWindows].map(([code, w]) => {
    const inner = [...taskWindows.values()].filter((t) => t.from >= w.from && t.to <= w.to)
    const overhead = messages.filter((m) => within(m, w) && !inner.some((t) => within(m, t)))
    return { code, overhead: sumUsage(overhead) }
  })
  return { tasks, stories }
}
