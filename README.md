# Reembolso Viagem

Aplicativo mobile (Expo / React Native + TypeScript) para consultores organizarem despesas de viagens a serviço e gerarem os relatórios de reembolso para lançar no ERP.

## Fluxo do app

1. **Criar projeto** — o consultor cria um projeto de viagem (nome, cliente, centro de custo, período) e define a **política de reembolso**: limites diários por categoria (alimentação, transporte, estacionamento, hospedagem) e o valor a partir do qual a foto da nota fiscal é obrigatória.
2. **Lançamentos diários** — durante a viagem, o consultor registra cada despesa tirando uma foto da nota (câmera ou galeria), escolhendo a categoria, valor, data e forma de pagamento.
3. **Acompanhamento** — a tela do projeto mostra o total gasto por categoria e alerta quando algum dia ultrapassa os limites da política ou quando falta foto de nota obrigatória.
4. **Fechamento do período** — ao final do mês (ou da viagem), o consultor faz o fechamento: os lançamentos pendentes são revisados, totalizados por categoria e "travados" (não podem mais ser editados).
5. **Relatórios em PDF** — a partir do fechamento, o app gera PDFs separados por **Alimentação**, **Transporte** e **Estacionamento** (além de um relatório completo com todas as categorias), cada um com a tabela de despesas e as fotos das notas fiscais anexadas, prontos para anexar ao pedido de reembolso no ERP.

Todos os dados ficam armazenados localmente no dispositivo (SQLite), sem necessidade de backend ou conexão com internet.

## Stack técnica

- **Expo + React Native + TypeScript**, navegação por arquivos com `expo-router`.
- **expo-sqlite** para persistência local (projetos, políticas, lançamentos, fechamentos).
- **expo-image-picker** para fotografar/selecionar as notas fiscais.
- **expo-file-system** para guardar as fotos das notas na pasta de documentos do app.
- **expo-print + expo-sharing** para gerar os PDFs de reembolso e compartilhar (e-mail, WhatsApp, salvar em arquivos etc).

## Estrutura de pastas

```
app/                          rotas (expo-router)
  index.tsx                   lista de projetos/viagens
  project/new.tsx              criar projeto + política
  project/[id]/index.tsx       dashboard do projeto
  project/[id]/edit.tsx        editar projeto/política
  project/[id]/entries/new.tsx        novo lançamento (foto da nota)
  project/[id]/entries/[entryId].tsx  detalhe/edição de lançamento
  project/[id]/closings/new.tsx       revisão e confirmação do fechamento
  project/[id]/closings/[closingId].tsx  fechamento + exportação dos PDFs

src/
  db/          schema SQLite e funções de acesso (projects, entries, closings)
  types/       tipos de domínio (Project, Policy, Entry, Closing, Category...)
  utils/       formatação, cálculo de totais/violações de política, geração de PDF, storage de fotos
  components/  componentes de UI reutilizáveis (formulários, campos, seletor de categoria, etc)
```

## Rodando o projeto

```bash
npm install
npm run start      # abre o Metro/Expo Dev Tools (use o app Expo Go ou um emulador)
npm run android     # abre direto no emulador/dispositivo Android
npm run ios         # abre direto no simulador iOS (macOS)
npm run typecheck   # checagem de tipos TypeScript
```
