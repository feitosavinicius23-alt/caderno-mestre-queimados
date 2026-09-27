# DEPLOY_CLOUDFLARE.md

**Instruções de publicação. Leia antes de executar qualquer coisa.**

Este projeto é um site **100% estático** (React + Vite). Não há servidor, banco de dados nem API.
Publicar significa: gerar a pasta `dist/` e entregá-la ao Cloudflare Pages.

---

## Contexto em 5 linhas

- O conteúdo de estudo vem de um Google Doc público e já está importado em `content/` (34 aulas).
- `npm run build` reconstrói os índices a partir de `content/` e gera `dist/`.
- **Não é preciso alterar nada em `src/` para publicar.** O projeto está pronto e testado.
- Não existe nenhum secret, token ou variável de ambiente obrigatória.
- Node.js **20.11+** é obrigatório (o build usa `import ... with { type: 'json' }`).

---

## Verificação antes de publicar

```bash
npm ci
npm run check     # typecheck + lint + 40 testes + build
```

Resultado esperado: `Tests 40 passed`, build concluído, pasta `dist/` criada.
**Se isso falhar, pare e corrija antes de publicar.**

---

## Caminho A — Cloudflare Pages conectado ao GitHub (RECOMENDADO)

É o melhor caminho porque habilita a atualização automática diária do conteúdo.

### A1. Subir para o GitHub

```bash
git init
git add .
git commit -m "feat: plataforma Caderno Mestre — Agente Fiscal Queimados 2026"
git branch -M main
git remote add origin https://github.com/<USUARIO>/<REPO>.git
git push -u origin main
```

### A2. Criar o projeto no Cloudflare

Painel Cloudflare → **Workers & Pages** → **Create** → aba **Pages** → **Connect to Git** →
autorizar o GitHub → selecionar o repositório.

Configuração de build:

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

Em **Environment variables (Production)**, adicione **apenas**:

| Nome | Valor |
|---|---|
| `NODE_VERSION` | `20.11.0` |

Opcional: `SITE_URL` com o domínio final (ex.: `https://caderno-queimados.pages.dev`) — usado
para gerar o `sitemap.xml`. Se não definir, usa o padrão.

**Não crie nenhuma outra variável.** Não há segredos neste projeto.

Clique em **Save and Deploy**.

### A3. Liberar o robô de sincronização

No **GitHub** → repositório → **Settings** → **Actions** → **General** →
seção **Workflow permissions** → marcar **"Read and write permissions"** → **Save**.

Sem isso, o workflow de sincronização diária roda mas falha ao fazer commit.

### A4. Testar a sincronização

GitHub → aba **Actions** → **Sincronizar Caderno Mestre** → **Run workflow**.
Deve terminar em verde. Se o Google Doc não tiver mudado, ele informa e não cria commit.

---

## Caminho B — Upload direto (sem GitHub)

Use apenas se o Caminho A não for possível. **A atualização automática não funciona neste modo** —
todo novo conteúdo terá que ser publicado à mão.

### B1. Via painel

```bash
npm ci
npm run build
```

Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Upload assets** →
arraste o **conteúdo de dentro** da pasta `dist/` (não a pasta em si).

### B2. Via linha de comando

```bash
npm ci
npm run build
npx wrangler pages deploy dist --project-name=caderno-mestre-queimados
```

Requer login: `npx wrangler login`.

---

## Arquivos que já estão prontos (não recrie)

| Arquivo | Função |
|---|---|
| `public/_redirects` | `/* /index.html 200` — **essencial** para as rotas da SPA |
| `public/_headers` | cache imutável em `/assets/*`, revalidação no `sw.js` |
| `public/robots.txt`, `public/sitemap.xml` | SEO (sitemap regerado a cada build) |
| `.nvmrc` | fixa o Node em 20.11.0 |
| `.github/workflows/sync-caderno.yml` | sincronização automática 3×/dia |

⚠️ Sem `public/_redirects`, abrir `https://site/aulas/...` direto no navegador retorna **404**.
Ele já existe — apenas confirme que foi para o repositório.

---

## Validação pós-deploy

Acesse o site publicado e confirme:

1. `/` — dashboard carrega com o botão "Continuar estudando".
2. `/aulas` — lista **34 aulas**.
3. **Recarregue a página (F5) estando em `/aulas`** — não pode dar 404.
   Se der, o `_redirects` não foi publicado.
4. `/status-sync` — mostra `Content version`, `Hash global` e 34 aulas no manifesto.
5. DevTools → Application → Service Worker — deve estar registrado (PWA).

---

## Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| Build falha com erro de sintaxe em `import ... with` | Node < 20.11 | definir `NODE_VERSION=20.11.0` |
| 404 ao recarregar uma rota interna | `_redirects` ausente no deploy | confirmar que `public/_redirects` está versionado |
| Página em branco | assets não carregaram | conferir que **Build output directory** é `dist` |
| Workflow de sync falha ao commitar | permissão do Actions | marcar "Read and write permissions" |
| Site publica mas sem aulas | `content/` não foi commitado | `content/` **deve** ir para o repositório; não está no `.gitignore` |

---

## O que NÃO fazer

- ❌ não adicionar variáveis de ambiente com tokens — o projeto não usa nenhum;
- ❌ não mudar o output de `dist` para outra pasta;
- ❌ não colocar `content/` no `.gitignore` — é o conteúdo do site;
- ❌ não rodar `npm audit fix --force` (quebra versões do Vite);
- ❌ não alterar `src/` para "arrumar" conteúdo — conteúdo vem de `content/`.
