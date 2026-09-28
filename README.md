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

1. Instale pelo terminal:

   ```sh
   claude plugin marketplace add reporteme/claude-plugins
   claude plugin install reporteme@reporteme
   ```

2. No Claude Code, rode `/mcp`, escolha `reporteme` e **Authenticate**. O navegador abre no
   Reporte.me: escolha as permissões e os projetos, autorize e volte ao terminal. Não há token para
   copiar: o Claude Code guarda o acesso no chaveiro do sistema e renova sozinho.

3. Pronto: `/reporteme:run RPM-42`.

A conexão aparece em **Central › Integrações › Tokens**, onde você revoga quando quiser. Testado
com o Claude Code 2.1.83; uma versão sem login OAuth para servidores MCP mostra o `reporteme` com
erro no `/mcp` — atualize o Claude Code.

Manual completo: <https://reporte.me/integrations/manual>.

## O que o plugin instala

| Parte | O que faz |
|---|---|
| `/reporteme:run` | Comando que conduz a execução de uma tarefa ou história |
| Servidor MCP `reporteme` | `https://mcp.reporte.me/mcp`, com login OAuth no Reporte.me |
| Hooks | Ao fim de cada tarefa, mede os tokens usados na sessão (transcript local) e envia só os totais por modelo, com o recibo que o servidor devolve ao concluir a tarefa |

Nada do seu código é enviado ao Reporte.me: só o que o agente escreve no checklist e os totais de
tokens.

## Variáveis

| Variável | Obrigatória | Padrão |
|---|---|---|
| `REPORTEME_URL` | não (só fora de produção) | `https://mcp.reporte.me` |

---

Este repositório é gerado a partir do monorepo do Reporte.me; mudanças feitas aqui são
sobrescritas na próxima publicação.
