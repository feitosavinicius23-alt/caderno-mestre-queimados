/** Banco de questões com filtros (requisitos 25, 37). */
import { useEffect, useMemo, useState } from 'react';
import type { Question } from '@/types';
import { loadAllQuestions, manifest, subjects } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { QuestionCard } from '@/components/QuestionCard';
import { Skeleton, Stat, Vazio } from '@/components/ui';

type Filtro = 'todas' | 'nao-respondidas' | 'erradas' | 'acertadas';

export default function Questions() {
  const { state } = useStore();
  const [questoes, setQuestoes] = useState<Question[] | null>(null);
  const [disciplina, setDisciplina] = useState('todas');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [limite, setLimite] = useState(10);

  useEffect(() => {
    loadAllQuestions().then(setQuestoes);
  }, []);

  const lista = useMemo(() => {
    if (!questoes) return [];
    return questoes.filter((question) => {
      if (disciplina !== 'todas' && question.subject !== disciplina) return false;
      const registro = state.respostas[question.id];
      switch (filtro) {
        case 'nao-respondidas': return !registro;
        case 'erradas': return registro && !registro.acertou;
        case 'acertadas': return registro?.acertou === true;
        default: return true;
      }
    });
  }, [questoes, disciplina, filtro, state.respostas]);

  const respondidas = Object.values(state.respostas);
  const acertos = respondidas.filter((r) => r.acertou).length;

  return (
    <>
      <h1>Questões</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        {manifest.totalQuestoes} questões extraídas do Caderno Mestre.
      </p>

      <div className="grade grade--3">
        <div className="cartao"><Stat valor={respondidas.length} rotulo="Resolvidas" /></div>
        <div className="cartao"><Stat valor={acertos} rotulo="Acertos" /></div>
        <div className="cartao">
          <Stat valor={respondidas.length ? `${Math.round((acertos / respondidas.length) * 100)}%` : '—'} rotulo="Taxa" />
        </div>
      </div>

      <label className="rotulo-secao" htmlFor="q-disciplina">Disciplina</label>
      <select id="q-disciplina" className="campo" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
        <option value="todas">Todas as disciplinas</option>
        {subjects.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
      </select>

      <div className="rotulo-secao">Filtros</div>
      <div className="chips">
        {([
          ['todas', 'Todas'],
          ['nao-respondidas', 'Não respondidas'],
          ['erradas', 'Erradas'],
          ['acertadas', 'Acertadas'],
        ] as Array<[Filtro, string]>).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            className={`chip${filtro === id ? ' chip--ativo' : ''}`}
            aria-pressed={filtro === id}
            onClick={() => { setFiltro(id); setLimite(10); }}
          >
            {rotulo}
          </button>
        ))}
      </div>

      <div className="rotulo-secao">{lista.length} questão(ões)</div>

      {!questoes ? <Skeleton linhas={3} /> : null}

      {questoes && lista.length === 0 ? (
        <Vazio icone="❓" titulo="Nenhuma questão com esses filtros" />
      ) : null}

      {lista.slice(0, limite).map((question) => (
        <QuestionCard
          key={question.id}
          question={question}
          lessonId={question.lessonId}
          disciplina={question.subject}
          assunto={question.topic}
          mostrarOrigem
        />
      ))}

      {lista.length > limite ? (
        <button type="button" className="botao botao--secundario botao--grande" onClick={() => setLimite((v) => v + 10)}>
          Carregar mais ({lista.length - limite} restantes)
        </button>
      ) : null}
    </>
  );
}
