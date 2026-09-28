/** Lei Seca: todos os dispositivos legais transcritos nas aulas. */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Lesson } from '@/types';
import { findEntryById, lessonHref, loadLessons, manifest, subjects } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { Skeleton, Vazio } from '@/components/ui';

const legislacoesEdital = [
  {
    grupo: 'Constituição e normas gerais',
    itens: [
      { titulo: 'Constituição Federal de 1988', descricao: 'Sistema Tributário Nacional, limitações ao poder de tributar e repartição de receitas.', url: 'https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm' },
      { titulo: 'Código Tributário Nacional — Lei nº 5.172/1966', descricao: 'Obrigação, crédito, lançamento, fiscalização, garantias, infrações, decadência e prescrição.', url: 'https://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm' },
      { titulo: 'Lei de Execução Fiscal — Lei nº 6.830/1980', descricao: 'Cobrança judicial da dívida ativa e execução fiscal.', url: 'https://www.planalto.gov.br/ccivil_03/leis/l6830.htm' },
      { titulo: 'Lei de Responsabilidade Fiscal — LC nº 101/2000', descricao: 'Gestão fiscal, receitas públicas, planejamento e transparência.', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp101.htm' },
    ],
  },
  {
    grupo: 'Legislação municipal de Queimados',
    itens: [
      { titulo: 'Lei Orgânica do Município de Queimados', descricao: 'Organização municipal, competências e tributos do Município.', url: 'https://www.queimados.rj.leg.br/leis/lei-organica-municipal/lei-organica-do-municipio-de-queimados' },
      { titulo: 'Código Tributário Municipal — LC nº 001/1995', descricao: 'IPTU, ISS, ITBI, taxas, fiscalização, lançamento e cobrança. Texto oficial consolidado.', url: 'https://transparencia.queimados.rj.gov.br/webrun/tmp/lai_lei_IPTU/BAD60E2A-8C15-460B-B163-5CC207C4BDEB_codigo-tributario.pdf' },
      { titulo: 'Regime Jurídico dos Servidores — Lei nº 1.060/2011', descricao: 'Legislação municipal prevista para os cargos de nível superior.', url: 'https://www.queimados.rj.leg.br/processo-legislativo/leis-municipais' },
    ],
  },
  {
    grupo: 'ISS e regimes tributários',
    itens: [
      { titulo: 'ISS — Lei Complementar nº 116/2003', descricao: 'Lista de serviços, local de incidência, retenção e conflitos entre municípios.', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp116.htm' },
      { titulo: 'Simples Nacional — Lei Complementar nº 123/2006', descricao: 'Regime simplificado e fiscalização do ISS no Simples Nacional.', url: 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm' },
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
          <a className="botao botao--secundario lei-edital__edital" href="https://transparencia.queimados.rj.gov.br/diario_oficial_get_anexo.php?codigo=9360" target="_blank" rel="noreferrer">
            Ver edital oficial
          </a>
        </div>
        <p className="lei-edital__intro">Acesse os textos oficiais e estude na ordem dos temas cobrados para Agente Fiscal.</p>
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
