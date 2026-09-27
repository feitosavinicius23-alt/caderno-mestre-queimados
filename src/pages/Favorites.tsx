/** Favoritos (requisito 28). */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { FavoriteItem } from '@/types';
import { findEntryById, lessonHref } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { Vazio, formatarData } from '@/components/ui';

const ROTULOS: Record<FavoriteItem['tipo'], string> = {
  aula: 'Aula',
  trecho: 'Trecho',
  questao: 'Questão',
  mapa: 'Mapa mental',
  lei: 'Lei seca',
};

export default function Favorites() {
  const { state, dispatch } = useStore();
  const [tipo, setTipo] = useState<'todos' | FavoriteItem['tipo']>('todos');

  const itens = useMemo(() => {
    return Object.values(state.favoritos)
      .filter((item) => tipo === 'todos' || item.tipo === tipo)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }, [state.favoritos, tipo]);

  return (
    <>
      <h1>Favoritos</h1>

      <div className="chips">
        {(['todos', 'aula', 'questao', 'lei', 'mapa', 'trecho'] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`chip${tipo === item ? ' chip--ativo' : ''}`}
            aria-pressed={tipo === item}
            onClick={() => setTipo(item)}
          >
            {item === 'todos' ? 'Todos' : ROTULOS[item]}
          </button>
        ))}
      </div>

      <div className="rotulo-secao">{itens.length} item(ns)</div>

      {itens.length === 0 ? (
        <Vazio icone="★" titulo="Nenhum favorito ainda" texto="Use o ícone ☆ nas aulas, questões e dispositivos legais." />
      ) : (
        <div className="empilha">
          {itens.map((item) => {
            const entry = findEntryById(item.lessonId);
            const href = entry
              ? `${lessonHref(entry)}${item.tipo !== 'aula' ? `#${item.id.split(':')[1]}` : ''}`
              : '/aulas';
            return (
              <div key={item.id} className="cartao">
                <div className="linha linha--entre" style={{ alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <span className="selo">{ROTULOS[item.tipo]}</span>
                    <strong style={{ display: 'block', marginTop: 6 }}>{item.titulo}</strong>
                    <span className="fraco">{formatarData(item.criadoEm)}</span>
                  </div>
                  <button
                    type="button"
                    className="icone-btn"
                    aria-label="Remover dos favoritos"
                    onClick={() => dispatch({ type: 'toggleFavorite', item })}
                  >
                    ✕
                  </button>
                </div>
                <Link className="botao botao--fantasma" to={href} style={{ marginTop: 8 }}>Abrir →</Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
