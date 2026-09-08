# Drixel

Editor de pixel art para navegador, focado em uma experiência rápida, simples e responsiva.

## Stack

- React + TypeScript
- TanStack Start / Router
- Vite + Nitro (Vercel)
- Tailwind CSS
- Zustand
- Radix UI
- Lucide
- Canvas 2D
- Vitest

## Funcionalidades

- Grades de 8×8 a 64×64
- Lápis, borracha, preenchimento e conta-gotas
- Pincéis de 1–4 pixels
- Paletas retrô
- Undo/redo
- Grade configurável
- Zoom de 50% a 1600%
- Pan com Espaço + arrastar ou botão do meio
- Atalhos de teclado
- Persistência local
- Importação de PNG com escala nearest-neighbor
- Salvamento e abertura de projetos `.drixe`
- Exportação PNG em múltiplas escalas
- Layout responsivo

## Projeto `.drixe`

O Drixel usa um formato de projeto JSON versionado com a extensão `.drixe`. O arquivo guarda a grade, pixels, paleta, cor, pincel e preferência de grade, permitindo editar o projeto novamente sem depender do navegador onde ele foi criado.

A versão atual do formato é `1`.

## Arquitetura

A lógica do editor é separada por responsabilidade:

```text
src/lib/pixel/
├── operations.ts   # Operações puras de pixels
├── coordinates.ts  # Conversão ponteiro → célula
├── renderer.ts     # Renderização Canvas 2D
├── export.ts       # Exportação e downloads PNG
├── import.ts       # Importação de PNG
├── project.ts      # Serialização/validação do .drixe
├── palettes.ts     # Paletas e constantes do editor
├── viewport.ts     # Zoom e pan
├── store.ts        # Estado, histórico e persistência
└── draw.ts         # Fachada de compatibilidade para imports antigos
```

A interface segue a mesma ideia:

```text
src/components/pixel/
├── studio.tsx             # Composição do editor
├── pixel-header.tsx       # Ações de projeto, zoom e exportação
├── pixel-tools.tsx        # Ferramentas e tamanho da grade
├── pixel-palette.tsx      # Paletas e cores
├── pixel-status.tsx       # Barra de status
├── pixel-canvas.tsx       # Interação com Canvas
├── project-actions.ts     # Abrir/salvar/importar
├── use-pixel-hotkeys.ts   # Atalhos globais do editor
├── studio-config.ts       # Configuração compartilhada
└── tool-button.tsx        # Controle reutilizável da toolbar
```

Esse desenho mantém o domínio de pixel art independente da composição visual e deixa o caminho aberto para recursos futuros como seleção, copy/paste e camadas.

## Desenvolvimento

```bash
npm install
npm run dev
```

Aplicação local: `http://localhost:8080`

## Validação

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Essas verificações também são executadas automaticamente pelo GitHub Actions.

## Deploy

O projeto é estruturado como uma aplicação standalone e pode ser conectado diretamente a um projeto Vercel com a raiz do repositório como Root Directory.

## Testes

Os testes ficam em `tests/pixel/` e cobrem a engine de pixels, estado, persistência/migração, formato `.drixe` e viewport.

## Licença

Apache-2.0
