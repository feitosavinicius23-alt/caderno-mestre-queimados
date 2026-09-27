# AI_SYNC_INSTRUCTIONS.md

**Instruções para qualquer agente de IA que for manter este repositório.**
Leia este arquivo inteiro antes de alterar qualquer coisa.

---

## 0. Em uma frase

O conteúdo vem de um Google Doc. Você roda **dois comandos**, confere o relatório e faz **um commit
na pasta `content/`**. O Cloudflare Pages publica sozinho. Você **nunca** precisa editar o código
da aplicação para adicionar uma aula.

```bash
npm ci
npm run fetch-caderno     # baixa o Google Doc
npm run import-caderno    # converte, valida, sincroniza (idempotente)
npm run validate-content  # confirma que está tudo íntegro
git add content/ && git commit -m "chore(content): sync do Caderno Mestre — N aulas" && git push
```

---

## 1. Fonte da verdade

| O quê | Onde |
|---|---|
| Documento fonte | Google Doc `17hPAJuQovOshYQGlzFF9-dzUl8kcbqvSD82L-KJPDRY` |
| Export usado | `https://docs.google.com/document/d/<ID>/export?format=txt` |
| Cópia local (versionada) | `content/source/_raw/caderno-mestre.txt` |

O documento precisa estar compartilhado como **"qualquer pessoa com o link pode ver"**.
Não há token, chave nem credencial em lugar nenhum — e **não deve haver** (requisitos 59/60).

Para trocar o documento: `CADERNO_DOC_ID=<novo-id> npm run fetch-caderno`, ou edite `DOC_ID` em
`lib/content-sync/paths.mjs`.

---

## 2. Onde ficam as coisas

```
content/                        ← CAMADA DE CONTEÚDO (é isto que você altera)
  aulas/<disciplina>-aula-NNN.json   uma aula por arquivo — GERADO
  manifest.json                      índice mestre — GERADO
  disciplinas.json                   disciplinas — GERADO
  metadata.json                      contadores e recentes — GERADO
  search-index.json                  índice de busca — GERADO
  sync-history.json                  histórico de sincronizações — GERADO
  source/_raw/caderno-mestre.txt      export do Google Doc — GERADO pelo fetch
  source/_config/disciplinas.json     CONFIGURAÇÃO — editável à mão, nunca sobrescrita

lib/content-sync/               ← motor de sincronização (código)
scripts/                        ← comandos npm
src/                            ← APLICAÇÃO REACT (não mexa em sync de conteúdo)
```

**Regra de ouro:** tudo marcado como GERADO é reconstruído pelos scripts. Não edite esses arquivos
à mão — suas mudanças serão perdidas na próxima sincronização.

---

## 3. Comandos

| Comando | O que faz | Escreve arquivos? |
|---|---|---|
| `npm run fetch-caderno` | Baixa o Google Doc para `content/source/_raw/` | Sim (1 arquivo) |
| `npm run import-caderno` | Converte o doc em aulas JSON + roda o sync | Sim |
| `npm run import-caderno -- --dry-run` | Só relata o que faria | **Não** |
| `npm run sync-content` | Reconstrói manifest/índices a partir das aulas em disco | Sim |
| `npm run validate-content` | Verifica integridade. Sai com código 1 se houver erro | **Não** |
| `npm run content:report` | Mostra o estado atual e **qual é a última aula de cada disciplina** | **Não** |
| `npm run build` | Sync + índices + sitemap + build Vite | Sim (`dist/`) |
| `npm run check` | typecheck + lint + testes + build | Sim (`dist/`) |

---

## 4. Como funciona a detecção de mudanças

Cada aula tem um `contentHash` (SHA-256 truncado em 16 chars) calculado sobre o conteúdo,
**ignorando** campos voláteis (`contentHash`, `ultimaAtualizacao`, `_file`).

```
hash anterior == hash atual  →  arquivo NÃO é reescrito  (nada no diff do git)
hash anterior != hash atual  →  só AQUELA aula é reescrita
aula não existe no manifest  →  aula nova
aula no manifest mas não no doc → removida
```

Isso é o que torna a sincronização **incremental** e os commits limpos (requisitos 11, 63, 64, 84).
Rodar `import-caderno` duas vezes seguidas produz **zero** arquivos alterados na segunda vez.

---

## 5. Identificadores — NUNCA reutilize ou renomeie

```
ID de aula:    <disciplina-slug>-aula-<numero em 3 dígitos>
               direito-tributario-aula-001
               legislacao-tributaria-de-queimados-aula-025

ID de questão: <id-da-aula>-q-<indice em 3 dígitos>
               direito-tributario-aula-012-q-003
```

- O ID é derivado de **disciplina + número**, nunca do título. Se o título mudar, o ID permanece.
- Se a aula já existe em disco, o importador **preserva o ID gravado**, mesmo que a regra geraria outro.
- O `slug` (usado na URL) vem do título. Quando dois títulos colidem na mesma disciplina, a aula de
  número maior recebe sufixo `-aula-N`. O ID não muda.

---

## 6. Como descobrir qual é a próxima aula

```bash
npm run content:report
```

Saída (trecho):

```
ÚLTIMA AULA POR DISCIPLINA (use para numerar a próxima):
  Direito Tributário: aula 34 — Decadência e prescrição tributárias
    → próxima deve ser a aula 35
```

Ou leia `content/manifest.json` → maior `numero` dentro da disciplina.

---

## 7. Como o documento é interpretado

O parser (`lib/content-sync/caderno-parser.mjs`) **classifica e estrutura — nunca resume ou
reescreve**. 99% dos caracteres do documento são preservados.

**Cabeçalho de aula** (abre uma aula nova):
```
AULA 35 — TÍTULO DA AULA
Aula 35 — Título da aula
```
Um cabeçalho `AULA — TÍTULO` **sem número** é tratado como continuação da aula anterior.

**Marcadores reconhecidos** → viram componentes visuais:

| No documento | Vira |
|---|---|
| `MISSÃO DO DIA` / `MISSÃO DIÁRIA` | painel de tarefas |
| `QUESTÕES` / `TESTE` / `SIMULADO` / `TREINO` | questões interativas |
| `GABARITO: 1-B \| 2-C` | chave de respostas |
| `CORREÇÃO E MECANISMO DA BANCA`, `1-B: explicação` | comentário da questão |
| `PEGADINHA`, `COMO A IAN PODE TENTAR ENGANAR` | card de alerta vermelho |
| `MEMÓRIA CENTRAL`, `MEMORIZE`, `Memória: …` | card de memorização |
| `MAPA DE 30 SEGUNDOS`, `MAPA MENTAL` | diagrama de fluxo |
| `REGRA DE OURO`, `REGRA-MÃE` | card destacado |
| `RECUPERAÇÃO…`, `REVISÃO…` | card de revisão |
| `FRASE FINAL`, `FECHAMENTO` | card de fechamento |
| Parágrafo começando com `Art.` / `§` | bloco de lei seca |
| Linha com `→` ou `↓` | nó de mapa mental |

Qualquer trecho que contenha **duas ou mais alternativas `A)` `B)`** vira bloco de questões,
mesmo sem cabeçalho — a estrutura manda, não o rótulo.

---

## 8. Gabaritos — regra inviolável

O Caderno Mestre às vezes **omite o gabarito de propósito** ("SEM GABARITO NESTA ETAPA",
"NÃO HÁ GABARITO ANTECIPADO") para forçar recuperação ativa.

> **NUNCA invente uma resposta.** Questões sem gabarito no documento recebem
> `"gabaritoOculto": true` e `"correctAnswer": ""`. A plataforma as exibe com um aviso.
> Quando o gabarito aparecer numa versão futura do documento, ele é preenchido automaticamente.

Hoje: 129 questões, 54 com gabarito no documento.

---

## 9. Disciplinas

O documento só declara a disciplina explicitamente na Aula 1. Para as demais, ela é inferida a
partir das **palavras do próprio título**, pelas regras em:

```
content/source/_config/disciplinas.json
```

Esse arquivo é **configuração** — os scripts nunca o reescrevem. Para corrigir a disciplina de uma
aula específica, use `porNumero` (tem prioridade sobre as regras):

```json
{ "porNumero": { "35": "Direito Constitucional" } }
```

Depois rode `npm run import-caderno`.

---

## 10. Checklist antes de commitar

1. `npm run fetch-caderno` — baixou o documento?
2. `npm run import-caderno` — leia o relatório. Aulas novas/alteradas batem com o esperado?
3. `npm run validate-content` — precisa terminar em `Resultado: OK`.
4. `npm run build` — precisa concluir sem erro.
5. `git status content/` — **só** `content/` deve aparecer. Se `src/` mudou, algo está errado.
6. Commit e push.

**O que NÃO fazer:**

- ❌ não edite `manifest.json`, `search-index.json`, `metadata.json` ou `disciplinas.json` à mão;
- ❌ não edite arquivos em `content/aulas/` à mão (serão sobrescritos pelo próximo import);
- ❌ não reutilize um ID já usado por outra aula;
- ❌ não apague aulas antigas sem que elas tenham sumido do documento;
- ❌ não invente conteúdo jurídico, gabarito ou explicação;
- ❌ não mexa em `src/` para adicionar conteúdo — isso nunca é necessário;
- ❌ não coloque token, chave ou segredo no repositório.

---

## 11. Mensagens de commit

```
chore(content): sync do Caderno Mestre — 35 aulas
content: adiciona aula 35 — IPTU progressividade
content: atualiza aula 12 (gabarito publicado)
fix(parser): reconhece cabeçalho "RODADA DE TREINO"
```

---

## 12. Como confirmar que o deploy saiu

1. `git push` na branch de produção (`main`).
2. Cloudflare Pages → projeto → **Deployments**: o commit aparece com status *Success*.
3. Abra `https://<seu-site>/status-sync` — confira `Content version` e `Hash global`;
   devem bater com `content/manifest.json` do commit.
4. A página `/novidades` lista as aulas adicionadas na última sincronização.

---

## 13. Se algo quebrar

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `fetch-caderno` devolve HTML | Documento não está público | Compartilhe como "qualquer pessoa com o link" |
| `Nenhuma aula detectada` | Formato do cabeçalho mudou | Ajuste `CABECALHO_AULA` em `caderno-parser.mjs` |
| `validate-content` falha | Aula malformada | Leia a mensagem: ela diz o arquivo e o campo |
| Aula não aparece no site | Manifesto desatualizado | `npm run sync-content` |
| Questão sem gabarito | O documento não o revela | Comportamento correto — não invente |

Aulas inválidas **nunca** são gravadas: o importador as rejeita e segue com as demais, então um
erro isolado não derruba a sincronização inteira nem o site.
