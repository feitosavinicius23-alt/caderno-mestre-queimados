/** Simulados gerados a partir do banco de questões (requisito 74). */
import { useEffect, useMemo, useState } from 'react';
import type { Question } from '@/types';
import { loadAllQuestions, subjects } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { QuestionCard } from '@/components/QuestionCard';
import { Skeleton, Stat, Vazio } from '@/components/ui';

type Fonte = 'todas' | 'erradas' | 'estudadas' | 'nao-respondidas';

function embaralhar<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Simulados() {
  const { state, dispatch } = useStore();
  const [banco, setBanco] = useState<Question[] | null>(null);
  const [disciplina, setDisciplina] = useState('todas');
  const [quantidade, setQuantidade] = useState(10);
  const [fonte, setFonte] = useState<Fonte>('todas');
  const [simulado, setSimulado] = useState<Question[] | null>(null);
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    loadAllQuestions().then(setBanco);
  }, []);

  const elegiveis = useMemo(() => {
    if (!banco) return [];
    return banco.filter((question) => {
      if (disciplina !== 'todas' && question.subject !== disciplina) return false;
      const registro = state.respostas[question.id];
      const progresso = state.progresso[question.lessonId];
      switch (fonte) {
        case 'erradas': return registro && !registro.acertou;
        case 'nao-respondidas': return !registro;
        case 'estudadas':
          return progresso?.status === 'concluida' || progresso?.status === 'revisada';
        default: return true;
      }
    });
  }, [banco, disciplina, fonte, state.respostas, state.progresso]);

  function iniciar() {
    const selecionadas = embaralhar(elegiveis).slice(0, quantidade);
    // Reinicia as respostas dessas questões para uma avaliação limpa.
    for (const question of selecionadas) dispatch({ type: 'resetAnswer', questionId: question.id });
    setSimulado(selecionadas);
    setFinalizado(false);
    window.scrollTo({ top: 0 });
  }

  const respondidasNoSimulado = simulado?.filter((q) => state.respostas[q.id]) ?? [];
  const acertosNoSimulado = respondidasNoSimulado.filter((q) => state.respostas[q.id]?.acertou).length;

  if (simulado) {
    return (
      <>
        <h1>Simulado em andamento</h1>
        <div className="cartao">
          <div className="linha linha--entre">
            <strong>{respondidasNoSimulado.length} de {simulado.length} respondidas</strong>
            <span className="selo">{acertosNoSimulado} acerto(s)</span>
          </div>
        </div>

        {finalizado ? (
          <div className="cartao mt">
            <h2>Resultado</h2>
            <div className="grade grade--3">
              <Stat valor={simulado.length} rotulo="Questões" />
              <Stat valor={acertosNoSimulado} rotulo="Acertos" />
              <Stat
                valor={`${respondidasNoSimulado.length ? Math.round((acertosNoSimulado / simulado.length) * 100) : 0}%`}
                rotulo="Aproveitamento"
              />
            </div>
            <p className="fraco mt">
              As questões erradas foram adicionadas ao Caderno de Erros automaticamente.
            </p>
          </div>
        ) : null}

        <div className="rotulo-secao">Questões</div>
        {simulado.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            lessonId={question.lessonId}
            disciplina={question.subject}
            assunto={question.topic}
            mostrarOrigem
          />
        ))}

        <div className="linha mt">
          {!finalizado ? (
            <button type="button" className="botao botao--grande" onClick={() => { setFinalizado(true); window.scrollTo({ top: 0 }); }}>
              Finalizar simulado
            </button>
          ) : (
            <button type="button" className="botao botao--secundario botao--grande" onClick={() => setSimulado(null)}>
              Voltar à configuração
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <h1>Simulados</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        Monte um simulado com as questões já extraídas do Caderno Mestre.
      </p>

      {!banco ? <Skeleton linhas={2} /> : null}

      {banco && banco.length === 0 ? (
        <Vazio icone="⏱️" titulo="Ainda não há questões" texto="Importe aulas com questões para gerar simulados." />
      ) : null}

      {banco && banco.length > 0 ? (
        <div className="cartao">
          <label className="rotulo-secao" htmlFor="sim-disciplina" style={{ marginTop: 0 }}>Disciplina</label>
          <select id="sim-disciplina" className="campo" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
            <option value="todas">Todas</option>
            {subjects.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
          </select>

          <label className="rotulo-secao" htmlFor="sim-fonte">Origem das questões</label>
          <select id="sim-fonte" className="campo" value={fonte} onChange={(e) => setFonte(e.target.value as Fonte)}>
            <option value="todas">Todas as questões</option>
            <option value="nao-respondidas">Apenas não respondidas</option>
            <option value="erradas">Apenas erradas anteriormente</option>
            <option value="estudadas">Apenas de conteúdo já estudado</option>
          </select>

          <label className="rotulo-secao" htmlFor="sim-qtd">
            Quantidade de questões: {quantidade}
          </label>
          <input
            id="sim-qtd"
            type="range"
            min={1}
            max={Math.max(1, Math.min(50, elegiveis.length))}
            value={Math.min(quantidade, Math.max(1, elegiveis.length))}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <p className="fraco">{elegiveis.length} questão(ões) disponível(is) com esses critérios.</p>

          <button type="button" className="botao botao--grande" disabled={elegiveis.length === 0} onClick={iniciar}>
            Iniciar simulado
          </button>
        </div>
      ) : null}
    </>
  );
}
