// ─── TYPES ──────────────────────────────────────────────────────
export interface BlogPost {
  slug: string;
  title: string;
  description: string; // meta description (max 155 chars)
  category: string;
  tags: string[];
  author: string;
  publishedAt: string; // YYYY-MM-DD
  readingTime: number; // minutes
  content: string; // markdown-ish HTML
}

export const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  "checkin-portaria": { label: "Check-in e Portaria", color: "#3B5FE5", bg: "#EBF0FF" },
  "dicas-anfitrioes": { label: "Dicas para Anfitriões", color: "#059669", bg: "#ECFDF5" },
  "legislacao": { label: "Legislação", color: "#D97706", bg: "#FFFBEB" },
  "ganhar-mais": { label: "Ganhar Mais", color: "#7C3AED", bg: "#F5F3FF" },
  "condominios": { label: "Para Condomínios", color: "#DC2626", bg: "#FEF2F2" },
};

// ─── POSTS ──────────────────────────────────────────────────────
export const BLOG_POSTS: BlogPost[] = [

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST 1
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  slug: "como-fazer-checkin-hospedes-airbnb-predio-portaria",
  title: "Como fazer o check-in de hóspedes do Airbnb em prédio com portaria",
  description: "Guia completo para anfitriões que hospedam em condomínios: como cadastrar hóspedes na portaria, quais dados enviar e como automatizar o processo.",
  category: "checkin-portaria",
  tags: ["check-in", "portaria", "airbnb", "condomínio", "hóspedes"],
  author: "AirCheck",
  publishedAt: "2026-02-20",
  readingTime: 8,
  content: `
<p>Se você hospeda pelo Airbnb em um apartamento dentro de um condomínio, sabe que o check-in não termina quando a reserva é confirmada. Antes do hóspede chegar, existe um passo que muitos anfitriões subestimam: <strong>avisar a portaria</strong>.</p>

<p>Na maioria dos prédios residenciais, a portaria é o primeiro ponto de contato do hóspede com o edifício. Se o porteiro não souber que aquela pessoa tem autorização para entrar, o hóspede vai ficar esperando — e você vai receber uma ligação no pior momento possível.</p>

<h2>Por que o check-in em prédio com portaria é diferente</h2>

<p>Em uma casa ou um flat sem portaria, o check-in é simples: você entrega a chave (ou usa um cofre de senha) e pronto. Em um condomínio, a dinâmica muda completamente:</p>

<ul>
<li><strong>A portaria precisa ser avisada com antecedência.</strong> O porteiro precisa saber o nome de quem vai chegar, quando, quantas pessoas e por quanto tempo.</li>
<li><strong>Muitos prédios exigem documentos.</strong> CPF, RG ou passaporte de cada hóspede — não só do titular da reserva.</li>
<li><strong>Troca de turno é um risco.</strong> Se você avisou o porteiro da manhã mas o hóspede chega à noite, a informação pode não ter sido repassada.</li>
<li><strong>Cada reserva exige comunicação individual.</strong> Não dá pra fazer uma vez e esquecer — cada reserva tem nomes, datas e quantidades diferentes.</li>
</ul>

<h2>Quais dados a portaria geralmente precisa</h2>

<p>Embora cada condomínio tenha suas regras, os dados mais comuns que a portaria solicita são:</p>

<ul>
<li>Nome completo de todos os hóspedes</li>
<li>Documento de identidade (CPF, RG ou passaporte para estrangeiros)</li>
<li>Data e horário de check-in e checkout</li>
<li>Número do apartamento</li>
<li>Vaga de garagem (se aplicável)</li>
<li>Placa do veículo (quando o hóspede vem de carro)</li>
</ul>

<h2>O processo manual e seus problemas</h2>

<p>A maioria dos anfitriões faz assim: quando a reserva é confirmada, pede os dados pelo chat do Airbnb. Depois, copia esses dados e manda por WhatsApp para o porteiro. Parece simples, mas na prática:</p>

<ul>
<li>O hóspede demora para responder, ou manda os dados incompletos.</li>
<li>Você precisa cobrar várias vezes até ter tudo.</li>
<li>A mensagem pro porteiro não segue um padrão — às vezes falta o CPF, às vezes a data está errada.</li>
<li>Com múltiplas reservas simultâneas, você perde o controle de quem já mandou dados e quem não mandou.</li>
<li>Se o porteiro trocou de turno, a informação pode se perder.</li>
</ul>

<h2>Como automatizar o check-in na portaria</h2>

<p>Ferramentas como o <strong>AirCheck</strong> foram criadas justamente para resolver esse problema. O processo funciona assim:</p>

<ol>
<li><strong>A reserva é captada automaticamente</strong> a partir do email de confirmação do Airbnb.</li>
<li><strong>O hóspede recebe um link</strong> para preencher um formulário padronizado com nome, CPF, data de nascimento e foto do documento.</li>
<li><strong>Você envia tudo para a portaria</strong> com um clique — uma mensagem formatada vai direto no WhatsApp do porteiro, com todos os dados organizados.</li>
</ol>

<p>A vantagem é que o processo é o mesmo para toda reserva. Sem improvisação, sem dado faltando, sem "esqueci de avisar a portaria".</p>

<h2>Dicas para um check-in sem problemas</h2>

<ul>
<li><strong>Avise a portaria com pelo menos 24 horas de antecedência.</strong> Isso dá tempo para todos os turnos serem informados.</li>
<li><strong>Envie os dados por escrito,</strong> nunca apenas por ligação. Mensagem no WhatsApp ou formulário são melhores que uma ligação rápida.</li>
<li><strong>Padronize as informações.</strong> Quanto mais consistente for o formato, menos erro o porteiro vai cometer.</li>
<li><strong>Confirme com o hóspede o horário de chegada.</strong> Se possível, avise a portaria o horário previsto.</li>
<li><strong>Tenha um plano B.</strong> Deixe seu telefone com a portaria caso algo dê errado na chegada.</li>
</ul>

<h2>Conclusão</h2>

<p>O check-in em prédio com portaria é mais trabalhoso que em uma casa, mas não precisa ser desorganizado. Com um processo claro e ferramentas que automatizam a coleta de dados e o envio para a portaria, você ganha tempo, reduz erros e garante que o hóspede tenha uma boa primeira impressão.</p>

<p>Se você está cansado de mandar mensagens manuais a cada reserva, <a href="/register">experimente o AirCheck gratuitamente</a> e veja como o check-in pode funcionar no automático.</p>
`,
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST 2
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  slug: "pode-ter-airbnb-em-condominio-o-que-diz-a-lei",
  title: "Pode ter Airbnb em condomínio? O que diz a lei em 2026",
  description: "Entenda o que a legislação brasileira e as decisões do STF dizem sobre aluguel por temporada em condomínios residenciais via Airbnb.",
  category: "legislacao",
  tags: ["legislação", "condomínio", "airbnb", "STF", "aluguel por temporada"],
  author: "AirCheck",
  publishedAt: "2026-02-19",
  readingTime: 7,
  content: `
<p>Uma das dúvidas mais comuns de quem quer começar a hospedar pelo Airbnb em apartamento é: <strong>o condomínio pode proibir?</strong> A resposta não é tão simples quanto parece, e a legislação brasileira vem evoluindo sobre o tema.</p>

<h2>O que diz a Lei do Inquilinato</h2>

<p>A Lei nº 8.245/91 (Lei do Inquilinato) diferencia o aluguel residencial do aluguel por temporada. O aluguel por temporada é aquele com prazo máximo de 90 dias, voltado para lazer, tratamento de saúde ou outros fins temporários. O Airbnb se enquadra nessa categoria.</p>

<p>A lei, em si, não proíbe o aluguel por temporada em condomínios. Porém, a convenção do condomínio pode impor restrições — e é aí que a questão fica mais complexa.</p>

<h2>O papel da convenção do condomínio</h2>

<p>A convenção condominial é o documento que estabelece as regras de convivência do prédio. Ela pode, por exemplo:</p>

<ul>
<li>Proibir atividades comerciais nas unidades</li>
<li>Exigir permanência mínima para locações</li>
<li>Estabelecer regras para cadastro de visitantes e hóspedes</li>
<li>Restringir o uso de áreas comuns por não moradores</li>
</ul>

<p>Quando um condomínio quer restringir o Airbnb, geralmente argumenta que o uso é comercial, não residencial. Esse é o principal ponto de debate jurídico.</p>

<h2>Decisões recentes do STF e STJ</h2>

<p>O tema chegou ao Supremo Tribunal Federal, que reconheceu a repercussão geral da questão. Na prática, o entendimento que tem prevalecido é:</p>

<ul>
<li><strong>O condomínio pode estabelecer regras</strong> para o uso das unidades, incluindo restrições ao aluguel por temporada, desde que aprovadas em assembleia com quórum qualificado.</li>
<li><strong>A proibição total é controversa.</strong> Muitos juristas defendem que o proprietário tem direito de usar sua propriedade, incluindo locação por temporada.</li>
<li><strong>O mais comum é a regulamentação</strong> — em vez de proibir, o condomínio cria regras como cadastro prévio de hóspedes, limite de rotatividade e responsabilização do proprietário.</li>
</ul>

<h2>Como se adequar às regras do condomínio</h2>

<p>Se o seu condomínio permite o Airbnb (com ou sem restrições), existem boas práticas que evitam conflitos:</p>

<ul>
<li><strong>Cadastre sempre os hóspedes na portaria</strong> com antecedência. Isso mostra boa-fé e profissionalismo.</li>
<li><strong>Estabeleça regras claras de convivência</strong> para os hóspedes (horário de silêncio, uso de áreas comuns).</li>
<li><strong>Mantenha a comunicação aberta com o síndico.</strong> Transparência reduz resistência.</li>
<li><strong>Documente tudo.</strong> Ter um registro organizado de hóspedes, datas e documentos pode ser decisivo caso surja alguma reclamação.</li>
</ul>

<h2>Ferramentas que ajudam na conformidade</h2>

<p>Uma das maiores objeções dos condomínios ao Airbnb é a falta de controle: "não sabemos quem está entrando no prédio". Usar uma ferramenta como o <a href="/">AirCheck</a> que coleta dados dos hóspedes (nome, CPF, foto do documento) e envia pra portaria de forma padronizada pode ser o diferencial para convencer o condomínio de que a operação é profissional e segura.</p>

<h2>Conclusão</h2>

<p>Ter Airbnb em condomínio é legal, mas exige atenção às regras do prédio. A tendência legislativa é a regulamentação — não a proibição. Anfitriões que operam de forma transparente, cadastram hóspedes corretamente e se comunicam com a administração tendem a ter muito menos problemas.</p>

<p><em>Nota: este artigo tem caráter informativo e não substitui consultoria jurídica. Consulte um advogado para questões específicas do seu condomínio.</em></p>
`,
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST 3
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  slug: "mensagem-para-portaria-sobre-hospedes-airbnb-modelos",
  title: "Mensagem para portaria sobre hóspedes do Airbnb: modelos prontos",
  description: "Modelos de mensagens para enviar ao porteiro do seu condomínio sobre check-in de hóspedes do Airbnb. WhatsApp, email e formulários.",
  category: "checkin-portaria",
  tags: ["portaria", "mensagem", "whatsapp", "modelo", "check-in"],
  author: "AirCheck",
  publishedAt: "2026-02-18",
  readingTime: 6,
  content: `
<p>Uma das tarefas mais repetitivas de quem hospeda pelo Airbnb em condomínio é avisar a portaria sobre cada hóspede que vai chegar. O problema não é só avisar — é avisar <strong>com todos os dados necessários, no formato certo, toda vez</strong>.</p>

<p>Neste post, compartilhamos modelos de mensagens prontas que você pode adaptar ao seu condomínio.</p>

<h2>Quais informações incluir na mensagem</h2>

<p>Antes de ver os modelos, saiba que uma boa mensagem para a portaria deve conter:</p>

<ul>
<li>Nome completo de cada hóspede</li>
<li>CPF ou documento de identidade</li>
<li>Data e horário de check-in e checkout</li>
<li>Número do apartamento</li>
<li>Vaga de estacionamento (se aplicável)</li>
<li>Placa do veículo (se aplicável)</li>
<li>Seu nome como anfitrião responsável</li>
</ul>

<h2>Modelo 1: Mensagem simples para WhatsApp</h2>

<p>Para reservas com um hóspede:</p>

<blockquote>
<p>Olá! Informo que o apto [NÚMERO] receberá um hóspede:</p>
<p>Nome: [NOME COMPLETO]<br>
CPF: [CPF]<br>
Check-in: [DATA] às [HORÁRIO]<br>
Checkout: [DATA] às [HORÁRIO]<br>
Veículo: [PLACA] - [MODELO] (ou "sem veículo")</p>
<p>Anfitrião responsável: [SEU NOME] - [SEU TELEFONE]</p>
</blockquote>

<h2>Modelo 2: Mensagem com múltiplos hóspedes</h2>

<blockquote>
<p>Olá! O apto [NÚMERO] receberá [X] hóspedes:</p>
<p>Hóspede 1: [NOME] - CPF [CPF]<br>
Hóspede 2: [NOME] - CPF [CPF]<br>
Hóspede 3: [NOME] - CPF [CPF]</p>
<p>Período: [DATA CHECK-IN] a [DATA CHECKOUT]<br>
Horário previsto de chegada: [HORÁRIO]<br>
Veículo: [PLACA] - [MODELO]<br>
Vaga: [NÚMERO DA VAGA]</p>
<p>Responsável: [SEU NOME] - [SEU TELEFONE]</p>
</blockquote>

<h2>Modelo 3: Mensagem formal (para condomínios mais rigorosos)</h2>

<blockquote>
<p>Prezada portaria,</p>
<p>Comunico que a unidade [NÚMERO] receberá hóspedes de locação por temporada no período de [DATA] a [DATA], conforme segue:</p>
<p>[LISTA DE HÓSPEDES COM DOCUMENTOS]</p>
<p>Coloco-me à disposição para quaisquer esclarecimentos.<br>
[SEU NOME] - Proprietário/Anfitrião - [TELEFONE]</p>
</blockquote>

<h2>O problema de fazer isso manualmente</h2>

<p>Esses modelos ajudam, mas o processo ainda é manual. Para cada reserva, você precisa:</p>

<ol>
<li>Pedir os dados ao hóspede pelo chat do Airbnb</li>
<li>Esperar ele responder (e cobrar se não responder)</li>
<li>Copiar os dados e formatar a mensagem</li>
<li>Enviar para o porteiro</li>
</ol>

<p>Com 5, 10, 20 reservas por mês, isso vira um trabalho significativo — e sujeito a erros.</p>

<h2>Como automatizar o envio</h2>

<p>Ferramentas como o <a href="/">AirCheck</a> automatizam esse fluxo inteiro. O hóspede preenche um formulário padronizado (nome, CPF, documento com foto), e você envia a mensagem completa e formatada para o WhatsApp da portaria com um clique. Sem copiar e colar, sem esquecer dados, sem retrabalho.</p>

<p>Se você está cansado de montar essas mensagens na mão, <a href="/register">crie sua conta gratuita</a> e teste com sua próxima reserva.</p>
`,
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST 4
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  slug: "como-automatizar-airbnb-ferramentas-essenciais",
  title: "Como automatizar seu Airbnb: ferramentas essenciais para anfitriões",
  description: "Descubra as principais ferramentas para automatizar a gestão do seu Airbnb — de mensagens automáticas a check-in, precificação e limpeza.",
  category: "dicas-anfitrioes",
  tags: ["automação", "ferramentas", "airbnb", "gestão", "anfitrião"],
  author: "AirCheck",
  publishedAt: "2026-02-17",
  readingTime: 9,
  content: `
<p>Quanto mais reservas seu Airbnb recebe, mais trabalho operacional aparece. Mensagens para hóspedes, comunicação com limpeza, ajuste de preços, check-in na portaria — tudo isso consome tempo que poderia ser usado para expandir o negócio ou simplesmente viver a vida.</p>

<p>A boa notícia: quase tudo pode ser automatizado. Neste guia, listamos as áreas onde a automação faz mais diferença e as ferramentas que existem para cada uma.</p>

<h2>1. Mensagens automáticas no Airbnb</h2>

<p>O próprio Airbnb oferece o recurso de <strong>respostas rápidas programadas</strong>. Com ele, você cria modelos de mensagem que são enviados automaticamente quando determinados eventos acontecem:</p>

<ul>
<li><strong>Reserva confirmada:</strong> mensagem de boas-vindas com instruções iniciais</li>
<li><strong>Pré-check-in:</strong> endereço, senha do Wi-Fi, instruções de chegada</li>
<li><strong>Pós-checkout:</strong> agradecimento e pedido de avaliação</li>
</ul>

<p>Essas mensagens aceitam variáveis como nome do hóspede, data de check-in e código de confirmação, que são preenchidas automaticamente para cada reserva.</p>

<h2>2. Precificação dinâmica</h2>

<p>Definir o preço certo é crucial para maximizar receita sem perder reservas. Ferramentas de precificação dinâmica analisam oferta, demanda, eventos locais e sazonalidade para ajustar seu preço automaticamente:</p>

<ul>
<li><strong>PriceLabs:</strong> integra com Airbnb e permite regras customizadas</li>
<li><strong>Beyond Pricing:</strong> ajuste automático baseado em dados de mercado</li>
<li><strong>Wheelhouse:</strong> permite controle granular sobre a estratégia de preços</li>
</ul>

<h2>3. Gestão de múltiplos anúncios</h2>

<p>Se você gerencia mais de um imóvel, ou anuncia na Airbnb e em outras plataformas simultaneamente, um channel manager evita conflitos de disponibilidade:</p>

<ul>
<li><strong>Stays.net:</strong> popular no Brasil, integra com Airbnb, Booking e outros</li>
<li><strong>Guesty:</strong> robusto, voltado para operações maiores</li>
<li><strong>Hospitable:</strong> foco em automação de mensagens e tarefas</li>
</ul>

<h2>4. Limpeza e turnover</h2>

<p>A logística de limpeza entre reservas é uma das maiores dores de cabeça. Ferramentas que ajudam:</p>

<ul>
<li><strong>TurnoverBnB:</strong> conecta anfitriões a profissionais de limpeza e automatiza o agendamento</li>
<li><strong>Properly:</strong> checklists de limpeza com verificação por foto</li>
</ul>

<h2>5. Check-in e comunicação com portaria</h2>

<p>Para quem hospeda em prédios com portaria, o check-in é uma etapa extra que consome tempo. Você precisa coletar dados dos hóspedes, organizar essas informações e repassar para a portaria — a cada reserva.</p>

<p>O <a href="/">AirCheck</a> foi criado especificamente para automatizar esse processo:</p>

<ul>
<li>A reserva é captada automaticamente do email do Airbnb</li>
<li>O hóspede preenche um formulário padronizado com nome, CPF e foto do documento</li>
<li>A mensagem completa vai pro WhatsApp da portaria com um toque</li>
</ul>

<p>É a automação da "última milha" do check-in — aquela que nenhum channel manager resolve.</p>

<h2>6. Avaliações e reputação</h2>

<p>As mensagens programadas do Airbnb já ajudam com o pedido de avaliação. Além disso, responder rapidamente às avaliações recebidas demonstra profissionalismo e melhora seu posicionamento na plataforma.</p>

<h2>Quanto tempo você pode economizar</h2>

<p>Um anfitrião com 10 reservas por mês gasta, em média, 30 a 60 minutos por reserva em tarefas operacionais. Com automação bem implementada, esse tempo cai para menos de 5 minutos por reserva — o tempo de revisar o que o sistema fez automaticamente.</p>

<p>A automação não substitui o cuidado com o hóspede. Ela libera seu tempo para o que realmente importa: hospitalidade, manutenção do imóvel e crescimento do negócio.</p>
`,
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST 5
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  slug: "condominio-airbnb-como-padronizar-cadastro-hospedes",
  title: "Condomínio com Airbnb: como padronizar o cadastro de hóspedes",
  description: "Guia para síndicos e administradoras de condomínios que querem organizar o registro de hóspedes do Airbnb na portaria de forma profissional.",
  category: "condominios",
  tags: ["condomínio", "administradora", "síndico", "cadastro", "portaria", "segurança"],
  author: "AirCheck",
  publishedAt: "2026-02-16",
  readingTime: 7,
  content: `
<p>Se o seu condomínio tem moradores que hospedam pelo Airbnb, você provavelmente já enfrentou situações como: hóspedes chegando sem aviso prévio, porteiros sem saber quem liberar, falta de documentação e reclamações de condôminos sobre a "rotatividade de estranhos".</p>

<p>A solução não é necessariamente proibir o Airbnb. É <strong>criar um processo padronizado de cadastro</strong> que funcione para todos: administradora, portaria, anfitriões e demais moradores.</p>

<h2>Por que padronizar é melhor que proibir</h2>

<p>Proibir o Airbnb gera conflito jurídico, desvaloriza imóveis e nem sempre é viável legalmente. Já a regulamentação oferece benefícios reais:</p>

<ul>
<li><strong>Segurança:</strong> todos os hóspedes ficam registrados com nome, CPF e foto de documento</li>
<li><strong>Rastreabilidade:</strong> a administradora sabe exatamente quem entrou e quando</li>
<li><strong>Previsibilidade:</strong> a portaria é avisada com antecedência</li>
<li><strong>Redução de conflitos:</strong> moradores se sentem mais seguros com um processo formal</li>
</ul>

<h2>O que o processo de cadastro deve incluir</h2>

<p>Um bom processo de cadastro de hóspedes exige as seguintes informações:</p>

<ul>
<li>Nome completo de todos os hóspedes (não apenas o titular)</li>
<li>Documento com foto (CPF + RG ou passaporte)</li>
<li>Data e horário de entrada e saída</li>
<li>Número da unidade</li>
<li>Dados do veículo, se aplicável</li>
<li>Nome e contato do anfitrião responsável</li>
</ul>

<h2>Como implementar na prática</h2>

<p>Existem três abordagens comuns:</p>

<h3>1. Formulário manual (papel ou PDF)</h3>
<p>O anfitrião preenche um formulário e entrega na portaria. É simples, mas depende da disciplina do anfitrião, não tem padronização e é difícil de consultar depois.</p>

<h3>2. Grupo de WhatsApp ou email</h3>
<p>O anfitrião manda os dados por WhatsApp ou email. Mais ágil que o papel, mas as mensagens se misturam, não tem formato padrão e é fácil perder informação.</p>

<h3>3. Sistema digital de cadastro</h3>
<p>A abordagem mais profissional. O anfitrião usa um sistema que coleta os dados do hóspede de forma padronizada e envia automaticamente para a portaria.</p>

<p>O <a href="/">AirCheck</a> é um exemplo de ferramenta que funciona exatamente assim: o anfitrião não precisa fazer nada manualmente — o hóspede preenche um formulário digital, e a portaria recebe tudo organizado no WhatsApp, com nome, CPF, documento e datas.</p>

<h2>Modelo de regra condominial para Airbnb</h2>

<p>Se o condomínio quer regulamentar o uso do Airbnb, uma boa prática é aprovar em assembleia uma regra que inclua:</p>

<ul>
<li>Obrigatoriedade de cadastro prévio de hóspedes na portaria</li>
<li>Prazo mínimo de antecedência (ex: 24 horas)</li>
<li>Dados mínimos exigidos (nome, CPF, período)</li>
<li>Responsabilidade do proprietário/anfitrião por danos e infrações</li>
<li>Limite de rotatividade, se desejado (ex: mínimo de 2 noites)</li>
</ul>

<p>Essa abordagem é juridicamente mais segura que a proibição total e demonstra que o condomínio está cuidando da segurança sem restringir indevidamente o direito de propriedade.</p>

<h2>O papel da administradora</h2>

<p>A administradora pode liderar essa padronização, especialmente se gerencia múltiplos condomínios. Ao recomendar uma ferramenta de cadastro digital como padrão, ela:</p>

<ul>
<li>Reduz o trabalho da portaria (menos mensagens avulsas no WhatsApp)</li>
<li>Aumenta a segurança do condomínio (dados completos e documentados)</li>
<li>Diminui conflitos entre moradores e anfitriões</li>
<li>Agrega valor ao serviço de administração</li>
</ul>

<p>Se você é síndico ou administradora e quer implementar um processo de cadastro profissional, <a href="/register">conheça o AirCheck</a> — é gratuito durante o lançamento e pode ser o padrão que o seu condomínio precisa.</p>
`,
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST 6
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  slug: "como-configurar-mensagens-automaticas-airbnb",
  title: "Como configurar mensagens automáticas no Airbnb: guia passo a passo",
  description: "Aprenda a usar as respostas rápidas programadas do Airbnb para enviar mensagens automáticas aos hóspedes em cada etapa da reserva.",
  category: "dicas-anfitrioes",
  tags: ["mensagens automáticas", "airbnb", "respostas rápidas", "automação", "comunicação"],
  author: "AirCheck",
  publishedAt: "2026-02-15",
  readingTime: 6,
  content: `
<p>Uma das funcionalidades mais poderosas — e subutilizadas — do Airbnb é o sistema de <strong>respostas rápidas programadas</strong>. Com ele, você cria mensagens que são enviadas automaticamente aos hóspedes quando determinados eventos acontecem, como a confirmação da reserva ou a proximidade do check-in.</p>

<h2>Como acessar as respostas rápidas programadas</h2>

<ol>
<li>Acesse <strong>Mensagens</strong> no painel do Airbnb</li>
<li>Clique no ícone de <strong>Configurações</strong> (engrenagem)</li>
<li>Selecione <strong>Respostas rápidas</strong></li>
<li>Clique em <strong>Criar</strong></li>
</ol>

<h2>As variáveis que o Airbnb oferece</h2>

<p>Dentro da mensagem, você pode usar variáveis que o Airbnb preenche automaticamente para cada reserva:</p>

<ul>
<li><strong>Nome do primeiro hóspede</strong> — o nome do titular da reserva</li>
<li><strong>Data de check-in / checkout</strong></li>
<li><strong>Horário de check-in / checkout</strong></li>
<li><strong>Código de confirmação</strong> — o código único da reserva</li>
<li><strong>Endereço</strong> do imóvel</li>
<li><strong>Senha do Wi-Fi</strong></li>
<li><strong>Regras da casa</strong></li>
</ul>

<h2>Mensagens essenciais para configurar</h2>

<h3>1. Confirmação de reserva</h3>
<p><strong>Gatilho:</strong> reserva confirmada<br>
<strong>Quando:</strong> imediatamente</p>
<p>Essa é a primeira impressão. Agradeça, confirme as datas e dê uma instrução inicial.</p>

<h3>2. Pré-check-in (1-2 dias antes)</h3>
<p><strong>Gatilho:</strong> check-in<br>
<strong>Quando:</strong> 1 dia antes</p>
<p>Envie instruções de chegada, endereço, senha do Wi-Fi e informações sobre estacionamento.</p>

<h3>3. Solicitação de check-in / dados</h3>
<p><strong>Gatilho:</strong> reserva confirmada<br>
<strong>Quando:</strong> imediatamente ou 1 dia depois</p>
<p>Se você hospeda em prédio com portaria, essa mensagem é crucial. Aqui você pode incluir o link do formulário de check-in:</p>

<blockquote>
<p>Olá, [nome do primeiro hóspede]! 😊</p>
<p>Para agilizar seu check-in, preencha este formulário com os dados dos hóspedes. É necessário para liberação na portaria e leva menos de 1 minuto.</p>
<p>aircheck.com.br/c/[código de confirmação]</p>
<p>Qualquer dúvida, estou à disposição!</p>
</blockquote>

<p>Usando o <a href="/">AirCheck</a>, o código de confirmação na URL é substituído automaticamente pelo Airbnb, e o hóspede cai direto no formulário específico da sua reserva.</p>

<h3>4. Pós-checkout</h3>
<p><strong>Gatilho:</strong> checkout<br>
<strong>Quando:</strong> 1 dia depois</p>
<p>Agradeça pela estadia e peça uma avaliação.</p>

<h2>Reservas de última hora</h2>

<p>O Airbnb tem uma opção chamada "Enviar para reservas de última hora e estadias curtas". Ative-a para garantir que suas mensagens sejam enviadas mesmo quando a reserva é feita no dia do check-in.</p>

<h2>Dicas para boas mensagens</h2>

<ul>
<li><strong>Seja conciso.</strong> Hóspedes não leem mensagens longas.</li>
<li><strong>Uma informação por mensagem.</strong> Não misture instruções de chegada com pedido de dados.</li>
<li><strong>Use emojis com moderação.</strong> Transmitem simpatia sem parecer informal demais.</li>
<li><strong>Revise as variáveis.</strong> Certifique-se de que as informações do seu anúncio (endereço, Wi-Fi) estão preenchidas, senão a variável aparecerá como "indisponível".</li>
</ul>

<h2>Conclusão</h2>

<p>Mensagens automáticas economizam tempo, padronizam a comunicação e melhoram a experiência do hóspede. Configure uma vez e cada nova reserva recebe o mesmo nível de atenção — sem você precisar lembrar de enviar nada.</p>
`,
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST 7
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  slug: "airbnb-vs-aluguel-tradicional-qual-rende-mais",
  title: "Airbnb vs aluguel tradicional: qual rende mais em 2026?",
  description: "Comparação detalhada entre Airbnb e aluguel de longo prazo. Renda média, custos, ocupação, riscos e quando cada modelo faz mais sentido.",
  category: "ganhar-mais",
  tags: ["airbnb", "aluguel", "renda", "investimento", "comparação"],
  author: "AirCheck",
  publishedAt: "2026-02-14",
  readingTime: 8,
  content: `
<p>Essa é a pergunta que todo proprietário de imóvel já se fez: <strong>vale mais a pena alugar pelo Airbnb ou fazer um contrato de aluguel tradicional?</strong> A resposta depende de vários fatores — e neste artigo analisamos cada um deles.</p>

<h2>Renda potencial: Airbnb geralmente ganha</h2>

<p>Em cidades turísticas ou com alta demanda por estadia curta, o Airbnb pode render de 2x a 4x mais que o aluguel tradicional. A lógica é simples: o preço por diária é proporcionalmente maior que o preço mensal dividido por 30.</p>

<p>Por exemplo, um apartamento que aluga por R$ 2.000/mês no modelo tradicional pode gerar R$ 200-300/dia no Airbnb. Com 15 dias de ocupação, já iguala o aluguel mensal. Com 20+ dias, supera com folga.</p>

<h2>Mas os custos também são maiores</h2>

<p>O Airbnb envolve custos que o aluguel tradicional não tem:</p>

<ul>
<li><strong>Limpeza entre reservas:</strong> R$ 80-200 por turnover, dependendo do tamanho</li>
<li><strong>Enxoval e manutenção:</strong> toalhas, roupas de cama, produtos de higiene — e reposição constante</li>
<li><strong>Contas de consumo:</strong> água, luz, internet ficam por sua conta</li>
<li><strong>Taxa do Airbnb:</strong> 3% de taxa de serviço para o anfitrião</li>
<li><strong>Gestão operacional:</strong> mensagens, check-in, portaria, manutenção</li>
</ul>

<h2>Ocupação: o fator decisivo</h2>

<p>O aluguel tradicional tem 100% de ocupação (ou 0%, se estiver vazio). O Airbnb flutua. Uma taxa de ocupação de 60-70% geralmente é suficiente para superar o aluguel tradicional, mas isso depende da localização, preço e sazonalidade.</p>

<h2>Quando o Airbnb faz mais sentido</h2>

<ul>
<li>Imóvel em localização turística ou de negócios</li>
<li>Apartamento mobiliado e bem decorado</li>
<li>Você tem disponibilidade (ou ferramentas) para gestão operacional</li>
<li>O condomínio permite ou regulamenta locação por temporada</li>
</ul>

<h2>Quando o aluguel tradicional faz mais sentido</h2>

<ul>
<li>Você quer renda passiva sem gestão ativa</li>
<li>O imóvel está em região sem demanda turística</li>
<li>O condomínio proíbe ou dificulta o Airbnb</li>
<li>Você prefere previsibilidade de receita</li>
</ul>

<h2>A conta que você precisa fazer</h2>

<p>Para decidir de forma racional, calcule:</p>

<ol>
<li><strong>Receita do Airbnb:</strong> diária média × dias de ocupação estimados por mês</li>
<li><strong>Custos do Airbnb:</strong> limpeza + consumo + enxoval + taxa do Airbnb + seu tempo</li>
<li><strong>Receita líquida do Airbnb:</strong> receita menos custos</li>
<li><strong>Compare com:</strong> valor do aluguel tradicional líquido (descontando administradora, IPTU, etc.)</li>
</ol>

<h2>A automação muda a equação</h2>

<p>Um dos maiores custos do Airbnb é o tempo operacional. Cada ferramenta que automatiza uma etapa — mensagens, precificação, check-in — reduz esse custo e torna o modelo mais viável.</p>

<p>Para quem hospeda em condomínio, o <a href="/">AirCheck</a> elimina a gestão manual do check-in na portaria, que é uma das tarefas mais repetitivas e propensas a erro.</p>

<h2>Conclusão</h2>

<p>O Airbnb geralmente rende mais, mas exige mais trabalho. A chave está em automatizar o que for possível e manter a operação eficiente. Se a diferença de renda justifica o esforço — e com as ferramentas certas, o esforço é mínimo — o Airbnb é a escolha financeiramente superior para a maioria dos imóveis bem localizados.</p>
`,
},

// Posts 8-10: stubs - will be expanded
{
  slug: "seguranca-em-condominios-com-airbnb",
  title: "Segurança em condomínios com Airbnb: guia para síndicos e administradoras",
  description: "Como garantir a segurança do condomínio quando moradores hospedam pelo Airbnb. Processos, tecnologia e regras que funcionam.",
  category: "condominios",
  tags: ["segurança", "condomínio", "síndico", "administradora", "controle de acesso"],
  author: "AirCheck",
  publishedAt: "2026-02-13",
  readingTime: 7,
  content: `
<p>A presença do Airbnb em condomínios residenciais levanta uma preocupação legítima: <strong>segurança</strong>. Moradores querem saber quem está circulando pelo prédio, e administradoras precisam garantir que o controle de acesso funcione mesmo com a rotatividade de hóspedes.</p>

<p>A boa notícia: é possível manter (e até melhorar) a segurança do condomínio com o Airbnb. O segredo está no processo.</p>

<h2>Os riscos reais vs. os riscos percebidos</h2>

<p>Antes de tudo, é importante separar a percepção do risco real. Hóspedes do Airbnb:</p>

<ul>
<li>São identificados pela plataforma (nome, CPF, foto, histórico de avaliações)</li>
<li>Pagam antecipadamente (o que cria rastreabilidade financeira)</li>
<li>São avaliados publicamente (o que incentiva bom comportamento)</li>
</ul>

<p>Na prática, um hóspede do Airbnb é tão ou mais identificável que um visitante comum de um morador.</p>

<h2>O que realmente causa insegurança</h2>

<p>O problema não é o Airbnb em si — é a <strong>falta de processo</strong>. Quando não há um sistema padronizado:</p>

<ul>
<li>Hóspedes chegam sem aviso prévio à portaria</li>
<li>O porteiro não tem informações sobre quem liberar</li>
<li>Não existe registro de quem entrou e quando</li>
<li>Moradores ficam desconfortáveis com "estranhos" não identificados</li>
</ul>

<h2>Como criar um processo seguro</h2>

<h3>1. Cadastro prévio obrigatório</h3>
<p>Exija que o anfitrião cadastre os hóspedes com pelo menos 24 horas de antecedência. O cadastro deve incluir: nome completo, documento com foto, datas de entrada e saída.</p>

<h3>2. Envio padronizado para a portaria</h3>
<p>Defina um formato padrão de comunicação. Ferramentas como o <a href="/">AirCheck</a> resolvem isso automaticamente — o hóspede preenche um formulário, e a portaria recebe todos os dados organizados no WhatsApp.</p>

<h3>3. Verificação na chegada</h3>
<p>O porteiro confere o nome e documento do hóspede com o cadastro recebido antes de liberar o acesso.</p>

<h3>4. Registro digital</h3>
<p>Mantenha um histórico digital de todos os hóspedes que passaram pelo prédio. Isso é útil para auditorias e para resolver eventuais ocorrências.</p>

<h2>O papel da tecnologia</h2>

<p>Sistemas digitais de cadastro eliminam a dependência de anotações manuais e mensagens de WhatsApp perdidas no histórico. Com o cadastro digital:</p>

<ul>
<li>Os dados ficam organizados e consultáveis</li>
<li>A troca de turno não perde informação</li>
<li>O registro inclui foto do documento (prova documental)</li>
<li>O anfitrião tem responsabilidade documentada</li>
</ul>

<h2>Modelo de regra de segurança para Airbnb no condomínio</h2>

<ul>
<li>Todo hóspede de locação por temporada deve ser cadastrado na portaria com 24h de antecedência</li>
<li>O cadastro deve incluir nome completo, CPF/RG e foto de documento de todos os hóspedes</li>
<li>O anfitrião é responsável por informar a portaria e garantir o cumprimento das regras condominiais</li>
<li>Hóspedes não cadastrados não serão liberados pela portaria</li>
</ul>

<h2>Conclusão</h2>

<p>A segurança de um condomínio com Airbnb depende menos de proibições e mais de processos bem definidos. Com cadastro prévio, comunicação padronizada e registro digital, o condomínio fica mais seguro do que no modelo informal de "avisar o porteiro por telefone".</p>

<p>Se você é síndico ou administradora e quer implementar esse processo, <a href="/register">conheça o AirCheck</a> — é a ferramenta que padroniza o cadastro de hóspedes e entrega os dados direto na portaria.</p>
`,
},

{
  slug: "como-ser-superhost-airbnb-guia-completo",
  title: "Como ser Superhost no Airbnb: guia completo para 2026",
  description: "Tudo sobre os requisitos, benefícios e estratégias para conquistar e manter o status de Superhost no Airbnb em 2026.",
  category: "dicas-anfitrioes",
  tags: ["superhost", "airbnb", "avaliações", "hospedagem", "dicas"],
  author: "AirCheck",
  publishedAt: "2026-02-12",
  readingTime: 8,
  content: `
<p>O status de <strong>Superhost</strong> é o selo de qualidade do Airbnb. Anfitriões com essa distinção aparecem com mais destaque nas buscas, transmitem mais confiança e, na prática, recebem mais reservas. Mas conquistar e manter o status exige consistência.</p>

<h2>Requisitos para ser Superhost</h2>

<p>O Airbnb avalia os anfitriões a cada trimestre. Para ser (ou continuar sendo) Superhost, você precisa cumprir todos estes critérios:</p>

<ul>
<li><strong>Mínimo de 10 estadias</strong> (ou 3 estadias que totalizem pelo menos 100 noites) nos últimos 12 meses</li>
<li><strong>Taxa de resposta de 90%</strong> ou mais</li>
<li><strong>Taxa de cancelamento abaixo de 1%</strong> (cancelamentos feitos por você, não pelo hóspede)</li>
<li><strong>Avaliação geral de 4,8 ou mais</strong></li>
</ul>

<h2>Estratégias para alcançar 4,8 de avaliação</h2>

<h3>Comunicação rápida e clara</h3>
<p>A maioria das avaliações negativas vem de falhas de comunicação. Responda rápido, antecipe perguntas e envie instruções claras antes do check-in.</p>

<p>Dica: use as <a href="/blog/como-configurar-mensagens-automaticas-airbnb">mensagens automáticas do Airbnb</a> para garantir que toda informação importante chegue no momento certo.</p>

<h3>Check-in impecável</h3>
<p>A primeira impressão define o tom da avaliação. Em prédios com portaria, o check-in é ainda mais crítico — se o hóspede chega e a portaria não sabe quem ele é, a experiência começa mal.</p>

<p>Usar uma ferramenta como o <a href="/">AirCheck</a> para garantir que a portaria esteja preparada é um investimento direto na sua nota.</p>

<h3>Limpeza impecável</h3>
<p>Limpeza é o critério número 1 nas avaliações do Airbnb. Invista em profissionais de limpeza dedicados e crie um checklist detalhado.</p>

<h3>Amenidades que fazem diferença</h3>
<p>Café, chá, um guia local com dicas de restaurantes, carregador de celular. Pequenos detalhes geram avaliações entusiasmadas.</p>

<h3>Peça a avaliação</h3>
<p>Após o checkout, envie uma mensagem agradecendo e mencionando que avaliações são importantes. A maioria dos hóspedes satisfeitos avalia quando lembrados.</p>

<h2>Benefícios do Superhost</h2>

<ul>
<li><strong>Selo visível</strong> no seu anúncio e perfil</li>
<li><strong>Melhor posicionamento</strong> nos resultados de busca</li>
<li><strong>Mais confiança</strong> de hóspedes na hora da reserva</li>
<li><strong>Cupom de viagem</strong> do Airbnb como recompensa</li>
<li><strong>Suporte prioritário</strong> do Airbnb</li>
</ul>

<h2>Erros que tiram o Superhost</h2>

<ul>
<li><strong>Cancelar reservas:</strong> um cancelamento pode comprometer todo o trimestre</li>
<li><strong>Demorar para responder:</strong> mais de 24h sem resposta prejudica a taxa</li>
<li><strong>Problemas recorrentes de limpeza:</strong> uma avaliação de 3 estrelas puxa a média drasticamente</li>
<li><strong>Check-in desorganizado:</strong> hóspedes que enfrentam problemas na chegada avaliam pior</li>
</ul>

<h2>Conclusão</h2>

<p>Ser Superhost não é sobre sorte — é sobre processo. Comunicação automatizada, check-in organizado, limpeza impecável e atenção aos detalhes. A cada reserva, você constrói (ou destrói) sua reputação. Invista nas ferramentas e nos processos que tornam a excelência consistente.</p>
`,
},

{
  slug: "como-gerenciar-multiplos-imoveis-airbnb",
  title: "Como gerenciar múltiplos imóveis no Airbnb sem enlouquecer",
  description: "Dicas e ferramentas para anfitriões que gerenciam 2 ou mais imóveis no Airbnb. Organização, automação e processos que escalam.",
  category: "ganhar-mais",
  tags: ["gestão", "múltiplos imóveis", "airbnb", "escalar", "automação"],
  author: "AirCheck",
  publishedAt: "2026-02-11",
  readingTime: 7,
  content: `
<p>Gerenciar um imóvel no Airbnb é trabalhoso. Gerenciar dois, três ou dez é exponencialmente mais — a menos que você tenha processos e ferramentas que escalam.</p>

<p>A diferença entre um anfitrião que cresce e um que fica sobrecarregado é simples: <strong>quem cresce automatiza; quem não cresce, improvisa</strong>.</p>

<h2>Os gargalos que aparecem com múltiplos imóveis</h2>

<ul>
<li><strong>Comunicação:</strong> responder hóspedes de 5 imóveis diferentes, cada um com suas particularidades</li>
<li><strong>Check-in:</strong> avisar portarias diferentes, com dados diferentes, em horários diferentes</li>
<li><strong>Limpeza:</strong> coordenar turnovers em imóveis que podem ter checkouts e check-ins no mesmo dia</li>
<li><strong>Precificação:</strong> ajustar preços por localização, temporada e demanda — para cada imóvel</li>
<li><strong>Manutenção:</strong> controlar o que quebrou onde, e o que precisa ser reposto</li>
</ul>

<h2>Princípio 1: Padronize tudo que puder</h2>

<p>Quanto mais padronizado o processo, menos decisões você toma por reserva. Exemplos:</p>

<ul>
<li>Mesma marca de toalhas e roupas de cama em todos os imóveis (facilita reposição)</li>
<li>Mesmo checklist de limpeza</li>
<li>Mesmas mensagens automáticas (adaptadas por variáveis como endereço e Wi-Fi)</li>
<li>Mesmo processo de check-in na portaria</li>
</ul>

<h2>Princípio 2: Automatize a comunicação</h2>

<p>As mensagens programadas do Airbnb são obrigatórias para quem gerencia múltiplos imóveis. Configure uma vez por imóvel e nunca mais pense nisso.</p>

<h2>Princípio 3: Use ferramentas especializadas</h2>

<p>Cada área da operação tem ferramentas dedicadas:</p>

<ul>
<li><strong>Channel manager</strong> (Stays.net, Guesty) para sincronizar calendários</li>
<li><strong>Precificação dinâmica</strong> (PriceLabs, Beyond) para maximizar receita</li>
<li><strong>Check-in na portaria</strong> (<a href="/">AirCheck</a>) para coleta de dados e envio pro WhatsApp da portaria — especialmente importante quando cada imóvel tem uma portaria diferente</li>
</ul>

<h2>Princípio 4: Delegue a limpeza</h2>

<p>Limpeza é a tarefa que mais consome tempo operacional. Contrate profissionais fixos (não freelas avulsos) e use um checklist com fotos para garantir qualidade consistente.</p>

<h2>Princípio 5: Acompanhe os números</h2>

<p>Com múltiplos imóveis, você precisa saber:</p>

<ul>
<li>Taxa de ocupação por imóvel</li>
<li>Receita líquida (não bruta) por imóvel</li>
<li>Custo por reserva (limpeza + consumo + manutenção)</li>
<li>Nota média e tendência de avaliações</li>
</ul>

<p>Se um imóvel consistentemente rende menos que os outros, pode ser hora de repensar a estratégia — ou até vendê-lo.</p>

<h2>Quanto você pode gerenciar sozinho?</h2>

<p>Com boas ferramentas e processos, um anfitrião solo consegue gerenciar de 3 a 5 imóveis. Acima disso, geralmente precisa de ajuda — seja um coanfitrião, uma equipe de limpeza dedicada, ou um serviço de gestão.</p>

<p>O importante é que cada novo imóvel não deve multiplicar proporcionalmente o seu trabalho. Se cada imóvel adicional exige o mesmo esforço do primeiro, seu processo não está escalando.</p>

<h2>Conclusão</h2>

<p>Gerenciar múltiplos imóveis é viável e lucrativo — se você tratar como um negócio, não como um hobby. Padronize, automatize e monitore. As ferramentas existem. O que falta, na maioria dos casos, é o processo.</p>
`,
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST 11 — GUIA GMAIL FORWARDING (central de ajuda)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  slug: "como-configurar-encaminhamento-email-airbnb-gmail",
  title: "Como configurar o encaminhamento automático de reservas do Airbnb no Gmail",
  description: "Guia completo com prints: configure o Gmail para encaminhar automaticamente os emails de reserva do Airbnb para o AirCheck em menos de 5 minutos.",
  category: "checkin-portaria",
  tags: ["gmail", "encaminhamento", "email", "airbnb", "configuração", "filtro", "tutorial", "passo a passo"],
  author: "AirCheck",
  publishedAt: "2026-03-20",
  readingTime: 5,
  content: `
<p>Para o AirCheck funcionar automaticamente, ele precisa receber os emails de confirmação de reserva que o Airbnb envia pra você. A forma mais simples é criar um <strong>filtro de encaminhamento automático</strong> no seu email.</p>

<p>Neste guia, mostramos passo a passo como configurar no <strong>Gmail</strong> — incluindo contas do Google Workspace (emails corporativos que usam a interface do Gmail). O processo leva menos de 5 minutos e você faz uma única vez.</p>

<h2>Visão geral</h2>

<p>São 3 etapas:</p>
<ol>
<li>Adicionar o endereço de encaminhamento do AirCheck no Gmail</li>
<li>Aguardar a confirmação do endereço (nós cuidamos disso nos bastidores)</li>
<li>Importar o filtro automático (via arquivo XML que fornecemos)</li>
</ol>

<p><strong>Versão rápida:</strong> se você já tem experiência com filtros do Gmail, pode <a href="/aircheck-gmail-filter.xml" download>baixar nosso arquivo de filtro XML</a> e importar em Configurações → Filtros → Importar filtros. Mas antes, complete as etapas 1 e 2 abaixo.</p>

<h2>Etapa 1 — Adicionar o endereço de encaminhamento</h2>

<p>Abra o Gmail <strong>no computador</strong> (este passo precisa ser feito no desktop). Clique no ícone de <strong>engrenagem ⚙️</strong> no canto superior direito e depois em <strong>"Ver todas as configurações"</strong>.</p>

<p>Na barra de abas, clique em <strong>"Encaminhamento e POP/IMAP"</strong>.</p>

<p><img src="/blog/gmail-setup/1.png" alt="Configurações do Gmail — aba Encaminhamento e POP/IMAP" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<p>Clique no botão <strong>"Adicionar um endereço de encaminhamento"</strong>.</p>

<p>No popup, digite:</p>

<p style="text-align:center;font-size:18px;font-weight:700;color:#3B5FE5;padding:12px;background:#EBF0FF;border-radius:8px;margin:16px 0"><code>reservas@aircheck.com.br</code></p>

<p>Clique em <strong>"Avançar"</strong>.</p>

<p><img src="/blog/gmail-setup/2.png" alt="Popup de adicionar endereço de encaminhamento" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<p>Uma janela de confirmação vai aparecer. Clique em <strong>"Continuar"</strong>.</p>

<p><img src="/blog/gmail-setup/3.png" alt="Popup de confirmação" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<h2>Etapa 2 — Aguardar a confirmação</h2>

<p>O Gmail vai exibir a mensagem: <em>"Um link de confirmação foi enviado a reservas@aircheck.com.br para verificar a permissão"</em>. Clique em <strong>OK</strong>.</p>

<p><img src="/blog/gmail-setup/4.png" alt="Gmail informando que o link de confirmação foi enviado" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<p><strong>Nós cuidamos da confirmação nos bastidores.</strong> Aguarde de 1 a 2 minutos e recarregue a página de configurações do Gmail (aperte F5). O endereço vai aparecer como verificado.</p>

<p><img src="/blog/gmail-setup/5.png" alt="Endereço de encaminhamento verificado no Gmail" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<p><strong>Importante:</strong> não é necessário ativar o encaminhamento geral (pode deixar em "Desativar encaminhamento"). Vamos usar um filtro específico — assim, apenas os emails do Airbnb serão encaminhados, não todos os seus emails.</p>

<p><img src="/blog/gmail-setup/8.png" alt="Encaminhamento desativado mas endereço verificado" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<p>Se o endereço não aparecer como verificado após 5 minutos, entre em contato conosco em <a href="mailto:oi@aircheck.com.br">oi@aircheck.com.br</a>.</p>

<h2>Etapa 3 — Importar o filtro automático</h2>

<p>Agora vamos configurar o Gmail para encaminhar automaticamente apenas os emails de reserva do Airbnb. A forma mais rápida é importar nosso filtro pronto:</p>

<ol>
<li><a href="/aircheck-gmail-filter.xml" download><strong>Baixe o arquivo de filtro do AirCheck</strong></a></li>
<li>No Gmail, vá na aba <strong>"Filtros e endereços bloqueados"</strong></li>
<li>Role até o final e clique em <strong>"Importar filtros"</strong></li>
<li>Selecione o arquivo XML baixado e clique em <strong>"Abrir arquivo"</strong></li>
<li>Marque <strong>"Aplicar filtro às conversas correspondentes"</strong> — isso processa reservas que já estão na sua caixa</li>
<li>Clique em <strong>"Criar filtros"</strong></li>
</ol>

<p><strong>Pronto!</strong> O filtro foi criado. Confira na lista de filtros:</p>

<p><img src="/blog/gmail-setup/9.png" alt="Filtro criado — from:(automated@airbnb.com), Encaminhar para reservas@aircheck.com.br" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<h2>Alternativa: criar o filtro manualmente</h2>

<p>Se preferir criar o filtro sem importar o XML:</p>

<ol>
<li>Na caixa de entrada do Gmail, clique na <strong>barra de pesquisa</strong> e depois no ícone de <strong>"Mostrar opções de pesquisa"</strong> (ícone de filtro ao lado da barra)</li>
<li>No campo <strong>"De"</strong>, digite: <code>automated@airbnb.com</code></li>
<li>Clique em <strong>"Criar filtro"</strong></li>
</ol>

<p><img src="/blog/gmail-setup/6.png" alt="Opções de pesquisa com automated@airbnb.com" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<p>Na próxima tela, marque:</p>
<ul>
<li>✅ <strong>"Encaminhar para: reservas@aircheck.com.br"</strong></li>
<li>✅ <strong>"Marcar como lida"</strong> (opcional, mas recomendado)</li>
<li>✅ <strong>"Também aplicar filtro a X conversas correspondentes"</strong></li>
</ul>

<p>Clique em <strong>"Criar filtro"</strong>.</p>

<p><img src="/blog/gmail-setup/7.png" alt="Configuração do filtro com encaminhamento e marcar como lida" style="max-width:100%;border-radius:8px;border:1px solid #E5E5E5;margin:16px 0" /></p>

<h2>E os cancelamentos?</h2>

<p>Os emails de confirmação e cancelamento do Airbnb vêm do mesmo remetente (<code>automated@airbnb.com</code>). Com esse filtro, ambos são encaminhados automaticamente — o AirCheck processa cancelamentos e atualiza o status da reserva no painel.</p>

<h2>Google Workspace (email corporativo)</h2>

<p>Se você usa um email corporativo hospedado no Google (ex: <code>voce@suaempresa.com.br</code> com interface do Gmail), o processo é idêntico. O Gmail é o mesmo — o que muda é só o domínio do seu email.</p>

<h2>Usa outro provedor?</h2>

<p>Se você usa <strong>Outlook/Hotmail</strong>, <strong>Yahoo Mail</strong> ou <strong>Zoho Mail</strong>, o processo é similar mas em telas diferentes. Durante o onboarding do AirCheck, mostramos o passo a passo específico pro seu provedor automaticamente.</p>

<h2>Precisa de ajuda?</h2>

<p>Se tiver qualquer dificuldade, entre em contato em <a href="mailto:oi@aircheck.com.br">oi@aircheck.com.br</a>. Vamos te ajudar pessoalmente a configurar.</p>
`,
},

];

// ─── HELPERS ────────────────────────────────────────────────────
export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return BLOG_POSTS.filter(p => p.category === category).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const post = getPostBySlug(slug);
  if (!post) return [];
  return BLOG_POSTS
    .filter(p => p.slug !== slug && (p.category === post.category || p.tags.some(t => post.tags.includes(t))))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}
