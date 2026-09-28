# Reporte.me — plugin para o Claude Code

Executa tarefas e histórias do [Reporte.me](https://reporte.me) pelo código, no repositório em que
você está trabalhando:

```text
/reporteme:run RPM-42              # uma tarefa
/reporteme:run RPM-42 use o design system
/reporteme:run RPM-1               # uma história: você escolhe as listas/tarefas
```

O agente lê a tarefa (descrição, print, URL, caminho e trecho de HTML capturados), corrige no seu
projeto, move a tarefa no quadro, registra o que fez no checklist e o Reporte.me soma o custo
estimado de tokens no valor da tarefa.

## Instalação

1. No Reporte.me, gere um token em **Central › Integrações › Tokens** (escopos e projetos que o
   agente pode acessar).
2. Salve o token no perfil do seu shell — o Claude Code só enxerga variáveis que existiam quando ele
   iniciou:

   ```sh
   echo 'export REPORTEME_TOKEN="rpm_pat_..."' >> ~/.zshrc   # bash: ~/.bashrc
   set -Ux REPORTEME_TOKEN rpm_pat_...                       # fish
   setx REPORTEME_TOKEN "rpm_pat_..."                        # PowerShell
   ```

   Depois abra um terminal novo (ou reinicie o VS Code/Cursor, se usa o Claude Code por lá).

3. Instale pelo terminal:

   ```sh
   claude plugin marketplace add reporteme/claude-plugins
   claude plugin install reporteme@reporteme
   ```

4. No Claude Code, `/mcp` deve mostrar o servidor `reporteme` conectado. Se falhar, a sessão não
   está vendo o `REPORTEME_TOKEN` (volte ao passo 2).

Manual completo: <https://reporte.me/integrations/manual>.

## O que o plugin instala

| Parte | O que faz |
|---|---|
| `/reporteme:run` | Comando que conduz a execução de uma tarefa ou história |
| Servidor MCP `reporteme` | `https://mcp.reporte.me/mcp`, autenticado pelo `REPORTEME_TOKEN` |
| Hooks | Ao fim de cada tarefa, mede os tokens usados na sessão (transcript local) e envia só os totais por modelo |

Nada do seu código é enviado ao Reporte.me: só o que o agente escreve no checklist e os totais de
tokens.

## Variáveis

| Variável | Obrigatória | Padrão |
|---|---|---|
| `REPORTEME_TOKEN` | sim | — |
| `REPORTEME_URL` | não | `https://mcp.reporte.me` |

---

Este repositório é gerado a partir do monorepo do Reporte.me; mudanças feitas aqui são
sobrescritas na próxima publicação.
