#!/usr/bin/env node
/**
 * Correções editoriais comprovadas que precisam sobreviver à reimportação do Drive.
 * O script é intencionalmente idempotente e só altera questões identificadas por ID.
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('content/aulas');
const updates = new Map([
  ['direito-tributario-aula-001-q-004', {
    legalBasis: 'Constituição Federal, art. 156: compete aos Municípios instituir impostos sobre a propriedade predial e territorial urbana, serviços de qualquer natureza e transmissão onerosa inter vivos de bens imóveis; a atividade fiscalizatória, por si só, não cria automaticamente taxa.',
  }],
  ['direito-tributario-aula-001-q-007', {
    legalBasis: 'CTN, art. 113, § 2º: a obrigação acessória decorre da legislação tributária e tem por objeto prestações positivas ou negativas no interesse da arrecadação ou da fiscalização dos tributos.',
  }],
  ['direito-tributario-aula-001-q-009', {
    legalBasis: 'CTN, art. 121: sujeito passivo da obrigação principal é a pessoa obrigada ao pagamento de tributo ou penalidade pecuniária, podendo ser contribuinte ou responsável.',
  }],
  ['direito-tributario-aula-001-q-010', {
    legalBasis: 'CTN, art. 113, §§ 1º e 2º: a obrigação principal tem por objeto o pagamento de tributo ou penalidade pecuniária; a obrigação acessória tem por objeto prestações positivas ou negativas no interesse da fiscalização ou arrecadação.',
  }],
  ['direito-tributario-aula-002-q-003', {
    legalBasis: 'CTN, art. 147: o lançamento é efetuado com base na declaração do sujeito passivo ou de terceiro, quando prestada na forma e nas condições da legislação tributária.',
  }],
  ['direito-tributario-aula-002-q-004', {
    legalBasis: 'CTN, art. 150: o lançamento por homologação ocorre quando a legislação atribui ao sujeito passivo o dever de antecipar o pagamento sem prévio exame da autoridade administrativa, sujeito à posterior homologação.',
  }],
  ['direito-tributario-aula-002-q-005', {
    legalBasis: 'CTN, arts. 113, § 1º, e 142: a obrigação nasce com o fato gerador e o lançamento constitui o crédito tributário; a declaração prévia não é exigida em todo lançamento.',
  }],
  ['direito-tributario-aula-002-q-006', {
    legalBasis: 'CTN, art. 149: o lançamento é efetuado ou revisto de ofício pela autoridade administrativa nas hipóteses legais, sem depender necessariamente de declaração prévia do sujeito passivo.',
  }],
  ['direito-tributario-aula-003-q-002', {
    legalBasis: 'CTN, art. 151, II: suspende a exigibilidade do crédito tributário o depósito do seu montante integral.',
  }],
  ['direito-tributario-aula-004-q-002', {
    legalBasis: 'CTN, arts. 151, VI, e 156: o parcelamento suspende a exigibilidade do crédito, enquanto o pagamento, a remissão, a prescrição e a decadência são hipóteses de extinção.',
  }],
  ['direito-tributario-aula-004-q-005', {
    legalBasis: 'CTN, arts. 151, VI, 156 e 175: parcelamento suspende a exigibilidade; pagamento e remissão extinguem o crédito; isenção e anistia integram a exclusão do crédito tributário.',
  }],
  ['direito-tributario-aula-005-q-004', {
    legalBasis: 'CTN, arts. 151, VI, 156 e 175: parcelamento suspende a exigibilidade; remissão extingue o crédito; isenção e anistia são hipóteses de exclusão.',
  }],
  ['direito-tributario-aula-005-q-005', {
    legalBasis: 'CTN, arts. 151, II, e 156, VI: o depósito do montante integral suspende a exigibilidade; sua conversão em renda extingue o crédito tributário.',
  }],
  ['direito-tributario-aula-005-q-006', {
    legalBasis: 'CTN, art. 175, parágrafo único: a exclusão do crédito tributário não dispensa o cumprimento das obrigações acessórias dependentes da obrigação principal ou dela consequentes.',
  }],
  ['direito-tributario-aula-006-q-001', {
    legalBasis: 'CTN, art. 183: a enumeração das garantias atribuídas ao crédito tributário não exclui outras expressamente previstas em lei, em função da natureza ou das características do tributo.',
  }],
  ['direito-tributario-aula-006-q-002', {
    legalBasis: 'CTN, art. 185: presume-se fraudulenta a alienação ou oneração de bens ou rendas por sujeito passivo em débito por crédito tributário regularmente inscrito em dívida ativa.',
  }],
  ['direito-tributario-aula-006-q-003', {
    legalBasis: 'CTN, art. 185, parágrafo único: a presunção de fraude não se aplica quando o devedor reservou bens ou rendas suficientes ao total pagamento da dívida inscrita.',
  }],
  ['direito-tributario-aula-006-q-006', {
    legalBasis: 'CTN, art. 187: no concurso de preferência entre pessoas jurídicas de direito público, a União prefere aos Estados e ao Distrito Federal, que preferem aos Municípios, observadas as regras do dispositivo.',
  }],
  ['direito-tributario-aula-007-q-003', {
    legalBasis: 'CTN, art. 138: a denúncia espontânea, acompanhada das condições legais, pode excluir a responsabilidade pela infração quando apresentada antes do início de procedimento administrativo ou medida de fiscalização relacionados com a infração.',
  }],
  ['direito-tributario-aula-007-q-006', {
    legalBasis: 'CTN, art. 113, § 3º: a obrigação acessória, pelo simples fato da sua inobservância, converte-se em obrigação principal relativamente à penalidade pecuniária.',
  }],
  ['direito-tributario-aula-008-q-001', {
    legalBasis: 'CTN, art. 121: contribuinte é quem tem relação pessoal e direta com a situação que constitua o respectivo fato gerador; responsável é quem, sem ser contribuinte, tem obrigação decorrente de disposição expressa de lei.',
  }],
  ['direito-tributario-aula-008-q-004', {
    legalBasis: 'CTN, art. 133: quem adquire fundo de comércio ou estabelecimento e continua a respectiva exploração responde pelos tributos devidos até a data do ato, conforme as condições e os limites previstos no dispositivo.',
  }],
  ['direito-tributario-aula-009-q-001', {
    legalBasis: 'CTN, arts. 173 e 174: a decadência se relaciona ao prazo para constituir o crédito tributário; a prescrição se relaciona à ação de cobrança após a constituição definitiva.',
  }],
  ['direito-tributario-aula-010-q-001', {
    legalBasis: 'Constituição Federal, art. 150, I: é vedado exigir ou aumentar tributo sem lei que o estabeleça, expressão do princípio da legalidade tributária.',
  }],
  ['direito-tributario-aula-010-q-002', {
    legalBasis: 'Constituição Federal, art. 150, III, a: é vedado cobrar tributos em relação a fatos geradores ocorridos antes do início da vigência da lei que os instituiu ou aumentou.',
  }],
  ['direito-tributario-aula-010-q-005', {
    legalBasis: 'Constituição Federal, art. 150, II, III e IV: a Constituição prevê isonomia, anterioridade e vedação ao confisco; imunidade tem fundamento constitucional e isenção decorre de lei.',
  }],
  ['direito-tributario-aula-010-q-006', {
    legalBasis: 'Constituição Federal, art. 150, III: a anterioridade anual e a noventena são regras constitucionais, ressalvadas as exceções previstas na própria Constituição.',
  }],
  ['direito-tributario-aula-011-q-005', {
    legalBasis: 'Constituição Federal, arts. 145, 156 e 158: competência tributária é o poder de instituir tributos; a repartição de receitas não altera o ente competente; IPTU, ITBI e ISS são impostos municipais.',
  }],
  ['direito-tributario-aula-012-q-001', {
    legalBasis: 'CTN, art. 32: o imposto, de competência dos Municípios, tem como fato gerador a propriedade, o domínio útil ou a posse de bem imóvel por natureza ou acessão física localizado na zona urbana.',
  }],
  ['direito-tributario-aula-012-q-002', {
    legalBasis: 'CTN, art. 32, § 1º: considera-se zona urbana a definida em lei municipal, observada a existência de pelo menos dois dos melhoramentos públicos enumerados no dispositivo.',
  }],
  ['direito-tributario-aula-012-q-003', {
    legalBasis: 'CTN, art. 33: a base de cálculo do imposto é o valor venal do imóvel.',
  }],
  ['direito-tributario-aula-012-q-004', {
    legalBasis: 'CTN, art. 34: contribuinte do imposto é o proprietário do imóvel, o titular do seu domínio útil ou o seu possuidor a qualquer título.',
  }],
  ['direito-tributario-aula-012-q-005', {
    legalBasis: 'Constituição Federal, art. 156, § 1º, I e II: o IPTU pode ser progressivo em razão do valor do imóvel e ter alíquotas diferentes de acordo com a localização e o uso do imóvel.',
  }],
  ['direito-tributario-aula-012-q-006', {
    legalBasis: 'CTN, art. 32, § 2º: a lei municipal pode considerar urbanas as áreas urbanizáveis ou de expansão urbana constantes de loteamentos aprovados, destinados à habitação, indústria ou comércio, mesmo fora das zonas definidas no § 1º.',
  }],
  ['direito-tributario-aula-013-q-006', {
    legalBasis: 'Constituição Federal, art. 156, § 2º, I: o ITBI não incide sobre a transmissão de bens ou direitos incorporados ao patrimônio de pessoa jurídica em realização de capital nem sobre transmissão decorrente de fusão, incorporação, cisão ou extinção, ressalvada a atividade preponderante prevista no dispositivo.',
  }],
  ['direito-tributario-aula-014-q-001', {
    legalBasis: 'Lei Complementar nº 116/2003, art. 1º: o ISS tem como fato gerador a prestação dos serviços constantes da lista anexa, ainda que esses não se constituam como atividade preponderante do prestador.',
  }],
  ['direito-tributario-aula-014-q-002', {
    legalBasis: 'Lei Complementar nº 116/2003, arts. 3º, 4º, 7º e 8º: o local da incidência, a caracterização do estabelecimento, a base de cálculo e as alíquotas observam a disciplina nacional, com as exceções do art. 3º.',
  }],
  ['direito-tributario-aula-014-q-003', {
    legalBasis: 'Lei Complementar nº 116/2003, arts. 2º, I, e 3º: a exportação de serviços não sofre incidência quando o resultado se verifica no exterior; a regra do local do estabelecimento prestador possui as exceções do art. 3º.',
  }],
  ['direito-tributario-aula-014-q-004', {
    legalBasis: 'CTN, arts. 33 e 38, e Lei Complementar nº 116/2003, art. 7º: o IPTU tem base no valor venal do imóvel, enquanto a base de cálculo do ISS é o preço do serviço.',
  }],
  ['direito-tributario-aula-014-q-005', {
    legalBasis: 'Lei Complementar nº 116/2003, arts. 1º, 3º, 7º e 8º: o serviço da lista pode ser tributado mesmo sem ser atividade preponderante; há exceções ao local do estabelecimento e a alíquota máxima nacional é de 5%.',
  }],
  ['direito-tributario-aula-014-q-006', {
    legalBasis: 'Constituição Federal, art. 156, III, e Lei Complementar nº 116/2003, art. 1º: o Município institui ISS observando a lista de serviços definida em lei complementar nacional.',
  }],
  ['direito-tributario-aula-015-q-003', {
    legalBasis: 'CTN, art. 79: os serviços públicos para fins de taxa devem ser específicos e divisíveis, prestados ao contribuinte ou postos à sua disposição.',
  }],
  ['direito-tributario-aula-016-q-003', {
    legalBasis: 'CTN, art. 81: a contribuição de melhoria tem como limite total a despesa realizada e como limite individual o acréscimo de valor que da obra resultar para cada imóvel beneficiado.',
  }],
  ['direito-tributario-aula-016-q-006', {
    legalBasis: 'CTN, arts. 77 e 79: serviço público específico e divisível, de utilização compulsória e efetivamente posto à disposição, pode fundamentar taxa de serviço, inclusive pela utilização potencial nas condições legais.',
  }],
  ['direito-tributario-aula-017-q-002', {
    legalBasis: 'CTN, art. 204, parágrafo único: a dívida regularmente inscrita goza de presunção de certeza e liquidez, que pode ser ilidida por prova inequívoca a cargo do sujeito passivo ou de terceiro interessado.',
  }],
  ['direito-tributario-aula-017-q-003', {
    legalBasis: 'CTN, art. 206: tem os mesmos efeitos da certidão negativa a certidão de que conste a existência de créditos não vencidos, em curso de cobrança executiva com penhora efetivada ou cuja exigibilidade esteja suspensa.',
  }],
  ['direito-tributario-aula-017-q-006', {
    legalBasis: 'CTN, arts. 77, 79 e 81: taxa de serviço exige serviço específico e divisível; contribuição de melhoria pressupõe obra pública da qual decorra valorização imobiliária.',
  }],
  ['direito-tributario-aula-018-q-002', {
    legalBasis: 'CTM de Queimados, arts. 154 a 165, conforme a disciplina do processo administrativo tributário: impugnação e recurso são instrumentos distintos, ainda que ambos possam integrar a defesa administrativa.',
  }],
  ['legislacao-tributaria-de-queimados-aula-029-q-008', {
    correctAnswer: 'A',
    explanation: 'A alternativa A é a resposta correta: parcelamento suspende a exigibilidade; remissão extingue o crédito; anistia exclui o crédito tributário.',
  }],
  ['direito-tributario-aula-034-q-007', {
    legalBasis: 'CTN, art. 142: compete privativamente à autoridade administrativa constituir o crédito tributário pelo lançamento, procedimento que verifica a ocorrência do fato gerador e determina o montante devido.',
  }],
  ['direito-tributario-aula-034-q-008', {
    legalBasis: 'CTN, art. 113, § 3º: a obrigação acessória, pelo simples fato da sua inobservância, converte-se em obrigação principal relativamente à penalidade pecuniária.',
  }],
  ['direito-tributario-aula-034-q-009', {
    legalBasis: 'CTN, art. 81: a contribuição de melhoria decorre de obra pública da qual resulte valorização imobiliária, observados os limites total e individual e os demais requisitos legais.',
  }],
  ['direito-tributario-aula-034-q-010', {
    legalBasis: 'CTN, arts. 113, 142 e 145: o fato gerador faz nascer a obrigação tributária; o lançamento constitui o crédito tributário e é atividade administrativa vinculada.',
  }],
  ['direito-tributario-aula-036-q-001', {
    legalBasis: 'CTN, art. 151, VI: o parcelamento suspende a exigibilidade do crédito tributário.',
  }],
  ['direito-tributario-aula-037-q-001', {
    legalBasis: 'CTN, art. 151, I e VI: moratória e parcelamento suspendem a exigibilidade do crédito tributário.',
  }],
  ['direito-tributario-aula-037-q-004', {
    legalBasis: 'CTN, arts. 151, 156, IV, e 175: depósito integral e parcelamento suspendem; remissão extingue; anistia exclui o crédito tributário.',
  }],
  ['direito-tributario-aula-037-q-005', {
    legalBasis: 'CTN, art. 151, VI: o parcelamento suspende a exigibilidade do crédito tributário.',
  }],
  ['direito-tributario-aula-037-q-006', {
    legalBasis: 'CTN, arts. 173 e 174: decadência relaciona-se à constituição do crédito; prescrição, à cobrança do crédito constituído.',
  }],
  ['direito-tributario-aula-037-q-008', {
    legalBasis: 'CTN, art. 151, VI: o parcelamento suspende a exigibilidade do crédito tributário.',
  }],
  ['direito-tributario-aula-037-q-009', {
    legalBasis: 'CTN, arts. 151, VI, 156, IV, e 175, II: parcelamento suspende; remissão extingue; anistia exclui o crédito tributário.',
  }],
  ['direito-tributario-aula-037-q-010', {
    legalBasis: 'CTN, arts. 151, VI, 156 e 175, II: parcelamento não extingue; moratória suspende, prescrição extingue e anistia exclui o crédito tributário.',
  }],
  ['direito-tributario-aula-038-q-005', {
    legalBasis: 'CTN, arts. 121, 128 e 135: a responsabilidade depende de previsão legal e, no art. 135, de atos com excesso de poderes ou infração legal, contratual ou estatutária.',
  }],
  ['direito-tributario-aula-038-q-008', {
    legalBasis: 'CTN, art. 142: o lançamento constitui o crédito tributário.',
  }],
  ['direito-tributario-aula-038-q-009', {
    legalBasis: 'Interpretação textual: o termo “alguns” autoriza concluir apenas que pelo menos parte dos responsáveis foi notificada.',
  }],
  ['direito-tributario-aula-038-q-010', {
    legalBasis: 'CTN, arts. 151, VI, e 156, IV: parcelamento suspende a exigibilidade; remissão extingue o crédito tributário.',
  }],
  ['direito-tributario-aula-039-q-001', {
    legalBasis: 'CTN, art. 130: os créditos relativos ao imóvel sub-rogam-se na pessoa dos adquirentes, ressalvada a prova de quitação no título.',
  }],
  ['direito-tributario-aula-039-q-002', {
    legalBasis: 'CTN, art. 130, parágrafo único: na arrematação em hasta pública, a sub-rogação ocorre sobre o respectivo preço.',
  }],
  ['direito-tributario-aula-039-q-007', {
    legalBasis: 'CTN, art. 133, II: a responsabilidade subsidiária subsiste quando o alienante prossegue ou inicia nova atividade no prazo legal, sem exigir que seja do mesmo ramo.',
  }],
  ['direito-tributario-aula-039-q-008', {
    legalBasis: 'CTN, art. 156, IV: a remissão é hipótese de extinção do crédito tributário.',
  }],
  ['direito-tributario-aula-039-q-009', {
    legalBasis: 'Interpretação textual: o termo “alguns” autoriza concluir apenas que pelo menos parte dos adquirentes respondeu pelos tributos.',
  }],
  ['direito-tributario-aula-039-q-010', {
    explanation: 'A alternativa D é a resposta porque a questão pede a associação incorreta: o art. 135 trata de responsabilidade por atos com excesso de poderes ou infração legal, contratual ou estatutária, não de parcelamento.',
    legalBasis: 'CTN, arts. 130, 132, 133 e 135: os três primeiros tratam das hipóteses de sucessão indicadas; o art. 135 trata de responsabilidade pessoal, não de parcelamento.',
  }],
  ['direito-tributario-aula-040-q-002', {
    legalBasis: 'CTN, art. 135: a responsabilidade pessoal decorre de atos praticados com excesso de poderes ou infração de lei, contrato social ou estatutos.',
  }],
  ['direito-tributario-aula-040-q-010', {
    explanation: 'A alternativa D é a resposta porque a questão pede a associação incorreta: o art. 138 trata de denúncia espontânea, não de parcelamento.',
  }],
  ['direito-tributario-aula-041-q-001', {
    legalBasis: 'CTN, art. 183: a enumeração das garantias não exclui outras expressamente previstas em lei.',
  }],
  ['direito-tributario-aula-041-q-002', {
    legalBasis: 'CTN, art. 184: respondem pelo crédito tributário todos os bens e rendas do sujeito passivo, ressalvados os absolutamente impenhoráveis.',
  }],
  ['direito-tributario-aula-041-q-003', {
    legalBasis: 'CTN, art. 185: presume-se fraudulenta a alienação ou oneração de bens por sujeito passivo com débito regularmente inscrito em dívida ativa, ressalvada a hipótese legal.',
  }],
  ['direito-tributario-aula-041-q-004', {
    legalBasis: 'CTN, art. 185, parágrafo único: a presunção não se aplica quando tiverem sido reservados bens ou rendas suficientes ao total pagamento da dívida inscrita.',
  }],
  ['direito-tributario-aula-041-q-006', {
    legalBasis: 'CTN, art. 135: a responsabilidade pessoal relaciona-se a atos com excesso de poderes ou infração de lei, contrato social ou estatutos.',
  }],
  ['direito-tributario-aula-041-q-007', {
    legalBasis: 'CTN, art. 138: a denúncia apresentada após o início de procedimento administrativo ou medida de fiscalização relacionada não é espontânea.',
  }],
  ['direito-tributario-aula-041-q-010', {
    legalBasis: 'CTN, arts. 138 e 151, VI: o art. 138 trata de denúncia espontânea; parcelamento é hipótese de suspensão prevista no art. 151, VI.',
  }],
  ['direito-tributario-aula-042-q-001', {
    legalBasis: 'CTN, art. 195, parágrafo único: livros obrigatórios e comprovantes devem ser conservados até a prescrição dos créditos tributários decorrentes das operações.',
  }],
  ['direito-tributario-aula-042-q-003', {
    legalBasis: 'CTN, art. 201: dívida ativa tributária é a proveniente de crédito dessa natureza regularmente inscrito na repartição administrativa competente, depois de esgotado o prazo de pagamento.',
  }],
  ['direito-tributario-aula-042-q-004', {
    legalBasis: 'CTN, art. 204: a dívida regularmente inscrita goza de presunção relativa de certeza e liquidez, ilidível por prova inequívoca.',
  }],
  ['direito-tributario-aula-042-q-006', {
    legalBasis: 'CTN, arts. 151, VI, e 206: o parcelamento suspende a exigibilidade e permite certidão positiva com efeitos de negativa, observados os requisitos legais.',
  }],
  ['direito-tributario-aula-042-q-007', {
    legalBasis: 'CTN, art. 204: a presunção de certeza e liquidez da dívida inscrita é relativa e admite prova inequívoca em contrário.',
  }],
  ['direito-tributario-aula-042-q-009', {
    legalBasis: 'Interpretação textual: o termo “alguns” autoriza concluir apenas que pelo menos parte dos créditos possui exigibilidade suspensa.',
  }],
  ['direito-tributario-aula-042-q-010', {
    legalBasis: 'CTN, art. 151, VI: o parcelamento suspende a exigibilidade; não é hipótese de extinção do crédito.',
  }],
  ['direito-tributario-aula-044-q-010', {
    legalBasis: 'CTM de Queimados, art. 137: o dispositivo trata dos requisitos do auto de infração, não de certidão negativa.',
  }],
  ['direito-tributario-aula-045-q-001', {
    legalBasis: 'CTM de Queimados, arts. 143 a 145: representação, requisitos e providências da autoridade competente.',
  }],
  ['direito-tributario-aula-045-q-002', {
    legalBasis: 'CTM de Queimados, art. 143: qualquer pessoa pode representar o sujeito passivo nas condições legais.',
  }],
  ['direito-tributario-aula-045-q-003', {
    legalBasis: 'CTM de Queimados, art. 145: recebida a representação, a autoridade competente providencia diligências para verificar sua veracidade e dá-lhe o destino cabível.',
  }],
  ['direito-tributario-aula-045-q-004', {
    legalBasis: 'CTM de Queimados, art. 146: a impugnação do lançamento deve ser apresentada no prazo de 30 dias.',
  }],
  ['direito-tributario-aula-045-q-005', {
    legalBasis: 'CTM de Queimados, art. 147: a impugnação instaura a fase contraditória do procedimento.',
  }],
  ['direito-tributario-aula-045-q-006', {
    legalBasis: 'CTM de Queimados, art. 149: o servidor responsável pelo lançamento tem 15 dias para instruir o processo a partir do recebimento.',
  }],
  ['direito-tributario-aula-045-q-007', {
    legalBasis: 'CTM de Queimados, art. 151: julgada procedente a impugnação, as importâncias depositadas são restituídas em 30 dias.',
  }],
  ['direito-tributario-aula-045-q-009', {
    legalBasis: 'CTM de Queimados, art. 146: a impugnação do lançamento tem prazo de 30 dias, não 15.',
  }],
  ['direito-tributario-aula-045-q-010', {
    legalBasis: 'CTM de Queimados, art. 152: a defesa contra auto de infração ou auto de apreensão tem prazo de 15 dias.',
  }],
  ['direito-tributario-aula-046-q-001', {
    correctAnswer: 'B',
    explanation: 'A alternativa B é a resposta correta: o autuado pode arrolar até 3 testemunhas.',
    legalBasis: 'CTM de Queimados, art. 154: na defesa, o autuado pode arrolar no máximo 3 testemunhas.',
  }],
  ['direito-tributario-aula-046-q-002', {
    legalBasis: 'CTM de Queimados, art. 155: o sujeito passivo pode concordar com parte da autuação, cumprir a parte aceita e contestar o restante.',
  }],
  ['direito-tributario-aula-046-q-003', {
    legalBasis: 'CTM de Queimados, art. 156: apresentada a defesa, o autuante tem 15 dias para instruir o processo.',
  }],
  ['direito-tributario-aula-046-q-004', {
    legalBasis: 'CTM de Queimados, art. 157: as impugnações e defesas indicadas são decididas pelo Prefeito, conforme a redação consolidada estudada.',
  }],
  ['direito-tributario-aula-046-q-005', {
    legalBasis: 'CTM de Queimados, art. 158: diligências claramente inúteis ou protelatórias podem ser indeferidas.',
  }],
  ['direito-tributario-aula-046-q-006', {
    legalBasis: 'CTM de Queimados, art. 158: o prazo fixado para realização das diligências e provas não pode ser superior a 30 dias.',
  }],
  ['direito-tributario-aula-046-q-007', {
    legalBasis: 'CTM de Queimados, art. 163: encerradas as diligências e provas, a autoridade julgadora profere decisão em 15 dias.',
  }],
  ['direito-tributario-aula-046-q-008', {
    legalBasis: 'CTM de Queimados, art. 163: se não estiver habilitada a decidir, a autoridade pode converter o julgamento em diligência e determinar novas provas.',
  }],
  ['direito-tributario-aula-046-q-009', {
    legalBasis: 'CTM de Queimados, art. 164: a decisão definitiva conclui pela procedência ou improcedência do auto ou da impugnação, definindo seus efeitos.',
  }],
  ['direito-tributario-aula-046-q-010', {
    legalBasis: 'CTM de Queimados, art. 165: a decisão definitiva notifica para pagamento em 15 dias, não 30.',
  }],
  ['direito-tributario-aula-046-q-011', {
    legalBasis: 'CTM de Queimados, art. 165, I: após a decisão definitiva, o contribuinte é notificado para pagar em 15 dias.',
  }],
  ['direito-tributario-aula-046-q-012', {
    legalBasis: 'CTM de Queimados, art. 165, III: não pago o valor no prazo, segue-se a inscrição em dívida ativa e a remessa da certidão à execução.',
  }],
  ['direito-tributario-aula-047-q-001', {
    legalBasis: 'CTM de Queimados, art. 175, I: a incidência independe da legitimidade do título de aquisição da propriedade, domínio útil ou posse.',
  }],
  ['direito-tributario-aula-047-q-002', {
    legalBasis: 'CTM de Queimados, art. 175, II: a incidência independe do resultado financeiro da exploração econômica do imóvel.',
  }],
  ['direito-tributario-aula-047-q-003', {
    legalBasis: 'CTM de Queimados, art. 176: o IPTU constitui ônus que acompanha o imóvel nas transferências previstas.',
  }],
  ['direito-tributario-aula-047-q-004', {
    legalBasis: 'CTM de Queimados, art. 177, em consonância com o CTN, art. 34: contribuinte é o proprietário, titular do domínio útil ou possuidor a qualquer título.',
  }],
  ['direito-tributario-aula-047-q-005', {
    legalBasis: 'CTM de Queimados, art. 177: conhecido o proprietário, o Município dá preferência a ele como sujeito passivo, conforme a regra estudada.',
  }],
  ['direito-tributario-aula-047-q-006', {
    legalBasis: 'CTM de Queimados, art. 178: sendo o adquirente imune ou isento, vencem antecipadamente as prestações vincendas e por elas responde o alienante.',
  }],
  ['direito-tributario-aula-047-q-007', {
    legalBasis: 'CTM de Queimados, art. 179: na desapropriação, o marco relevante é a imissão de posse pelo poder desapropriante.',
  }],
  ['direito-tributario-aula-047-q-008', {
    legalBasis: 'CTM de Queimados, art. 180: a base de cálculo do IPTU é o valor venal da unidade imobiliária.',
  }],
  ['direito-tributario-aula-047-q-009', {
    legalBasis: 'CTM de Queimados, art. 175: a incidência não depende da legitimidade do título, do resultado financeiro ou do cumprimento de exigências administrativas; por isso, a alternativa D é incorreta.',
  }],
  ['direito-tributario-aula-047-q-010', {
    legalBasis: 'CTM de Queimados, art. 180 e disciplina da Planta de Valores: os valores da Comissão de Avaliação dependem de aprovação por decreto do Prefeito e publicação.',
  }],
  ['direito-tributario-aula-047-q-011', {
    legalBasis: 'CTM de Queimados, art. 180: a base de cálculo é o valor venal, não o lucro anual.',
  }],
  ['direito-tributario-aula-047-q-012', {
    legalBasis: 'CTM de Queimados, art. 165: o débito definitivamente mantido e não pago é inscrito em dívida ativa e encaminhado à execução.',
  }],
  ['direito-tributario-aula-063-q-001', { legalBasis: 'CTM de Queimados, art. 280: o descumprimento de obrigação acessória pode ser penalizado independentemente do imposto principal.' }],
  ['direito-tributario-aula-063-q-002', { legalBasis: 'CTM de Queimados, art. 280: a isenção não elimina automaticamente as obrigações instrumentais previstas no Código.' }],
  ['direito-tributario-aula-063-q-003', { legalBasis: 'CTM de Queimados, art. 280: 130,1602 UFIR é uma das penalidades numéricas estudadas.' }],
  ['direito-tributario-aula-063-q-004', { legalBasis: 'CTM de Queimados, art. 280: 390,4808 UFIR é uma das penalidades numéricas estudadas.' }],
  ['direito-tributario-aula-063-q-005', { legalBasis: 'CTM de Queimados, art. 280: 520,6411 UFIR é uma das penalidades numéricas estudadas.' }],
  ['direito-tributario-aula-063-q-006', { legalBasis: 'CTM de Queimados, art. 280: a multa por obrigação acessória não é automaticamente eliminada pelo pagamento do tributo principal.' }],
  ['direito-tributario-aula-063-q-007', { legalBasis: 'CTM de Queimados, art. 280: a penalidade deve ser associada à conduta específica prevista no dispositivo.' }],
  ['direito-tributario-aula-063-q-008', { legalBasis: 'CTM de Queimados, art. 280: fraude no ISS deve ser enquadrada na regra específica do imposto.' }],
  ['direito-tributario-aula-063-q-009', { legalBasis: 'CTM de Queimados, art. 280: não emitir documento e emitir documento falso são condutas distintas para fins de enquadramento.' }],
  ['direito-tributario-aula-063-q-010', { legalBasis: 'CTM de Queimados, art. 277: a comunicação da cessação das atividades deve ocorrer no prazo de 30 dias.' }],
  ['direito-tributario-aula-063-q-011', { legalBasis: 'CTM de Queimados, art. 265: o prazo revisado estudado para a comunicação indicada é de 20 dias.' }],
  ['direito-tributario-aula-063-q-012', { legalBasis: 'CTM de Queimados, art. 280: cada imposto possui regra própria de penalidade; não se transporta automaticamente o percentual do ITBI para o ISS.' }],
  ['direito-tributario-aula-064-q-001', { legalBasis: 'CTM de Queimados, art. 280, I: atividade sem inscrição, após 15 dias de notificação não cumprida, sujeita-se a 130,1602 UFIR.' }],
  ['direito-tributario-aula-064-q-002', { legalBasis: 'CTM de Queimados, art. 280: a recusa na exibição de livros ou documentos fiscais sujeita à multa de 520,6411 UFIR.' }],
  ['direito-tributario-aula-064-q-003', { legalBasis: 'CTM de Queimados, art. 280: a falta de livros fiscais ou de autenticação sujeita à multa de 390,4808 UFIR por livro.' }],
  ['direito-tributario-aula-064-q-004', { legalBasis: 'CTM de Queimados, art. 280: omissão/falsidade e falta/erro na declaração têm, respectivamente, as multas de 520,6411 e 390,4808 UFIR.' }],
  ['direito-tributario-aula-064-q-005', { legalBasis: 'CTM de Queimados, art. 280: a prestação de serviço sem emissão da nota fiscal sujeita à multa de 520,6411 UFIR por serviço.' }],
  ['direito-tributario-aula-064-q-006', { legalBasis: 'CTM de Queimados, art. 280: a não comunicação de mudança de local no prazo legal associa-se a 130,1602 UFIR e ao prazo de 30 dias estudado.' }],
  ['direito-tributario-aula-064-q-007', { legalBasis: 'CTM de Queimados, art. 280: o estabelecimento gráfico que emite documento fiscal sem autorização sujeita-se a 130,1602 UFIR por documento.' }],
  ['direito-tributario-aula-064-q-008', { legalBasis: 'CTM de Queimados, art. 280, VI: falta de recolhimento do imposto retido na fonte sujeita à multa de 100% do valor atualizado.' }],
  ['direito-tributario-aula-064-q-009', { legalBasis: 'CTM de Queimados, art. 280, VI: recolhimento a menor apurado por ação fiscal sujeita à multa de 100%.' }],
  ['direito-tributario-aula-064-q-010', { legalBasis: 'CTM de Queimados, art. 280, VII: atraso de 61 a 90 dias corresponde a 40%.' }],
  ['direito-tributario-aula-064-q-011', { legalBasis: 'CTM de Queimados, art. 280, VII: atraso a partir de 91 dias corresponde a 50%.' }],
  ['direito-tributario-aula-064-q-012', { legalBasis: 'CTM de Queimados, art. 280: as penalidades são aplicadas sem prejuízo da exigência do imposto.' }],
  ['direito-tributario-aula-065-q-001', { correctAnswer: 'C', explanation: 'A alternativa C é a resposta correta: a TSU pode envolver utilização efetiva ou potencial dos serviços previstos legalmente.', legalBasis: 'CTM de Queimados, art. 281: a utilização dos serviços pode ser efetiva ou potencial, desde que prestados com regularidade.' }],
  ['direito-tributario-aula-065-q-002', { legalBasis: 'CTM de Queimados, art. 281: a TSU abrange, entre os serviços previstos, a coleta periódica de lixo.' }],
  ['direito-tributario-aula-065-q-003', { legalBasis: 'CTM de Queimados, art. 281, § 1º: a remoção especial solicitada pelo interessado é tratada como preço público, não como a mesma taxa de coleta periódica.' }],
  ['direito-tributario-aula-065-q-004', { correctAnswer: 'C', explanation: 'A alternativa C é a resposta correta: a remoção especial de entulho fica sujeita ao preço público fixado pelo Prefeito Municipal.', legalBasis: 'CTM de Queimados, art. 281, § 1º: a remoção especial de entulho e similares fica sujeita a preço público.' }],
  ['direito-tributario-aula-065-q-005', { legalBasis: 'CTM de Queimados, art. 282: são contribuintes o proprietário, o titular do domínio útil ou o possuidor a qualquer título, nas condições legais.' }],
  ['direito-tributario-aula-065-q-006', { legalBasis: 'CTM de Queimados, art. 283: para imóvel edificado, a coleta de lixo utiliza a área construída e o percentual/fator previsto.' }],
  ['direito-tributario-aula-065-q-007', { correctAnswer: 'A', explanation: 'A alternativa A é a resposta correta: em imóvel não edificado, considera-se 0,1% da Unidade Fiscal por metro quadrado do terreno, com o fator aplicável.', legalBasis: 'CTM de Queimados, art. 283: para imóvel não edificado, a referência é a área do terreno e o percentual de 0,1% previsto.' }],
  ['direito-tributario-aula-065-q-008', { legalBasis: 'CTM de Queimados, art. 283: limpeza e conservação utilizam 2% da Unidade Fiscal por metro linear de testada, com o fator previsto.' }],
  ['direito-tributario-aula-065-q-009', { legalBasis: 'CTM de Queimados, art. 283, III: na regra estudada, considera-se a testada correspondente ao endereço do imóvel.' }],
  ['direito-tributario-aula-065-q-010', { correctAnswer: 'C', explanation: 'A alternativa C é a resposta correta: o valor estudado para manutenção das redes de iluminação pública é 3,3910 UFIR.', legalBasis: 'CTM de Queimados, art. 281, § 3º, e disciplina numérica do art. 283: manutenção das redes de iluminação pública — 3,3910 UFIR.' }],
  ['direito-tributario-aula-065-q-011', { legalBasis: 'CTM de Queimados, art. 284: havendo mais de uma unidade autônoma edificada no mesmo terreno, calcula-se a testada ideal conforme regulamento.' }],
  ['direito-tributario-aula-065-q-012', { legalBasis: 'CTM de Queimados, art. 280, VII: atraso de 61 a 90 dias no ISS corresponde a 40%.' }],
  ['direito-tributario-aula-066-q-001', { correctAnswer: 'C', explanation: 'A alternativa C é a resposta correta: a redução prevista para a hipótese estudada é de 50%.', legalBasis: 'CTM de Queimados, art. 285: a redução estudada para a indústria que atende às condições ambientais é de 50%.' }],
  ['direito-tributario-aula-066-q-002', { legalBasis: 'CTM de Queimados, art. 285: a redução alcança a indústria com equipamentos antipoluentes que reaproveite total ou parcialmente seu lixo, nas condições legais.' }],
  ['direito-tributario-aula-066-q-003', { legalBasis: 'CTM de Queimados, art. 286: a TSU é lançada anualmente.' }],
  ['direito-tributario-aula-066-q-004', { legalBasis: 'CTM de Queimados, art. 287: o Prefeito pode conceder, por decreto, desconto de até 60% para pagamento em cota única.' }],
  ['direito-tributario-aula-066-q-005', { legalBasis: 'CTM de Queimados, art. 287: parcelas vincendas somente podem ser pagas depois das vencidas.' }],
  ['direito-tributario-aula-066-q-006', { legalBasis: 'CTM de Queimados, arts. 288 e 289: a Taxa de Serviços Diversos alcança animais, veículos e bens/mercadorias nas hipóteses legais.' }],
  ['direito-tributario-aula-066-q-007', { legalBasis: 'CTM de Queimados, art. 289: no caso de veículo apreendido, pode figurar como contribuinte o proprietário ou possuidor interessado na liberação.' }],
  ['direito-tributario-aula-066-q-008', { legalBasis: 'CTM de Queimados, art. 289: para bens e mercadorias, a taxa pode alcançar proprietário, possuidor ou outra pessoa interessada na liberação.' }],
  ['direito-tributario-aula-066-q-009', { legalBasis: 'CTM de Queimados, art. 290: as taxas indicadas remetem ao Anexo I.' }],
  ['direito-tributario-aula-066-q-010', { legalBasis: 'CTM de Queimados, art. 291: a taxa referente aos bens apreendidos é paga de uma só vez antes da liberação.' }],
  ['direito-tributario-aula-066-q-011', { legalBasis: 'CTM de Queimados, art. 292: serviços funerários admitem pagamento de uma só vez ou parceladamente, na forma regulamentar.' }],
  ['direito-tributario-aula-066-q-012', { legalBasis: 'CTM de Queimados, art. 280, VII: atraso de 61 a 90 dias no ISS corresponde a 40%.' }],
  ['direito-tributario-aula-067-q-001', { legalBasis: 'CTM de Queimados, art. 280, VII: atraso de até 30 dias corresponde a 20%.' }],
  ['direito-tributario-aula-067-q-002', { correctAnswer: 'B', explanation: 'A alternativa B é a resposta correta: atraso de 31 a 60 dias corresponde a 30%, inclusive no 60º dia.', legalBasis: 'CTM de Queimados, art. 280, VII: 30% para atraso de 31 a 60 dias.' }],
  ['direito-tributario-aula-067-q-003', { correctAnswer: 'C', explanation: 'A alternativa C é a resposta correta: atraso de 61 a 90 dias corresponde a 40%, inclusive no 61º dia.', legalBasis: 'CTM de Queimados, art. 280, VII: 40% para atraso de 61 a 90 dias.' }],
  ['direito-tributario-aula-067-q-004', { legalBasis: 'CTM de Queimados, art. 280, VII: atraso a partir de 91 dias corresponde a 50%.' }],
  ['direito-tributario-aula-067-q-005', { legalBasis: 'CTM de Queimados, art. 280: omissão/falsidade e falta/erro têm as multas de 520,6411 e 390,4808 UFIR, respectivamente.' }],
  ['direito-tributario-aula-067-q-006', { legalBasis: 'CTM de Queimados, art. 281: a utilização dos serviços pode ser efetiva ou potencial.' }],
  ['direito-tributario-aula-067-q-007', { legalBasis: 'CTM de Queimados, art. 282: a sujeição passiva alcança proprietário, titular do domínio útil ou possuidor a qualquer título.' }],
  ['direito-tributario-aula-067-q-008', { legalBasis: 'CTM de Queimados, art. 283: imóvel não edificado utiliza a área do terreno e o percentual de 0,1% previsto.' }],
  ['direito-tributario-aula-067-q-009', { correctAnswer: 'A', explanation: 'A alternativa A é a resposta correta: limpeza e conservação utilizam a testada e o percentual de 2% previsto.', legalBasis: 'CTM de Queimados, art. 283: limpeza e conservação são calculadas por metro linear de testada, com o percentual de 2% estudado.' }],
  ['direito-tributario-aula-067-q-010', { correctAnswer: 'C', explanation: 'A alternativa C é a resposta correta: a redução estudada para a indústria que atende às condições ambientais é de 50%.', legalBasis: 'CTM de Queimados, art. 285: redução de 50% nas condições ambientais previstas.' }],
  ['direito-tributario-aula-067-q-011', { legalBasis: 'CTM de Queimados, arts. 286 e 287: lançamento anual, parcelamento e desconto de até 60% na cota única.' }],
  ['direito-tributario-aula-067-q-012', { legalBasis: 'CTM de Queimados, art. 291: a taxa de bens apreendidos é paga de uma só vez antes da liberação.' }],
  ['direito-tributario-aula-067-q-013', { legalBasis: 'CTM de Queimados, art. 292: serviços funerários admitem pagamento à vista ou parcelado na forma regulamentar.' }],
  ['direito-tributario-aula-067-q-014', { legalBasis: 'CTM de Queimados, art. 281, § 1º: remoção especial de entulho é tratada como preço público, não como a mesma TSU da coleta periódica.' }],
  ['direito-tributario-aula-067-q-015', { legalBasis: 'CTM de Queimados, art. 280: a conduta deve ser identificada antes da associação com a penalidade específica.' }],
  ['direito-tributario-aula-068-q-001', { legalBasis: 'CTM de Queimados, art. 293, em consonância com CTN, arts. 77 a 80: a Taxa de Licença decorre do exercício regular do poder de polícia.' }],
  ['direito-tributario-aula-068-q-002', { legalBasis: 'CTM de Queimados, art. 293: o poder de polícia disciplina e fiscaliza atividades privadas dentro da lei.' }],
  ['direito-tributario-aula-068-q-003', { legalBasis: 'CTM de Queimados, arts. 293 e 297: a licença não torna irrelevantes alterações posteriores nem elimina a fiscalização.' }],
  ['direito-tributario-aula-068-q-004', { legalBasis: 'CTM de Queimados, art. 293, em consonância com CTN, art. 77: trata-se de taxa vinculada ao poder de polícia.' }],
  ['direito-tributario-aula-068-q-005', { legalBasis: 'CTM de Queimados, art. 293: o pagamento da taxa não autoriza funcionamento em desconformidade nem impede fiscalização.' }],
  ['direito-tributario-aula-068-q-006', { correctAnswer: 'A', explanation: 'A alternativa A é a resposta correta: o alvará materializa a licença administrativa nas hipóteses previstas.', legalBasis: 'CTM de Queimados, art. 295: o alvará é o documento relacionado à licença e deve observar as regras do Código.' }],
  ['direito-tributario-aula-068-q-007', { legalBasis: 'CTM de Queimados, art. 293: a Taxa de Licença relaciona-se ao poder de polícia.' }],
  ['direito-tributario-aula-068-q-008', { legalBasis: 'CTN, art. 3º, e LC nº 116/2003, art. 1º: ISS é imposto incidente sobre serviços definidos na legislação.' }],
  ['direito-tributario-aula-068-q-009', { correctAnswer: 'C', explanation: 'A alternativa C é a resposta correta: atraso de 61 a 90 dias corresponde a 40%.', legalBasis: 'CTM de Queimados, art. 280, VII: 40% para atraso de 61 a 90 dias.' }],
  ['direito-tributario-aula-068-q-010', { legalBasis: 'CTM de Queimados, art. 280: omissão ou falsidade na declaração associa-se à multa de 520,6411 UFIR.' }],
  ['direito-tributario-aula-068-q-011', { legalBasis: 'CTM de Queimados, art. 283: imóvel não edificado utiliza a área do terreno e o percentual de 0,1% estudado.' }],
  ['direito-tributario-aula-068-q-012', { legalBasis: 'CTM de Queimados, arts. 293 e 297: a concessão da licença não elimina o poder de fiscalização sobre alterações e condições da atividade.' }],
  ['direito-tributario-aula-069-q-001', { legalBasis: 'CTM de Queimados, art. 294: o rol de licenças abrange localização/funcionamento, publicidade, obras e comércio informal; transmissão imobiliária não integra o dispositivo.' }],
  ['direito-tributario-aula-069-q-002', { legalBasis: 'CTM de Queimados, art. 295: o alvará deve ficar exposto em local visível e ser exibido quando solicitado pela fiscalização.' }],
  ['direito-tributario-aula-069-q-003', { legalBasis: 'CTM de Queimados, art. 296: a licença e o alvará não impedem a constante inspeção sanitária prevista no Código.' }],
  ['direito-tributario-aula-069-q-004', { legalBasis: 'CTM de Queimados, art. 296: a hipótese de inspeção sanitária constante não corresponde ao abate de animais fora de matadouro público municipal.' }],
  ['direito-tributario-aula-069-q-005', { legalBasis: 'CTM de Queimados, art. 297, com redação alterada pela LC nº 026/2005: a licença do inciso I permanece enquanto houver mesmo ramo e mesmas características físicas.' }],
  ['direito-tributario-aula-069-q-006', { legalBasis: 'CTM de Queimados, art. 297, com redação alterada pela LC nº 026/2005: as demais licenças seguem o prazo do alvará, limitado a um ano.' }],
  ['direito-tributario-aula-069-q-007', { legalBasis: 'CTM de Queimados, art. 298: estabelecimentos potencialmente degradadores ficam sujeitos à constante fiscalização ambiental.' }],
  ['direito-tributario-aula-069-q-008', { legalBasis: 'CTM de Queimados, art. 299: estabelecimento é conceito amplo e pode incluir local residencial nas condições legais.' }],
  ['direito-tributario-aula-069-q-009', { legalBasis: 'CTM de Queimados, art. 280, VII: atraso de 61 a 90 dias corresponde a 40%.' }],
  ['direito-tributario-aula-069-q-010', { legalBasis: 'CTM de Queimados, art. 287: o Prefeito pode conceder desconto de até 60% para pagamento da TSU em cota única.' }],
  ['direito-tributario-aula-069-q-011', { legalBasis: 'CTM de Queimados, art. 297, com redação alterada pela LC nº 026/2005: a licença do inciso I não é obrigatoriamente anual.' }],
  ['direito-tributario-aula-069-q-012', { legalBasis: 'CTM de Queimados, art. 293: segurança, higiene e saúde estão entre os aspectos fiscalizados pelo poder de polícia.' }],
  ['direito-tributario-aula-040-q-001', {
    numero: 1,
    question: 'O art. 134 do CTN relaciona a responsabilidade de terceiros, entre outros requisitos, à:',
    correctAnswer: 'B',
    explanation: 'A alternativa B é a resposta correta: impossibilidade de exigir o cumprimento da obrigação principal pelo contribuinte e atos ou omissões previstos em lei.',
    topic: 'RESPONSABILIDADE TRIBUTÁRIA DE TERCEIROS (CTN, ART. 134)',
    legalBasis: 'CTN, art. 134: nos casos de impossibilidade de exigir o cumprimento da obrigação principal pelo contribuinte, respondem solidariamente com ele as pessoas indicadas no dispositivo, nos atos em que intervierem ou pelas omissões de que forem responsáveis.',
  }],
  ['direito-tributario-aula-041-q-005', {
    legalBasis: 'CTN, arts. 186 e 187: o crédito tributário possui preferência, ressalvados os créditos decorrentes da legislação do trabalho ou de acidente de trabalho; a cobrança judicial segue as regras próprias do Código, inclusive quanto à falência.',
  }],
  ['direito-tributario-aula-077-q-017', {
    legalBasis: 'CTM de Queimados, art. 332, § 2º: nos bens indivisos, o lançamento pode ser feito em nome de qualquer um dos titulares, que poderá exigir dos demais as parcelas que lhes couberem.',
  }],
  ['lingua-portuguesa-aula-035-q-007', {
    legalBasis: 'CTN, art. 173: o direito de a Fazenda Pública constituir o crédito tributário extingue-se após cinco anos, nos termos das hipóteses previstas no dispositivo.',
  }],
  ['lingua-portuguesa-aula-035-q-008', {
    correctAnswer: 'B',
    explanation: 'A alternativa B é a resposta correta: o lançamento constitui o crédito tributário.',
    legalBasis: 'CTN, art. 142: compete privativamente à autoridade administrativa constituir o crédito tributário pelo lançamento.',
  }],
]);

function readLesson(lessonId) {
  const file = path.join(dir, `${lessonId}.json`);
  return { file, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

function applyUpdate(question, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (key === 'options') continue;
    if (question[key] !== value) {
      question[key] = value;
      changed++;
    }
  }
}

const lessonCache = new Map();
let changed = 0;
for (const [questionId, patch] of updates) {
  const lessonId = questionId.replace(/-q-\d+$/, '');
  if (!lessonCache.has(lessonId)) lessonCache.set(lessonId, readLesson(lessonId));
  const entry = lessonCache.get(lessonId);
  const question = entry.data.questoes.find((item) => item.id === questionId);
  if (!question) throw new Error(`Questão não encontrada: ${questionId}`);
  applyUpdate(question, patch);
}

// Limpa duas corrupções editoriais da importação do documento.
{
  const entry = lessonCache.get('direito-tributario-aula-001') ?? readLesson('direito-tributario-aula-001');
  lessonCache.set('direito-tributario-aula-001', entry);
  const { data } = entry;
  const q = data.questoes.find((item) => item.id === 'direito-tributario-aula-001-q-011');
  const option = q?.options.find((item) => item.id === 'D');
  if (option && option.text.endsWith(' Pare antes do')) {
    option.text = option.text.slice(0, -' Pare antes do'.length);
    changed++;
  }
}

for (const [lessonId, questionId, optionId, suffix] of [
  ['direito-tributario-aula-013', 'direito-tributario-aula-013-q-006', 'D', ' NÃO HÁ'],
  ['direito-tributario-aula-014', 'direito-tributario-aula-014-q-006', 'D', ' Registre mentalmente ou no estudo suas respostas 1 a 6. O'],
  ['direito-tributario-aula-016', 'direito-tributario-aula-016-q-006', 'D', ' Não há'],
  ['direito-tributario-aula-017', 'direito-tributario-aula-017-q-006', 'D', ' Não há'],
  ['direito-tributario-aula-018', 'direito-tributario-aula-018-q-006', 'D', ' Não há'],
  ['legislacao-tributaria-de-queimados-aula-029', 'legislacao-tributaria-de-queimados-aula-029-q-008', 'D', ' Sem respostas registradas de Vinícius'],
  ['direito-tributario-aula-034', 'direito-tributario-aula-034-q-010', 'D', ' Sem respostas registradas de Vinícius'],
  ['direito-tributario-aula-039', 'direito-tributario-aula-039-q-010', 'D', ' Não consulte o'],
  ['direito-tributario-aula-040', 'direito-tributario-aula-040-q-010', 'D', ' As respostas ficam ocultas nesta etapa. Após a'],
]) {
  const entry = lessonCache.get(lessonId) ?? readLesson(lessonId);
  lessonCache.set(lessonId, entry);
  const question = entry.data.questoes.find((item) => item.id === questionId);
  const option = question?.options.find((item) => item.id === optionId);
  if (option?.text.endsWith(suffix)) {
    option.text = option.text.slice(0, -suffix.length);
    changed++;
  }
}
{
  const entry = lessonCache.get('direito-tributario-aula-002') ?? readLesson('direito-tributario-aula-002');
  lessonCache.set('direito-tributario-aula-002', entry);
  const { data } = entry;
  const q = data.questoes.find((item) => item.id === 'direito-tributario-aula-002-q-002');
  const option = q?.options.find((item) => item.id === 'D');
  if (option && option.text.includes('autoridad8e')) {
    option.text = option.text.replace('autoridad8e', 'autoridade');
    changed++;
  }
}

// A importação do documento pode juntar o início da questão seguinte na alternativa D.
for (const lessonNumber of [75, 76, 77, 78, 79]) {
  const lessonId = `direito-tributario-aula-${String(lessonNumber).padStart(3, '0')}`;
  if (!lessonCache.has(lessonId)) lessonCache.set(lessonId, readLesson(lessonId));
  const entry = lessonCache.get(lessonId);
  for (const question of entry.data.questoes) {
    for (const option of question.options ?? []) {
      const match = option.text.match(/^(.*?\.)(?:\s+\d+\)\s+)/s);
      if (match && option.text !== match[1]) {
        option.text = match[1];
        changed++;
      }
    }
  }
}

// A Aula 1 recebeu questões numeradas novamente a partir de 1 na última importação.
{
  const { file, data } = lessonCache.has('direito-tributario-aula-001')
    ? lessonCache.get('direito-tributario-aula-001')
    : readLesson('direito-tributario-aula-001');
  lessonCache.set('direito-tributario-aula-001', { file, data });
  const byId = new Map(data.questoes.map((item) => [item.id, item]));
  for (let number = 6; number <= 11; number++) {
    const question = byId.get(`direito-tributario-aula-001-q-${String(number).padStart(3, '0')}`);
    if (question && question.numero !== number) {
      question.numero = number;
      changed++;
    }
  }
}

for (const { file, data } of lessonCache.values()) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

console.log(`Correções editoriais reaplicadas: ${changed}`);
