# Reporte.me — plugin para o Claude Code

Executa tarefas, histórias e fluxos de agentes do [Reporte.me](https://reporte.me) pelo código, no
repositório em que você está trabalhando:

```text
/reporteme:run RPM-42              # uma tarefa
/reporteme:run RPM-42 use o design system
/reporteme:run RPM-1               # uma história: você escolhe as listas/tarefas
/reporteme:run RPM-57              # um fluxo: agentes e ações do quadro, etapa a etapa
```

O agente lê a tarefa (descrição, print, URL, caminho e trecho de HTML capturados), corrige no seu
projeto, move a tarefa no quadro, registra o que fez no checklist e o Reporte.me soma o custo
estimado de tokens no valor da tarefa.

## Fluxos de agentes

Um fluxo é montado na aba **Fluxo** do quadro: um gatilho manual escolhe as tarefas (por status,
listas ou códigos) e as etapas seguem em série. Etapa de **agentes** roda vários agentes do
catálogo ao mesmo tempo; etapa de **ação** move a tarefa, aplica tag, cria checklist ou comenta.

O `/reporteme:run <código do fluxo>` mostra o plano e pede uma aprovação. Depois, para cada tarefa:

- cria um worktree em `.claude/worktrees/<código>` e uma branch `reporteme/<código>` quando algum
  agente edita código, sem tocar nos seus arquivos (para o `git status` não listar a pasta, ponha
  `.claude/worktrees/` no `.gitignore`);
- lança um subagente por agente (`reporteme:executor` para quem edita, `reporteme:reviewer` para
  quem só lê), cada um com as instruções e as skills do agente;
- segue a saída de falha quando um agente pede ação de alguém; sem ela, a tarefa volta ao status em
  que entrou, com "Ação necessária".

Cada agente comenta com o próprio nome, e o custo dele aparece na conversa que abriu. A execução
aparece ao vivo na aba Fluxo do quadro.

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
| `update_task` | Altera título, datas, estimativa, lista ou status, etiquetas (põe e tira), você como responsável, dependências e o agente vinculado |
| `list_agents` | Lista os agentes que podem ser vinculados a uma tarefa |
| `get_day_summary` | O que você tem para hoje: atrasadas, de hoje, em revisão e da semana |
| `get_workspace` | Em qual espaço a conexão está, quem é o dono e o que ela pode fazer |

- Criar é idempotente pelo título: repetir o pedido devolve o item que já existe, sem duplicar.
- Ao executar uma tarefa, a descrição é sua: o agente registra o resto no checklist.
- Tarefa que veio de formulário, de automação com resposta ou de membro sem papel de administrador
  só é executada depois que um administrador clica em **Liberar para agentes** no card.
- A permissão **não vem marcada** no login. Conexão criada antes dela existir não a recebe:
  revogue em **Central › Integrações › Tokens** e entre de novo marcando a opção.

## Planejar um projeto no Ágil (com IA)

Com **Ler o Ágil**, **Planejar no Ágil** e **Criar e editar tarefas e quadros**, peça
`/reporteme:planejar-projeto` (ou, no claude.ai e no Desktop, o prompt **Planejar projeto no Ágil**
do conector). A IA pergunta o contexto, o período e as pessoas (nome, cidade, cargo, senioridade e
especialidade, só na conversa), sugere os feriados de cada cidade para você confirmar e propõe OKRs,
épicos, squads, sprints, histórias e tarefas estimadas e alocadas. Nada é gravado antes do seu OK; no
fim ela confere cada sprint com `get_sprint_plan` ("vai dar tempo?").

| Tool | O que faz |
|---|---|
| `get_agile_overview` · `list_sprints` · `list_objectives` · `list_absences` | Retrato do Ágil: squads e membros, quarters, épicos, sprints, OKRs, feriados e ausências |
| `list_people` | Pessoas do espaço (id e nome) para membro e responsável |
| `create_quarter` · `create_squad` · `set_squad_member` · `create_sprint` · `create_epic` · `create_objective` | Cadastros do planejamento, idempotentes pelo nome ou código |
| `add_absences` · `remove_absence` | Feriados e ausências em lote; remover pede confirmação |
| `plan_stories` · `assign_task` | Histórias na sprint, no épico e na squad; quem executa cada tarefa |
| `get_sprint_plan` | Veredito da sprint, ocupação por pessoa e tarefas sem quem execute |
| `update_quarter` · `update_squad` · `update_sprint` · `update_epic` · `update_objective` · `update_key_result` | Corrige o que já foi criado (só os campos enviados) |
| `remove_squad_member` · `add_key_result_checkin` · `open_sprint` · `close_sprint` | Tira membro, mede OKR, abre e fecha sprint (remover e fechar pedem confirmação) |
| `list_story_statuses` · `create_story_status` · `update_story_status` · `reorder_story_statuses` · `set_story_status` · `reopen_story` | Fluxo de status da história e o move das histórias nele (reabrir pede confirmação) |
| `cancel_sprint` · `archive_agile_item` · `restore_agile_item` · `delete_agile_item` | Com **Arquivar e excluir no Ágil**: cancelar sprint, arquivar, restaurar e excluir de vez (só restaurar dispensa confirmação) |
| `update_list` · `archive_list` · `archive_board` | Renomeia lista; manda lista ou história para a Lixeira (com **Editar descrição e excluir tarefas**, confirmado) |

## Editar descrição, excluir e formulários

Permissões à parte, também desmarcadas no login: **Editar descrição e excluir tarefas**,
**Ler formulários**, **Editar formulários** e **Respostas de formulários**.

| Tool | O que faz |
|---|---|
| `update_description` | Reescreve a descrição de uma tarefa ou história |
| `update_checklist_item` · `remove_checklist_item` | Renomeia e remove itens do checklist da tarefa |
| `archive_task` · `restore_task` | Exclui mandando para a Lixeira (volta pela Lixeira, pelo filtro "Mostrar na lixeira" ou por `restore_task`) |
| `list_forms` · `get_form` | Lista todos os formulários, com o código e onde cada um está (projeto ou avulso), e lê os campos de um (pelo id ou pelo código) |
| `list_form_responses` | Lê as respostas de um formulário, em páginas, com filtro por período e aprovação (quem criou o formulário, quem edita as respostas e administradores) |
| `create_form_response` · `update_form_response` · `delete_form_response` | Cria, edita e exclui respostas (só quem está na lista de editores das respostas) |
| `create_form` | Cria o formulário com os campos e devolve o link para responder; você escolhe onde: num projeto, num quadro (as respostas viram tarefa na lista escolhida), avulso ou num projeto novo |
| `update_form` | Muda nome e descrição do formulário |
| `add_form_fields` · `update_form_field` · `remove_form_field` | Cria, edita, reordena e remove campos |
| `send_form_email` | Envia o link do formulário por e-mail |
| `archive_form` | Exclui o formulário mandando para a Lixeira (volta pela Lixeira) |

- Reescrever descrição, excluir tarefa, remover item do checklist, remover campo, excluir formulário, excluir resposta e enviar formulário por e-mail **pedem a sua confirmação**: o agente
  mostra a prévia e só aplica depois que você aprova.
- Tudo fica na auditoria com quem, quando e por qual conexão; a descrição anterior fica guardada.
- Excluir o formulário de vez continua na Lixeira do Reporte.me.

## Agentes

Permissão à parte, desmarcada no login: **Criar e editar agentes** (só proprietários e
administradores do espaço).

| Tool | O que faz |
|---|---|
| `create_agent` · `update_agent` | Cria o agente (nome, cargo, descrição, perfil e instruções) e altera os campos enviados |
| `add_agent_skill` · `update_agent_skill` · `remove_agent_skill` | Cuida das skills no formato SKILL.md; cada mudança grava uma versão nova do agente |
| `delete_agent` | Exclui o agente; a prévia diz quantas tarefas ficam sem agente |

- Remover skill e excluir agente **pedem a sua confirmação**.
- Agentes do Reporte.me são só leitura: para personalizar, use **Duplicar** no Reporte.me.
- Tudo fica na auditoria; o conteúdo do agente excluído fica guardado nela.

## Vínculos na descrição (#)

Na descrição da tarefa, digitar `#` vincula um projeto, uma nota, outra tarefa ou um formulário.
O `get_task` e o `start_task` trazem esses vínculos numa seção própria: a nota vinculada (o
refinamento da tarefa) vem com o conteúdo quando a conexão tem **Ler páginas, notas e cursos**.

## Páginas, notas, cursos, favoritos, arquivos e contas

Permissões à parte, desmarcadas no login: **Ler páginas, notas e cursos**, **Criar e editar
páginas, notas e cursos** e **Ler arquivos**. Contas usam as permissões de tarefa.

| Tool | O que faz |
|---|---|
| `list_pages` · `get_page` | Lista as páginas de qualquer tipo e lê uma (nota com o conteúdo) |
| `create_page` · `update_page` | Cria página de qualquer tipo (nota, projeto, formulário, arquivos, favoritos, contas, curso, seção) e renomeia ou move |
| `append_note` · `replace_note` | Acrescenta ao fim da nota; substitui o conteúdo inteiro (pede confirmação) |
| `archive_page` | Manda a página para a Lixeira |
| `get_course` · `update_course` | Lê o curso com módulos e aulas e muda descrição e status |
| `create_course_module` · `update_course_module` · `archive_course_module` | Cria, renomeia e manda módulos para a Lixeira |
| `create_lesson` · `update_lesson` · `replace_lesson_text` · `archive_lesson` | Cria, edita título e módulo, troca o texto e manda aulas para a Lixeira (vídeo e arquivo ficam no Reporte.me) |
| `list_bookmarks` · `create_bookmark` · `update_bookmark` · `archive_bookmark` | Links das páginas de favoritos |
| `list_files` | Pastas e arquivos (nome, tipo, tamanho), sem baixar |
| `list_bills` · `create_bill` · `update_bill` · `set_bill_status` · `archive_bill` | Contas do mês com totais, conta avulsa ou recorrente e o status de cada mês |

- Substituir o conteúdo de uma nota ou o texto de uma aula e mandar qualquer item para a Lixeira
  **pedem a sua confirmação**. O conteúdo anterior fica na auditoria.

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

Documentação pública: <https://reporte.me/recursos/agentes-de-ia>. Já logado, o passo a passo de
cada forma de integrar fica em <https://reporte.me/integrations/manual>.

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
| `/reporteme:run` | Comando que conduz a execução de uma tarefa, história ou fluxo |
| `/reporteme:planejar-projeto` | Skill que monta um projeto no Ágil a partir da conversa |
| Subagentes `reporteme:executor` e `reporteme:reviewer` | Uma etapa de fluxo com o agente do catálogo: o primeiro edita no worktree da tarefa, o segundo só lê |
| Servidor MCP `reporteme` | `https://mcp.reporte.me/mcp`, com login OAuth no Reporte.me |
| Hooks | Ao fim de cada tarefa, etapa de agente e fluxo, mede os tokens usados (transcript local, cada subagente pelo próprio arquivo) e envia só os totais por modelo, com o recibo que o servidor devolve ao concluir |

Nada do seu código é enviado ao Reporte.me: só o que o agente escreve no checklist e os totais de
tokens.

## Exemplos de pedido

```text
/reporteme:run RPM-42
O que eu tenho para hoje no Reporte.me?
Crie no projeto RPM um quadro "Lançamento" com as tarefas do arquivo plano.md, com prazo e estimativa.
/reporteme:planejar-projeto
Liste as respostas da última semana do formulário de inscrição.
```

## Privacidade e segurança

- O plugin só conversa com `https://mcp.reporte.me`. O que chega ao Reporte.me: o que o agente
  escreve na tarefa (checklist, comentários, tarefas e quadros criados) e os totais de tokens por
  modelo. Código, arquivos e transcript ficam na sua máquina.
- Cada conexão vê só os projetos e as permissões escolhidos no login, e é revogada em
  **Central › Integrações › Tokens**.
- Política de privacidade: <https://reporte.me/terms#privacidade>.
- Vulnerabilidades: escreva para <contato@reporte.me> (também em
  <https://reporte.me/.well-known/security.txt>).

## Variáveis

| Variável | Obrigatória | Padrão |
|---|---|---|
| `REPORTEME_URL` | não (só fora de produção) | `https://mcp.reporte.me` |

---

Licença MIT (arquivo `LICENSE`). Este repositório é gerado a partir do monorepo do Reporte.me; mudanças feitas aqui são
sobrescritas na próxima publicação.
