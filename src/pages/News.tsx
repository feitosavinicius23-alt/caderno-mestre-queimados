/** Novidades (requisitos 39, 40). */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SyncLogEntry } from '@/types';
import { findEntryById, lessonHref, manifest, metadata, loadSyncHistory } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { Stat, Vazio, formatarDataHora } from '@/components/ui';

export default function News() {
  const { state, dispatch } = useStore();
  const [historico, setHistorico] = useState<SyncLogEntry[] | null>(null);

  useEffect(() => {
    loadSyncHistory().then(setHistorico);
  }, []);

  // Marca as novidades como vistas ao abrir a página.
  useEffect(() => {
    if (manifest.contentVersion > state.contentVersionVista) {
      const timer = setTimeout(() => dispatch({ type: 'markNewsSeen' }), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.contentVersionVista, dispatch]);

  return (
    <>
      <h1>Novidades</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        Conteúdo atualizado em {formatarDataHora(metadata.atualizadoEm)} · versão{' '}
        <span className="mono">v{metadata.contentVersion}</span>
      </p>

      <div className="grade grade--3">
        <div className="cartao"><Stat valor={metadata.totalAulas} rotulo="Aulas" /></div>
        <div className="cartao"><Stat valor={metadata.totalQuestoes} rotulo="Questões" /></div>
        <div className="cartao"><Stat valor={metadata.totalDisciplinas} rotulo="Disciplinas" /></div>
      </div>

      <div className="rotulo-secao">Conteúdos adicionados recentemente</div>
      <div className="empilha">
        {metadata.recentes.map((item) => {
          const entry = findEntryById(item.id);
          if (!entry) return null;
          return (
            <Link key={item.id} className="cartao cartao--clique" to={lessonHref(entry)}>
              <div className="linha linha--entre">
                <div style={{ minWidth: 0 }}>
                  <div className="fraco">{item.disciplina}</div>
                  <strong>Aula {entry.numero} — {item.titulo}</strong>
                  <div className="fraco">{entry.totalQuestoes} questões</div>
                </div>
                <span className="selo selo--novo nowrap">{item.ultimaAtualizacao}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rotulo-secao">Histórico de sincronizações</div>
      {!historico || historico.length === 0 ? (
        <Vazio icone="🆕" titulo="Nenhuma sincronização registrada ainda" />
      ) : (
        <div className="empilha">
          {historico.slice(0, 15).map((registro, index) => (
            <div key={`${registro.data}-${index}`} className="cartao">
              <div className="linha linha--entre">
                <strong>{formatarDataHora(registro.data)}</strong>
                <span className="selo">v{registro.contentVersion}</span>
              </div>
              <ul className="fraco" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {registro.novasAulas.length ? <li>{registro.novasAulas.length} aula(s) adicionada(s)</li> : null}
                {registro.aulasModificadas.length ? <li>{registro.aulasModificadas.length} aula(s) atualizada(s)</li> : null}
                {registro.aulasRemovidas.length ? <li>{registro.aulasRemovidas.length} aula(s) removida(s)</li> : null}
                {registro.questoesAdicionadas ? <li>{registro.questoesAdicionadas} questão(ões) adicionada(s)</li> : null}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
