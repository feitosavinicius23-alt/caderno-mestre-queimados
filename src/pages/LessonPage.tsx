/**
 * Página de aula (requisitos 22, 19, 28, 29, 32).
 * Rota dinâmica: /aulas/:disciplina/:slug — gerada a partir do manifesto.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Lesson } from '@/types';
import { findEntryBySlug, lessonHref, loadLesson, manifest, subjectSlugOf } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { ContentBlockView } from '@/components/ContentBlock';
import { MissionPanel } from '@/components/MissionPanel';
import { Barra, SeloStatus, Skeleton, Vazio, formatarData } from '@/components/ui';

export default function LessonPage() {
  const { disciplina = '', slug = '' } = useParams();
  const { state, dispatch } = useStore();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [notaAberta, setNotaAberta] = useState(false);
  const [rascunho, setRascunho] = useState('');
  const artigoRef = useRef<HTMLElement | null>(null);

  const entry = findEntryBySlug(disciplina, slug);
  const lessonId = entry?.id ?? null;

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setLesson(null);
    if (!lessonId) {
      setCarregando(false);
      return;
    }
    loadLesson(lessonId).then((data) => {
      if (!ativo) return;
      setLesson(data);
      setCarregando(false);
    });
    return () => { ativo = false; };
  }, [lessonId]);

  // Marca a aula como aberta (define "última aula" para o Continuar Estudando).
  useEffect(() => {
    if (lessonId) dispatch({ type: 'openLesson', lessonId });
  }, [lessonId, dispatch]);

  // Contabiliza tempo de estudo enquanto a aba está visível.
  useEffect(() => {
    if (!lessonId) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        dispatch({ type: 'addStudyTime', lessonId, segundos: 15 });
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [lessonId, dispatch]);

  const progresso = lessonId ? state.progresso[lessonId] : undefined;
  const statusAtual = progresso?.status ?? 'nao-iniciada';

  // Salva a posição de leitura (requisito 19).
  const registrarScroll = useCallback(() => {
    const node = artigoRef.current;
    if (!node || !lessonId) return;
    const rect = node.getBoundingClientRect();
    const altura = node.scrollHeight - window.innerHeight;
    const lido = altura > 0 ? Math.min(1, Math.max(0, -rect.top / altura)) : 1;

    let blocoAtual: string | null = null;
    for (const section of node.querySelectorAll<HTMLElement>('section[id], figure[id]')) {
      if (section.getBoundingClientRect().top <= 120) blocoAtual = section.id;
    }
    dispatch({ type: 'readProgress', lessonId, ratio: lido, blocoId: blocoAtual });
  }, [lessonId, dispatch]);

  useEffect(() => {
    if (!lesson) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(registrarScroll);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [lesson, registrarScroll]);

  // Restaura a posição de leitura ao reabrir a aula.
  const restaurado = useRef(false);
  useEffect(() => {
    if (!lesson || restaurado.current) return;
    restaurado.current = true;
    const bloco = progresso?.blocoAtual;
    if (bloco) {
      const alvo = document.getElementById(bloco);
      if (alvo) setTimeout(() => alvo.scrollIntoView({ block: 'start' }), 60);
    }
  }, [lesson, progresso?.blocoAtual]);

  const vizinhas = useMemo(() => {
    if (!entry) return { anterior: undefined, proxima: undefined };
    const index = manifest.aulas.findIndex((a) => a.id === entry.id);
    return { anterior: manifest.aulas[index - 1], proxima: manifest.aulas[index + 1] };
  }, [entry]);

  const notasDaAula = useMemo(
    () => Object.values(state.notas).filter((nota) => nota.lessonId === lessonId),
    [state.notas, lessonId],
  );

  if (!entry) {
    return (
      <Vazio
        icone="🔍"
        titulo="Aula não encontrada"
        texto="O endereço pode estar desatualizado. Veja a lista completa em Aulas."
      />
    );
  }

  if (carregando) return <Skeleton linhas={5} />;

  if (!lesson) {
    return (
      <div className="cartao" role="alert">
        <h2>Não foi possível carregar esta aula</h2>
        <p className="suave">
          O arquivo <span className="mono">content/aulas/{entry.id}.json</span> está ausente ou inválido.
          Rode <span className="mono">npm run validate-content</span> para diagnosticar.
        </p>
        <Link className="botao" to="/aulas">Voltar para as aulas</Link>
      </div>
    );
  }

  const favoritoId = `aula:${lesson.id}`;
  const favoritada = Boolean(state.favoritos[favoritoId]);
  const larguraClasse =
    state.settings.larguraLeitura === 'estreita' ? ' leitura--estreita'
      : state.settings.larguraLeitura === 'larga' ? ' leitura--larga' : '';

  return (
    <article ref={artigoRef} className={`leitura${larguraClasse}`}>
      <nav aria-label="Trilha" className="fraco" style={{ marginBottom: 8 }}>
        <Link to="/aulas">Aulas</Link> ›{' '}
        <Link to={`/disciplinas/${subjectSlugOf(lesson.disciplina)}`}>{lesson.disciplina}</Link>
      </nav>

      <header>
        <div className="linha linha--entre">
          <span className="selo">Aula {lesson.numero}</span>
          <SeloStatus status={statusAtual} />
        </div>
        <h1 style={{ marginTop: 10 }}>{lesson.titulo}</h1>
        {lesson.assunto ? <p className="suave" style={{ marginTop: -4 }}>{lesson.assunto}</p> : null}

        <div className="linha fraco" style={{ gap: 14, marginBottom: 12 }}>
          <span>⏱ {lesson.tempoEstimadoMin} min</span>
          <span>❓ {lesson.questoes.length} questões</span>
          <span>📅 {formatarData(lesson.data)}</span>
        </div>

        <Barra
          valor={(progresso?.scrollRatio ?? 0) * 100}
          rotulo={`Leitura da aula ${lesson.numero}`}
        />

        <div className="linha mt">
          <button
            type="button"
            className="botao botao--secundario"
            aria-pressed={favoritada}
            onClick={() =>
              dispatch({
                type: 'toggleFavorite',
                item: {
                  id: favoritoId,
                  tipo: 'aula',
                  lessonId: lesson.id,
                  titulo: lesson.titulo,
                  criadoEm: new Date().toISOString(),
                },
              })
            }
          >
            {favoritada ? '★ Favoritada' : '☆ Favoritar'}
          </button>
          <button type="button" className="botao botao--secundario" onClick={() => setNotaAberta((v) => !v)}>
            📝 Anotar
          </button>
        </div>

        {notaAberta ? (
          <div className="cartao mt">
            <label className="rotulo-secao" htmlFor="nova-nota" style={{ marginTop: 0 }}>
              Nota pessoal (separada do conteúdo oficial)
            </label>
            <textarea
              id="nova-nota"
              className="campo"
              value={rascunho}
              onChange={(event) => setRascunho(event.target.value)}
              placeholder="Escreva sua anotação sobre esta aula…"
            />
            <div className="linha mt">
              <button
                type="button"
                className="botao"
                disabled={!rascunho.trim()}
                onClick={() => {
                  const agora = new Date().toISOString();
                  dispatch({
                    type: 'saveNote',
                    note: {
                      id: `${lesson.id}-nota-${Date.now()}`,
                      lessonId: lesson.id,
                      blocoId: progresso?.blocoAtual ?? null,
                      texto: rascunho.trim(),
                      criadoEm: agora,
                      atualizadoEm: agora,
                    },
                  });
                  setRascunho('');
                  setNotaAberta(false);
                }}
              >
                Salvar nota
              </button>
              <button type="button" className="botao botao--secundario" onClick={() => setNotaAberta(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <hr style={{ border: 0, borderTop: '1px solid var(--borda)', margin: '20px 0' }} />

      {lesson.missao ? <MissionPanel missao={lesson.missao} /> : null}

      {lesson.conteudo.map((bloco) => (
        <ContentBlockView
          key={bloco.id}
          bloco={bloco}
          mapas={lesson.mapasMentais}
          questoes={lesson.questoes}
          lessonId={lesson.id}
          disciplina={lesson.disciplina}
          assunto={lesson.assunto}
        />
      ))}

      {/* Requisito 8: anotações do documento ficam separadas do conteúdo oficial. */}
      {lesson.anotacoes.length > 0 ? (
        <section className="cartao mt" aria-label="Anotações do estudante">
          <div className="rotulo-secao" style={{ marginTop: 0 }}>Anotações do estudante (não oficiais)</div>
          {lesson.anotacoes.map((nota) => (
            <p key={nota.id} className="suave" style={{ whiteSpace: 'pre-wrap' }}>{nota.texto}</p>
          ))}
        </section>
      ) : null}

      {notasDaAula.length > 0 ? (
        <section className="cartao mt" aria-label="Suas notas">
          <div className="rotulo-secao" style={{ marginTop: 0 }}>Suas notas</div>
          {notasDaAula.map((nota) => (
            <div key={nota.id} className="linha linha--entre" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', flex: 1 }}>{nota.texto}</p>
              <button
                type="button"
                className="botao botao--fantasma"
                aria-label="Excluir nota"
                onClick={() => dispatch({ type: 'deleteNote', noteId: nota.id })}
              >
                ✕
              </button>
            </div>
          ))}
        </section>
      ) : null}

      <div className="mt">
        {statusAtual === 'concluida' || statusAtual === 'revisada' ? (
          <button
            type="button"
            className="botao botao--secundario botao--grande"
            onClick={() => dispatch({ type: 'reopenLesson', lessonId: lesson.id })}
          >
            ✓ Aula concluída — reabrir
          </button>
        ) : (
          <button
            type="button"
            className="botao botao--grande"
            onClick={() => dispatch({ type: 'completeLesson', lessonId: lesson.id })}
          >
            Marcar aula como concluída
          </button>
        )}
        <p className="fraco centro mt">
          Concluir agenda revisões para 24 horas, 7, 21 e 30 dias.
        </p>
      </div>

      <nav className="linha linha--entre mt" aria-label="Navegação entre aulas">
        {vizinhas.anterior ? (
          <Link className="botao botao--secundario" to={lessonHref(vizinhas.anterior)}>
            ← Aula {vizinhas.anterior.numero}
          </Link>
        ) : <span />}
        {vizinhas.proxima ? (
          <Link className="botao botao--secundario" to={lessonHref(vizinhas.proxima)}>
            Aula {vizinhas.proxima.numero} →
          </Link>
        ) : <span />}
      </nav>

      <p className="fraco centro mt">
        Fonte: {lesson.fonte} · atualizada em {formatarData(lesson.ultimaAtualizacao)} ·{' '}
        <span className="mono">{lesson.contentHash}</span>
      </p>
    </article>
  );
}
