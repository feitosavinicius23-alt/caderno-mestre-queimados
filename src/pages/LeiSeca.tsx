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
      { titulo: 'Emendas recentes da Lei Orgânica — 042 a 046', descricao: 'Acesse a página oficial da IAN para consultar os PDFs individuais das emendas disponibilizadas pela banca.', url: 'https://portal.ian.org.br/edital/ver/53' },
    ],
  },
  {
    grupo: 'Conteúdo tributário previsto no edital',
    itens: [
      { titulo: 'Constituição Federal de 1988', descricao: 'Sistema Tributário Nacional, limitações ao poder de tributar e repartição de receitas. Consulte a referência na página oficial da IAN.', url: 'https://portal.ian.org.br/edital/ver/53' },
      { titulo: 'Código Tributário Nacional — Lei nº 5.172/1966', descricao: 'Obrigação, crédito, lançamento, fiscalização, garantias, infrações, decadência e prescrição. Consulte a referência na página oficial da IAN.', url: 'https://portal.ian.org.br/edital/ver/53' },
      { titulo: 'Lei de Execução Fiscal — Lei nº 6.830/1980', descricao: 'Cobrança judicial da dívida ativa e execução fiscal. Consulte a referência na página oficial da IAN.', url: 'https://portal.ian.org.br/edital/ver/53' },
      { titulo: 'Lei de Responsabilidade Fiscal — LC nº 101/2000', descricao: 'Gestão fiscal, receitas públicas, planejamento e transparência. Consulte a referência na página oficial da IAN.', url: 'https://portal.ian.org.br/edital/ver/53' },
      { titulo: 'Código Tributário Municipal — LC nº 001/1995', descricao: 'IPTU, ISS, ITBI, taxas, fiscalização, lançamento e cobrança. A página oficial da IAN indica os materiais do concurso.', url: 'https://portal.ian.org.br/edital/ver/53' },
    ],
  },
  {
    grupo: 'ISS e regimes tributários',
    itens: [
      { titulo: 'ISS — Lei Complementar nº 116/2003', descricao: 'Lista de serviços, local de incidência, retenção e conflitos entre municípios. Consulte a referência na página oficial da IAN.', url: 'https://portal.ian.org.br/edital/ver/53' },
      { titulo: 'Simples Nacional — Lei Complementar nº 123/2006', descricao: 'Regime simplificado e fiscalização do ISS no Simples Nacional. Consulte a referência na página oficial da IAN.', url: 'https://portal.ian.org.br/edital/ver/53' },
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
        <p className="lei-edital__intro">Acesse os materiais publicados pela banca IAN e estude na ordem dos temas cobrados para Agente Fiscal. Quando a banca não oferece um PDF separado, o link abre a página oficial do concurso para consulta.</p>
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
