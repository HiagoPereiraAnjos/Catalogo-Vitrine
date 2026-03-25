# Catalogo Digital - Frontend

Projeto frontend em React + Vite + TypeScript + Tailwind para vitrine e gestao local de produtos jeans.

## Requisitos

- Node.js 20+

## Scripts

- `npm run dev`: inicia o ambiente de desenvolvimento
- `npm run build`: gera build de producao
- `npm run preview`: serve o build localmente
- `npm run lint`: validacao de tipos TypeScript
- `npm run clean`: remove a pasta `dist`

## Estrutura principal

- `src/pages`: paginas da aplicacao
- `src/components`: componentes compartilhados
- `src/context`: estado global de produtos
- `src/services`: camada de persistencia local (localStorage + IndexedDB)
- `src/hooks`: hooks reutilizaveis (filtros, SEO, site settings)
- `src/data`: mocks e configuracoes padrao

## Deploy na Vercel

O projeto ja esta pronto para Vercel com:

- `vercel.json` configurado com:
  - `installCommand: npm ci`
  - `buildCommand: npm run build`
  - `outputDirectory: dist`
  - fallback de rotas SPA para `index.html` (mantendo arquivos estaticos via `handle: filesystem`)

### Passo a passo

1. Suba o repositorio no GitHub/GitLab/Bitbucket.
2. No painel da Vercel, clique em **Add New Project**.
3. Importe o repositorio.
4. Confirme as configuracoes:
   - Framework: `Vite`
   - Install Command: `npm ci`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Clique em **Deploy**.

## Observacoes

- Projeto 100% frontend (sem backend).
- Persistencia de dados no navegador.
- SEO baseline com meta tags dinamicas por rota.

