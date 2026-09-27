import assert from 'node:assert/strict'
import { test } from 'node:test'

import { assistantMessages, buildReports, normalizeUsage } from './usage-segments.mjs'

const TOOL = 'mcp__plugin_reporteme_reporteme__'
let clock = Date.parse('2026-09-27T12:00:00Z')

/** Uma mensagem do assistant em N registros (um por bloco), como o Claude Code grava. */
function message(id, { input = 0, output = 0, cacheRead = 0, tool, args, model = 'claude-opus-5-5' } = {}) {
  clock += 1000
  const usage = {
    input_tokens: input,
    output_tokens: output,
    cache_read_input_tokens: cacheRead,
    cache_creation_input_tokens: 0,
    cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
  }
  const blocks = [{ type: 'text', text: '…' }]
  if (tool) blocks.push({ type: 'tool_use', id: `tu-${id}`, name: `${TOOL}${tool}`, input: args })
  return blocks.map((block) => ({
    type: 'assistant',
    timestamp: new Date(clock).toISOString(),
    message: { id, model, usage, content: [block] },
  }))
}

test('deduplica por message.id e normaliza os baldes de cache', () => {
  const rows = message('m1', { input: 10, output: 5 }).concat(message('m1', { input: 10, output: 5 }))
  const messages = assistantMessages(rows)
  assert.equal(messages.length, 1)
  assert.deepEqual(
    normalizeUsage({ input_tokens: 1, output_tokens: 2, cache_creation_input_tokens: 7, cache_read_input_tokens: 3 }),
    { input: 1, output: 2, cacheWrite5m: 7, cacheWrite1h: 0, cacheRead: 3 },
  )
})

test('trecho da task = start → finish; overhead da história = o resto da janela', () => {
  const rows = [
    ...message('a', { input: 1 }), // antes da história: fora de tudo
    ...message('b', { input: 100, tool: 'queue_story_tasks', args: { story_code: 'rpm-1' } }),
    ...message('c', { input: 10, tool: 'start_task', args: { code: 'RPM-2' } }),
    ...message('d', { input: 20, output: 5 }),
    ...message('e', { input: 30, tool: 'finish_task', args: { code: 'RPM-2' } }),
    ...message('f', { input: 7 }), // entre tasks: overhead
    ...message('g', { input: 40, tool: 'start_task', args: { code: 'RPM-3' } }),
    ...message('h', { input: 50, tool: 'finish_task', args: { code: 'RPM-3' }, model: 'claude-haiku-4-5' }),
    ...message('i', { input: 3, tool: 'finish_story_run', args: { story_code: 'RPM-1' } }),
  ]
  const { tasks, stories } = buildReports(assistantMessages(rows))
  const rpm2 = tasks.find((t) => t.code === 'RPM-2')
  const rpm3 = tasks.find((t) => t.code === 'RPM-3')
  assert.equal(rpm2.usage['claude-opus-5-5'].input, 60)
  assert.equal(rpm2.usage['claude-opus-5-5'].output, 5)
  assert.equal(rpm3.usage['claude-opus-5-5'].input, 40)
  assert.equal(rpm3.usage['claude-haiku-4-5'].input, 50)
  assert.equal(stories[0].code, 'RPM-1')
  assert.equal(stories[0].overhead['claude-opus-5-5'].input, 110)
})

test('reexecução na mesma sessão usa o trecho mais recente; start sem finish não reporta', () => {
  const rows = [
    ...message('a', { input: 5, tool: 'start_task', args: { code: 'RPM-9' } }),
    ...message('b', { input: 5, tool: 'finish_task', args: { code: 'RPM-9' } }),
    ...message('c', { input: 70, tool: 'start_task', args: { code: 'RPM-9' } }),
    ...message('d', { input: 30, tool: 'finish_task', args: { code: 'RPM-9' } }),
    ...message('e', { input: 1, tool: 'start_task', args: { code: 'RPM-8' } }),
  ]
  const { tasks } = buildReports(assistantMessages(rows))
  assert.equal(tasks.length, 1)
  assert.equal(tasks[0].usage['claude-opus-5-5'].input, 100)
})

test('ignora tools de outros servidores com o mesmo nome', () => {
  const rows = message('a', { input: 5, tool: 'start_task', args: { code: 'RPM-1' } }).map((r) => {
    r.message.content = r.message.content.map((b) =>
      b.type === 'tool_use' ? { ...b, name: 'mcp__outro__start_task' } : b,
    )
    return r
  })
  assert.equal(buildReports(assistantMessages(rows)).tasks.length, 0)
})
