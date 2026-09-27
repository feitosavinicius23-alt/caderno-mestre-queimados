/**
 * PARSER DO "CADERNO MESTRE — AGENTE FISCAL QUEIMADOS 2026"
 * =========================================================
 * Converte a exportação em texto do Google Docs nas aulas estruturadas da plataforma.
 *
 * PRINCÍPIO (requisitos 7 e 103): este parser CLASSIFICA e ESTRUTURA — nunca resume,
 * reescreve, completa ou inventa. Todo parágrafo do documento termina dentro de algum
 * bloco da saída. Quando o documento deliberadamente NÃO revela um gabarito
 * ("SEM GABARITO NESTA ETAPA"), a questão é marcada com gabaritoOculto = true em vez
 * de receber uma resposta inventada.
 */
import { estimateMinutes, lessonId, questionId, slugify, today } from './utils.mjs';

/* ------------------------------------------------------------------ *
 * Normalização
 * ------------------------------------------------------------------ */

/** O export do Google Docs traz espaços duplicados e NBSP herdados da formatação. */
export function normalizeText(raw) {
  return raw
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u00a0\u2007\u202f]/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trimEnd())
    .join('\n');
}

const upper = (value) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();

/* ------------------------------------------------------------------ *
 * Divisão em aulas
 * ------------------------------------------------------------------ */

const CABECALHO_AULA = /^\s*(AULA|Aula)\s*(\d{1,3})?\s*[—–-]\s*(.+?)\s*$/;

/**
 * Localiza os cabeçalhos de aula.
 * Cabeçalhos SEM número ("AULA — OBRIGAÇÃO TRIBUTÁRIA…") são continuações da aula
 * anterior e viram uma seção dela, não uma aula nova.
 */
export function splitLessons(text) {
  const lines = text.split('\n');
  const marcadores = [];

  lines.forEach((line, index) => {
    if (line.length > 160) return;
    const match = CABECALHO_AULA.exec(line);
    if (!match) return;
    const numero = match[2] ? Number(match[2]) : null;
    const titulo = match[3].replace(/\s+/g, ' ').trim();
    if (!titulo) return;
    marcadores.push({ index, numero, titulo });
  });

  // Apenas cabeçalhos numerados abrem uma aula.
  const aberturas = marcadores.filter((m) => m.numero !== null);
  const aulas = [];

  aberturas.forEach((abertura, i) => {
    const fim = i + 1 < aberturas.length ? aberturas[i + 1].index : lines.length;
    aulas.push({
      numero: abertura.numero,
      titulo: abertura.titulo,
      linhas: lines.slice(abertura.index + 1, fim),
    });
  });

  return aulas;
}

/* ------------------------------------------------------------------ *
 * Classificação semântica dos trechos (requisito 23)
 * ------------------------------------------------------------------ */

/** Cabeçalhos em CAIXA ALTA usados pelo Caderno Mestre. */
const REGRAS_MARCADOR = [
  [/^MISSAO (DO DIA|DIARIA)/, 'missao-do-dia'],
  [/^(QUESTOES|TESTE|SIMULADO|TREINO)\b/, 'questao'],
  [/^GABARITO COMENTADO/, 'gabarito-comentado'],
  [/^CORRECAO E MECANISMO DA BANCA/, 'gabarito-comentado'],
  [/^CORRECAO\b/, 'gabarito-comentado'],
  [/^GABARITO\b/, 'gabarito'],
  [/^COMO A IAN PODE TENTAR ENGANAR/, 'pegadinha'],
  [/^PEGADINHA/, 'pegadinha'],
  [/^ERRO(S)? COMUM/, 'erro-comum'],
  [/^MAPA (DE|MENTAL)/, 'mapa-mental'],
  [/^MEMORIA CENTRAL/, 'memorize'],
  [/^MEMORIZE/, 'memorize'],
  [/^(RECUPERACAO|REVISAO)\b/, 'revisao'],
  [/^(FRASE FINAL|REGRA FINAL DA AULA|FECHAMENTO)/, 'fechamento'],
  [/^(REGRA DE OURO|REGRA-MAE|REGRA MAE|REGRA DE PROVA|TRIO QUE PRECISA FICAR AUTOMATICO)/, 'regra-de-prova'],
  [/^(ATENCAO|CUIDADO)/, 'atencao'],
  [/^RESUMO/, 'resumo'],
  [/^(LEI SECA|TEXTO DE LEI)/, 'lei-seca'],
  [/^DEFINICAO/, 'definicao'],
  [/^(EXEMPLO|CASO PRATICO)/, 'exemplo'],
  [/^(DICA|OBSERVACAO)/, 'dica'],
  [/^(COMPARACAO|COMPARE)/, 'comparacao'],
  [/^CADERNO DE ERROS/, 'caderno-de-erros'],
  [/^BLOCO \d+/, 'teoria'],
];

/** Seção numerada de teoria: "3. CONTRIBUINTE — CTN, ART. 34". */
const SECAO_NUMERADA = /^(\d{1,2})\.\s+(.{3,120})$/;

/**
 * Decide se uma linha é um cabeçalho de trecho e qual o seu tipo.
 * @returns {{tipo: string, titulo: string}|null}
 */
export function classificarCabecalho(line) {
  const texto = line.trim();
  if (!texto || texto.length > 130) return null;

  // Gabaritos compactos são um marcador de bloco mesmo quando usam "|".
  // A guarda genérica de pipes abaixo não pode capturar esta linha, senão ela
  // acaba anexada à última alternativa da questão.
  if (/^GABARITO\b/i.test(texto) && /\b\d{1,2}\s*[-–—]\s*[A-E]\b/i.test(texto)) {
    return { tipo: 'gabarito', titulo: texto };
  }

  // Linhas de gabarito compacto ("1-C | 2-D | 3-C") são CONTEÚDO, não cabeçalho.
  // Sem esta guarda elas seriam lidas como título em caixa alta e a chave de
  // respostas se perderia.
  if (/^\d{1,2}\s*[-–—]\s*[A-E]\b/.test(texto)) return null;
  if (texto.includes('|')) return null;

  // Linhas com seta são nós de mapa mental ("FATO GERADOR → OBRIGAÇÃO"),
  // frequentemente em CAIXA ALTA. São conteúdo, nunca cabeçalho.
  if (/(->|=>|→|↓)/.test(texto)) return null;

  const emCaixaAlta = texto === texto.toUpperCase() && /[A-ZÀ-Ú]/.test(texto);
  const chave = upper(texto);

  for (const [regex, tipo] of REGRAS_MARCADOR) {
    if (regex.test(chave)) {
      // "1. FATO GERADOR" só é cabeçalho se estiver em caixa alta;
      // "1. Segundo o CTN, o fato gerador…" é enunciado de questão.
      return { tipo, titulo: texto };
    }
  }

  const secao = SECAO_NUMERADA.exec(texto);
  if (secao) {
    const corpo = secao[2];
    const corpoCaixaAlta = corpo === corpo.toUpperCase() && /[A-ZÀ-Ú]/.test(corpo);
    if (corpoCaixaAlta) {
      // Reclassifica seções numeradas cujo título carrega um marcador semântico.
      const chaveCorpo = upper(corpo);
      for (const [regex, tipo] of REGRAS_MARCADOR) {
        if (regex.test(chaveCorpo)) return { tipo, titulo: texto };
      }
      return { tipo: 'teoria', titulo: texto };
    }
    return null;
  }

  // Cabeçalho em caixa alta sem numeração e sem pontuação final.
  if (emCaixaAlta && texto.length <= 90 && !/[.?!]$/.test(texto) && texto.split(' ').length <= 14) {
    return { tipo: 'teoria', titulo: texto };
  }

  return null;
}

/* ------------------------------------------------------------------ *
 * Questões
 * ------------------------------------------------------------------ */

const LINHA_ENUNCIADO = /^(\d{1,2})\.\s+(.+)$/;
const LINHA_ALTERNATIVA = /^([A-E])\)\s+(.+)$/;
const CABECALHO_QUESTAO = /^(?:QUEST(?:ÃO|AO)|Q)\s+(\d{1,2})(?:\s*[—–-]\s*(.*))?$/i;

/** Remove caudas de instruções/cabeçalhos que nunca pertencem à alternativa. */
function limparTextoAlternativa(texto) {
  return texto
    .replace(/\s+(?:QUEST(?:ÃO|AO)|Q)\s+\d{1,2}\b[\s\S]*$/i, '')
    .replace(/\s+(?:RESPONDA|GABARITO|RESPOSTA)\b[\s\S]*$/i, '')
    .trim();
}

/** "GABARITO: 1-B | 2-C | 3-C." -> Map { 1:'B', 2:'C', 3:'C' } */
export function parseGabaritoCompacto(texto) {
  const mapa = new Map();
  for (const match of texto.matchAll(/(\d{1,2})\s*[-–—]\s*([A-E])\b/g)) {
    mapa.set(Number(match[1]), match[2]);
  }
  return mapa;
}

/** "1-B: o distrator reduz…" -> Map { 1: 'o distrator reduz…' } */
export function parseCorrecoes(texto) {
  const mapa = new Map();
  for (const linha of texto.split('\n')) {
    const match = /^(\d{1,2})\s*[-–—]\s*([A-E])\s*[:.)-]\s*(.+)$/.exec(linha.trim());
    if (match) mapa.set(Number(match[1]), { resposta: match[2], comentario: match[3].trim() });
  }
  return mapa;
}

/** Extrai as questões de um trecho já identificado como bloco de questões. */
/**
 * Algumas questões trazem as alternativas na MESMA linha:
 *   "A) I apenas. B) II apenas. C) I e III apenas. D) I, II e III."
 * Expandimos essas linhas em uma alternativa por linha antes de processar.
 */
export function expandirAlternativasInline(linhas) {
  const saida = [];
  for (const linha of linhas) {
    const texto = linha.trim();
    if (LINHA_ALTERNATIVA.test(texto) && /\s[B-E]\)\s/.test(texto)) {
      const partes = texto.split(/\s+(?=[A-E]\)\s)/);
      if (partes.length >= 2 && partes.every((p) => LINHA_ALTERNATIVA.test(p))) {
        saida.push(...partes);
        continue;
      }
    }
    saida.push(linha);
  }
  return saida;
}

export function parseQuestoes(linhasBrutas) {
  const linhas = expandirAlternativasInline(linhasBrutas);
  const questoes = [];
  let atual = null;
  let modo = 'nenhum';
  /** Última linha comum vista — vira enunciado de questões não numeradas. */
  let anterior = '';

  const fechar = () => {
    if (atual && atual.options.length >= 2) {
      atual.options = atual.options.map((option) => ({
        ...option,
        text: limparTextoAlternativa(option.text),
      }));
      questoes.push(atual);
    }
    atual = null;
  };

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trim();
    if (!linha) continue;

    const cabecalhoQuestao = CABECALHO_QUESTAO.exec(linha);
    if (cabecalhoQuestao) {
      fechar();
      atual = { numero: Number(cabecalhoQuestao[1]), question: '', options: [] };
      modo = 'enunciado';
      anterior = '';
      continue;
    }

    // Instruções de resposta pertencem ao material bruto, mas não à última
    // alternativa. O gabarito compacto será processado pelo bloco próprio.
    if (atual?.options.length && /^(?:RESPONDA|GABARITO|RESPOSTA)\b/i.test(linha)) {
      fechar();
      modo = 'nenhum';
      anterior = '';
      continue;
    }

    const alternativa = LINHA_ALTERNATIVA.exec(linha);
    if (alternativa) {
      // Nas aulas iniciais o enunciado não é numerado: ele é apenas a frase
      // imediatamente anterior à alternativa "A)". Ao ver um novo "A)",
      // encerramos a questão corrente e abrimos outra com essa frase.
      if (alternativa[1] === 'A' && (!atual || atual.options.length > 0)) {
        fechar();
        if (anterior && anterior.length <= 600) {
          atual = { numero: questoes.length + 1, question: anterior, options: [] };
        }
      }
      if (atual) {
        atual.options.push({ id: alternativa[1], text: alternativa[2].trim() });
        modo = 'alternativas';
      }
      continue;
    }

    anterior = linha;

    const enunciado = LINHA_ENUNCIADO.exec(linha);
    if (enunciado && (!atual || modo === 'alternativas')) {
      fechar();
      atual = { numero: Number(enunciado[1]), question: enunciado[2].trim(), options: [] };
      modo = 'enunciado';
      continue;
    }

    if (!atual) continue; // texto introdutório antes da primeira questão
    if (modo === 'enunciado') atual.question += ` ${linha}`;
    else if (modo === 'alternativas' && atual.options.length) {
      atual.options[atual.options.length - 1].text += ` ${linha}`;
    }
  }
  fechar();
  return questoes;
}

/** Um trecho contém questões objetivas se traz pelo menos duas alternativas. */
export function contemAlternativas(linhas) {
  const alternativas = linhas.filter((l) => LINHA_ALTERNATIVA.test(l.trim())).length;
  return alternativas >= 2;
}

/**
 * Texto introdutório do bloco de questões: tudo antes da primeira questão.
 * A primeira questão começa no primeiro enunciado numerado OU, quando os
 * enunciados não são numerados, na linha imediatamente anterior ao primeiro "A)".
 */
function introDoBloco(linhas) {
  let corte = linhas.length;

  for (let i = 0; i < linhas.length; i += 1) {
    if (LINHA_ENUNCIADO.test(linhas[i].trim()) || CABECALHO_QUESTAO.test(linhas[i].trim())) {
      corte = i; break;
    }
  }

  for (let i = 0; i < linhas.length; i += 1) {
    if (/^A\)\s/.test(linhas[i].trim())) {
      let anterior = i - 1;
      while (anterior >= 0 && !linhas[anterior].trim()) anterior -= 1;
      corte = Math.min(corte, Math.max(0, anterior));
      break;
    }
  }

  return linhas.slice(0, corte).map((l) => l.trim()).filter(Boolean).join('\n');
}

/* ------------------------------------------------------------------ *
 * Mapas mentais e missões
 * ------------------------------------------------------------------ */

const SETA = /\s*(?:->|=>|→|↓)\s*/;

function parseMapa(linhas) {
  const nos = [];
  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trim();
    if (!linha) continue;
    if (SETA.test(linha)) {
      for (const parte of linha.split(SETA)) {
        const no = parte.replace(/^[-*•\s]+/, '').replace(/[.;]$/, '').trim();
        if (no) nos.push(no);
      }
    } else {
      const no = linha.replace(/^[-*•\s]+/, '').replace(/[.;]$/, '').trim();
      if (no) nos.push(no);
    }
  }
  return nos;
}

/** Tarefas da missão: "1h20 — teoria guiada", "50 min — questões", "BLOCO 1 — …". */
function parseTarefas(linhas) {
  const tarefas = [];
  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trim();
    if (!linha) continue;
    if (/^(\d+\s*h\s*\d*|\d+\s*min|BLOCO\s+\d+|[-*•]|\[\s?\])/i.test(linha)) {
      const texto = linha.replace(/^[-*•]\s*/, '').replace(/^\[\s?\]\s*/, '').trim();
      if (texto) tarefas.push({ id: `t${tarefas.length + 1}`, texto, concluida: false });
    }
  }
  return tarefas;
}

/* ------------------------------------------------------------------ *
 * Conversão de uma aula
 * ------------------------------------------------------------------ */

/** Um parágrafo que começa com "Art." é transcrição de lei. */
const PARECE_LEI = /^(Art\.|Artigo|§|Parágrafo único)/i;

/** Frases de memorização inline: "Memória: ZONA URBANA → LEI MUNICIPAL + 2 DE 5." */
const INLINE_MEMORIA = /^(Memória|Memorize|Guarde|Grave)\s*[:—–-]\s*(.+)$/i;

function resolverDisciplina(numero, titulo, config) {
  const fixo = config?.porNumero?.[String(numero)];
  if (fixo) return fixo;
  const chave = upper(titulo);
  for (const regra of config?.regras ?? []) {
    if (chave.includes(upper(regra.contemNoTitulo))) return regra.disciplina;
  }
  return config?.padrao ?? 'Direito Tributário';
}

/**
 * Converte uma aula bruta (cabeçalho + linhas) em objeto Lesson.
 * @returns {{lesson: object, warnings: string[]}}
 */
export function converterAula(aulaBruta, config, opcoes = {}) {
  const warnings = [];
  const { numero, titulo: tituloBruto, linhas } = aulaBruta;

  const titulo = tituloBruto.replace(/\s+/g, ' ').trim();
  const disciplina = resolverDisciplina(numero, titulo, config);
  const id = lessonId(disciplina, numero);

  /* 1. Segmenta as linhas em trechos rotulados. */
  const trechos = [];
  let corrente = { tipo: 'teoria', titulo: '', linhas: [] };

  for (const linha of linhas) {
    const cabecalho = classificarCabecalho(linha);
    if (cabecalho) {
      if (corrente.linhas.some((l) => l.trim()) || corrente.titulo) trechos.push(corrente);
      corrente = { tipo: cabecalho.tipo, titulo: cabecalho.titulo, linhas: [] };
      continue;
    }
    corrente.linhas.push(linha);
  }
  if (corrente.linhas.some((l) => l.trim()) || corrente.titulo) trechos.push(corrente);

  /* 2. Converte cada trecho em bloco / questão / mapa / missão. */
  const conteudo = [];
  const questoes = [];
  const gabaritos = [];
  const mapasMentais = [];
  const revisao = [];
  const leiSeca = [];
  let missao = null;
  let resumo = '';

  const novoId = () => `${id}-b${conteudo.length + 1}`;

  for (const trecho of trechos) {
    const texto = trecho.linhas.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!texto && !trecho.titulo) continue;

    // Nas primeiras aulas o Caderno Mestre não usa um cabeçalho padronizado
    // antes das questões ("11. RODADA DE TREINO…", ou nada). Em vez de mapear
    // cada variação de título, reclassificamos qualquer trecho que traga
    // alternativas objetivas — a estrutura manda, não o rótulo.
    if (trecho.tipo === 'teoria' && contemAlternativas(trecho.linhas)) {
      trecho.tipo = 'questao';
    }

    switch (trecho.tipo) {
      case 'questao': {
        const extraidas = parseQuestoes(trecho.linhas);
        if (extraidas.length === 0) {
          conteudo.push({ id: novoId(), tipo: 'teoria', titulo: trecho.titulo, texto });
          break;
        }
        // O próprio cabeçalho avisa quando o gabarito é omitido de propósito
        // ("SEM GABARITO ANTECIPADO", "NÃO HÁ GABARITO ANTECIPADO").
        const semGabarito = /(SEM|NAO HA|NAO E REVELADO O) GABARITO/.test(upper(trecho.titulo));
        const intro = introDoBloco(trecho.linhas);
        const base = questoes.length;

        for (const [i, q] of extraidas.entries()) {
          questoes.push({
            id: questionId(id, base + i + 1),
            lessonId: id,
            numero: q.numero,
            question: q.question.replace(/\s+/g, ' ').trim(),
            options: q.options.map((o) => ({ id: o.id, text: o.text.replace(/\s+/g, ' ').trim() })),
            correctAnswer: '',
            explanation: '',
            gabaritoOculto: semGabarito,
            subject: disciplina,
            topic: titulo,
          });
        }

        conteudo.push({
          id: novoId(),
          tipo: 'questao',
          titulo: trecho.titulo,
          texto: intro,
          questionIds: questoes.slice(base).map((q) => q.id),
        });
        break;
      }

      case 'gabarito': {
        // "GABARITO: 1-B | 2-C | …" preenche as questões ainda sem resposta.
        const mapa = parseGabaritoCompacto(`${trecho.titulo}\n${texto}`);
        if (mapa.size === 0) {
          conteudo.push({ id: novoId(), tipo: 'teoria', titulo: trecho.titulo, texto });
          break;
        }
        const pendentes = questoes.filter((q) => !q.correctAnswer);
        for (const [num, letra] of mapa) {
          const alvo =
            pendentes.find((q) => q.numero === num) ?? questoes.find((q) => q.numero === num && !q.correctAnswer);
          if (!alvo) continue;
          if (!alvo.options.some((o) => o.id === letra)) {
            warnings.push(`Aula ${numero}: gabarito "${num}-${letra}" não corresponde a alternativa existente.`);
            continue;
          }
          alvo.correctAnswer = letra;
          alvo.gabaritoOculto = false;
        }
        break;
      }

      case 'gabarito-comentado': {
        const correcoes = parseCorrecoes(texto);
        for (const [num, dados] of correcoes) {
          const alvo =
            questoes.find((q) => q.numero === num && q.correctAnswer === dados.resposta) ??
            questoes.find((q) => q.numero === num);
          if (!alvo) continue;
          if (!alvo.correctAnswer && alvo.options.some((o) => o.id === dados.resposta)) {
            alvo.correctAnswer = dados.resposta;
            alvo.gabaritoOculto = false;
          }
          if (!alvo.explanation) alvo.explanation = dados.comentario;
        }
        // O texto da correção também fica visível como bloco.
        conteudo.push({ id: novoId(), tipo: 'gabarito-comentado', titulo: trecho.titulo, texto });
        break;
      }

      case 'mapa-mental': {
        const blocoId = novoId();
        const nos = parseMapa(trecho.linhas);
        if (nos.length >= 2) {
          mapasMentais.push({ id: blocoId, titulo: trecho.titulo, nos });
          conteudo.push({ id: blocoId, tipo: 'mapa-mental', titulo: trecho.titulo, texto, mapaId: blocoId });
        } else {
          conteudo.push({ id: blocoId, tipo: 'memorize', titulo: trecho.titulo, texto });
        }
        break;
      }

      case 'missao-do-dia': {
        const tarefas = parseTarefas(trecho.linhas);
        missao = {
          id: `${id}-missao`,
          lessonId: id,
          titulo: trecho.titulo,
          descricao: tarefas.length ? '' : texto,
          tarefas,
        };
        conteudo.push({ id: novoId(), tipo: 'missao-do-dia', titulo: trecho.titulo, texto, missaoId: missao.id });
        break;
      }

      case 'revisao': {
        const blocoId = novoId();
        revisao.push({ id: blocoId, titulo: trecho.titulo, texto });
        conteudo.push({ id: blocoId, tipo: 'revisao', titulo: trecho.titulo, texto });
        break;
      }

      case 'lei-seca': {
        const blocoId = novoId();
        leiSeca.push({ id: blocoId, titulo: trecho.titulo, texto });
        conteudo.push({ id: blocoId, tipo: 'lei-seca', titulo: trecho.titulo, texto });
        break;
      }

      case 'resumo':
      case 'fechamento': {
        if (!resumo) resumo = texto;
        conteudo.push({ id: novoId(), tipo: trecho.tipo, titulo: trecho.titulo, texto });
        break;
      }

      default: {
        // Dentro da teoria, isola transcrições de lei e frases de memorização.
        const paragrafos = texto.split('\n').filter((p) => p.trim());
        const acumulado = [];

        const despejar = () => {
          if (!acumulado.length) return;
          conteudo.push({
            id: novoId(),
            tipo: trecho.tipo,
            titulo: acumulado.primeiro ? trecho.titulo : '',
            texto: acumulado.join('\n'),
          });
          acumulado.length = 0;
        };

        let primeiroBloco = true;
        for (const paragrafo of paragrafos) {
          const linha = paragrafo.trim();
          const memoria = INLINE_MEMORIA.exec(linha);

          if (PARECE_LEI.test(linha)) {
            if (acumulado.length) {
              conteudo.push({
                id: novoId(), tipo: trecho.tipo,
                titulo: primeiroBloco ? trecho.titulo : '', texto: acumulado.join('\n'),
              });
              primeiroBloco = false;
              acumulado.length = 0;
            }
            const blocoId = novoId();
            leiSeca.push({ id: blocoId, titulo: trecho.titulo, texto: linha });
            conteudo.push({ id: blocoId, tipo: 'lei-seca', titulo: '', texto: linha });
            continue;
          }

          if (memoria) {
            if (acumulado.length) {
              conteudo.push({
                id: novoId(), tipo: trecho.tipo,
                titulo: primeiroBloco ? trecho.titulo : '', texto: acumulado.join('\n'),
              });
              primeiroBloco = false;
              acumulado.length = 0;
            }
            conteudo.push({ id: novoId(), tipo: 'memorize', titulo: '', texto: memoria[2].trim() });
            continue;
          }

          acumulado.push(linha);
        }

        if (acumulado.length) {
          conteudo.push({
            id: novoId(), tipo: trecho.tipo,
            titulo: primeiroBloco ? trecho.titulo : '', texto: acumulado.join('\n'),
          });
        } else if (primeiroBloco && trecho.titulo && !conteudo.some((b) => b.titulo === trecho.titulo)) {
          conteudo.push({ id: novoId(), tipo: trecho.tipo, titulo: trecho.titulo, texto: '' });
        }
        break;
      }
    }
  }

  /* 3. Questões que continuaram sem resposta.
   *
   * O Caderno Mestre às vezes guarda o gabarito para a execução seguinte
   * ("Registre suas respostas 1 a 6… o gabarito não é revelado nesta etapa").
   * Nesse caso a questão é VÁLIDA e fica marcada como gabarito oculto.
   * Em hipótese alguma uma resposta é inventada (requisito 103). */
  for (const q of questoes) {
    if (!q.correctAnswer) q.gabaritoOculto = true;
  }

  /* 4. Gabaritos derivados das questões. */
  for (const q of questoes) {
    if (q.correctAnswer) {
      gabaritos.push({ questionId: q.id, resposta: q.correctAnswer, comentario: q.explanation || '' });
    }
  }

  const ocultas = questoes.filter((q) => q.gabaritoOculto).length;
  if (ocultas > 0) {
    warnings.push(
      `Aula ${numero}: ${ocultas} questão(ões) sem gabarito no documento ` +
      `(marcadas como "SEM GABARITO" — preservadas para recuperação ativa).`,
    );
  }
  const semResposta = questoes.filter((q) => !q.correctAnswer && !q.gabaritoOculto).length;
  if (semResposta > 0) {
    warnings.push(`Aula ${numero}: ${semResposta} questão(ões) sem gabarito localizável no documento.`);
  }

  const textoPlano = conteudo.map((b) => `${b.titulo} ${b.texto}`).join(' ');

  const lesson = {
    id,
    numero,
    titulo,
    slug: slugify(titulo),
    disciplina,
    assunto: titulo,
    ordem: numero,
    data: opcoes.data ?? today(),
    tempoEstimadoMin: estimateMinutes(textoPlano),
    resumo,
    conteudo,
    questoes,
    gabaritos,
    revisao,
    mapasMentais,
    leiSeca,
    missao,
    anotacoes: [],
    tags: [],
    fonte: 'Caderno Mestre — Agente Fiscal Queimados 2026',
    fonteUrl: opcoes.fonteUrl ?? '',
    ultimaAtualizacao: today(),
  };

  return { lesson, warnings };
}

/** Converte o documento inteiro. */
export function converterDocumento(rawText, config, opcoes = {}) {
  const texto = normalizeText(rawText);
  const brutas = splitLessons(texto);
  const lessons = [];
  const warnings = [];

  for (const bruta of brutas) {
    try {
      const { lesson, warnings: avisos } = converterAula(bruta, config, opcoes);
      lessons.push(lesson);
      warnings.push(...avisos);
    } catch (error) {
      warnings.push(`Falha ao converter a aula ${bruta.numero}: ${error.message}`);
    }
  }

  /**
   * O Caderno Mestre repete títulos (ex.: aulas 16 e 31 tratam de "CONTRIBUIÇÃO DE
   * MELHORIA…"). Slugs precisam ser únicos por disciplina para gerar URLs estáveis,
   * então a aula de MENOR número mantém o slug limpo e as demais recebem sufixo.
   * O ID permanente não muda — apenas a URL é desambiguada.
   */
  const porSlug = new Map();
  for (const lesson of lessons) {
    const chave = `${lesson.disciplina}::${lesson.slug}`;
    if (!porSlug.has(chave)) porSlug.set(chave, []);
    porSlug.get(chave).push(lesson);
  }
  for (const grupo of porSlug.values()) {
    if (grupo.length < 2) continue;
    grupo.sort((a, b) => a.numero - b.numero);
    for (const lesson of grupo.slice(1)) {
      lesson.slug = `${lesson.slug}-aula-${lesson.numero}`;
      warnings.push(
        `Aula ${lesson.numero}: título repetido no documento — slug ajustado para "${lesson.slug}".`,
      );
    }
  }

  return { lessons, warnings };
}
