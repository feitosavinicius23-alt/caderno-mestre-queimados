/** Configurações: tema, leitura, exportar/importar progresso (requisitos 46, 48, 49, 76). */
import { useRef, useState } from 'react';
import { useStore } from '@/hooks/useStore';
import { exportState, parseImportedState } from '@/services/storage';
import { metadata } from '@/services/content';
import { formatarDataHora } from '@/components/ui';

export default function Settings() {
  const { state, dispatch } = useStore();
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function exportar() {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caderno-mestre-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMensagem({ tipo: 'ok', texto: 'Arquivo de progresso gerado.' });
  }

  async function importar(file: File) {
    try {
      const texto = await file.text();
      const novo = parseImportedState(texto);
      dispatch({ type: 'replace', state: novo });
      setMensagem({ tipo: 'ok', texto: 'Progresso importado com sucesso.' });
    } catch (error) {
      setMensagem({ tipo: 'erro', texto: `Não foi possível importar: ${(error as Error).message}` });
    }
  }

  return (
    <>
      <h1>Configurações</h1>

      <div className="rotulo-secao">Aparência</div>
      <div className="cartao">
        <label htmlFor="cfg-tema" style={{ display: 'block', marginBottom: 6 }}>Tema</label>
        <select
          id="cfg-tema"
          className="campo"
          value={state.settings.tema}
          onChange={(e) => dispatch({ type: 'settings', settings: { tema: e.target.value as 'claro' | 'escuro' | 'auto' } })}
        >
          <option value="auto">Automático (segue o dispositivo)</option>
          <option value="claro">Claro</option>
          <option value="escuro">Escuro</option>
        </select>
      </div>

      <div className="rotulo-secao">Leitura</div>
      <div className="cartao">
        <label htmlFor="cfg-fonte" style={{ display: 'block', marginBottom: 6 }}>
          Tamanho da fonte: {state.settings.fontSize}px
        </label>
        <input
          id="cfg-fonte"
          type="range"
          min={14}
          max={24}
          value={state.settings.fontSize}
          style={{ width: '100%' }}
          onChange={(e) => dispatch({ type: 'settings', settings: { fontSize: Number(e.target.value) } })}
        />

        <label htmlFor="cfg-linha" style={{ display: 'block', margin: '14px 0 6px' }}>
          Altura da linha: {state.settings.lineHeight.toFixed(2)}
        </label>
        <input
          id="cfg-linha"
          type="range"
          min={1.4}
          max={2.2}
          step={0.05}
          value={state.settings.lineHeight}
          style={{ width: '100%' }}
          onChange={(e) => dispatch({ type: 'settings', settings: { lineHeight: Number(e.target.value) } })}
        />

        <label htmlFor="cfg-largura" style={{ display: 'block', margin: '14px 0 6px' }}>
          Largura do texto
        </label>
        <select
          id="cfg-largura"
          className="campo"
          value={state.settings.larguraLeitura}
          onChange={(e) =>
            dispatch({ type: 'settings', settings: { larguraLeitura: e.target.value as 'estreita' | 'media' | 'larga' } })
          }
        >
          <option value="estreita">Estreita (foco máximo)</option>
          <option value="media">Média (recomendada)</option>
          <option value="larga">Larga</option>
        </select>

        <p className="suave" style={{ marginTop: 14, marginBottom: 0, fontSize: `${state.settings.fontSize}px`, lineHeight: state.settings.lineHeight }}>
          Exemplo de leitura: o lançamento é o procedimento administrativo que constitui o
          crédito tributário, nos termos do art. 142 do CTN.
        </p>
      </div>

      <div className="rotulo-secao">Seus dados</div>
      <div className="cartao">
        <p className="suave">
          Todo o progresso fica salvo apenas neste dispositivo (IndexedDB). Não há login nem envio
          de dados para servidores. Use a exportação para fazer backup ou migrar de aparelho.
        </p>

        {mensagem ? (
          <p
            role="status"
            style={{ color: mensagem.tipo === 'ok' ? 'var(--verde-600)' : 'var(--vermelho-600)', fontWeight: 600 }}
          >
            {mensagem.texto}
          </p>
        ) : null}

        <div className="linha">
          <button type="button" className="botao" onClick={exportar}>Exportar dados</button>
          <button type="button" className="botao botao--secundario" onClick={() => inputRef.current?.click()}>
            Importar dados
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importar(file);
              e.target.value = '';
            }}
          />
        </div>

        <div className="linha mt">
          <button
            type="button"
            className="botao botao--perigo"
            onClick={() => {
              if (window.confirm('Apagar todo o progresso deste dispositivo? Esta ação não pode ser desfeita.')) {
                dispatch({ type: 'reset' });
                setMensagem({ tipo: 'ok', texto: 'Progresso apagado.' });
              }
            }}
          >
            Apagar todo o progresso
          </button>
        </div>
      </div>

      <div className="rotulo-secao">Sobre o conteúdo</div>
      <div className="cartao">
        <p style={{ margin: 0 }} className="suave">
          Fonte: <strong>Caderno Mestre — Agente Fiscal Queimados 2026</strong>
          <br />
          Versão do conteúdo: <span className="mono">v{metadata.contentVersion}</span>
          <br />
          Atualizado em: {formatarDataHora(metadata.atualizadoEm)}
          <br />
          {metadata.totalAulas} aulas · {metadata.totalQuestoes} questões · {metadata.totalDisciplinas} disciplinas
        </p>
      </div>
    </>
  );
}
