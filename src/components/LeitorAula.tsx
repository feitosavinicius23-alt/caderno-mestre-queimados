import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  texto: string;
}

function vozEmPortugues(voices: SpeechSynthesisVoice[]) {
  return voices.find((voice) => voice.lang.toLowerCase().startsWith('pt-br'))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('pt'));
}

export function LeitorAula({ texto }: Props) {
  const [falando, setFalando] = useState(false);
  const [disponivel, setDisponivel] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

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
  }, []);

  const ouvir = useCallback((trecho = texto) => {
    if (!disponivel || !trecho.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(trecho.trim());
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    const voz = vozEmPortugues(window.speechSynthesis.getVoices());
    if (voz) utterance.voice = voz;
    utterance.onend = () => setFalando(false);
    utterance.onerror = () => setFalando(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setFalando(true);
  }, [disponivel, texto]);

  if (!disponivel) {
    return <p className="fraco leitor-aula__indisponivel">A leitura de voz não está disponível neste navegador.</p>;
  }

  return (
    <div className="leitor-aula" aria-label="Leitura em voz alta">
      <button type="button" className="botao botao--secundario" onClick={falando ? parar : () => ouvir()}>
        {falando ? '⏹ Parar leitura' : '🔊 Ouvir aula'}
      </button>
      <span className="fraco leitor-aula__ajuda">
        {falando ? 'Lendo com a voz do seu celular…' : 'Toque nos textos para ouvir um trecho.'}
      </span>
    </div>
  );
}

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
