/** Lei Seca: todos os dispositivos legais transcritos nas aulas. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/types';
import { findEntryById, lessonHref, loadLessons, manifest, subjects } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { Skeleton, Vazio } from '@/components/ui';

const legislacoesEdital = [
  {
    grupo: 'Materiais oficiais da banca IAN',
    itens: [
      { titulo: 'Página do concurso — edital e materiais', descricao: 'Central oficial da IAN para o concurso de Queimados, com edital, legislação municipal e documentos disponibilizados pela banca.', url: 'https://portal.ian.org.br/edital/ver/53' },
      { titulo: 'Edital de Abertura nº 01/2026', descricao: 'Documento oficial do concurso disponibilizado pela banca IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/b69dd1da66c2379238309f5d3e733110.pdf' },
      { titulo: 'Lei nº 1.060/2011 — Estatuto dos Servidores', descricao: 'Texto disponibilizado diretamente pela IAN na página do concurso.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/ec4f1719dbe96475ce2b52090642ea41.pdf' },
      { titulo: 'Lei Orgânica Municipal — versão revisada até a Emenda 041/2018', descricao: 'Versão oficial disponibilizada diretamente pela IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/d4603894b39e3fa2c249ffe0e1804532.pdf' },
      { titulo: 'Emenda à Lei Orgânica nº 046/2022', descricao: 'Diário Oficial — página 16. Documento disponibilizado pela IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/74eb38522d1365e0f832fe5d184a86c8.pdf' },
      { titulo: 'Emenda à Lei Orgânica nº 045/2022', descricao: 'Diário Oficial — página 10. Documento disponibilizado pela IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/0c0939dfdbcbe6e986cfffca810ca13a.pdf' },
      { titulo: 'Emenda à Lei Orgânica nº 044/2021', descricao: 'Diário Oficial — página 70. Documento disponibilizado pela IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/9420ec7b07364eb30f5635ba6a7516b3.pdf' },
      { titulo: 'Emenda à Lei Orgânica nº 043/2021', descricao: 'Diário Oficial — página 08. Documento disponibilizado pela IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/42e33f1ee5a537096a73811b7a8a1039.pdf' },
      { titulo: 'Emenda à Lei Orgânica nº 042/2021', descricao: 'Diário Oficial — página 36. Documento disponibilizado pela IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/d7de84a361799295138b93c836a8f300.pdf' },
      { titulo: 'Lei Orgânica do Município de Queimados — 2018', descricao: 'Versão publicada pela banca IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/b78bdf14650749c02481da92776dadf9.pdf' },
      { titulo: '1ª Lei Orgânica de Queimados — 1993', descricao: 'Texto promulgado em 23 de outubro de 1993 e disponibilizado pela IAN.', url: 'https://ian.org.br/arquivo.php?file=edital/1/53/9df59336594e2eb52b3582c530228876.pdf' },
    ],
  },
] as const;

export default function LeiSeca() {
  const { state, dispatch } = useStore();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [disciplina, setDisciplina] = useState('todas');

  useEffect(() => {
    loadLessons(manifest.aulas.map((a) => a.id)).then(setLessons);
  }, []);

  const itens = useMemo(() => {
    if (!lessons) return [];
    return lessons
      .filter((lesson) => disciplina === 'todas' || lesson.disciplina === disciplina)
      .flatMap((lesson) => lesson.leiSeca.map((item) => ({ item, lesson })));
  }, [lessons, disciplina]);

  if (!lessons) return <Skeleton linhas={3} />;

  return (
    <>
      <h1>Lei Seca</h1>
      <p className="suave" style={{ marginTop: -6 }}>
        Dispositivos legais transcritos no Caderno Mestre.
      </p>

      <section className="lei-edital" aria-labelledby="lei-edital-titulo">
        <div className="lei-edital__cabecalho">
          <div>
            <span className="lei-edital__rotulo">Roteiro de leitura</span>
            <h2 id="lei-edital-titulo">Legislações previstas no edital</h2>
          </div>
          <a className="botao botao--secundario lei-edital__edital" href="https://portal.ian.org.br/edital/ver/53" target="_blank" rel="noreferrer">
            Ver materiais da IAN
          </a>
        </div>
        <p className="lei-edital__intro">Acesse diretamente os documentos publicados pela banca IAN e estude na ordem da legislação municipal indicada no concurso.</p>
        <div className="lei-edital__grupos">
          {legislacoesEdital.map((grupo) => (
            <div key={grupo.grupo}>
              <h3>{grupo.grupo}</h3>
              <div className="lei-edital__lista">
                {grupo.itens.map((lei) => (
                  <a className="lei-edital__item" key={lei.titulo} href={lei.url} target="_blank" rel="noreferrer">
                    <span className="lei-edital__item-titulo">{lei.titulo} <span aria-hidden="true">↗</span></span>
                    <span className="lei-edital__item-descricao">{lei.descricao}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <label className="rotulo-secao" htmlFor="lei-disciplina">Disciplina</label>
      <select id="lei-disciplina" className="campo" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
        <option value="todas">Todas</option>
        {subjects.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
      </select>

      <div className="rotulo-secao">{itens.length} dispositivo(s)</div>

      {itens.length === 0 ? (
        <Vazio icone="§" titulo="Nenhum bloco de lei seca encontrado" />
      ) : (
        <div className="empilha">
          {itens.map(({ item, lesson }) => {
            const entry = findEntryById(lesson.id);
            const favId = `lei:${item.id}`;
            const favoritado = Boolean(state.favoritos[favId]);
            return (
              <article key={item.id} className="lei-seca">
                <div className="linha linha--entre">
                  <span className="lei-seca__rotulo">§ {lesson.disciplina}</span>
                  <button
                    type="button"
                    className="icone-btn"
                    style={{ width: 32, height: 32 }}
                    aria-pressed={favoritado}
                    aria-label={favoritado ? 'Remover dos favoritos' : 'Favoritar dispositivo'}
                    onClick={() =>
                      dispatch({
                        type: 'toggleFavorite',
                        item: {
                          id: favId,
                          tipo: 'lei',
                          lessonId: lesson.id,
                          titulo: item.texto.slice(0, 80),
                          criadoEm: new Date().toISOString(),
                        },
                      })
                    }
                  >
                    {favoritado ? '★' : '☆'}
                  </button>
                </div>
                <p style={{ whiteSpace: 'pre-wrap', margin: '0 0 10px' }}>{item.texto}</p>
                {entry ? (
                  <p className="fraco" style={{ margin: 0, fontFamily: 'var(--fonte)' }}>
                    <Link to={`${lessonHref(entry)}#${item.id}`}>
                      Aula {entry.numero} — {entry.titulo}
                    </Link>
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
