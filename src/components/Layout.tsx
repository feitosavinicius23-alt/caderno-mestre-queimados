/** Casca da aplicação: topo, gaveta de navegação, barra inferior mobile. */
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { manifest, metadata } from '@/services/content';
import { useStore } from '@/hooks/useStore';
import { formatarDataHora } from './ui';
import { DriveSyncButton } from './DriveSyncButton';

const MENU = [
  { to: '/', rotulo: 'Dashboard', icone: '🏠', fim: true },
  { to: '/aulas', rotulo: 'Aulas', icone: '📚' },
  { to: '/disciplinas', rotulo: 'Disciplinas', icone: '🗂️' },
  { to: '/plano', rotulo: 'Plano de Estudos', icone: '📅' },
  { to: '/missao', rotulo: 'Missão do Dia', icone: '🎯' },
  { to: '/questoes', rotulo: 'Questões', icone: '❓' },
  { to: '/simulados', rotulo: 'Simulados', icone: '⏱️' },
  { to: '/lei-seca', rotulo: 'Lei Seca', icone: '§' },
  { to: '/revisoes', rotulo: 'Revisões', icone: '🔁' },
  { to: '/erros', rotulo: 'Caderno de Erros', icone: '📕' },
  { to: '/mapas', rotulo: 'Mapas Mentais', icone: '🗺️' },
  { to: '/favoritos', rotulo: 'Favoritos', icone: '★' },
  { to: '/estatisticas', rotulo: 'Estatísticas', icone: '📊' },
  { to: '/novidades', rotulo: 'Novidades', icone: '🆕' },
  { to: '/busca', rotulo: 'Busca', icone: '🔍' },
  { to: '/configuracoes', rotulo: 'Configurações', icone: '⚙️' },
];

const NAV_MOBILE = [
  { to: '/', rotulo: 'Início', icone: '🏠', fim: true },
  { to: '/aulas', rotulo: 'Aulas', icone: '📚' },
  { to: '/questoes', rotulo: 'Questões', icone: '❓' },
  { to: '/revisoes', rotulo: 'Revisões', icone: '🔁' },
  { to: '/busca', rotulo: 'Busca', icone: '🔍' },
];

function useTema() {
  const { state, dispatch } = useStore();
  const tema = state.settings.tema;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const aplicar = () => {
      const escuro = tema === 'escuro' || (tema === 'auto' && media.matches);
      document.documentElement.dataset.tema = escuro ? 'escuro' : 'claro';
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', escuro ? '#0c1420' : '#10284a');
    };
    aplicar();
    media.addEventListener('change', aplicar);
    return () => media.removeEventListener('change', aplicar);
  }, [tema]);

  const alternar = () =>
    dispatch({ type: 'settings', settings: { tema: tema === 'escuro' ? 'claro' : 'escuro' } });

  return { tema, alternar };
}

export function Layout({ children }: { children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const location = useLocation();
  const { tema, alternar } = useTema();
  const { state } = useStore();

  // Fecha a gaveta ao navegar e leva o foco ao topo do conteúdo.
  useEffect(() => {
    setAberto(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAberto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const temNovidade = manifest.contentVersion > state.contentVersionVista;

  // Preferências de leitura aplicadas via CSS custom properties.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--leitura-fonte', `${state.settings.fontSize}px`);
    root.style.setProperty('--leitura-linha', String(state.settings.lineHeight));
  }, [state.settings.fontSize, state.settings.lineHeight]);

  return (
    <div className="app">
      <a className="pular-para-conteudo" href="#conteudo-principal">Pular para o conteúdo</a>

      <header className="topo">
        <button
          type="button"
          className="icone-btn icone-btn--menu"
          aria-label="Abrir menu de navegação"
          aria-expanded={aberto}
          onClick={() => setAberto(true)}
        >
          ☰
        </button>
        <div className="topo__marca">
          <span className="topo__titulo">{metadata.titulo}</span>
          <span className="topo__sub">{metadata.subtitulo}</span>
        </div>
        <DriveSyncButton />
        <button
          type="button"
          className="icone-btn"
          aria-label={tema === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          onClick={alternar}
        >
          {tema === 'escuro' ? '☀️' : '🌙'}
        </button>
      </header>

      {aberto ? (
        <button
          type="button"
          className="gaveta-fundo"
          aria-label="Fechar menu"
          onClick={() => setAberto(false)}
        />
      ) : null}

      <nav
        className="gaveta"
        aria-label="Navegação principal"
        style={{ transform: aberto ? 'translateX(0)' : 'translateX(-105%)', transition: 'transform 200ms ease' }}
      >
        <div className="gaveta__cabecalho">
          <strong style={{ display: 'block', letterSpacing: '0.05em' }}>CADERNO MESTRE</strong>
          <span className="fraco">Agente Fiscal — Queimados/RJ — 2026</span>
        </div>
        <ul className="gaveta__lista">
          {MENU.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.fim}>
                <span aria-hidden="true" style={{ width: 22, textAlign: 'center' }}>{item.icone}</span>
                <span>{item.rotulo}</span>
                {item.to === '/novidades' && temNovidade ? (
                  <span className="selo selo--novo" style={{ marginLeft: 'auto' }}>novo</span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="fraco" style={{ padding: '10px 20px 24px', marginTop: 'auto' }}>
          Conteúdo atualizado em
          <br />
          {formatarDataHora(metadata.atualizadoEm)}
          <br />
          <span className="mono">v{metadata.contentVersion}</span>
        </p>
      </nav>

      <main className="conteudo" id="conteudo-principal" tabIndex={-1}>
        {children}
      </main>

      <nav className="nav-inferior" aria-label="Navegação rápida">
        {NAV_MOBILE.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.fim}>
            <span className="nav-icone" aria-hidden="true">{item.icone}</span>
            <span>{item.rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
