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

## Estrutura

```text
src/
├── components/
│   ├── pixel/        # Editor, canvas e controles
│   └── ui/           # Primitivas reutilizáveis
├── lib/
│   ├── pixel/        # Engine, estado, projetos, importação e viewport
│   └── utils.ts
├── routes/            # Rotas TanStack
├── router.tsx
└── styles.css

tests/
└── pixel/             # Testes da engine, estado, projeto e viewport

public/                # Assets estáticos
```

## Licença

Apache-2.0
