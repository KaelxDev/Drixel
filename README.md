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

## Funcionalidades

- Grades de 8×8 a 64×64
- Lápis, borracha, preenchimento e conta-gotas
- Pincéis de 1–4 pixels
- Paletas retrô
- Undo/redo
- Grade configurável
- Atalhos de teclado
- Exportação PNG em múltiplas escalas
- Layout responsivo

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
npm run build
```

## Deploy

O projeto é estruturado como uma aplicação standalone e pode ser conectado diretamente a um projeto Vercel com a raiz do repositório como Root Directory.

## Estrutura

```text
src/
├── components/
│   ├── pixel/        # Editor e canvas
│   └── ui/           # Primitivas reutilizáveis
├── lib/
│   ├── pixel/        # Domínio, desenho, paletas e estado
│   └── utils.ts
├── routes/            # Rotas TanStack
├── router.tsx
└── styles.css

public/                # Assets estáticos
```

## Licença

Apache-2.0
