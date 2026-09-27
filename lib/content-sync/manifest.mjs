/**
 * Construção do manifesto, metadados, disciplinas e índice de busca.
 * Tudo é derivado das aulas em disco — nunca editado à mão.
 */
import { compareLessons, computeContentHash, hashString, nowIso, slugify, stableStringify } from './utils.mjs';

export function buildManifest(lessons, previousManifest) {
  const sorted = [...lessons].sort(compareLessons);
  const entries = sorted.map((lesson) => ({
    id: lesson.id,
    numero: lesson.numero,
    titulo: lesson.titulo,
    slug: lesson.slug,
    disciplina: lesson.disciplina,
    assunto: lesson.assunto || '',
    arquivo: `aulas/${lesson._file || `${lesson.id}.json`}`,
    hash: lesson.contentHash || computeContentHash(lesson),
    totalQuestoes: (lesson.questoes || []).length,
    ultimaAtualizacao: lesson.ultimaAtualizacao,
  }));

  const totalQuestoes = sorted.reduce((sum, lesson) => sum + (lesson.questoes || []).length, 0);
  const globalHash = hashString(stableStringify(entries.map((e) => [e.id, e.hash])));

  const previousHash = previousManifest?.contentHashGlobal;
  const changed = previousHash !== globalHash;

  return {
    versao: 1,
    contentVersion: changed ? (previousManifest?.contentVersion ?? 0) + 1 : (previousManifest?.contentVersion ?? 1),
    documento: 'Caderno Mestre — Agente Fiscal Queimados 2026',
    ultimaSincronizacao: changed ? nowIso() : (previousManifest?.ultimaSincronizacao ?? nowIso()),
    contentHashGlobal: globalHash,
    totalAulas: entries.length,
    totalQuestoes,
    totalDisciplinas: new Set(entries.map((e) => e.disciplina)).size,
    aulas: entries,
  };
}

export function buildSubjects(lessons) {
  const map = new Map();
  for (const lesson of [...lessons].sort(compareLessons)) {
    const key = slugify(lesson.disciplina);
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        slug: key,
        nome: lesson.disciplina,
        totalAulas: 0,
        totalQuestoes: 0,
        tempoEstimadoMin: 0,
        assuntos: [],
        aulas: [],
      });
    }
    const subject = map.get(key);
    subject.totalAulas += 1;
    subject.totalQuestoes += (lesson.questoes || []).length;
    subject.tempoEstimadoMin += lesson.tempoEstimadoMin || 0;
    if (lesson.assunto && !subject.assuntos.includes(lesson.assunto)) subject.assuntos.push(lesson.assunto);
    subject.aulas.push({ id: lesson.id, numero: lesson.numero, titulo: lesson.titulo, slug: lesson.slug });
  }
  return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export function buildMetadata(lessons, manifest) {
  const totalMin = lessons.reduce((sum, l) => sum + (l.tempoEstimadoMin || 0), 0);
  const recent = [...lessons]
    .sort((a, b) => String(b.ultimaAtualizacao).localeCompare(String(a.ultimaAtualizacao)))
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      titulo: l.titulo,
      disciplina: l.disciplina,
      slug: l.slug,
      ultimaAtualizacao: l.ultimaAtualizacao,
    }));

  return {
    titulo: 'Caderno Mestre',
    subtitulo: 'Agente Fiscal — Queimados/RJ — 2026',
    contentVersion: manifest.contentVersion,
    atualizadoEm: manifest.ultimaSincronizacao,
    totalAulas: manifest.totalAulas,
    totalQuestoes: manifest.totalQuestoes,
    totalDisciplinas: manifest.totalDisciplinas,
    tempoEstimadoTotalMin: totalMin,
    totalMapasMentais: lessons.reduce((s, l) => s + (l.mapasMentais || []).length, 0),
    totalLeiSeca: lessons.reduce((s, l) => s + (l.leiSeca || []).length, 0),
    totalMissoes: lessons.filter((l) => l.missao).length,
    recentes: recent,
  };
}

/** Texto plano de um bloco, para indexação. */
function blockText(bloco) {
  const parts = [bloco.titulo || '', bloco.texto || ''];
  if (bloco.tabela) {
    parts.push((bloco.tabela.headers || []).join(' '));
    for (const row of bloco.tabela.rows || []) parts.push(row.join(' '));
  }
  return parts.filter(Boolean).join(' ');
}

/**
 * Índice de busca (requisito 36).
 * Mantido enxuto: trechos de até ~300 caracteres, sem duplicar a aula inteira.
 */
export function buildSearchIndex(lessons, manifest) {
  const documents = [];

  for (const lesson of [...lessons].sort(compareLessons)) {
    documents.push({
      tipo: 'aula',
      id: lesson.id,
      lessonId: lesson.id,
      titulo: lesson.titulo,
      disciplina: lesson.disciplina,
      assunto: lesson.assunto || '',
      slug: lesson.slug,
      texto: [lesson.titulo, lesson.assunto, lesson.resumo, (lesson.tags || []).join(' ')]
        .filter(Boolean)
        .join(' ')
        .slice(0, 600),
    });

    for (const bloco of lesson.conteudo || []) {
      const text = blockText(bloco);
      if (!text.trim()) continue;
      documents.push({
        tipo: bloco.tipo === 'lei-seca' ? 'lei' : 'trecho',
        id: bloco.id,
        lessonId: lesson.id,
        titulo: bloco.titulo || lesson.titulo,
        disciplina: lesson.disciplina,
        assunto: lesson.assunto || '',
        slug: lesson.slug,
        blocoTipo: bloco.tipo,
        texto: text.slice(0, 400),
      });
    }

    for (const question of lesson.questoes || []) {
      documents.push({
        tipo: 'questao',
        id: question.id,
        lessonId: lesson.id,
        titulo: `Questão ${question.numero} — ${lesson.titulo}`,
        disciplina: lesson.disciplina,
        assunto: question.topic || lesson.assunto || '',
        slug: lesson.slug,
        texto: String(question.question).slice(0, 400),
      });
    }

    for (const mapa of lesson.mapasMentais || []) {
      documents.push({
        tipo: 'mapa',
        id: mapa.id,
        lessonId: lesson.id,
        titulo: mapa.titulo,
        disciplina: lesson.disciplina,
        assunto: lesson.assunto || '',
        slug: lesson.slug,
        texto: (mapa.nos || []).join(' → ').slice(0, 400),
      });
    }

    for (const rev of lesson.revisao || []) {
      documents.push({
        tipo: 'revisao',
        id: rev.id,
        lessonId: lesson.id,
        titulo: rev.titulo,
        disciplina: lesson.disciplina,
        assunto: lesson.assunto || '',
        slug: lesson.slug,
        texto: String(rev.texto).slice(0, 400),
      });
    }
  }

  return {
    contentVersion: manifest.contentVersion,
    geradoEm: manifest.ultimaSincronizacao,
    total: documents.length,
    documentos: documents,
  };
}
