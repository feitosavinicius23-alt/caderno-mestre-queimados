/**
 * Rotas da aplicação.
 * As páginas de aula usam rota DINÂMICA (/aulas/:disciplina/:slug) resolvida
 * contra o manifesto — adicionar uma aula nova nunca exige mexer neste arquivo
 * (requisitos 65 e 66).
 */
import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Lessons = lazy(() => import('@/pages/Lessons'));
const LessonPage = lazy(() => import('@/pages/LessonPage'));
const SubjectsList = lazy(() => import('@/pages/Subjects'));
const SubjectPage = lazy(() => import('@/pages/Subjects').then((m) => ({ default: m.SubjectPage })));
const Plan = lazy(() => import('@/pages/Plan'));
const Mission = lazy(() => import('@/pages/Mission'));
const Questions = lazy(() => import('@/pages/Questions'));
const Simulados = lazy(() => import('@/pages/Simulados'));
const LeiSeca = lazy(() => import('@/pages/LeiSeca'));
const Reviews = lazy(() => import('@/pages/Reviews'));
const ErrorNotebook = lazy(() => import('@/pages/ErrorNotebook'));
const MindMaps = lazy(() => import('@/pages/MindMaps'));
const Favorites = lazy(() => import('@/pages/Favorites'));
const Stats = lazy(() => import('@/pages/Stats'));
const News = lazy(() => import('@/pages/News'));
const Search = lazy(() => import('@/pages/Search'));
const Settings = lazy(() => import('@/pages/Settings'));
const StatusSync = lazy(() => import('@/pages/StatusSync'));
const NotFound = lazy(() => import('@/pages/NotFound'));

export default function App() {
  return (
    <Layout>
      <ErrorBoundary>
        <Suspense fallback={<Skeleton linhas={4} />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/aulas" element={<Lessons />} />
            <Route path="/aulas/:disciplina/:slug" element={<LessonPage />} />
            <Route path="/disciplinas" element={<SubjectsList />} />
            <Route path="/disciplinas/:slug" element={<SubjectPage />} />
            <Route path="/plano" element={<Plan />} />
            <Route path="/missao" element={<Mission />} />
            <Route path="/questoes" element={<Questions />} />
            <Route path="/simulados" element={<Simulados />} />
            <Route path="/lei-seca" element={<LeiSeca />} />
            <Route path="/revisoes" element={<Reviews />} />
            <Route path="/erros" element={<ErrorNotebook />} />
            <Route path="/mapas" element={<MindMaps />} />
            <Route path="/favoritos" element={<Favorites />} />
            <Route path="/estatisticas" element={<Stats />} />
            <Route path="/novidades" element={<News />} />
            <Route path="/busca" element={<Search />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/status-sync" element={<StatusSync />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
