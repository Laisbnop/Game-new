/* História da família. Cada contexto tem os mesmos seis capítulos, com
   situações e escolhas diferentes. Nenhuma escolha é "errada": todas valem
   igual e mudam apenas o rumo da história (registrado na ficha e no diário).

   Os capítulos acontecem em casa, conversando com o responsável, e são
   liberados conforme o número de tarefas de trabalho já concluídas.
   Marcadores: {nome} = jogador · {oficio} = área da profissão.
   Quem fala: 'narr' (narração) ou 'resp' (responsável). */

const STORY_BEATS = [
  { id: 'b1', at: 0,  title: 'O primeiro dia' },
  { id: 'b2', at: 2,  title: 'O caminho do trabalho' },
  { id: 'b3', at: 4,  title: 'Conversa sobre dinheiro', reveals: true },
  { id: 'b4', at: 7,  title: 'Um imprevisto' },
  { id: 'b5', at: 10, title: 'O que esperam de você' },
  { id: 'b6', at: 14, title: 'Um passo adiante' },
];

/* O responsável herda o tom de pele do jogador (é da família). */
const GUARDIANS = {
  pobre: { name: 'Rosa',   rel: 'sua mãe', look: { body: 'f', hair: 'cacheado', hairColor: 'preto',    outfit: ['#d98a3a', '#5a4a6a'] } },
  media: { name: 'Jorge',  rel: 'seu pai', look: { body: 'm', hair: 'careca',   hairColor: 'castanho', outfit: ['#6a9a5a', '#4a4a5a'] } },
  rico:  { name: 'Helena', rel: 'sua mãe', look: { body: 'f', hair: 'liso',     hairColor: 'castanho', outfit: ['#e8e4f0', '#3a3a5a'] } },
};

const STORY = {
  /* ------------------------------------------------------------------ */
  pobre: {
    b1: { lines: [
      ['resp', 'Bom dia, {nome}! Primeiro dia de trabalho, hein? Deixei pão e café na mesa.'],
      ['resp', 'Hoje pego turno dobrado. Na volta, é você quem busca seu irmão na escola, combinado?'],
      ['resp', 'Dezessete anos e já com um ofício. {oficio}... quem diria. Vai lá e capricha.'],
    ] },
    b2: { lines: [
      ['narr', 'Suas botas estão gastas, e o caminho até o trabalho é longo para fazer a pé todos os dias.'],
      ['resp', 'A bicicleta velha do seu tio está encostada lá nos fundos. Precisa de conserto, mas anda.'],
      ['resp', 'Não é o ideal, eu sei. Como você prefere fazer?'],
    ], choices: [
      { label: 'Consertar a bicicleta aos poucos', flag: 'Está consertando a bicicleta do tio para ir ao trabalho',
        after: [['narr', 'Um remendo por noite. Em uma semana ela já aguenta a ladeira.']] },
      { label: 'Sair mais cedo e ir a pé', flag: 'Sai de casa antes do sol para chegar a pé ao trabalho',
        after: [['narr', 'Você aprende a gostar da vila vazia de manhã cedo. Chega sempre primeiro.']] },
      { label: 'Combinar carona com um vizinho', flag: 'Divide o caminho com um vizinho que vai para o mesmo lado',
        after: [['narr', 'Seu Zé passa de carroça todo dia. Em troca, você o ajuda a descarregar aos sábados.']] },
    ] },
    b3: { lines: [
      ['resp', 'Senta aqui um pouco. Vou ser sincera com você: este mês as contas apertaram.'],
      ['resp', 'O que você ganha é seu, e eu não vou pedir. Mas preciso que você saiba como as coisas estão.'],
      ['narr', 'Você entende melhor a realidade da sua casa: o dinheiro é contado, e o seu trabalho pesa de verdade aqui.'],
    ], choices: [
      { label: 'Dar parte do que ganha para a casa', flag: 'Ajuda nas contas da casa com parte do que ganha', coins: -10,
        after: [['narr', 'Rosa não quer aceitar. Você deixa as moedas no pote da cozinha mesmo assim.']] },
      { label: 'Assumir a feira da semana', flag: 'Faz a feira da casa com o próprio dinheiro', coins: -6,
        after: [['narr', 'Você volta do mercado com a sacola cheia. Seu irmão comemora as bananas.']] },
      { label: 'Guardar para um conserto do telhado', flag: 'Está juntando para consertar o telhado antes das chuvas',
        after: [['narr', 'Vocês colam um papel na parede com a meta. Cada moeda vira um risquinho.']] },
    ] },
    b4: { lines: [
      ['narr', 'Choveu a noite inteira e uma goteira abriu bem em cima da sua cama. Você mal dormiu.'],
      ['resp', 'Eu seguro as pontas aqui. Mas você tem trabalho hoje...'],
    ], choices: [
      { label: 'Arrumar a goteira antes de sair', flag: 'Consertou a goteira de casa antes do trabalho',
        after: [['narr', 'Uma telha emprestada e meia hora no telhado. Você chega com atraso, mas com a casa seca.']] },
      { label: 'Ir trabalhar e resolver à noite', flag: 'Cumpriu o dia de trabalho e arrumou a goteira à noite',
        after: [['narr', 'Um balde resolve por enquanto. À noite, você e Rosa trocam a telha à luz do lampião.']] },
      { label: 'Pedir ajuda a um vizinho', flag: 'Aprendeu a pedir ajuda quando precisa',
        after: [['narr', 'Seu Antônio sobe no telhado antes do almoço. Pedir ajuda custou menos do que você imaginava.']] },
    ] },
    b5: { lines: [
      ['resp', 'Ninguém da nossa família seguiu por {oficio}. Às vezes tenho medo de você se frustrar...'],
      ['resp', '...mas tenho mais medo ainda de você não tentar.'],
      ['resp', 'Ouvi dizer que querem você fixo lá. O que você pensa em fazer?'],
    ], choices: [
      { label: 'Ficar e crescer no ofício', flag: 'Decidiu crescer no próprio ofício',
        after: [['narr', 'Você conta os planos. Rosa escuta tudo sem interromper, sorrindo de canto.']] },
      { label: 'Juntar para ter as próprias ferramentas', flag: 'Está juntando para comprar as próprias ferramentas', coins: 8,
        after: [['narr', 'Você separa um pote só para isso. Rosa coloca a primeira moeda sem dizer nada.']] },
      { label: 'Ensinar o ofício ao irmão', flag: 'Ensina ao irmão o que aprende no trabalho',
        after: [['narr', 'Toda noite, dez minutos de aula na mesa da cozinha. Ele já quer ser igual a você.']] },
    ] },
    b6: { lines: [
      ['narr', 'Fim de tarde. Sua mãe está na porta, olhando você chegar pela rua.'],
      ['resp', 'Lembra do seu primeiro dia? Olha só o quanto você já andou.'],
      ['resp', 'Não foi sorte, viu. Foi você, um dia de cada vez.'],
      ['narr', 'O caminho foi mais apertado em alguns trechos — e você passou por todos.'],
    ] },
  },

  /* ------------------------------------------------------------------ */
  media: {
    b1: { lines: [
      ['resp', 'Bom dia, {nome}! Café na mesa. Primeiro dia de trabalho, hein?'],
      ['resp', 'Sua mãe está fechando a planilha do mês, então hoje não é dia de pedir nada.'],
      ['resp', 'Dezessete anos e já em {oficio}. Na volta, quero ouvir tudo durante o jantar.'],
    ] },
    b2: { lines: [
      ['narr', 'Em casa, o horário de todo mundo é apertado. Sua irmã estuda à noite e precisa de silêncio.'],
      ['resp', 'Vocês dois vão ter que se entender com a casa. Eu não vou ficar de juiz.'],
    ], choices: [
      { label: 'Combinar horários com sua irmã', flag: 'Combinou os horários da casa com a irmã',
        after: [['narr', 'Vocês colam uma tabela na geladeira. Às terças ela cede a sala; aos domingos, você.']] },
      { label: 'Acordar mais cedo', flag: 'Acorda mais cedo para ter tempo antes do trabalho',
        after: [['narr', 'Seis da manhã, casa em silêncio. O sono reclama nos primeiros dias.']] },
      { label: 'Ficar um pouco mais no trabalho', flag: 'Fica depois do expediente para praticar',
        after: [['narr', 'Você descobre que não é a única pessoa que fica até mais tarde por lá.']] },
    ] },
    b3: { lines: [
      ['resp', 'Sua mãe e eu olhamos o orçamento. Agora que você ganha o seu, queremos combinar uma coisa.'],
      ['resp', 'O que é seu é seu. Mas as suas despesas pessoais passam a ser com você, tudo bem?'],
      ['narr', 'Você entende melhor a realidade da sua casa: nada falta, e nada sobra. Cada escolha tem um preço.'],
    ], choices: [
      { label: 'Aceitar e montar um orçamento', flag: 'Cuida das próprias despesas com um orçamento',
        after: [['narr', 'Você abre um caderno: o que entra, o que sai. Seu pai espia e aprova com a cabeça.']] },
      { label: 'Propor ajudar com uma conta da casa', flag: 'Paga uma das contas da casa todo mês', coins: -8,
        after: [['narr', 'Seu pai levanta a sobrancelha, depois sorri. A conta de luz agora é sua.']] },
      { label: 'Guardar para um objetivo', flag: 'Guarda parte do que ganha para um objetivo',
        after: [['narr', 'Você ainda não sabe o que vai ser. Mas o pote já tem nome: "futuro".']] },
    ] },
    b4: { lines: [
      ['narr', 'A carroça da família quebrou. O conserto levou a reserva do mês inteira.'],
      ['resp', 'Sinto muito. Este mês vamos ter que apertar um pouco.'],
    ], choices: [
      { label: 'Oferecer parte das suas economias', flag: 'Ajudou no conserto com as economias', coins: -8,
        after: [['narr', 'Seu pai não quer aceitar. Sua mãe aceita por ele, e te dá um abraço demorado.']] },
      { label: 'Vender algo que não usa mais', flag: 'Vendeu o que não usava para ajudar em casa', coins: 12,
        after: [['narr', 'Os brinquedos antigos ganham um novo dono. Com o dinheiro, você cobre as suas despesas.']] },
      { label: 'Cortar os próprios gastos', flag: 'Aprendeu a passar o mês com menos',
        after: [['narr', 'Um mês sem lanche fora. Não é confortável, mas funciona.']] },
    ] },
    b5: { lines: [
      ['resp', 'Seu tio acha que você devia escolher uma carreira "mais segura". Eu não sei se concordo com ele.'],
      ['resp', 'Mas preciso perguntar: você pensa em seguir em {oficio} por muito tempo?'],
    ], choices: [
      { label: 'Mostrar um plano com metas', flag: 'Apresentou um plano de carreira para a família',
        after: [['narr', 'Você escreve metas para seis meses e um ano. Seu pai lê duas vezes e guarda a folha na carteira.']] },
      { label: 'Pedir um ano para provar que é sério', flag: 'Combinou um prazo de um ano com a família',
        after: [['narr', 'Vocês combinam: um ano de dedicação, e depois conversam de novo. Sem cobrança no meio do caminho.']] },
      { label: 'Levar seus pais ao seu trabalho', flag: 'Levou os pais para conhecer o trabalho',
        after: [['narr', 'Uma tarde vendo você trabalhar responde perguntas que nenhuma conversa responderia.']] },
    ] },
    b6: { lines: [
      ['narr', 'Domingo à tarde. Seu pai conserta a cerca na frente de casa e faz sinal para você chegar perto.'],
      ['resp', 'Quando você começou, achei que era fase. Me enganei.'],
      ['resp', 'A gente não pode te dar tudo. Mas você mostrou que sabe o que fazer com o que tem.'],
      ['narr', 'Você aprendeu a escolher — e a bancar as próprias escolhas.'],
    ] },
  },

  /* ------------------------------------------------------------------ */
  rico: {
    b1: { lines: [
      ['resp', 'Bom dia, {nome}. O café está servido na sala.'],
      ['resp', 'Seu pai ainda não se conformou. Ele imaginava você no escritório da família, e não em {oficio}.'],
      ['resp', 'Mas hoje é o seu primeiro dia. Vá, e volte para me contar.'],
    ] },
    b2: { lines: [
      ['narr', 'A carruagem da família está à sua disposição. Chegar ao trabalho nela, porém, chama a atenção de todos.'],
      ['resp', 'O cocheiro pode levar você todos os dias, se quiser.'],
    ], choices: [
      { label: 'Ir a pé, como todo mundo', flag: 'Vai a pé para o trabalho, como os colegas',
        after: [['narr', 'No caminho, você cumprimenta moradores que nunca tinha visto de perto.']] },
      { label: 'Aceitar e oferecer carona aos colegas', flag: 'Divide a carruagem com os colegas de trabalho',
        after: [['narr', 'O que era privilégio vira condução de todo mundo. O cocheiro passa a gostar da bagunça.']] },
      { label: 'Descer uma rua antes', flag: 'Ainda está aprendendo a lidar com o que tem',
        after: [['narr', 'Você desce antes da esquina. Não resolve nada, mas hoje é o que você consegue.']] },
    ] },
    b3: { lines: [
      ['resp', 'Dinheiro nunca foi problema nesta casa, você sabe.'],
      ['resp', 'Seu pai disse que paga o que você quiser, desde que você largue esse trabalho. Eu disse a ele que a decisão é sua.'],
      ['narr', 'Você entende melhor a realidade da sua casa: recursos não faltam, mas vêm junto com um caminho já traçado.'],
    ], choices: [
      { label: 'Viver só do que ganha no trabalho', flag: 'Decidiu viver só do próprio trabalho',
        after: [['narr', 'É a primeira vez que cada moeda no seu bolso tem uma história. Elas pesam diferente.']] },
      { label: 'Aceitar a mesada e investir no ofício', flag: 'Usa a mesada para melhorar o lugar onde trabalha', coins: 15,
        after: [['narr', 'Você compra ferramentas novas para todo mundo usar. Ninguém pergunta de onde vieram.']] },
      { label: 'Pedir uma conversa com o pai', flag: 'Abriu o jogo com o pai sobre o trabalho',
        after: [['narr', 'A conversa é longa e não termina em acordo. Mas agora ele sabe — e isso já muda alguma coisa.']] },
    ] },
    b4: { lines: [
      ['narr', 'Jantar com os sócios do seu pai. Alguém se vira para você, sorrindo: "E você? Ainda brincando de trabalhar?"'],
      ['narr', 'A mesa inteira espera a resposta.'],
    ], choices: [
      { label: 'Responder com orgulho do que faz', flag: 'Defendeu o próprio trabalho em público',
        after: [['narr', 'Silêncio curto. Depois uma das sócias pergunta, com interesse real, como é o seu dia. Seu pai escuta calado.']] },
      { label: 'Desconversar e falar com o pai depois', flag: 'Preferiu conversar com o pai em particular',
        after: [['narr', 'Você sorri e muda de assunto. Mais tarde, bate na porta do escritório dele: "Podemos conversar?"']] },
      { label: 'Convidar a pessoa para ver seu trabalho', flag: 'Convidou os sócios do pai para conhecer o trabalho',
        after: [['narr', '"Passe lá amanhã." Ninguém esperava o convite. Um deles aparece de verdade.']] },
    ] },
    b5: { lines: [
      ['narr', 'No trabalho, alguém comenta: "Para você é fácil. Se der errado, sua família resolve."'],
      ['narr', 'Dói — porque em parte é verdade, e em parte não é.'],
      ['resp', 'Você chegou diferente hoje. Aconteceu alguma coisa?'],
    ], choices: [
      { label: 'Fazer um trabalho sem nada da família', flag: 'Fez um trabalho sem contatos nem dinheiro da família',
        after: [['narr', 'Sem indicação, sem ferramenta cara. O resultado é simples — e inteiramente seu.']] },
      { label: 'Compartilhar o que tem com os colegas', flag: 'Abriu a casa e os recursos para os colegas',
        after: [['narr', 'Você empresta livros, espaço e ferramentas. O que era só seu passa a servir a todos.']] },
      { label: 'Conversar com quem falou', flag: 'Ouviu um colega e entendeu outra realidade',
        after: [['narr', 'Vocês conversam no intervalo. Você ouve mais do que fala, e os dois saem diferentes.']] },
    ] },
    b6: { lines: [
      ['narr', 'Sua mãe te espera no jardim, com duas xícaras de chá.'],
      ['resp', 'Seu pai ainda não entende. Mas ontem ele perguntou como você estava indo. Isso, vindo dele, é muito.'],
      ['resp', 'Você podia ter seguido o caminho pronto. Escolheu construir o seu.'],
      ['narr', 'Você teve portas abertas — e descobriu que atravessá-las ainda dependia de você.'],
    ] },
  },
};
