/** Busca global (requisito 35). */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SearchDoc, SearchIndex } from '@/types';
import { findEntryById, lessonHref, loadSearchIndex } from '@/services/content';
import { Skeleton, Vazio } from '@/components/ui';

const ROTULO_TIPO: Record<SearchDoc['tipo'], string> = {
  aula: 'Aula',
  trecho: 'Trecho',
  questao: 'Questão',
  mapa: 'Mapa mental',
  revisao: 'Revisão',
  lei: 'Lei seca',
};

function normalizar(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Pontuação simples: título vale mais que corpo; todos os termos devem aparecer. */
function pontuar(doc: SearchDoc, termos: string[]): number {
  const titulo = normalizar(doc.titulo);
  const corpo = normalizar(doc.texto);
  let score = 0;
  for (const termo of termos) {
    const noTitulo = titulo.includes(termo);
    const noCorpo = corpo.includes(termo);
    if (!noTitulo && !noCorpo) return 0;
    if (noTitulo) score += 10;
    if (noCorpo) score += 3;
    if (titulo.startsWith(termo)) score += 5;
  }
  if (doc.tipo === 'aula') score += 4;
  return score;
}

export default function Search() {
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [consulta, setConsulta] = useState('');
  const [tipo, setTipo] = useState<'todos' | SearchDoc['tipo']>('todos');

  useEffect(() => {
    loadSearchIndex().then(setIndex);
  }, []);

  const resultados = useMemo(() => {
    if (!index) return [];
    const termos = normalizar(consulta).split(/\s+/).filter((t) => t.length >= 2);
    if (termos.length === 0) return [];
    return index.documentos
      .filter((doc) => tipo === 'todos' || doc.tipo === tipo)
      .map((doc) => ({ doc, score: pontuar(doc, termos) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 60);
  }, [index, consulta, tipo]);

  return (
    <>
      <h1>Busca</h1>

      <label htmlFor="campo-busca" className="rotulo-secao">Pesquisar no Caderno Mestre</label>
      <input
        id="campo-busca"
        className="campo"
        type="search"
        value={consulta}
        autoComplete="off"
        placeholder="Ex.: lançamento, IPTU, competência…"
        onChange={(event) => setConsulta(event.target.value)}
      />

      <div className="rotulo-secao">Tipo</div>
      <div className="chips">
        {(['todos', 'aula', 'trecho', 'questao', 'lei', 'mapa', 'revisao'] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`chip${tipo === item ? ' chip--ativo' : ''}`}
            aria-pressed={tipo === item}
            onClick={() => setTipo(item)}
          >
            {item === 'todos' ? 'Todos' : ROTULO_TIPO[item]}
          </button>
        ))}
      </div>

      {!index ? <Skeleton linhas={2} /> : null}

      {index && consulta.trim().length < 2 ? (
        <Vazio
          icone="🔍"
          titulo="Digite ao menos 2 caracteres"
          texto={`${index.total} trechos indexados: aulas, questões, leis, mapas e revisões.`}
        />
      ) : null}

      {index && consulta.trim().length >= 2 ? (
        <>
          <div className="rotulo-secao">{resultados.length} resultado(s)</div>
          {resultados.length === 0 ? (
            <Vazio icone="🤷" titulo="Nada encontrado" texto="Tente outra palavra-chave." />
          ) : (
            <div className="empilha">
              {resultados.map(({ doc }) => {
                const entry = findEntryById(doc.lessonId);
                const href = entry
                  ? `${lessonHref(entry)}${doc.tipo !== 'aula' ? `#${doc.id}` : ''}`
                  : '/aulas';
                return (
                  <Link key={`${doc.tipo}-${doc.id}`} className="cartao cartao--clique" to={href}>
                    <div className="linha linha--entre">
                      <span className="selo">{ROTULO_TIPO[doc.tipo]}</span>
                      <span className="fraco nowrap">{doc.disciplina}</span>
                    </div>
                    <strong style={{ display: 'block', margin: '8px 0 4px' }}>{doc.titulo}</strong>
                    <p className="fraco" style={{ margin: 0 }}>
                      {doc.texto.slice(0, 180)}
                      {doc.texto.length > 180 ? '…' : ''}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </>
  );
}
