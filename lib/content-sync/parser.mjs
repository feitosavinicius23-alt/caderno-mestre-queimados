/**
 * PARSER DO CADERNO MESTRE
 * ------------------------
 * Converte um arquivo Markdown do Caderno Mestre em uma aula estruturada (JSON).
 *
 * PRINCÍPIO (requisitos 7 e 103): o parser NUNCA resume, reescreve ou inventa.
 * Ele apenas CLASSIFICA e ESTRUTURA o texto que já existe. Todo texto de entrada
 * termina dentro de algum bloco da saída — nada é descartado.
 */
import { BLOCK_MARKERS } from './block-types.mjs';
import {
  deaccent,
  estimateMinutes,
  lessonId,
  questionId,
  slugify,
  today,
} from './utils.mjs';

/** Lê o front-matter YAML simples (chave: valor) no topo do arquivo. */
export function parseFrontMatter(raw) {
  const text = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: text };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    let value = kv[2].trim().replace(/^["']|["']$/g, '');
    if (/^\[.*\]$/.test(value)) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    }
    meta[key] = value;
  }
  return { meta, body: text.slice(match[0].length) };
}

/** Normaliza um rótulo para comparação com os marcadores. */
function normalizeLabel(value) {
  return deaccent(value).toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Detecta o tipo semântico de um trecho a partir do seu rótulo.
 * @returns {{type: string, titulo: string, rest: string}|null}
 */
export function detectMarker(line) {
  // Itens de checklist ("- [ ] questões") pertencem ao bloco corrente —
  // nunca abrem um novo bloco semântico.
  if (/^\s*(?:[-*]\s*)?(?:\[[ xX]\]|☐|☑)/.test(line)) return null;

  const cleaned = line.replace(/^#{1,6}\s*/, '').replace(/^[*_>\s-]+/, '').trim();
  const label = normalizeLabel(cleaned.split(/[:—–-]/)[0] || '');
  if (!label) return null;

  for (const [marker, type] of BLOCK_MARKERS) {
    if (label === marker || label.startsWith(`${marker} `)) {
      const sepIndex = cleaned.search(/[:—–]/);
      const rest = sepIndex >= 0 ? cleaned.slice(sepIndex + 1).trim() : '';
      return { type, titulo: cleaned.replace(/[:\s]+$/, ''), rest };
    }
  }
  return null;
}

/** Converte "A) texto" / "a. texto" em alternativa. */
function parseOption(line) {
  const match = line.match(/^\s*\(?([A-Ea-e])\s*[).:.\-–—]\s+(.*\S)\s*$/);
  if (!match) return null;
  return { id: match[1].toUpperCase(), text: match[2].trim() };
}

/** Extrai a resposta correta de uma linha de gabarito: "GABARITO: B". */
function parseAnswer(text) {
  const match = normalizeLabel(text).match(/\b([A-E])\b/);
  return match ? match[1] : null;
}

/**
 * Divide o corpo em segmentos rotulados, preservando 100% do texto.
 */
function splitIntoSegments(body) {
  const lines = body.split('\n');
  const segments = [];
  let current = { type: 'teoria', titulo: '', lines: [] };

  for (const line of lines) {
    const isHeading = /^#{1,6}\s+/.test(line);
    const marker = detectMarker(line);

    // Dentro de um bloco de QUESTÕES, os rótulos GABARITO/COMENTÁRIO pertencem
    // à questão corrente — não podem abrir um novo segmento, senão as questões
    // seguintes seriam engolidas pelo bloco de gabarito.
    const belongsToQuestionBlock =
      current.type === 'questao' &&
      marker &&
      (marker.type === 'gabarito' || marker.type === 'gabarito-comentado') &&
      !isHeading;

    // Um novo segmento começa num heading OU num marcador semântico isolado.
    const startsSegment = marker && !belongsToQuestionBlock && (isHeading || line.trim().length <= 120);

    if (startsSegment) {
      if (current.lines.join('\n').trim() || current.titulo) segments.push(current);
      current = { type: marker.type, titulo: marker.titulo, lines: [] };
      if (marker.rest) current.lines.push(marker.rest);
      continue;
    }

    if (isHeading) {
      if (current.lines.join('\n').trim() || current.titulo) segments.push(current);
      current = { type: 'teoria', titulo: line.replace(/^#{1,6}\s+/, '').trim(), lines: [] };
      continue;
    }

    current.lines.push(line);
  }
  if (current.lines.join('\n').trim() || current.titulo) segments.push(current);
  return segments;
}

/** Detecta tabela markdown dentro de um texto. */
function extractTable(text) {
  const lines = text.split('\n');
  const start = lines.findIndex(
    (line, i) =>
      /\|/.test(line) && lines[i + 1] && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]),
  );
  if (start < 0) return null;
  let end = start + 2;
  while (end < lines.length && /\|/.test(lines[end])) end += 1;

  const toCells = (line) =>
    line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

  return {
    headers: toCells(lines[start]),
    rows: lines.slice(start + 2, end).map(toCells),
  };
}

/** Converte "A -> B -> C" ou linhas com ↓ em nós de mapa mental. */
function parseMindMap(text) {
  const arrowSplit = /\s*(?:->|=>|→|↓|\u2192|\u2193)\s*/;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const nodes = [];
  for (const line of lines) {
    if (arrowSplit.test(line)) {
      for (const part of line.split(arrowSplit)) {
        const clean = part.replace(/^[-*•\s]+/, '').trim();
        if (clean) nodes.push(clean);
      }
    } else {
      const clean = line.replace(/^[-*•\s]+/, '').trim();
      if (clean) nodes.push(clean);
    }
  }
  return nodes;
}

/**
 * Extrai questões de um bloco de texto.
 * Formato esperado (tolerante):
 *   1. Enunciado...
 *   A) ...  B) ...  C) ...  D) ...
 *   GABARITO: B
 *   COMENTÁRIO: ...
 */
function extractQuestions(text, ownerLessonId, startIndex, subject, topic) {
  const lines = text.split('\n');
  const questions = [];
  let current = null;
  let mode = 'enunciado';

  const push = () => {
    if (current && current.question.trim() && current.options.length >= 2) {
      questions.push(current);
    }
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const numbered = line.match(/^\(?(\d{1,3})\)?\s*[).:-]\s+(.*\S)\s*$/);
    const option = parseOption(line);
    const label = normalizeLabel(line);

    if (label.startsWith('GABARITO COMENTADO') || label.startsWith('COMENTARIO') || label.startsWith('EXPLICACAO')) {
      if (current) {
        mode = 'explicacao';
        const after = line.replace(/^[^:—–]*[:—–]\s*/, '').trim();
        if (after && after !== line) current.explanation = after;
        const answer = parseAnswer(line);
        if (answer && !current.correctAnswer) current.correctAnswer = answer;
      }
      continue;
    }
    if (label.startsWith('GABARITO') || label.startsWith('RESPOSTA')) {
      if (current) {
        current.correctAnswer = parseAnswer(line) || current.correctAnswer;
        mode = 'explicacao';
      }
      continue;
    }

    if (option && current) {
      current.options.push(option);
      mode = 'alternativas';
      continue;
    }

    if (numbered && (!current || mode !== 'enunciado')) {
      push();
      current = {
        id: questionId(ownerLessonId, startIndex + questions.length + 1),
        lessonId: ownerLessonId,
        numero: Number(numbered[1]),
        question: numbered[2],
        options: [],
        correctAnswer: '',
        explanation: '',
        subject,
        topic,
      };
      mode = 'enunciado';
      continue;
    }

    if (!current) {
      current = {
        id: questionId(ownerLessonId, startIndex + questions.length + 1),
        lessonId: ownerLessonId,
        numero: questions.length + 1,
        question: line,
        options: [],
        correctAnswer: '',
        explanation: '',
        subject,
        topic,
      };
      mode = 'enunciado';
      continue;
    }

    if (mode === 'enunciado') current.question += ` ${line}`;
    else if (mode === 'explicacao') current.explanation = `${current.explanation} ${line}`.trim();
    else if (current.options.length) {
      current.options[current.options.length - 1].text += ` ${line}`;
    }
  }
  push();
  return questions;
}

/** Extrai tarefas de uma missão do dia: "- [ ] teoria" ou "☐ teoria". */
function parseMissionTasks(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^([-*]\s*\[[ xX]\]|☐|☑|\[[ xX]\])/.test(line))
    .map((line, index) => ({
      id: `t${index + 1}`,
      texto: line.replace(/^([-*]\s*\[[ xX]\]|☐|☑|\[[ xX]\])\s*/, '').trim(),
      concluida: /\[[xX]\]|☑/.test(line),
    }))
    .filter((task) => task.texto);
}

/**
 * Converte um documento Markdown em uma aula estruturada.
 * @param {string} raw conteúdo do arquivo
 * @param {object} defaults valores padrão (ex.: disciplina inferida da pasta)
 */
export function parseLesson(raw, defaults = {}) {
  const { meta, body } = parseFrontMatter(raw);
  const warnings = [];

  const disciplina = String(meta.disciplina || defaults.disciplina || '').trim();
  if (!disciplina) throw new Error('Aula sem "disciplina" no front-matter.');

  const numero = Number(meta.numero ?? defaults.numero);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`Aula sem "numero" válido (recebido: ${meta.numero ?? defaults.numero}).`);
  }

  const firstHeading = (body.match(/^#\s+(.+)$/m) || [])[1];
  const titulo = String(meta.titulo || firstHeading || '').trim();
  if (!titulo) throw new Error('Aula sem título (front-matter "titulo" ou heading "# ").');

  const id = String(meta.id || lessonId(disciplina, numero));
  const slug = slugify(meta.slug || titulo);

  const segments = splitIntoSegments(body.replace(/^#\s+.+\n?/m, ''));

  const conteudo = [];
  const questoes = [];
  const gabaritos = [];
  const mapasMentais = [];
  const revisao = [];
  const leiSeca = [];
  const anotacoes = [];
  let resumo = String(meta.resumo || '').trim();
  let missao = null;

  for (const segment of segments) {
    const text = segment.lines.join('\n').trim();
    if (!text && !segment.titulo) continue;

    const bloco = {
      id: `${id}-b${conteudo.length + 1}`,
      tipo: segment.type,
      titulo: segment.titulo || '',
      texto: text,
    };

    switch (segment.type) {
      case 'anotacao':
        // Requisito 8: anotações do estudante NÃO são conteúdo oficial.
        anotacoes.push({ id: bloco.id, titulo: bloco.titulo, texto: text, origem: 'documento' });
        continue;

      case 'questao': {
        const extracted = extractQuestions(text, id, questoes.length, disciplina, segment.titulo || titulo);
        if (extracted.length === 0) {
          warnings.push(`Bloco QUESTÃO sem alternativas reconhecidas em ${id} — mantido como texto.`);
          conteudo.push({ ...bloco, tipo: 'texto' });
          continue;
        }
        for (const question of extracted) {
          questoes.push(question);
          if (question.correctAnswer) {
            gabaritos.push({
              questionId: question.id,
              resposta: question.correctAnswer,
              comentario: question.explanation || '',
            });
          } else {
            warnings.push(`Questão ${question.id} sem gabarito identificado.`);
          }
        }
        conteudo.push({ ...bloco, tipo: 'questao', questionIds: extracted.map((q) => q.id), texto: '' });
        continue;
      }

      case 'gabarito':
      case 'gabarito-comentado': {
        // Gabaritos soltos: casam com questões já extraídas pela ordem/numeração.
        const entries = text.split('\n').map((l) => l.trim()).filter(Boolean);
        for (const entry of entries) {
          const numMatch = entry.match(/^\(?(\d{1,3})\)?\s*[).:-]?\s*/);
          const answer = parseAnswer(entry.replace(/^\(?\d{1,3}\)?\s*[).:-]?\s*/, ''));
          if (!answer) continue;
          const target = numMatch
            ? questoes.find((q) => q.numero === Number(numMatch[1]))
            : questoes.find((q) => !q.correctAnswer);
          if (!target) continue;
          target.correctAnswer = answer;
          const comment = entry.replace(/^.*?\b[A-E]\b\s*[-—–.:)]?\s*/, '').trim();
          if (comment && comment.length > 3) target.explanation = target.explanation || comment;
          const existing = gabaritos.find((g) => g.questionId === target.id);
          if (existing) {
            existing.resposta = answer;
            existing.comentario = existing.comentario || target.explanation || '';
          } else {
            gabaritos.push({ questionId: target.id, resposta: answer, comentario: target.explanation || '' });
          }
        }
        continue;
      }

      case 'mapa-mental': {
        const nodes = parseMindMap(text);
        mapasMentais.push({ id: bloco.id, titulo: segment.titulo || 'Mapa mental', nos: nodes });
        conteudo.push({ ...bloco, mapaId: bloco.id });
        continue;
      }

      case 'revisao':
        revisao.push({ id: bloco.id, titulo: segment.titulo || 'Revisão', texto: text });
        conteudo.push(bloco);
        continue;

      case 'lei-seca':
        leiSeca.push({ id: bloco.id, titulo: segment.titulo || 'Lei seca', texto: text });
        conteudo.push(bloco);
        continue;

      case 'resumo':
        if (!resumo) resumo = text;
        conteudo.push(bloco);
        continue;

      case 'missao-do-dia': {
        const tarefas = parseMissionTasks(text);
        missao = {
          id: `${id}-missao`,
          lessonId: id,
          titulo: segment.titulo || 'Missão do dia',
          descricao: tarefas.length ? '' : text,
          tarefas,
        };
        conteudo.push({ ...bloco, missaoId: missao.id });
        continue;
      }

      default: {
        const table = extractTable(text);
        if (table) conteudo.push({ ...bloco, tipo: segment.type === 'teoria' ? 'tabela' : bloco.tipo, tabela: table });
        else conteudo.push(bloco);
      }
    }
  }

  const plainText = conteudo.map((b) => `${b.titulo}\n${b.texto || ''}`).join('\n');

  const lesson = {
    id,
    numero,
    titulo,
    slug,
    disciplina,
    assunto: String(meta.assunto || segments.find((s) => s.titulo)?.titulo || titulo).trim(),
    ordem: Number(meta.ordem ?? numero),
    data: String(meta.data || today()),
    tempoEstimadoMin: Number(meta.tempoEstimadoMin || estimateMinutes(plainText)),
    resumo: resumo || '',
    conteudo,
    questoes,
    gabaritos,
    revisao,
    mapasMentais,
    leiSeca,
    missao,
    anotacoes,
    tags: Array.isArray(meta.tags) ? meta.tags : String(meta.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
    fonte: String(meta.fonte || 'Caderno Mestre — Agente Fiscal Queimados 2026'),
    ultimaAtualizacao: today(),
  };

  return { lesson, warnings };
}
