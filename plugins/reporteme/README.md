# Reporte.me

Plugin oficial do [Reporte.me](https://reporte.me) para o Claude Code. Ele liga o Claude às suas
tarefas, histórias, quadros, formulários, notas e ao planejamento ágil do Reporte.me, pelo servidor
MCP `https://mcp.reporte.me/mcp` com login OAuth.

## O que faz

- Executa uma tarefa pelo código: o Claude lê a descrição, o print e o trecho de HTML capturados,
  corrige no repositório em que você está, registra no checklist o que fez e move a tarefa para
  revisão. Com o código de uma história, você escolhe quais tarefas executar; com o de um fluxo,
  os agentes do quadro rodam etapa a etapa.
- Planeja um projeto no Ágil a partir da conversa: OKRs, squads, sprints, feriados de cada cidade e
  tarefas estimadas e alocadas, gravados só depois do seu OK.
- Com as permissões escolhidas no login, cria quadros, listas e tarefas, edita formulários e
  escreve em notas. Toda ação que apaga ou sobrescreve mostra uma prévia e pede a sua confirmação.

## Como usar

Instale pelo diretório de plugins do Claude Code e entre com a sua conta: em `/mcp`, escolha
`reporteme` e **Authenticate**. O navegador abre no Reporte.me para você escolher as permissões e
os projetos. Depois:

```text
/reporteme:run RPM-42
/reporteme:planejar-projeto
O que eu tenho para hoje no Reporte.me?
```

## Dados

O plugin só conversa com `https://mcp.reporte.me`. O que chega ao Reporte.me é o que o agente
escreve no seu espaço (checklist, comentários, tarefas e quadros criados). O seu código, os
arquivos e o transcript ficam na sua máquina. A conexão vê só os projetos escolhidos e pode ser revogada a
qualquer momento em Central › Integrações › Tokens.

- Documentação: <https://reporte.me/recursos/agentes-de-ia>
- Política de privacidade: <https://reporte.me/terms#privacidade>
- Suporte e vulnerabilidades: <contato@reporte.me>
- Licença: MIT
