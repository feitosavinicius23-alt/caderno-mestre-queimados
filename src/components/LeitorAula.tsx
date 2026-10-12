import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

interface Props {
  texto: string;
}

export interface LeitorAulaHandle {
  ouvir: (texto?: string) => void;
}

function vozEmPortugues(voices: SpeechSynthesisVoice[]) {
  return voices.find((voice) => voice.lang.toLowerCase().startsWith('pt-br'))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('pt'));
}

export const LeitorAula = forwardRef<LeitorAulaHandle, Props>(function LeitorAula({ texto }, ref) {
  const [falando, setFalando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [velocidade, setVelocidade] = useState(1);
  const [disponivel, setDisponivel] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textoAtualRef = useRef(texto);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setDisponivel(false);
      return;
    }
    const terminar = () => setFalando(false);
    window.speechSynthesis.addEventListener('end', terminar);
    window.speechSynthesis.addEventListener('error', terminar);
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener('end', terminar);
      window.speechSynthesis.removeEventListener('error', terminar);
    };
  }, []);

  const parar = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setFalando(false);
    setPausado(false);
  }, []);

  const ouvir = useCallback((trecho = texto) => {
    if (!disponivel || !trecho.trim()) return;
    window.speechSynthesis.cancel();
    textoAtualRef.current = trecho;
    const utterance = new SpeechSynthesisUtterance(trecho.trim());
    utterance.lang = 'pt-BR';
    utterance.rate = velocidade;
    utterance.pitch = 1;
    const voz = vozEmPortugues(window.speechSynthesis.getVoices());
    if (voz) utterance.voice = voz;
    utterance.onend = () => { setFalando(false); setPausado(false); };
    utterance.onerror = () => { setFalando(false); setPausado(false); };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setFalando(true);
    setPausado(false);
  }, [disponivel, texto, velocidade]);

  useImperativeHandle(ref, () => ({ ouvir }), [ouvir]);

  const pausarOuContinuar = () => {
    if (!falando) {
      ouvir(textoAtualRef.current || texto);
      return;
    }
    if (pausado) {
      window.speechSynthesis.resume();
      setPausado(false);
    } else {
      window.speechSynthesis.pause();
      setPausado(true);
    }
  };

  if (!disponivel) {
    return <p className="fraco leitor-aula__indisponivel">A leitura de voz não está disponível neste navegador.</p>;
  }

  return (
    <div className="leitor-aula" aria-label="Controles de leitura em voz alta">
      <button type="button" className="botao" onClick={() => ouvir()}>
        🔊 Ouvir aula
      </button>
      <button type="button" className="botao botao--secundario" onClick={pausarOuContinuar}>
        {pausado ? '▶ Continuar' : '⏸ Pausar'}
      </button>
      <button type="button" className="botao botao--secundario" onClick={parar}>
        ⏹ Parar
      </button>
      <label className="leitor-aula__velocidade">
        Velocidade
        <select className="campo campo--compacto" value={velocidade} onChange={(event) => setVelocidade(Number(event.target.value))}>
          <option value={0.75}>0,75×</option>
          <option value={1}>1×</option>
          <option value={1.25}>1,25×</option>
          <option value={1.5}>1,5×</option>
          <option value={2}>2×</option>
        </select>
      </label>
      <span className="fraco leitor-aula__ajuda">
        {falando ? (pausado ? 'Leitura pausada.' : 'Lendo com a voz do seu celular…') : 'Toque nos textos para ouvir um trecho.'}
      </span>
    </div>
  );
});

export function TextoFalado({ texto, onOuvir }: { texto: string; onOuvir?: (texto: string) => void }) {
  if (!onOuvir || !texto.trim()) return <div className="bloco__texto">{texto}</div>;
  return (
    <div
      className="bloco__texto bloco__texto--falado"
      role="button"
      tabIndex={0}
      title="Toque para ouvir este trecho"
      onClick={() => onOuvir(texto)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOuvir(texto);
        }
      }}
    >
      {texto}
    </div>
  );
}
