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

## Planejar pelo agente

Com a permissão **Criar e editar tarefas e quadros**, o agente também monta o trabalho no
Reporte.me, em projetos kanban (Projeto e Projeto Ágil):

```text
Crie no projeto RPM um quadro "Lançamento" com as tarefas do arquivo plano.md,
com prazo, estimativa e dependências.
```

| Tool | O que faz |
|---|---|
| `list_projects` | Lista projetos, quadros e listas do alcance da conexão |
| `create_board` · `update_board` | Cria o quadro (a história) e altera título e data de início |
| `create_list` | Cria uma lista (coluna) no quadro |
| `create_task` | Cria a tarefa com descrição, início, prazo, estimativa, etiquetas, checklist e dependências |
| `update_task` | Altera título, datas, estimativa, lista ou status, etiquetas e dependências |

- Criar é idempotente pelo título: repetir o pedido devolve o item que já existe, sem duplicar.
- A descrição só é escrita na criação. Depois ela é sua: o agente registra o resto no checklist.
- A permissão **não vem marcada** no login. Conexão criada antes dela existir não a recebe:
  revogue em **Central › Integrações › Tokens** e entre de novo marcando a opção.

## Instalação

1. Instale e entre, pelo terminal:

   ```sh
   claude plugin marketplace add reporteme/claude-plugins
   claude plugin install reporteme@reporteme
   claude mcp login plugin:reporteme:reporteme
   ```

   O último comando abre o navegador no Reporte.me: escolha as permissões e os projetos e
   autorize. Dentro do Claude Code (terminal ou VS Code), o mesmo login fica em `/mcp` →
   `reporteme` → **Authenticate**. Não há token para copiar: o Claude Code guarda o acesso e renova
   sozinho — é uma vez por computador.

2. Pronto: `/reporteme:run RPM-42`. Com o Claude Code já aberto durante a instalação, rode
   `/reload-plugins` ou abra uma conversa nova.

A conexão aparece em **Central › Integrações › Tokens**, onde você revoga quando quiser. Testado
com o Claude Code 2.1.287; uma versão sem login OAuth para servidores MCP mostra o `reporteme` com
erro no `/mcp` — atualize o Claude Code.

Manual completo: <https://reporte.me/integrations/manual>.

## Se o comando não aparecer

1. Rode `/reload-plugins` (ou feche e abra a conversa).
2. Ainda não? `claude plugin list` mostra o erro do plugin. Um registro antigo do marketplace
   (por exemplo, adicionado a partir de uma pasta local) impede o carregamento — refaça:

   ```sh
   claude plugin marketplace remove reporteme
   claude plugin marketplace add reporteme/claude-plugins
   claude plugin install reporteme@reporteme
   ```

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
