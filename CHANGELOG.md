# Changelog

Mudanças de `@reporte.me/claude-plugin` (`apps/rpm-fed-claude-plugin`). Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), versão [SemVer](https://semver.org/lang/pt-BR/).

## [1.2.3] - 2026-11-08

### Alterado

- Diretório da Claude (RP-133), achados da validação do portal:
  - `.mcp.json` com URL fixa `https://mcp.reporte.me/mcp` (sem `REPORTEME_URL`): o portal lê o endereço e pareia o plugin com o conector. Teste local passa a ser pelo `claude mcp add` (aba de token do manual).
  - Hook de uso não lê mais `REPORTEME_TOKEN` nem `REPORTEME_URL`: só envia com o recibo do `finish_*` (achado "credencial da máquina").
  - Hooks em `command` + `args` (`node` + o script), em vez de uma linha só.
  - `description` dos subagentes `executor` e `reviewer` entre aspas no frontmatter.
  - `icon.png` recomprimido (mesmos pixels): o scan via um padrão de "download e execução" nos bytes do arquivo.
- Plugin `reporteme`: de `1.2.2` para `1.2.3`.

## [1.2.2] - 2026-11-08

### Adicionado

- Licença MIT (`LICENSE` na raiz e na pasta do plugin; `license` no `plugin.json`), exigida pelo diretório de plugins da Claude (RP-133).
- Ícone do plugin em `plugins/reporteme/.claude-plugin/icon.png` (512 px, o mesmo do app).
- README: exemplos de pedido e a seção de privacidade e segurança (o que vai para onde e o canal de vulnerabilidades).
- `plugins/reporteme/README.md`: o diretório da Claude lê o README da PASTA do plugin (40+ palavras fora de bloco de código) como descrição do listing.
- README: as tools novas do servidor `append_note`, `replace_note`, `restore_agile_item` e `replace_lesson_text` (no lugar de `write_note` e do restaurar dentro de `archive_agile_item`).

### Alterado

- `homepage` do plugin passa a ser a página pública `/recursos/agentes-de-ia` (o manual exige login); `repository` e e-mail do autor no `plugin.json`.
- A publicação não leva mais a pasta `.turbo` (log local) nem `.DS_Store` (bloqueia o diretório) para o repositório público.
- Plugin `reporteme`: de `1.2.1` para `1.2.2`.

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
