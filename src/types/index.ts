/**
 * Schemas de dados da plataforma (requisito 67).
 * Espelham exatamente o que os scripts de /lib/content-sync geram.
 */

export type BlockType =
  | 'teoria' | 'definicao' | 'atencao' | 'cuidado' | 'pegadinha' | 'regra-de-prova'
  | 'memorize' | 'exemplo' | 'questao' | 'gabarito' | 'gabarito-comentado'
  | 'revisao' | 'mapa-mental' | 'resumo' | 'lei-seca' | 'caderno-de-erros'
  | 'fechamento' | 'dica' | 'comparacao' | 'erro-comum' | 'missao-do-dia'
  | 'tabela' | 'texto';

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface ContentBlock {
  id: string;
  tipo: BlockType | string;
  titulo: string;
  texto: string;
  tabela?: TableData;
  questionIds?: string[];
  mapaId?: string;
  missaoId?: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  lessonId: string;
  numero: number;
  question: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  topic: string;
}

export interface AnswerKey {
  questionId: string;
  resposta: string;
  comentario: string;
}

export interface MindMap {
  id: string;
  titulo: string;
  nos: string[];
}

export interface TextSection {
  id: string;
  titulo: string;
  texto: string;
}

export interface StudyMissionTask {
  id: string;
  texto: string;
  concluida: boolean;
}

export interface StudyMission {
  id: string;
  lessonId: string;
  titulo: string;
  descricao: string;
  tarefas: StudyMissionTask[];
}

export interface StudentNote {
  id: string;
  titulo: string;
  texto: string;
  origem: 'documento' | 'usuario';
}

export interface Lesson {
  id: string;
  numero: number;
  titulo: string;
  slug: string;
  disciplina: string;
  assunto: string;
  ordem: number;
  data: string;
  tempoEstimadoMin: number;
  resumo: string;
  conteudo: ContentBlock[];
  questoes: Question[];
  gabaritos: AnswerKey[];
  revisao: TextSection[];
  mapasMentais: MindMap[];
  leiSeca: TextSection[];
  missao: StudyMission | null;
  anotacoes: StudentNote[];
  tags: string[];
  fonte: string;
  ultimaAtualizacao: string;
  contentHash: string;
}

export interface ManifestEntry {
  id: string;
  numero: number;
  titulo: string;
  slug: string;
  disciplina: string;
  assunto: string;
  arquivo: string;
  hash: string;
  totalQuestoes: number;
  ultimaAtualizacao: string;
}

export interface SyncManifest {
  versao: number;
  contentVersion: number;
  documento: string;
  ultimaSincronizacao: string;
  contentHashGlobal: string;
  totalAulas: number;
  totalQuestoes: number;
  totalDisciplinas: number;
  aulas: ManifestEntry[];
}

export interface Subject {
  id: string;
  slug: string;
  nome: string;
  totalAulas: number;
  totalQuestoes: number;
  tempoEstimadoMin: number;
  assuntos: string[];
  aulas: Array<{ id: string; numero: number; titulo: string; slug: string }>;
}

export interface ContentMetadata {
  titulo: string;
  subtitulo: string;
  contentVersion: number;
  atualizadoEm: string;
  totalAulas: number;
  totalQuestoes: number;
  totalDisciplinas: number;
  tempoEstimadoTotalMin: number;
  totalMapasMentais: number;
  totalLeiSeca: number;
  totalMissoes: number;
  recentes: Array<{ id: string; titulo: string; disciplina: string; slug: string; ultimaAtualizacao: string }>;
}

export interface SearchDoc {
  tipo: 'aula' | 'trecho' | 'questao' | 'mapa' | 'revisao' | 'lei';
  id: string;
  lessonId: string;
  titulo: string;
  disciplina: string;
  assunto: string;
  slug: string;
  blocoTipo?: string;
  texto: string;
}

export interface SearchIndex {
  contentVersion: number;
  geradoEm: string;
  total: number;
  documentos: SearchDoc[];
}

export interface SyncLogEntry {
  data: string;
  contentVersion: number;
  novasAulas: string[];
  aulasModificadas: string[];
  aulasRemovidas: string[];
  questoesAdicionadas: number;
  arquivosAlterados: number;
  status: 'success' | 'error';
}

/* ---------- Estado do usuário (local, IndexedDB) ---------- */

export type LessonStatus = 'nao-iniciada' | 'em-andamento' | 'concluida' | 'revisada';

export interface LessonProgress {
  lessonId: string;
  status: LessonStatus;
  scrollRatio: number;
  blocoAtual: string | null;
  iniciadaEm: string | null;
  concluidaEm: string | null;
  tempoEstudoSeg: number;
}

export interface AnswerRecord {
  questionId: string;
  lessonId: string;
  subject: string;
  escolhida: string;
  correta: string;
  /** null = resposta registrada, mas a questão ainda não tem gabarito. */
  acertou: boolean | null;
  respondidaEm: string;
  tentativas: number;
}

export interface ErrorEntry {
  questionId: string;
  lessonId: string;
  disciplina: string;
  assunto: string;
  respostaEscolhida: string;
  respostaCorreta: string;
  explicacao: string;
  data: string;
  numeroErros: number;
  revisoesFeitas: number;
  resolvido: boolean;
}

export interface ReviewItem {
  id: string;
  lessonId: string;
  etapa: number;
  agendadaPara: string;
  concluidaEm: string | null;
}

export interface FavoriteItem {
  id: string;
  tipo: 'aula' | 'trecho' | 'questao' | 'mapa' | 'lei';
  lessonId: string;
  titulo: string;
  criadoEm: string;
}

export interface UserNote {
  id: string;
  lessonId: string;
  blocoId: string | null;
  texto: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface MissionState {
  missionId: string;
  lessonId: string;
  data: string;
  tarefasConcluidas: string[];
}

export interface Settings {
  tema: 'claro' | 'escuro' | 'auto';
  fontSize: number;
  lineHeight: number;
  larguraLeitura: 'estreita' | 'media' | 'larga';
}

export interface UserState {
  versao: number;
  progresso: Record<string, LessonProgress>;
  respostas: Record<string, AnswerRecord>;
  erros: Record<string, ErrorEntry>;
  revisoes: ReviewItem[];
  favoritos: Record<string, FavoriteItem>;
  notas: Record<string, UserNote>;
  missoes: Record<string, MissionState>;
  settings: Settings;
  ultimaAula: string | null;
  sequencia: { dias: number; ultimoDia: string | null };
  diasEstudados: string[];
  contentVersionVista: number;
}
