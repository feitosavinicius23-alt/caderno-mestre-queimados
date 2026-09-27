# Caderno Mestre — Agente Fiscal Queimados/RJ 2026

Plataforma de estudos alimentada pelo documento **“Caderno Mestre — Agente Fiscal Queimados 2026”**
(Google Docs). O documento é a fonte do conteúdo; este site é a interface de aprendizagem.

```
GOOGLE DOC → fetch → parser → content/*.json → GitHub → Cloudflare Pages → site
```

**Adicionar uma aula nova nunca exige alterar o código da aplicação.**
Basta o documento mudar e dois comandos rodarem.

---

## Conteúdo atualmente importado

| | |
|---|---|
| Aulas | **34** (numeradas 1–34) |
| Questões objetivas | **129** (54 com gabarito no documento) |
| Disciplinas | **3** — Direito Tributário (23), Legislação Tributária de Queimados (6), Receitas Públicas (5) |
| Blocos de conteúdo | 388 |
| Mapas mentais | 18 · Lei seca: 10 · Revisões: 19 · Missões: 2 |
| Fidelidade ao documento | **99%** dos caracteres preservados |

---

## 1. Instalação

Requer **Node.js 20.11+**.

```bash
git clone <url-do-repositorio>
cd caderno-mestre-queimados
npm ci
```

## 2. Rodar localmente

```bash
npm run dev       # http://localhost:5173
```

## 3. Build

```bash
npm run build     # gera dist/
npm run preview   # serve o dist/ em http://localhost:4173
```

`npm run build` executa, em ordem: `sync-content` → `build:search-index` → `build:sitemap` → `vite build`.
Ou seja, o build **sempre** reconstrói o manifesto e os índices a partir das aulas em disco.

## 4. Verificação completa

```bash
npm run check     # typecheck + lint + testes + build
```

---

## 5. Estrutura de pastas

```
content/                         CAMADA DE CONTEÚDO (separada do código)
  aulas/*.json                     uma aula por arquivo         [gerado]
  manifest.json                    índice mestre + hashes       [gerado]
  disciplinas.json                 disciplinas extraídas        [gerado]
  metadata.json                    contadores, recentes         [gerado]
  search-index.json                índice de busca              [gerado]
  sync-history.json                histórico de sincronizações  [gerado]
  source/_raw/caderno-mestre.txt   export do Google Doc         [gerado]
  source/_config/disciplinas.json  mapeamento aula→disciplina   [EDITÁVEL]
  source/_templates/               modelo de aula em Markdown

lib/content-sync/                MOTOR DE SINCRONIZAÇÃO
  caderno-parser.mjs               Google Doc → aulas estruturadas
  parser.mjs                       Markdown → aula (entrada manual alternativa)
  sync.mjs                         diff por hash, manifesto, histórico
  validate.mjs                     todas as regras de validação
  manifest.mjs                     manifesto, disciplinas, metadados, busca
  utils.mjs                        IDs, slugs, hashes
  io.mjs / paths.mjs / block-types.mjs

scripts/                         COMANDOS NPM
  fetch-caderno.mjs  import-caderno.mjs  import-content.mjs
  sync-content.mjs   validate-content.mjs  sync-report.mjs
  build-search-index.mjs  build-sitemap.mjs

src/                             APLICAÇÃO (React + TypeScript)
  components/  pages/  hooks/  services/  types/  styles.css

public/                          estáticos: ícones, _redirects, _headers, sitemap, robots
.github/workflows/               automação diária
```

---

## 6. Como adicionar uma aula

### Caminho normal (automático — o documento manda)

Escreva a aula no Google Doc usando o cabeçalho padrão:

```
AULA 35 — TÍTULO DA AULA
```

E depois:

```bash
npm run fetch-caderno
npm run import-caderno
git add content/ && git commit -m "chore(content): sync — aula 35" && git push
```

Pronto. A aula aparece no site: rota, menu, busca, filtros e estatísticas são automáticos.

### Caminho manual (sem o Google Doc)

Crie `content/source/minha-disciplina/aula-035.md` seguindo
`content/source/_templates/aula-exemplo.md` e rode `npm run import-content`.

Ou escreva o JSON direto em `content/aulas/` e rode `npm run sync-content`.

---

## 7. Formato de uma aula (JSON)

```jsonc
{
  "id": "direito-tributario-aula-012",   // permanente: disciplina + número
  "numero": 12,
  "titulo": "IPTU: incidência, contribuinte, base de cálculo e progressividade",
  "slug": "iptu-incidencia-contribuinte-base-de-calculo-e-progressividade",
  "disciplina": "Direito Tributário",
  "assunto": "…",
  "ordem": 12,
  "data": "2026-09-27",
  "tempoEstimadoMin": 14,
  "resumo": "…",
  "conteudo": [                          // blocos semânticos, na ordem do documento
    { "id": "…-b1", "tipo": "memorize",   "titulo": "MEMÓRIA CENTRAL", "texto": "…" },
    { "id": "…-b2", "tipo": "lei-seca",   "titulo": "", "texto": "Art. 32. …" },
    { "id": "…-b3", "tipo": "mapa-mental","titulo": "MAPA", "mapaId": "…-b3" },
    { "id": "…-b4", "tipo": "questao",    "questionIds": ["…-q-001"] }
  ],
  "questoes": [{
    "id": "direito-tributario-aula-012-q-001",
    "lessonId": "direito-tributario-aula-012",
    "numero": 1,
    "question": "…",
    "options": [{ "id": "A", "text": "…" }, { "id": "B", "text": "…" }],
    "correctAnswer": "B",     // "" quando o documento não revela
    "gabaritoOculto": false,  // true = omitido de propósito, NÃO inventar
    "explanation": "…",
    "subject": "Direito Tributário",
    "topic": "…"
  }],
  "gabaritos": [], "revisao": [], "mapasMentais": [], "leiSeca": [],
  "missao": null, "anotacoes": [], "tags": [],
  "fonte": "Caderno Mestre — Agente Fiscal Queimados 2026",
  "ultimaAtualizacao": "2026-09-27",
  "contentHash": "a1b2c3d4e5f6a7b8"      // assinatura do conteúdo
}
```

Tipos de bloco: `teoria`, `definicao`, `atencao`, `cuidado`, `pegadinha`, `regra-de-prova`,
`memorize`, `exemplo`, `questao`, `gabarito`, `gabarito-comentado`, `revisao`, `mapa-mental`,
`resumo`, `lei-seca`, `caderno-de-erros`, `fechamento`, `dica`, `comparacao`, `erro-comum`,
`missao-do-dia`, `tabela`, `texto`.

---

## 8. Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | sync + índices + sitemap + build |
| `npm run preview` | serve o `dist/` |
| **`npm run sync:now`** | **botão de sincronizar agora**: baixa, importa, valida, commita e publica |
| `npm run sync:now -- --no-push` | igual, mas só commita (não envia) |
| `npm run sync:now -- --no-commit` | igual, mas só atualiza os arquivos locais |
| `npm run fetch-caderno` | baixa o Google Doc |
| `npm run import-caderno` | converte o documento em aulas + sincroniza |
| `npm run import-content` | importa aulas escritas em Markdown |
| `npm run sync-content` | reconstrói manifesto e índices |
| `npm run validate-content` | valida tudo (somente leitura) |
| `npm run content:report` | estado atual + última aula por disciplina |
| `npm run test` | testes |
| `npm run typecheck` / `npm run lint` | verificações |
| `npm run check` | tudo acima |

---

## 9. Funcionalidades

**Estudo** — dashboard com progresso; botão *Continuar estudando* que retoma a posição exata de
leitura; página de aula com blocos visuais tipados; missão do dia interativa; favoritos; notas
pessoais separadas do conteúdo oficial.

**Questões** — interativas, gabarito oculto até responder (ou clicar em *Ver gabarito*), correção
com explicação, erro alimenta o Caderno de Erros automaticamente, simulados configuráveis.

**Memória** — revisão espaçada em 24h / 7d / 21d / 30d gerada ao concluir uma aula; página de
revisões separando atrasadas, de hoje e próximas; caderno de erros com contagem de reincidência.

**Navegação** — busca global sobre aulas, trechos, questões, leis, mapas e revisões; filtros por
disciplina, status, questões, revisão e favoritos; páginas de disciplina, lei seca e mapas mentais.

**Plataforma** — PWA instalável com modo offline; mobile-first (360px → 1440px+); modo claro/escuro/
automático; controles de tipografia; progresso em IndexedDB sem login; exportar/importar progresso
em JSON; navegação por teclado, foco visível e ARIA.

---

## 10. GitHub

```bash
git init
git add .
git commit -m "feat: plataforma Caderno Mestre — Agente Fiscal Queimados 2026"
git branch -M main
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
```

### Sincronização automática

O workflow `.github/workflows/sync-caderno.yml` roda **3× por dia — 07:20, 13:20 e 19:20
(Brasília)** — 20 minutos depois de cada geração de aula no Caderno Mestre. Ele baixa o documento,
reimporta, valida, builda e — **só se algo mudou** — faz commit em `content/`. Não requer secret.

**Pré-requisito obrigatório:** em *Settings → Actions → General → Workflow permissions*, marque
**"Read and write permissions"**. Sem isso o workflow não consegue commitar.

### Botão "sincronizar agora"

Duas formas de forçar uma sincronização sem esperar o horário:

1. **Pelo GitHub (recomendado):** *Actions → Sincronizar Caderno Mestre → Run workflow*.
   Roda na nuvem e publica sozinho.
2. **Pela sua máquina:** `npm run sync:now` — baixa, importa, valida, commita e faz push.
   Se o documento não mudou, ele avisa e não cria commit vazio.

---

## 11. Cloudflare Pages

**Workers & Pages → Create → Pages → Connect to Git →** selecione o repositório.

| Campo | Valor |
|---|---|
| **Framework preset** | `None` (ou `Vite`) |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Root directory** | `/` (raiz) |
| **Production branch** | `main` |
| **Node version** | `20.11.0` (variável `NODE_VERSION`) |
| **Environment variables** | nenhuma obrigatória |

Opcionais: `SITE_URL` (usada no `sitemap.xml`; padrão `https://caderno-mestre-queimados.pages.dev`)
e `CADERNO_DOC_ID` (para apontar a outro documento).

Já incluídos no repositório:

- `public/_redirects` → `/* /index.html 200`, necessário para as rotas da SPA;
- `public/_headers` → cache imutável em `/assets/*`, revalidação em `sw.js` e `index.html`.

**Deploy automático:** commit em `main` → Cloudflare detecta → build → publica. Sem intervenção
manual, sem acessar o painel.

---

## 12. Sincronização — como funciona

1. `fetch-caderno` baixa o Doc e salva em `content/source/_raw/`.
2. `import-caderno` divide por `AULA N — TÍTULO`, classifica cada trecho em bloco semântico,
   extrai questões/gabaritos/mapas/missões e monta o JSON de cada aula.
3. Calcula o `contentHash` de cada aula e compara com o manifesto:
   - hash igual → **não reescreve o arquivo** (diff limpo);
   - hash diferente → reescreve **apenas aquela aula**;
   - aula ausente no manifesto → nova; ausente no documento → removida.
4. Reconstrói `manifest.json`, `disciplinas.json`, `metadata.json`, `search-index.json`;
   incrementa `contentVersion` só quando o conteúdo global mudou; registra em `sync-history.json`.
5. Imprime o relatório de sincronização.
6. Commit em `content/` → Cloudflare publica.

Aulas inválidas **nunca** são gravadas — o importador as rejeita e continua com as demais.

Detalhes operacionais para agentes de IA: **[`AI_SYNC_INSTRUCTIONS.md`](./AI_SYNC_INSTRUCTIONS.md)**.

---

## 13. Princípios de fidelidade ao conteúdo

- O parser **classifica e estrutura**; nunca resume, reescreve ou completa.
- Gabaritos omitidos de propósito pelo documento ficam `gabaritoOculto: true` — **nenhuma resposta
  é inventada**.
- Anotações do estudante ficam em campo separado do conteúdo oficial.
- Nenhum segredo, token ou chave no repositório. O acesso ao documento usa apenas o link público.

---

## 14. Stack

React 18 · TypeScript 5 · Vite 5 · React Router 6 · vite-plugin-pwa (Workbox) · Vitest · ESLint.
CSS próprio com design tokens — sem framework de UI, para manter o bundle pequeno e o controle
tipográfico total na leitura longa. Saída 100% estática: sem servidor, sem banco, sem custo.
