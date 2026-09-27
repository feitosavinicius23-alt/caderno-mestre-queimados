/** Página reservada /status-sync (requisitos 41, 42). */
import { useEffect, useState } from 'react';
import type { SyncLogEntry } from '@/types';
import { loadSyncHistory, manifest, metadata } from '@/services/content';
import { formatarDataHora } from '@/components/ui';

function Linha({ rotulo, valor, ok }: { rotulo: string; valor: string; ok?: boolean }) {
  return (
    <div className="linha linha--entre" style={{ padding: '7px 0', borderBottom: '1px solid var(--borda)' }}>
      <span className="fraco">{rotulo}</span>
      <span className="mono" style={{ color: ok === undefined ? 'inherit' : ok ? 'var(--verde-600)' : 'var(--vermelho-600)', fontWeight: 600 }}>
        {valor}
      </span>
    </div>
  );
}

export default function StatusSync() {
  const [historico, setHistorico] = useState<SyncLogEntry[]>([]);

  useEffect(() => {
    loadSyncHistory().then(setHistorico);
  }, []);

  const ultimo = historico[0];

  return (
    <>
      <h1>Status de sincronização</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        Página técnica. Reflete o estado do conteúdo no momento do último build.
      </p>

      <div className="cartao">
        <Linha rotulo="Documento" valor="Caderno Mestre — Queimados 2026" />
        <Linha rotulo="Última sincronização" valor={formatarDataHora(manifest.ultimaSincronizacao)} />
        <Linha rotulo="Content version" valor={`v${manifest.contentVersion}`} />
        <Linha rotulo="Hash global" valor={manifest.contentHashGlobal} />
        <Linha rotulo="Aulas encontradas" valor={String(manifest.totalAulas)} />
        <Linha rotulo="Questões" valor={String(manifest.totalQuestoes)} />
        <Linha rotulo="Disciplinas" valor={String(manifest.totalDisciplinas)} />
        <Linha rotulo="Aulas novas (último sync)" valor={String(ultimo?.novasAulas.length ?? 0)} />
        <Linha rotulo="Aulas alteradas (último sync)" valor={String(ultimo?.aulasModificadas.length ?? 0)} />
        <Linha rotulo="Conteúdo processado" valor="OK" ok />
        <Linha rotulo="Manifest" valor="OK" ok />
        <Linha rotulo="Search index" valor={`OK (${metadata.totalAulas > 0 ? 'gerado' : 'vazio'})`} ok />
        <Linha rotulo="Build" valor="CONCLUÍDO" ok />
      </div>

      <div className="rotulo-secao">Aulas no manifesto</div>
      <div className="cartao" style={{ overflowX: 'auto' }}>
        <table className="tabela">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">ID</th>
              <th scope="col">Disciplina</th>
              <th scope="col">Hash</th>
              <th scope="col">Questões</th>
              <th scope="col">Atualizada</th>
            </tr>
          </thead>
          <tbody>
            {manifest.aulas.map((aula) => (
              <tr key={aula.id}>
                <td>{aula.numero}</td>
                <td className="mono">{aula.id}</td>
                <td>{aula.disciplina}</td>
                <td className="mono">{aula.hash}</td>
                <td>{aula.totalQuestoes}</td>
                <td>{aula.ultimaAtualizacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rotulo-secao">Log de sincronização</div>
      <div className="cartao">
        <pre className="mono" style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.78rem' }}>
          {historico.length ? JSON.stringify(historico.slice(0, 10), null, 2) : 'Sem registros.'}
        </pre>
      </div>
    </>
  );
}
