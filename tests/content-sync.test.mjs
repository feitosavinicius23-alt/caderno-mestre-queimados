/**
 * Testes da camada de conteúdo e sincronização.
 * Cobrem os cenários exigidos nos requisitos 82, 83 e 84.
 */
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

import {
  computeContentHash, lessonId, questionId, slugify, stableStringify,
} from '../lib/content-sync/utils.mjs';
import { validateCollection, validateLesson, validateManifest } from '../lib/content-sync/validate.mjs';
import { buildManifest, buildSearchIndex, buildSubjects } from '../lib/content-sync/manifest.mjs';
import { bucketReviewsShim } from './helpers.mjs';
import {
  classificarCabecalho, converterAula, expandirAlternativasInline, normalizeText,
  parseCorrecoes, parseGabaritoCompacto, parseQuestoes, splitLessons,
} from '../lib/content-sync/caderno-parser.mjs';
import { LESSONS_DIR, MANIFEST_PATH } from '../lib/content-sync/paths.mjs';
import { loadLessons, readJson } from '../lib/content-sync/io.mjs';

/* ------------------------------------------------------------------ */

function aulaBase(overrides = {}) {
  return {
    id: 'direito-tributario-aula-001',
    numero: 1,
    titulo: 'Tributo e espécies',
    slug: 'tributo-e-especies',
    disciplina: 'Direito Tributário',
    assunto: 'Conceito de tributo',
    ordem: 1,
    data: '2026-09-27',
    tempoEstimadoMin: 10,
    resumo: 'Resumo',
    conteudo: [{ id: 'b1', tipo: 'teoria', titulo: 'Teoria', texto: 'Texto da aula.' }],
    questoes: [],
    gabaritos: [],
    revisao: [],
    mapasMentais: [],
    leiSeca: [],
    missao: null,
    anotacoes: [],
    tags: [],
    fonte: 'Caderno Mestre',
    ultimaAtualizacao: '2026-09-27',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */

describe('identificadores', () => {
  it('gera ID permanente a partir de disciplina + número (requisito 10)', () => {
    expect(lessonId('Direito Tributário', 1)).toBe('direito-tributario-aula-001');
    expect(lessonId('Direito Tributário', 24)).toBe('direito-tributario-aula-024');
  });

  it('mantém o ID mesmo quando o título muda', () => {
    const a = lessonId('Direito Tributário', 7);
    const b = lessonId('Direito Tributário', 7);
    expect(a).toBe(b);
  });

  it('normaliza slugs sem deixar hífen sobrando após o corte', () => {
    const longo = 'Responsabilidade fiscal na receita: instituição, previsão, arrecadação e combate à evasão';
    expect(slugify(longo).endsWith('-')).toBe(false);
    expect(slugify(longo)).toBe(slugify(slugify(longo)));
  });

  it('gera IDs de questão estáveis', () => {
    expect(questionId('direito-tributario-aula-001', 3)).toBe('direito-tributario-aula-001-q-003');
  });
});

describe('hash de conteúdo (requisito 11)', () => {
  it('é determinístico e ignora a ordem das chaves', () => {
    const a = aulaBase();
    const b = { ultimaAtualizacao: '2026-09-27', ...aulaBase() };
    expect(computeContentHash(a)).toBe(computeContentHash(b));
  });

  it('ignora campos voláteis (data de atualização e o próprio hash)', () => {
    const base = aulaBase();
    const outro = aulaBase({ ultimaAtualizacao: '2030-01-01', contentHash: 'xxxx' });
    expect(computeContentHash(base)).toBe(computeContentHash(outro));
  });

  it('MUDA quando o conteúdo muda (requisito 83)', () => {
    const antes = computeContentHash(aulaBase());
    const depois = computeContentHash(
      aulaBase({ conteudo: [{ id: 'b1', tipo: 'teoria', titulo: 'Teoria', texto: 'Texto ALTERADO.' }] }),
    );
    expect(depois).not.toBe(antes);
  });

  it('NÃO muda quando a aula é reenviada idêntica (requisito 84)', () => {
    expect(computeContentHash(aulaBase())).toBe(computeContentHash(aulaBase()));
  });

  it('serializa de forma estável', () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });
});

describe('validação (requisito 16)', () => {
  it('aceita uma aula bem formada', () => {
    expect(validateLesson(aulaBase()).errors).toHaveLength(0);
  });

  it('rejeita aula sem título', () => {
    const r = validateLesson(aulaBase({ titulo: '' }));
    expect(r.errors.some((e) => /titulo/i.test(e.message))).toBe(true);
  });

  it('rejeita aula sem disciplina', () => {
    const r = validateLesson(aulaBase({ disciplina: '' }));
    expect(r.errors.some((e) => /disciplina/i.test(e.message))).toBe(true);
  });

  it('rejeita questão sem alternativas', () => {
    const r = validateLesson(aulaBase({
      questoes: [{ id: 'q1', question: 'Pergunta?', options: [], correctAnswer: 'A' }],
    }));
    expect(r.errors.some((e) => /alternativas/i.test(e.message))).toBe(true);
  });

  it('rejeita gabarito que não corresponde a nenhuma alternativa', () => {
    const r = validateLesson(aulaBase({
      questoes: [{
        id: 'q1', question: 'P?', correctAnswer: 'Z',
        options: [{ id: 'A', text: 'a' }, { id: 'B', text: 'b' }],
      }],
    }));
    expect(r.errors.some((e) => /não corresponde/i.test(e.message))).toBe(true);
  });

  it('aceita questão sem gabarito quando o documento o omite de propósito', () => {
    const r = validateLesson(aulaBase({
      questoes: [{
        id: 'q1', question: 'P?', correctAnswer: '', gabaritoOculto: true,
        options: [{ id: 'A', text: 'a' }, { id: 'B', text: 'b' }],
      }],
    }));
    expect(r.errors).toHaveLength(0);
    expect(r.warnings.some((w) => /recuperação ativa/i.test(w.message))).toBe(true);
  });

  it('detecta IDs duplicados (requisito 13)', () => {
    const r = validateCollection([aulaBase(), aulaBase()]);
    expect(r.errors.some((e) => /ID duplicado/i.test(e.message))).toBe(true);
  });

  it('detecta slugs duplicados na mesma disciplina', () => {
    const r = validateCollection([aulaBase(), aulaBase({ id: 'outro-id', numero: 2 })]);
    expect(r.errors.some((e) => /Slug duplicado/i.test(e.message))).toBe(true);
  });
});

describe('manifesto e índices', () => {
  const aulas = [
    aulaBase({ contentHash: computeContentHash(aulaBase()) }),
    aulaBase({
      id: 'direito-tributario-aula-002', numero: 2, titulo: 'Crédito tributário',
      slug: 'credito-tributario', contentHash: 'abc123',
    }),
  ];

  it('conta aulas e questões', () => {
    const m = buildManifest(aulas, null);
    expect(m.totalAulas).toBe(2);
    expect(m.aulas.map((a) => a.numero)).toEqual([1, 2]);
  });

  it('incrementa contentVersion apenas quando o conteúdo muda (requisito 89)', () => {
    const v1 = buildManifest(aulas, null);
    const v2 = buildManifest(aulas, v1);
    expect(v2.contentVersion).toBe(v1.contentVersion);

    const alteradas = [...aulas, aulaBase({ id: 'x', numero: 3, slug: 'x', contentHash: 'zzz' })];
    const v3 = buildManifest(alteradas, v1);
    expect(v3.contentVersion).toBe(v1.contentVersion + 1);
  });

  it('extrai disciplinas automaticamente (requisito 21)', () => {
    const s = buildSubjects(aulas);
    expect(s).toHaveLength(1);
    expect(s[0].nome).toBe('Direito Tributário');
    expect(s[0].totalAulas).toBe(2);
  });

  it('gera índice de busca com aulas e trechos (requisito 36)', () => {
    const idx = buildSearchIndex(aulas, buildManifest(aulas, null));
    expect(idx.total).toBeGreaterThan(0);
    expect(idx.documentos.some((d) => d.tipo === 'aula')).toBe(true);
  });
});

describe('parser do Caderno Mestre', () => {
  it('normaliza espaços duplicados vindos do Google Docs', () => {
    expect(normalizeText('Aula  1   —  Direito')).toBe('Aula 1 — Direito');
  });

  it('separa as aulas pelos cabeçalhos numerados', () => {
    const doc = normalizeText([
      'AULA 1 — PRIMEIRA', 'conteúdo um',
      'AULA — CONTINUAÇÃO SEM NÚMERO', 'ainda da aula um',
      'AULA 2 — SEGUNDA', 'conteúdo dois',
    ].join('\n'));
    const aulas = splitLessons(doc);
    expect(aulas.map((a) => a.numero)).toEqual([1, 2]);
    // O cabeçalho sem número NÃO cria uma aula nova.
    expect(aulas[0].linhas.join('\n')).toContain('ainda da aula um');
  });

  it('classifica marcadores semânticos (requisito 23)', () => {
    expect(classificarCabecalho('PEGADINHA').tipo).toBe('pegadinha');
    expect(classificarCabecalho('MEMÓRIA CENTRAL').tipo).toBe('memorize');
    expect(classificarCabecalho('MAPA DE 30 SEGUNDOS').tipo).toBe('mapa-mental');
    expect(classificarCabecalho('QUESTÕES — PADRÃO IAN').tipo).toBe('questao');
    expect(classificarCabecalho('CORREÇÃO E MECANISMO DA BANCA').tipo).toBe('gabarito-comentado');
    expect(classificarCabecalho('FRASE FINAL').tipo).toBe('fechamento');
    expect(classificarCabecalho('MISSÃO DO DIA — 4 HORAS').tipo).toBe('missao-do-dia');
  });

  it('não confunde a chave de gabarito com um cabeçalho', () => {
    expect(classificarCabecalho('1-C | 2-D | 3-C | 4-D | 5-B | 6-C')).toBeNull();
  });

  it('lê a chave de gabarito compacta', () => {
    const m = parseGabaritoCompacto('GABARITO: 1-B | 2-C | 3-A.');
    expect(m.get(1)).toBe('B');
    expect(m.get(3)).toBe('A');
  });

  it('lê as correções comentadas', () => {
    const c = parseCorrecoes('1-B: porque sim.\n2-C: outra razão.');
    expect(c.get(1)).toEqual({ resposta: 'B', comentario: 'porque sim.' });
  });

  it('expande alternativas escritas em uma única linha', () => {
    const out = expandirAlternativasInline(['A) I apenas. B) II apenas. C) I e III. D) todas.']);
    expect(out).toHaveLength(4);
    expect(out[2]).toBe('C) I e III.');
  });

  it('extrai questões numeradas', () => {
    const q = parseQuestoes([
      '1. Qual a base do IPTU?',
      'A) renda', 'B) valor venal', 'C) preço', 'D) nada',
    ]);
    expect(q).toHaveLength(1);
    expect(q[0].options).toHaveLength(4);
  });

  it('extrai questões SEM numeração usando a frase anterior como enunciado', () => {
    const q = parseQuestoes([
      'Assinale a alternativa CORRETA:',
      'A) primeira', 'B) segunda', 'C) terceira', 'D) quarta',
    ]);
    expect(q).toHaveLength(1);
    expect(q[0].question).toBe('Assinale a alternativa CORRETA:');
  });

  it('separa cabeçalho de questão e instruções da alternativa anterior', () => {
    const q = parseQuestoes([
      'Questão 5 — quero testar conceito, não memória',
      'Um Município estabelece determinada cobrança como punição pela prática de uma infração administrativa.',
      'Considerando apenas essa característica, a cobrança:',
      'A) constitui necessariamente imposto.',
      'B) constitui necessariamente taxa de polícia.',
      'C) não se caracteriza como tributo se sua natureza for de sanção por ato ilícito.',
      'D) será contribuição de melhoria caso o valor arrecadado seja utilizado em obra pública. Questão 6 Uma nova pergunta começa aqui.',
      'Responda sem voltar na matéria: 1?, 2?, 3?, 4?, 5?',
    ]);
    expect(q).toHaveLength(1);
    expect(q[0].numero).toBe(5);
    expect(q[0].question).toContain('Um Município estabelece');
    expect(q[0].options[3].text).toBe('será contribuição de melhoria caso o valor arrecadado seja utilizado em obra pública.');
  });

  it('classifica gabarito compacto com pipes como bloco de gabarito', () => {
    expect(classificarCabecalho('GABARITO: 1-B | 2-A | 3-C | 4-D | 5-C.')).toEqual({
      tipo: 'gabarito',
      titulo: 'GABARITO: 1-B | 2-A | 3-C | 4-D | 5-C.',
    });
  });

  it('converte uma aula completa preservando os blocos', () => {
    const bruta = {
      numero: 12,
      titulo: 'IPTU',
      linhas: [
        'MEMÓRIA CENTRAL', 'IPTU É MUNICIPAL.',
        '1. FATO GERADOR', 'Art. 32. O IPTU tem como fato gerador a propriedade.',
        'Memória: IPTU → VALOR VENAL.',
        'MAPA DE 30 SEGUNDOS', 'FATO GERADOR → OBRIGAÇÃO → LANÇAMENTO',
        'QUESTÕES — PADRÃO IAN',
        '1. Base do IPTU?', 'A) renda', 'B) valor venal', 'C) preço', 'D) nada',
        'GABARITO: 1-B.',
        'CORREÇÃO E MECANISMO DA BANCA', '1-B: a base é o valor venal.',
      ],
    };
    const { lesson } = converterAula(bruta, { padrao: 'Direito Tributário', regras: [], porNumero: {} });

    expect(lesson.id).toBe('direito-tributario-aula-012');
    expect(lesson.questoes).toHaveLength(1);
    expect(lesson.questoes[0].correctAnswer).toBe('B');
    expect(lesson.questoes[0].explanation).toContain('valor venal');
    expect(lesson.mapasMentais[0].nos).toEqual(['FATO GERADOR', 'OBRIGAÇÃO', 'LANÇAMENTO']);
    // Transcrição de lei vira bloco jurídico próprio.
    expect(lesson.leiSeca.length).toBeGreaterThan(0);
    // "Memória:" inline vira card de memorização.
    expect(lesson.conteudo.some((b) => b.tipo === 'memorize')).toBe(true);
    expect(validateLesson(lesson).errors).toHaveLength(0);
  });

  it('marca como oculto — e nunca inventa — gabarito omitido pelo documento (requisito 103)', () => {
    const bruta = {
      numero: 14,
      titulo: 'ISS',
      linhas: [
        'QUESTÕES — PADRÃO IAN — SEM GABARITO NESTA ETAPA',
        '1. O ISS incide sobre?', 'A) mercadorias', 'B) serviços da lista', 'C) renda', 'D) imóveis',
      ],
    };
    const { lesson } = converterAula(bruta, { padrao: 'Direito Tributário', regras: [], porNumero: {} });
    expect(lesson.questoes[0].correctAnswer).toBe('');
    expect(lesson.questoes[0].gabaritoOculto).toBe(true);
    expect(validateLesson(lesson).errors).toHaveLength(0);
  });
});

describe('conteúdo real importado', () => {
  const { lessons, errors } = loadLessons();

  it('carrega todas as aulas sem erro de JSON', () => {
    expect(errors).toHaveLength(0);
    expect(lessons.length).toBeGreaterThan(0);
  });

  it('não possui aulas inválidas', () => {
    for (const lesson of lessons) {
      const r = validateLesson(lesson);
      expect(r.errors, `${lesson.id}: ${r.errors.map((e) => e.message).join('; ')}`).toHaveLength(0);
    }
  });

  it('não possui duplicidades (requisito 13)', () => {
    const r = validateCollection(lessons);
    expect(r.errors.map((e) => e.message)).toEqual([]);
  });

  it('o manifesto está sincronizado com o disco', () => {
    const manifest = readJson(MANIFEST_PATH, null);
    expect(manifest).not.toBeNull();
    const r = validateManifest(manifest, lessons);
    expect(r.errors.map((e) => e.message)).toEqual([]);
  });

  it('todo hash gravado confere com o recalculado', () => {
    for (const lesson of lessons) {
      const { _file, contentHash, ...rest } = lesson;
      expect(computeContentHash(rest), lesson.id).toBe(contentHash);
    }
  });

  it('cada arquivo de aula existe no diretório esperado', () => {
    expect(fs.existsSync(LESSONS_DIR)).toBe(true);
    const arquivos = fs.readdirSync(LESSONS_DIR).filter((f) => f.endsWith('.json'));
    expect(arquivos.length).toBe(lessons.length);
  });

  it('toda questão com gabarito aponta para uma alternativa existente', () => {
    for (const lesson of lessons) {
      for (const q of lesson.questoes) {
        if (!q.correctAnswer) continue;
        expect(q.options.map((o) => o.id), q.id).toContain(q.correctAnswer);
      }
    }
  });
});

describe('revisão espaçada (requisito 30)', () => {
  it('agenda 24h, 7, 21 e 30 dias', () => {
    const datas = bucketReviewsShim('2026-09-27');
    expect(datas).toEqual(['2026-09-28', '2026-10-04', '2026-10-18', '2026-10-27']);
  });
});
