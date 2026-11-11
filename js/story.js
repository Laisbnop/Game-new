/* História da família. Cada contexto tem os mesmos seis capítulos, com
   situações e escolhas diferentes. Nenhuma escolha é "errada": todas dão a
   mesma recompensa e mudam apenas o rumo da história (flags + diário).

   Marcadores no texto: {nome} = nome do jogador · {trilha} = trilha escolhida.
   Quem fala: 'narr' (narração), 'resp' (responsável), 'ori' (Mestre Ori). */

const STORY_BEATS = [
  { id: 'b1', at: 0,  title: 'Voltando para casa' },
  { id: 'b2', at: 1,  title: 'Onde estudar' },
  { id: 'b3', at: 3,  title: 'Conversa sobre dinheiro', reveals: true },
  { id: 'b4', at: 5,  title: 'Um imprevisto' },
  { id: 'b5', at: 8,  title: 'O que esperam de você' },
  { id: 'b6', at: 11, title: 'Um passo adiante' },
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
      ['narr', 'A rua de terra termina na sua casa. É pequena, de tijolo à vista, com a horta que sua mãe cuida e a roupa secando no varal.'],
      ['resp', 'Chegou, {nome}! Guardei seu prato no fogão.'],
      ['resp', 'Amanhã pego turno dobrado, então é você quem leva seu irmão na escola cedo, combinado?'],
      ['resp', 'E essa história de {trilha}... Gostei de ver seu olho brilhando. Depois me conta tudo.'],
    ] },
    b2: { lines: [
      ['narr', 'Em casa não tem computador, e o pacote de dados do celular é dividido com a família inteira.'],
      ['resp', 'A biblioteca do bairro tem computador de graça e fica aberta até as oito. O ônibus passa de hora em hora.'],
      ['resp', 'Não é o ideal, eu sei. Mas a gente dá um jeito. Como você prefere fazer?'],
    ], choices: [
      { label: 'Ir à biblioteca depois da aula', flag: 'Estuda na biblioteca do bairro',
        after: [['narr', 'Você decora o horário do ônibus das cinco. A bibliotecária já separa a mesma mesa para você.']] },
      { label: 'Estudar pelo celular, tarde da noite', flag: 'Estuda pelo celular à noite',
        after: [['narr', 'Quando a casa dorme, a internet rende mais. Você aprende a baixar as aulas para ver sem gastar dados.']] },
      { label: 'Pedir o computador de uma vizinha emprestado', flag: 'Usa o computador da vizinha',
        after: [['narr', 'Dona Lúcia empresta o computador duas tardes por semana. Em troca, você a ajuda com as mensagens do celular.']] },
    ] },
    b3: { lines: [
      ['resp', 'Senta aqui um pouco. Vou ser sincera com você: este mês as contas apertaram.'],
      ['resp', 'O seu Antônio da mercearia precisa de alguém à tarde. Paga pouco, mas é certo.'],
      ['resp', 'Não quero que você largue o estudo por causa disso. A decisão é sua, e eu apoio qualquer uma.'],
      ['narr', 'Você entende melhor a realidade da sua casa: o dinheiro é contado, e o seu tempo também vale.'],
    ], choices: [
      { label: 'Aceitar o trabalho à tarde', flag: 'Trabalha à tarde na mercearia', income: 12, incomeLabel: 'salário da mercearia',
        after: [['narr', 'Agora você estuda antes e depois do trabalho. O tempo fica curto, mas o salário é seu — e parte dele ajuda em casa.']] },
      { label: 'Trabalhar só aos sábados', flag: 'Trabalha aos sábados na mercearia', income: 5, incomeLabel: 'salário dos sábados',
        after: [['narr', 'Seu Antônio topa. Os dias de semana continuam livres para estudar, e o sábado vira dia de balcão.']] },
      { label: 'Focar nos estudos e ajudar em casa', flag: 'Cuida da casa e do irmão para a mãe trabalhar',
        after: [['narr', 'Você assume a janta e o dever de casa do seu irmão. Sua mãe pega mais um turno com a cabeça tranquila.']] },
    ] },
    b4: { lines: [
      ['narr', 'Dia de avaliação no curso. O ônibus quebra no meio do caminho, e o próximo só passa em uma hora.'],
      ['narr', 'Não é culpa sua, mas o problema é seu para resolver. O que você faz?'],
    ], choices: [
      { label: 'Seguir a pé', flag: 'Andou quarenta minutos para não perder a avaliação',
        after: [['narr', 'Você chega com atraso e suando, mas chega. A professora deixa você terminar no intervalo.']] },
      { label: 'Pedir carona a um vizinho', flag: 'Aprendeu a pedir ajuda quando precisa',
        after: [['narr', 'Seu Zé passa de moto e te deixa na porta. Pedir ajuda custou menos do que você imaginava.']] },
      { label: 'Avisar a professora e pedir outra data', flag: 'Negociou uma nova data de avaliação',
        after: [['narr', 'Você manda mensagem explicando. Ela remarca para quinta e agradece o aviso.']] },
    ] },
    b5: { lines: [
      ['resp', 'Ninguém da nossa família seguiu por {trilha}. Tenho medo de você se frustrar...'],
      ['resp', '...mas tenho mais medo ainda de você não tentar.'],
      ['resp', 'A sua professora falou de uma bolsa de estudos. A inscrição é trabalhosa. O que você acha?'],
    ], choices: [
      { label: 'Fazer a inscrição para a bolsa', flag: 'Está concorrendo a uma bolsa de estudos',
        after: [['narr', 'São formulários, comprovantes e uma redação. Rosa te ajuda a juntar os papéis na mesa da cozinha.']] },
      { label: 'Continuar com os cursos gratuitos', flag: 'Segue por cursos gratuitos, no próprio ritmo',
        after: [['narr', 'Você monta sua própria grade com aulas abertas. Demora mais, mas cada etapa é conquista sua.']] },
      { label: 'Juntar dinheiro para pagar aos poucos', flag: 'Está guardando dinheiro para um curso', coins: 15,
        after: [['narr', 'Você separa um pote só para isso. Rosa coloca a primeira moeda sem dizer nada.']] },
    ] },
    b6: { lines: [
      ['narr', 'Fim de tarde. Sua mãe está na porta, olhando você chegar pela rua de terra.'],
      ['resp', 'Lembra do dia em que você chegou falando de {trilha}? Olha só o quanto você já andou.'],
      ['resp', 'Não foi sorte, viu. Foi você, um dia de cada vez.'],
      ['narr', 'A trilha continua. O caminho foi mais apertado em alguns trechos — e você passou por todos.'],
    ] },
  },

  /* ------------------------------------------------------------------ */
  media: {
    b1: { lines: [
      ['narr', 'Sua casa é um sobrado numa rua tranquila. O carro da família, com dez anos de uso, está na frente como sempre.'],
      ['resp', 'Chegou! Jantar em vinte minutos.'],
      ['resp', 'Sua mãe está fechando a planilha do mês, então hoje não é dia de pedir nada, hein?'],
      ['resp', 'E essa história de {trilha}? Quero ouvir direito durante o jantar.'],
    ] },
    b2: { lines: [
      ['narr', 'Sua casa tem um computador — um só, para todos. Sua irmã precisa dele toda noite para a faculdade.'],
      ['resp', 'Vocês dois vão ter que se entender com o horário. Eu não vou ficar de juiz.'],
    ], choices: [
      { label: 'Combinar horários fixos com sua irmã', flag: 'Divide o computador com a irmã em horários combinados',
        after: [['narr', 'Vocês colam uma tabela na geladeira. Nas terças ela cede uma hora a mais; nos domingos, você.']] },
      { label: 'Acordar mais cedo e estudar antes da escola', flag: 'Estuda de manhã cedo, antes da escola',
        after: [['narr', 'Seis da manhã, casa em silêncio, o computador é todo seu. O sono reclama nos primeiros dias.']] },
      { label: 'Usar o laboratório da escola', flag: 'Estuda no laboratório da escola',
        after: [['narr', 'O laboratório fica aberto depois da aula. Você descobre que mais duas pessoas da sua turma fazem o mesmo.']] },
    ] },
    b3: { lines: [
      ['resp', 'Sua mãe e eu olhamos o orçamento. Dá para pagar um curso para você. Um.'],
      ['resp', 'Se for o de {trilha}, o inglês precisa sair. Os dois juntos não cabem.'],
      ['resp', 'Sua mesada continua a mesma. É pouco, mas é sua para administrar.'],
      ['narr', 'Você entende melhor a realidade da sua casa: nada falta, e nada sobra. Cada escolha tem um preço.'],
    ], choices: [
      { label: 'Trocar o inglês pelo curso de {trilha}', flag: 'Trocou o inglês pelo curso da trilha', income: 8, incomeLabel: 'mesada',
        after: [['narr', 'Você se despede da turma de inglês. Promete a si que retoma quando puder pagar do próprio bolso.']] },
      { label: 'Manter o inglês e estudar {trilha} por conta própria', flag: 'Manteve o inglês e estuda a trilha por conta própria', income: 8, incomeLabel: 'mesada',
        after: [['narr', 'Você fica com o inglês e monta um plano com aulas gratuitas para a trilha. Dá mais trabalho organizar.']] },
      { label: 'Propor pagar parte do curso com a mesada', flag: 'Paga parte do próprio curso com a mesada', income: 4, incomeLabel: 'mesada (parte vai para o curso)',
        after: [['narr', 'Seu pai levanta a sobrancelha, depois sorri. Vocês fecham o acordo: você fica com os dois cursos e metade da mesada.']] },
    ] },
    b4: { lines: [
      ['narr', 'O carro quebrou. O conserto levou a reserva do mês, e o material que você precisava vai atrasar.'],
      ['resp', 'Sinto muito. Mês que vem a gente vê isso, prometo.'],
    ], choices: [
      { label: 'Oferecer parte das suas economias', flag: 'Ajudou no conserto do carro com as economias', coins: -8,
        after: [['narr', 'Seu pai não quer aceitar. Sua mãe aceita por ele, e te dá um abraço demorado.']] },
      { label: 'Vender algo que você não usa mais', flag: 'Vendeu o videogame antigo para comprar material', coins: 20,
        after: [['narr', 'O videogame antigo vai para um novo dono. Com o dinheiro, você mesmo resolve o material.']] },
      { label: 'Adaptar com o que já tem', flag: 'Aprendeu a se virar com materiais gratuitos',
        after: [['narr', 'Você troca o material por versões gratuitas e emprestadas. Não é igual, mas funciona.']] },
    ] },
    b5: { lines: [
      ['resp', 'Seu tio acha que você devia escolher uma carreira "mais segura". Eu não sei se concordo com ele.'],
      ['resp', 'Mas preciso perguntar: você já pensou no que faz se {trilha} não der certo de primeira?'],
    ], choices: [
      { label: 'Montar um plano com metas e mostrar', flag: 'Apresentou um plano de carreira para a família',
        after: [['narr', 'Você escreve metas para seis meses e um ano. Seu pai lê duas vezes e guarda a folha na carteira.']] },
      { label: 'Pedir um ano para provar que é sério', flag: 'Combinou um prazo de um ano com a família',
        after: [['narr', 'Vocês combinam: um ano de dedicação, e depois conversam de novo. Sem cobrança no meio do caminho.']] },
      { label: 'Levar seus pais para conhecer alguém da área', flag: 'Apresentou um profissional da área aos pais',
        after: [['narr', 'Uma hora de conversa com quem vive disso responde perguntas que você não conseguiria responder por conta própria.']] },
    ] },
    b6: { lines: [
      ['narr', 'Domingo à tarde. Seu pai lava o carro na frente de casa e faz sinal para você chegar perto.'],
      ['resp', 'Quando você falou de {trilha} pela primeira vez, achei que era fase. Me enganei.'],
      ['resp', 'A gente não pode te dar tudo. Mas você mostrou que sabe o que fazer com o que tem.'],
      ['narr', 'A trilha continua. Você aprendeu a escolher — e a bancar as próprias escolhas.'],
    ] },
  },

  /* ------------------------------------------------------------------ */
  rico: {
    b1: { lines: [
      ['narr', 'O portão se abre sozinho. A casa é grande, e o jardim é cuidado pelo seu Raimundo, que você conhece desde criança.'],
      ['resp', 'Chegou tarde, {nome}. O motorista disse que você preferiu voltar andando da praça.'],
      ['resp', 'Seu pai ligou do escritório. Quer saber se você já olhou o material do cursinho que ele escolheu.'],
      ['narr', 'Você ainda não contou a eles sobre {trilha}.'],
    ] },
    b2: { lines: [
      ['narr', 'Seu quarto tem um computador novo e tudo o que você precisa para estudar. Sua agenda é que não é sua: inglês, tênis, reforço, tudo decidido por outros.'],
      ['resp', 'Sobra pouco tempo, eu sei. Mas foi tudo pensado para o seu futuro.'],
    ], choices: [
      { label: 'Negociar trocar uma atividade pela trilha', flag: 'Trocou o tênis por tempo para a trilha',
        after: [['narr', 'Você argumenta com calma. O tênis sai da agenda, e duas tardes por semana passam a ser suas.']] },
      { label: 'Estudar à noite, depois de tudo', flag: 'Estuda a trilha à noite, por conta própria',
        after: [['narr', 'Ninguém precisa saber ainda. Depois do jantar, a porta do quarto fecha e a trilha começa.']] },
      { label: 'Pedir ajuda ao professor particular', flag: 'Reorganizou a rotina com ajuda do professor',
        after: [['narr', 'O professor Marcos te ajuda a redesenhar a semana — e conta que também mudou de carreira um dia.']] },
    ] },
    b3: { lines: [
      ['resp', 'Dinheiro para curso nunca foi problema nesta casa, você sabe.'],
      ['resp', 'Mas seu pai paga o curso que ele considera certo. Quando falei de {trilha}, ele chamou de "hobby".'],
      ['resp', 'Sua mesada é sua. O resto... depende de uma conversa que você ainda não teve.'],
      ['narr', 'Você entende melhor a realidade da sua casa: recursos não faltam, mas vêm junto com um caminho já traçado.'],
    ], choices: [
      { label: 'Pagar o curso de {trilha} com a própria mesada', flag: 'Paga o curso da trilha com a própria mesada', income: 10, incomeLabel: 'mesada (parte vai para o curso)',
        after: [['narr', 'É a primeira coisa na sua vida que você paga por conta própria. O curso passa a ter outro peso.']] },
      { label: 'Buscar um curso gratuito, sem depender deles', flag: 'Escolheu um curso gratuito para não depender dos pais', income: 20, incomeLabel: 'mesada',
        after: [['narr', 'Você quer saber se consegue sem o sobrenome e sem o cartão. Só tem um jeito de descobrir.']] },
      { label: 'Pedir uma conversa séria com os dois', flag: 'Abriu o jogo com os pais sobre a trilha', income: 20, incomeLabel: 'mesada',
        after: [['narr', 'A conversa é longa e não termina em acordo. Mas agora eles sabem — e isso já muda alguma coisa.']] },
    ] },
    b4: { lines: [
      ['narr', 'Jantar com os sócios do seu pai. Alguém se vira para você, sorrindo: "E você? Vai assumir a empresa um dia?"'],
      ['narr', 'A mesa inteira espera a resposta.'],
    ], choices: [
      { label: 'Responder com sinceridade sobre {trilha}', flag: 'Disse em público o que quer seguir',
        after: [['narr', 'Silêncio curto. Depois uma das sócias pergunta, com interesse real, como é a área. Seu pai escuta calado.']] },
      { label: 'Desconversar e falar com seu pai depois', flag: 'Preferiu conversar com o pai em particular',
        after: [['narr', 'Você sorri e muda de assunto. Mais tarde, bate na porta do escritório dele: "Podemos conversar?"']] },
      { label: 'Dizer que ainda está descobrindo', flag: 'Assumiu que ainda está descobrindo o caminho',
        after: [['narr', '"Ainda estou descobrindo." É verdade, e ninguém à mesa tem resposta melhor aos dezessete.']] },
    ] },
    b5: { lines: [
      ['narr', 'No curso, um colega comenta: "Para você é fácil, sua família resolve tudo."'],
      ['narr', 'Dói — porque em parte é verdade, e em parte não é.'],
      ['resp', 'Você chegou diferente hoje. Aconteceu alguma coisa?'],
    ], choices: [
      { label: 'Fazer um projeto sem usar nada da família', flag: 'Fez um projeto sem contatos nem dinheiro da família',
        after: [['narr', 'Sem indicação, sem equipamento caro. O resultado é simples — e inteiramente seu.']] },
      { label: 'Compartilhar o que tem com a turma', flag: 'Abriu a casa e os equipamentos para a turma estudar',
        after: [['narr', 'Você monta um grupo de estudos em casa. O que era privilégio vira recurso de todo mundo.']] },
      { label: 'Conversar com o colega', flag: 'Ouviu um colega e entendeu outra realidade',
        after: [['narr', 'Vocês conversam no intervalo. Você ouve mais do que fala, e os dois saem diferentes.']] },
    ] },
    b6: { lines: [
      ['narr', 'Sua mãe te espera no jardim, com duas xícaras de chá.'],
      ['resp', 'Seu pai ainda não entende {trilha}. Mas ontem ele perguntou como você estava indo. Isso, vindo dele, é muito.'],
      ['resp', 'Você podia ter seguido o caminho pronto. Escolheu construir o seu.'],
      ['narr', 'A trilha continua. Você teve portas abertas — e descobriu que atravessá-las ainda dependia de você.'],
    ] },
  },
};
