/**
 * Renderiza um bloco semântico da aula como componente visual (requisito 24).
 * Tipos desconhecidos caem no fallback "texto" — o site nunca quebra (requisito 79).
 */
import type { ContentBlock as Block, MindMap, Question, TableData } from '@/types';
import { QuestionCard } from './QuestionCard';

const ROTULOS: Record<string, { rotulo: string; icone: string }> = {
  pegadinha: { rotulo: 'Pegadinha', icone: '⚠️' },
  atencao: { rotulo: 'Atenção', icone: '❗' },
  cuidado: { rotulo: 'Cuidado', icone: '⚠️' },
  'erro-comum': { rotulo: 'Erro comum', icone: '🚫' },
  memorize: { rotulo: 'Memorize', icone: '🧠' },
  'regra-de-prova': { rotulo: 'Regra de prova', icone: '🎯' },
  definicao: { rotulo: 'Definição', icone: '📘' },
  dica: { rotulo: 'Dica', icone: '💡' },
  exemplo: { rotulo: 'Exemplo', icone: '✏️' },
  revisao: { rotulo: 'Revisão', icone: '🔁' },
  resumo: { rotulo: 'Resumo', icone: '📝' },
  fechamento: { rotulo: 'Fechamento', icone: '🏁' },
  'caderno-de-erros': { rotulo: 'Caderno de erros', icone: '📕' },
  comparacao: { rotulo: 'Comparação', icone: '⚖️' },
};

export function Tabela({ tabela }: { tabela: TableData }) {
  return (
    <div className="tabela-wrap">
      <table className="tabela">
        <thead>
          <tr>
            {tabela.headers.map((header, index) => (
              <th key={index} scope="col">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabela.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MapaMental({ mapa }: { mapa: MindMap }) {
  return (
    <figure className="bloco" style={{ margin: '0 0 18px' }}>
      <figcaption className="bloco-destaque__rotulo" style={{ color: 'var(--roxo-600)' }}>
        <span aria-hidden="true">🗺️</span> {mapa.titulo || 'Mapa mental'}
      </figcaption>
      <div className="mapa">
        {mapa.nos.map((no, index) => (
          <div key={`${mapa.id}-${index}`}>
            <div className="mapa__no">{no}</div>
            {index < mapa.nos.length - 1 ? (
              <div className="mapa__seta" aria-hidden="true">↓</div>
            ) : null}
          </div>
        ))}
      </div>
    </figure>
  );
}

interface Props {
  bloco: Block;
  mapas: MindMap[];
  questoes: Question[];
  lessonId: string;
  disciplina: string;
  assunto: string;
  modoImpressao?: boolean;
}

function PrintQuestionCard({ question }: { question: Question }) {
  return (
    <article className="questao" id={question.id}>
      <header className="questao__cabecalho">
        <span className="questao__numero">Questão {question.numero}</span>
      </header>
      <p className="questao__enunciado">{question.question}</p>
      <div className="alternativas" aria-label={`Alternativas da questão ${question.numero}`}>
        {question.options.map((option) => (
          <div
            key={option.id}
            className={`alternativa${option.id === question.correctAnswer ? ' alternativa--correta' : ''}`}
          >
            <span className="alternativa__letra" aria-hidden="true">{option.id}</span>
            <span>{option.text}</span>
          </div>
        ))}
      </div>
      <div className="gabarito">
        <div className="gabarito__rotulo">Gabarito comentado</div>
        <p style={{ marginBottom: question.explanation ? '0.7em' : 0 }}>
          <strong>{question.correctAnswer ? `Alternativa correta: ${question.correctAnswer}` : 'Gabarito ainda não disponível'}</strong>
        </p>
        {question.explanation ? <p style={{ margin: 0 }}>{question.explanation}</p> : null}
        {question.legalBasis ? (
          <p className="fraco" style={{ margin: '0.7em 0 0' }}>
            <strong>Base legal (texto estudado):</strong> {question.legalBasis}
          </p>
        ) : null}
        {question.topic ? <p className="fraco" style={{ margin: '0.7em 0 0' }}>Assunto: {question.topic}</p> : null}
      </div>
    </article>
  );
}

export function ContentBlockView({ bloco, mapas, questoes, lessonId, disciplina, assunto, modoImpressao = false }: Props) {
  const texto = bloco.texto?.trim() ?? '';

  // Mapa mental: componente visual dedicado (requisito 69).
  if (bloco.tipo === 'mapa-mental') {
    const mapa = mapas.find((m) => m.id === (bloco.mapaId ?? bloco.id));
    if (mapa) return <MapaMental mapa={mapa} />;
  }

  // Questões: componente interativo (requisito 25).
  if (bloco.tipo === 'questao') {
    const ids = new Set(bloco.questionIds ?? []);
    const doBloco = questoes.filter((q) => ids.has(q.id));
    if (doBloco.length === 0) return null;
    return (
      <section className="bloco" id={bloco.id} aria-label="Questões">
        <h3 className="bloco__titulo">{bloco.titulo || 'Questões'}</h3>
        {doBloco.map((question) => (
          modoImpressao ? (
            <PrintQuestionCard key={question.id} question={question} />
          ) : (
            <QuestionCard key={question.id} question={question} lessonId={lessonId} disciplina={disciplina} assunto={assunto} />
          )
        ))}
      </section>
    );
  }

  // Lei seca: bloco jurídico destacado (requisito 24).
  if (bloco.tipo === 'lei-seca') {
    return (
      <section className="bloco lei-seca" id={bloco.id}>
        <span className="lei-seca__rotulo">§ Lei seca</span>
        {bloco.titulo && bloco.titulo.toUpperCase() !== 'LEI SECA' ? (
          <h3 className="bloco__titulo">{bloco.titulo}</h3>
        ) : null}
        <div className="bloco__texto">{texto}</div>
      </section>
    );
  }

  if (bloco.tabela) {
    return (
      <section className="bloco" id={bloco.id}>
        {bloco.titulo ? <h3 className="bloco__titulo">{bloco.titulo}</h3> : null}
        {texto && !texto.includes('|') ? <div className="bloco__texto">{texto}</div> : null}
        <Tabela tabela={bloco.tabela} />
      </section>
    );
  }

  const destaque = ROTULOS[bloco.tipo];
  if (destaque) {
    const tituloExtra =
      bloco.titulo && bloco.titulo.toUpperCase() !== destaque.rotulo.toUpperCase() ? bloco.titulo : '';
    return (
      <section className={`bloco bloco-destaque b-${bloco.tipo}`} id={bloco.id}>
        <div className="bloco-destaque__rotulo">
          <span aria-hidden="true">{destaque.icone}</span> {destaque.rotulo}
        </div>
        {tituloExtra ? <h3 className="bloco__titulo">{tituloExtra}</h3> : null}
        <div className="bloco__texto">{texto}</div>
      </section>
    );
  }

  // Fallback: teoria / texto comum.
  if (!texto && !bloco.titulo) return null;
  return (
    <section className="bloco" id={bloco.id}>
      {bloco.titulo ? <h3 className="bloco__titulo">{bloco.titulo}</h3> : null}
      <div className="bloco__texto">{texto}</div>
    </section>
  );
}
