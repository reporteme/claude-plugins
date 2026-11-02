# Changelog

Mudanças de `@reporte.me/claude-plugin` (`apps/rpm-fed-claude-plugin`). Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versão [SemVer](https://semver.org/lang/pt-BR/).

## [1.2.1] - 2026-11-01

### Alterado

- Skill `planejar-projeto`: lê e completa o fluxo de status da história (`list_story_statuses`, `create_story_status`, `set_story_status`) e corrige o que já existe com as tools `update_*` em vez de recriar. Mesmo texto do prompt MCP `planejar-projeto`.
- Plugin `reporteme`: de `1.2.0` para `1.2.1`.

## [1.2.0] - 2026-11-01

### Adicionado

- Skill `planejar-projeto` (`plugins/reporteme/skills/planejar-projeto/SKILL.md`): monta um projeto no Ágil a partir da conversa, de OKRs a tarefas estimadas e alocadas, com os feriados das cidades do time; só grava depois do OK. É o mesmo roteiro do prompt MCP `planejar-projeto` (claude.ai e Desktop), travado por teste no `services/rpm-srv-mcp`.
- Plugin `reporteme`: de `1.1.0` para `1.2.0`.

## [1.0.0] - 2026-10-28

### Alterado

- Pasta `apps/claude-plugin` → `apps/rpm-fed-claude-plugin` (ADR 0021). O nome npm `@reporte.me/claude-plugin` não muda.
- Primeira versão estável: de `0.3.1` para `1.0.0`. Sem mudança de API.
- Plugin `reporteme` (`plugins/reporteme/.claude-plugin/plugin.json`): de `0.7.1` para `1.0.0`. A versão sobe, então o marketplace oferece a atualização normalmente.
