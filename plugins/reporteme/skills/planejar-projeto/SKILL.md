---
name: planejar-projeto
description: "Monta um projeto no Reporte.me a partir de uma conversa: OKRs, épicos, squads, quarter e sprints, histórias e tarefas estimadas pela senioridade e alocadas pela ocupação, com os feriados das cidades do time. Use quando o usuário pedir para planejar ou montar um projeto, uma sprint ou um quarter no Reporte.me."
---

<!-- Mesmo roteiro do prompt MCP planejar-projeto (services/rpm-srv-mcp/src/modules/mcp/prompts/plan-project.prompt.ts): mudou lá, muda aqui. -->

Se as tools do servidor `reporteme` não estiverem disponíveis, peça para o usuário entrar pelo `/mcp` → `reporteme` → **Authenticate** marcando "Ler o Ágil", "Planejar no Ágil" e "Criar e editar tarefas e quadros", e pare.

Você vai montar um projeto no Reporte.me com o usuário, do objetivo até as tarefas alocadas, usando as tools do conector.

## Regras (valem o tempo todo)
- Converse em português, um bloco de perguntas por vez, frases curtas.
- NADA é gravado antes do OK explícito do usuário ao plano completo (etapa 5). Antes disso, só leituras.
- Cidade, cargo, senioridade e especialidade são contexto DESTA conversa: servem para estimar horas e sugerir feriados. Não existem como campo no Reporte.me; o papel do membro (rótulo livre) pode resumir, ex.: "Dev Back Sênior".
- Peça só o necessário sobre as pessoas. Nada de documento, endereço ou dado sensível.
- Os números de foco e de ajuste por senioridade abaixo são SUGESTÕES: mostre e deixe o usuário trocar.

## 0. Preparação
- get_workspace: confirme o espaço e as permissões. Precisa de "Planejar no Ágil" e "Criar e editar tarefas e quadros"; sem elas, peça para reconectar o conector marcando essas permissões e pare.
- get_agile_overview: o que já existe (squads, membros, quarters, épicos) é reaproveitado, nunca duplicado.
- list_projects: escolha com o usuário o projeto (de preferência Projeto Ágil) onde as histórias vão morar.
- list_story_statuses: o fluxo de status da HISTÓRIA do espaço. Se faltar etapa que o time usa (ex.: homologação, pronto para deploy), proponha criar.

## 1. Contexto e período
Objetivo do projeto, principais entregas, restrições, data de início e de fim, duração da sprint (sugira 2 semanas) e o nome do quarter.

## 2. Participantes
Para cada pessoa: nome (ache o userId com list_people; quem não estiver no espaço precisa ser convidado pelo Reporte.me antes), cidade e UF, cargo, senioridade (júnior, pleno, sênior, especialista), especialidade (ex.: back-end, front-end, QA, UX, dados, DevOps), horas por dia e férias ou folgas já previstas no período.
Foco sugerido (fração do dia que sobra para executar): júnior 70%, pleno 75%, sênior 80%, tech lead ou especialista 60%.

## 3. Feriados
Para cada cidade, liste os feriados NACIONAIS, ESTADUAIS e MUNICIPAIS que caem no período, com data e nome, numa tabela. Marque o que for incerto (data móvel, decreto local) e peça para o usuário confirmar ou corrigir. Só entra o que for confirmado.
Como gravar (add_absences):
- nacional: type HOLIDAY, user_id null (vale para o espaço todo);
- estadual ou municipal com a squad inteira na mesma cidade: type HOLIDAY, user_id null, squad_id da squad;
- estadual ou municipal de quem mora em cidade diferente do resto da squad: type OTHER com o user_id da pessoa e a nota "Feriado municipal: <cidade>" (ou "Feriado estadual: <UF>");
- férias e folgas: VACATION ou TIME_OFF com o user_id.

## 4. Proposta (mostre tudo antes de gravar)
Em tabelas curtas:
1. OKRs: 1 a 3 objetivos do quarter, cada um com 2 a 4 resultados-chave mensuráveis (base → meta, unidade).
2. Épicos: código, nome, período e squad.
3. Squads: código, membros com papel, horas/dia e foco.
4. Quarter e sprints: nome e datas de cada sprint (dentro do quarter, sem sobrepor, começando e terminando em dia útil).
5. Histórias por épico e sprint, e as tarefas de cada história com especialidade, estimativa em horas e responsável.
6. Fluxo da história: os status que faltam (nome e categoria A fazer, Em andamento ou Concluído) e em qual status cada história começa.
Estimativa: pense no esforço de um pleno e ajuste pela senioridade de quem executa (júnior ×1,4, pleno ×1,0, sênior ×0,8, especialista ×0,7). Tarefa com mais de 16h vira duas.
Alocação: cada tarefa com UM responsável da especialidade certa. Capacidade líquida de cada pessoa na sprint = horas/dia × (dias úteis − feriados − ausências) × foco. Mantenha a ocupação de cada um até 85% e mostre a tabela pessoa × sprint (capacidade, planejado, ocupação).

## 5. Ajuste e OK
Ajuste com o usuário até ele aprovar. Peça um OK explícito ("pode gravar") antes da etapa 6.

## 6. Gravação (nesta ordem; tudo é idempotente, então dá para repetir se algo falhar no meio)
1. create_quarter
2. create_squad e set_squad_member (focus_percent)
3. add_absences (feriados e ausências confirmados)
4. create_objective (com os key_results)
5. create_epic
6. create_sprint
7. create_board no projeto escolhido: uma história por item
8. create_task em cada história com estimated_hours e assign_to_me: false
9. assign_task: o responsável de cada tarefa
10. plan_stories: histórias na sprint, no épico e na squad
11. create_story_status para o que faltar no fluxo (reorder_story_statuses se precisar) e set_story_status com o status inicial de cada história

Errou um nome, período ou meta? Corrija com update_quarter, update_squad, update_sprint, update_epic, update_objective ou update_key_result, nunca criando de novo.

## 7. Verificação
get_sprint_plan em cada sprint. Se o veredito não for on_time, explique o motivo (capacidade insuficiente, término depois do fim, tarefa sem quem execute) e proponha um ajuste (mover história para a próxima sprint, redistribuir, reduzir escopo). Grave o ajuste só com novo OK.

## 8. Fechamento
Resumo curto: o que foi criado (códigos das histórias e nomes das sprints), o veredito de cada sprint e o que ficou pendente (convites, feriados a confirmar).
