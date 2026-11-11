/* Atividades jogáveis: uma para cada missão de cada trilha.

   Cada atividade é uma lista de etapas. Tipos de etapa:
     say    – fala do professor
     pick   – escolha livre (todas as opções valem), fica salva em S.choices
     branch – segue um caminho diferente conforme uma escolha anterior
     q      – uma resposta certa entre as opções (pode mostrar código e saída)
     multi  – marcar o conjunto certo de itens
     order  – colocar itens na ordem certa (escritos aqui já na ordem correta)
     match  – ligar pares
     calc   – responder com um número
     tap    – executar uma ação tocando no botão (o personagem anima)
     robot  – montar uma sequência de comandos e executar
     design – ajustar uma composição até atender ao briefing
     write  – escrever uma frase curta, que fica salva
   Marcadores: {nome}, {trilha}, {c:chave} (escolha ou texto salvo). */

const say = t => ({ k: 'say', say: t });
const pick = (key, t, prompt, opts, confirm) => ({ k: 'pick', key, say: t, prompt, opts, confirm: confirm || 'Confirmar' });
const branch = (key, opts) => ({ k: 'branch', key, opts });
const q = (t, prompt, opts, ans, hint, ok, anim, extra) => Object.assign({ k: 'q', say: t, prompt, opts, ans, hint, ok, anim }, extra);
const multi = (t, prompt, opts, ans, hint, ok, anim) => ({ k: 'multi', say: t, prompt, opts, ans, hint, ok, anim });
const order = (t, prompt, items, hint, ok, anim) => ({ k: 'order', say: t, prompt, items, hint, ok, anim });
const match = (t, prompt, pairs, hint, ok, anim) => ({ k: 'match', say: t, prompt, pairs, hint, ok, anim });
const calc = (t, prompt, ans, hint, ok, anim) => ({ k: 'calc', say: t, prompt, ans, hint, ok, anim });
const tap = (t, prompt, label, n, ok, anim) => ({ k: 'tap', say: t, prompt, label, n, ok, anim });
const robot = (t, prompt, map, max, hint, ok) => ({ k: 'robot', say: t, prompt, map, max, hint, ok, anim: 'run' });
const design = (t, brief, text, props, hint, ok) => ({ k: 'design', say: t, prompt: brief, text, props, hint, ok, anim: 'draw' });
const write = (key, t, prompt, ph, ok, anim) => ({ k: 'write', key, say: t, prompt, ph, ok, anim });

/* Opções visuais do tipo "design". */
const PALETTES = {
  'Azul e branco': ['#1f4e9a', '#ffffff'], 'Vermelho e amarelo': ['#c8281e', '#ffd84a'], 'Verde e creme': ['#2f7a48', '#f6efd8'],
  'Preto e dourado': ['#18141e', '#ffd75e'], 'Marrom e creme': ['#6a4426', '#f6efd8'], 'Rosa e roxo': ['#e870a8', '#3a1a5a'],
  'Cinza sobre cinza': ['#c4c4c4', '#aaaaaa'], 'Amarelo sobre branco': ['#ffffff', '#ffe866'],
};
const FONTS = { 'Pixel divertida': "'Press Start 2P', monospace", 'Serifada elegante': 'Georgia, serif', 'Simples e limpa': 'Arial, sans-serif', 'Manuscrita': "'Comic Sans MS', cursive" };
const dCor = (opts, ok) => ({ name: 'Cores', type: 'cor', opts, ok });
const dFonte = (opts, ok) => ({ name: 'Fonte', type: 'fonte', opts, ok });
const dAlinh = ok => ({ name: 'Alinhamento', type: 'alinh', opts: ['Esquerda', 'Centro', 'Direita'], ok });
const dTam = ok => ({ name: 'Título', type: 'tam', opts: ['Pequeno', 'Grande'], ok });
const dEsp = ok => ({ name: 'Espaço', type: 'esp', opts: ['Tudo apertado', 'Com respiro'], ok });

const TEACHERS = {
  chef:   { name: 'Chef Dandara',   room: 'Cozinha do Reino',  look: { body: 'f', skin: 's5', hair: 'crespo',   hairColor: 'preto',    outfit: ['#f4f4f4', '#3a3a4a'], hat: 'chef' } },
  dev:    { name: 'Professor Kenji', room: 'Guilda dos Códigos', look: { body: 'n', skin: 's2', hair: 'careca',   hairColor: 'preto',    outfit: ['#3a4a6a', '#2a2a3a'] } },
  design: { name: 'Professora Íris', room: 'Ateliê das Cores',  look: { body: 'f', skin: 's3', hair: 'ondulado', hairColor: 'rosa',     outfit: ['#f2c53d', '#5a3a7a'] } },
  saude:  { name: 'Enfermeira Bia',  room: 'Casa da Cura',      look: { body: 'f', skin: 's4', hair: 'trancas',  hairColor: 'castanho', outfit: ['#e8f4f4', '#4a8ab8'] } },
  prof:   { name: 'Professor Paulo', room: 'Escola da Vila',    look: { body: 'm', skin: 's6', hair: 'crespo',   hairColor: 'grisalho', outfit: ['#5aa84e', '#6a5038'] } },
  empre:  { name: 'Dona Marta',      room: 'Mercado Central',   look: { body: 'f', skin: 's1', hair: 'cacheado', hairColor: 'ruivo',    outfit: ['#8a5ad9', '#3a3a4a'] } },
};

const ACTIVITIES = {
  /* ================================================================== */
  chef: [[
    { title: 'Escolha um curso de culinária e faça a primeira aula',
      intro: 'Toda cozinha começa por uma primeira aula. Na Cozinha do Reino há dois cursos para iniciantes: escolha um, faça a matrícula e participe da aula.',
      done: 'Você se matriculou em "{c:curso}" e concluiu a primeira aula: separou os ingredientes, organizou o preparo e cozinhou.',
      steps: [
        pick('curso', 'Que bom ter você aqui, {nome}! Temos duas turmas abertas para iniciantes.', 'Escolha o seu curso', [
          ['Culinária do dia a dia', 'Receitas simples e fundamentos da cozinha: cortes, refogados e ponto de cozimento.'],
          ['Introdução à confeitaria', 'Medidas exatas, preparo de massas e as primeiras receitas de doces.']], 'Confirmar matrícula'),
        branch('curso', [[
          multi('Matrícula feita! Nossa primeira receita é arroz soltinho. Separe o que vamos usar.', 'Escolha os 4 ingredientes do arroz',
            ['Arroz', 'Açúcar', 'Alho', 'Óleo', 'Canela', 'Água quente', 'Leite condensado'], [0, 2, 3, 5],
            'Arroz branco leva arroz, alho, óleo e água quente. Os doces ficam para outra aula.', 'Isso! Separar tudo antes de acender o fogo tem nome: mise en place.', 'pick'),
          order('Agora, a ordem do preparo.', 'Monte o passo a passo',
            ['Aquecer o óleo e dourar o alho', 'Juntar o arroz e refogar', 'Colocar a água quente e o sal', 'Tampar e cozinhar em fogo baixo', 'Desligar e deixar descansar'],
            'Primeiro vem o refogado, depois a água. O descanso é sempre o último passo.', 'Perfeito. Refogar antes de pôr a água é o que deixa o grão soltinho.'),
          tap('Sua vez no fogão. Mexa o refogado para o alho não queimar.', 'Mexa a panela', 'Mexer', 5, 'Sente o cheiro? O alho dourou sem queimar.', 'stir'),
          q('A água secou. E agora?', 'Qual é a próxima ação?', ['Mexer bastante para soltar', 'Desligar, tampar e esperar 5 minutos', 'Colocar mais dois copos de água'], 1,
            'Mexer o arroz pronto quebra os grãos, e mais água deixa empapado.', 'Exato: com a panela tampada, o vapor termina o cozimento. Seu primeiro arroz está pronto!', 'plate'),
        ], [
          multi('Matrícula feita! Vamos começar por um brigadeiro de colher. Separe os ingredientes.', 'Escolha os 3 ingredientes do brigadeiro',
            ['Leite condensado', 'Sal grosso', 'Chocolate em pó', 'Manteiga', 'Alho', 'Vinagre'], [0, 2, 3],
            'Brigadeiro leva leite condensado, chocolate em pó e manteiga.', 'Isso! Em confeitaria a gente pesa e separa tudo antes de começar.', 'pick'),
          calc('Confeitaria é medida exata. A receita pede 2 colheres de chocolate para cada lata de leite condensado. Hoje vamos usar 3 latas.', 'Quantas colheres de chocolate?', 6,
            'Multiplique: 2 colheres × 3 latas.', 'São 6 colheres. Proporção certa é metade do doce.'),
          order('Agora, a ordem do preparo.', 'Monte o passo a passo',
            ['Colocar tudo na panela ainda fria', 'Levar ao fogo baixo', 'Mexer sem parar', 'Desligar quando soltar do fundo', 'Passar para um prato e esfriar'],
            'A mistura entra na panela fria, e o prato é sempre o último passo.', 'Isso mesmo. Fogo baixo e paciência.'),
          tap('Agora mexa sem parar, raspando bem o fundo.', 'Mexa o brigadeiro', 'Mexer', 6, 'Viu a colher abrir um caminho no fundo da panela? É o ponto. Seu primeiro doce está pronto!', 'stir'),
        ]]),
      ] },
    { title: 'Aprenda os cortes básicos',
      intro: 'Antes de cozinhar, é preciso saber cortar com segurança. A Chef Dandara vai mostrar os cortes básicos e você vai praticar na bancada.',
      done: 'Você aprendeu para que serve cada corte, como proteger os dedos e cortou uma cenoura inteira em rodelas.',
      steps: [
        match('Cada corte tem um uso. Ligue o corte ao prato em que ele funciona melhor.', 'Ligue os pares', [
          ['Cubos pequenos', 'Legumes para sopa'], ['Rodelas', 'Cenoura para salada'], ['Tiras finas', 'Pimentão para refogar']],
          'Pense no formato que você vê no prato pronto.', 'Isso! O corte muda o tempo de cozimento e a aparência do prato.'),
        q('Segurança primeiro.', 'Como segurar o alimento ao cortar?', ['Dedos esticados na frente da lâmina', 'Dedos dobrados em garra, com a faca guiada pelos nós', 'De qualquer jeito, bem rápido'], 1,
          'Dedos esticados ficam no caminho da faca. Pressa também não ajuda.', 'Mão em garra: as pontas dos dedos ficam protegidas.'),
        tap('Agora pratique: corte a cenoura em rodelas do mesmo tamanho.', 'Corte a cenoura', 'Cortar', 6, 'Rodelas iguais cozinham por igual. Belo trabalho!', 'chop'),
      ] },
    { title: 'Prepare uma receita seguindo tudo à risca',
      intro: 'Hoje você prepara uma omelete seguindo a receita exatamente como está escrita, sem pular nem inventar etapas.',
      done: 'Você preparou uma omelete do começo ao fim seguindo a receita: ingredientes certos, ordem certa e fogo baixo.',
      steps: [
        multi('A receita de hoje é omelete de queijo.', 'Escolha os 4 ingredientes', ['Ovos', 'Sal', 'Manteiga', 'Queijo', 'Farinha de rosca', 'Suco de laranja'], [0, 1, 2, 3],
          'Omelete de queijo: ovos, sal, manteiga e queijo.', 'Tudo na bancada.', 'pick'),
        order('Leia a receita e organize as etapas.', 'Monte o passo a passo', ['Bater os ovos com o sal', 'Derreter a manteiga em fogo baixo', 'Despejar os ovos na frigideira', 'Colocar o queijo e dobrar', 'Servir'],
          'Os ovos são batidos antes de a frigideira esquentar.', 'Ordem certa.'),
        tap('Bata os ovos até ficarem uniformes.', 'Bata os ovos', 'Bater', 5, 'Bem batidos, sem pedaços de clara.', 'mix'),
        q('A receita diz "fogo baixo". Você está com pressa.', 'O que você faz?', ['Aumenta o fogo para terminar logo', 'Segue a receita: fogo baixo', 'Desliga o fogo'], 1,
          'Fogo alto queima por fora e deixa cru por dentro.', 'Seguir à risca valeu: a omelete ficou macia e dourada.', 'plate'),
      ] },
  ], [
    { title: 'Conclua um módulo do seu curso',
      intro: 'É hora de fechar um módulo inteiro do curso em que você se matriculou.',
      done: 'Você concluiu um módulo inteiro do curso "{c:curso}".',
      steps: [
        branch('curso', [[
          match('Módulo de métodos de cozimento. Ligue cada método à sua descrição.', 'Ligue os pares', [
            ['Refogar', 'Pouca gordura, mexendo sempre'], ['Cozinhar', 'Em água ou caldo'], ['Assar', 'No forno, com calor seco'], ['Fritar', 'Mergulhado em gordura quente']],
            'Pense em onde o alimento fica: na panela, na água, no forno ou no óleo.', 'Com esses quatro métodos você faz quase qualquer receita.'),
          q('Um legume duro, como a batata, precisa ficar macio por dentro.', 'Qual método usar primeiro?', ['Cozinhar em água', 'Fritar direto em fogo alto', 'Servir cru'], 0,
            'Em fogo alto ela queima por fora antes de amaciar por dentro.', 'Cozinhar primeiro garante o ponto por dentro.'),
        ], [
          calc('Módulo de massas. A receita de um bolo pede 2 xícaras de farinha. Vamos fazer 2 bolos.', 'Quantas xícaras de farinha?', 4, 'Dobre a receita: 2 × 2.', 'Quatro xícaras. Dobrar uma receita é dobrar tudo.'),
          order('Agora o preparo do bolo.', 'Monte o passo a passo', ['Preaquecer o forno', 'Misturar os ingredientes secos', 'Juntar ovos, leite e óleo', 'Levar ao forno', 'Testar com um palito'],
            'O forno precisa estar quente quando a massa ficar pronta.', 'Ordem certa.'),
        ]]),
        tap('Para fechar o módulo, coloque a receita no forno.', 'Leve ao forno e acompanhe', 'Assar', 4, 'Módulo concluído, e a cozinha está cheirosa.', 'bake'),
      ] },
    { title: 'Domine um molho-base e um ponto de cozimento',
      intro: 'Molho de tomate e macarrão no ponto: duas bases que aparecem em dezenas de receitas.',
      done: 'Você fez um molho de tomate do zero e acertou o ponto do macarrão.',
      steps: [
        multi('Molho de tomate caseiro.', 'Escolha os 4 ingredientes', ['Tomate', 'Cebola', 'Alho', 'Azeite', 'Chocolate', 'Canela'], [0, 1, 2, 3],
          'O molho-base leva tomate, cebola, alho e azeite.', 'Ingredientes simples, sabor de verdade.', 'pick'),
        tap('Mexa o molho enquanto ele reduz.', 'Mexa o molho', 'Mexer', 5, 'O molho engrossou e perdeu a acidez.', 'stir'),
        q('Agora o macarrão.', 'O que significa "al dente"?', ['Macio por fora e firme ao morder', 'Desmanchando', 'Ainda cru no meio'], 0,
          'Al dente fica entre os dois extremos.', 'Isso: cozido, mas com resistência ao morder.'),
        calc('O pacote indica 9 minutos. Para ficar al dente, tire 1 minuto antes.', 'Quantos minutos de cozimento?', 8, 'Tempo do pacote menos 1 minuto.', 'Oito minutos. Molho e macarrão no ponto!', 'plate'),
      ] },
    { title: 'Cozinhe uma refeição completa para outra pessoa',
      intro: 'Cozinhar para alguém é pensar em quem vai comer e em como tudo chega quente à mesa ao mesmo tempo.',
      done: 'Você planejou um cardápio pensando na convidada, organizou os tempos e serviu a refeição completa.',
      steps: [
        q('Sua convidada de hoje não come carne.', 'Qual refeição você prepara?', ['Arroz, feijão, omelete e salada', 'Arroz, bife e salada', 'Só macarrão com salsicha'], 0,
          'Confira cada item: algum deles tem carne?', 'Completa e sem carne. Cozinhar começa por ouvir quem vai comer.'),
        order('Tudo precisa ficar pronto junto.', 'Em que ordem você começa cada preparo?', ['Colocar o feijão para cozinhar', 'Fazer o arroz', 'Preparar a salada', 'Fazer a omelete'],
          'Comece pelo que demora mais. O que esfria rápido fica para o fim.', 'Bom planejamento: tudo chega quente à mesa.', 'stir'),
        tap('Monte os pratos com capricho.', 'Sirva a refeição', 'Servir', 3, 'Ela repetiu o prato. Missão cumprida!', 'plate'),
      ] },
  ], [
    { title: 'Crie uma receita sua',
      intro: 'Chegou a hora de criar: você escolhe a base, batiza a receita e escreve do jeito certo para outra pessoa conseguir repetir.',
      done: 'Você criou a receita "{c:receita}" e a registrou com ingredientes, medidas e passo a passo.',
      steps: [
        pick('base', 'Toda receita autoral começa por uma base que você já domina.', 'Qual será a base da sua receita?', [
          ['Sanduíche quente', 'Pão, recheio e chapa.'], ['Salada de macarrão', 'Massa fria com legumes.'], ['Vitamina de frutas', 'Frutas batidas com leite.']]),
        write('receita', 'Boa escolha. Toda criação merece um nome.', 'Dê um nome à sua receita', 'Ex.: Sanduíche da madrugada', 'Gostei do nome!'),
        multi('Para outra pessoa conseguir repetir, a receita precisa estar bem escrita.', 'O que não pode faltar? Marque 3', ['Ingredientes com quantidades', 'Passo a passo em ordem', 'Tempo e rendimento', '"Um pouco de tudo"', 'Um segredo que ninguém pode saber'], [0, 1, 2],
          'Quem lê precisa saber quanto usar, o que fazer e quanto rende.', 'Receita bem escrita é receita que dá certo na cozinha de qualquer pessoa.'),
        tap('Agora prepare a sua criação.', 'Prepare a receita', 'Preparar', 5, '"{c:receita}" saiu do papel!', 'mix'),
      ] },
    { title: 'Calcule o custo de um prato',
      intro: 'Quem cozinha para vender precisa saber quanto custa cada porção. Vamos fazer essa conta.',
      done: 'Você somou os ingredientes, dividiu pelas porções e entendeu por que o preço precisa ser maior que o custo.',
      steps: [
        calc('Frango com legumes para 4 porções: arroz R$ 4, frango R$ 16 e legumes R$ 8.', 'Quanto custam os ingredientes ao todo? (R$)', 28, 'Some: 4 + 16 + 8.', 'R$ 28 no total.', 'count'),
        calc('Agora divida pelas 4 porções.', 'Quanto custa cada porção? (R$)', 7, 'Divida 28 por 4.', 'R$ 7 por porção.'),
        q('E se você vender cada porção por R$ 7?', 'O que acontece?', ['Tem bastante lucro', 'Não sobra nada: faltam gás, embalagem e o seu trabalho', 'O cliente paga a mais'], 1,
          'Compare o preço com o custo dos ingredientes: sobra alguma coisa?', 'Isso. O preço precisa cobrir os ingredientes, os outros gastos e o seu tempo.'),
      ] },
    { title: 'Peça opiniões sobre um prato e melhore-o',
      intro: 'Três pessoas vão provar o seu prato. Ouvir a crítica e ajustar faz parte do ofício.',
      done: 'Você ouviu três opiniões, entendeu o que cada uma pedia e ajustou o prato.',
      steps: [
        match('As opiniões chegaram. Ligue cada comentário ao ajuste certo.', 'Ligue os pares', [
          ['"Está sem gosto"', 'Ajustar o sal e o tempero'], ['"Está seco"', 'Diminuir o tempo de forno'], ['"Está doce demais"', 'Reduzir o açúcar']],
          'Pense no que causa cada problema.', 'Você traduziu as críticas em ações.'),
        q('Duas das três pessoas acharam o prato salgado.', 'O que você faz?', ['Ignora: a terceira gostou', 'Reduz o sal e prova de novo', 'Desiste da receita'], 1,
          'Quando a maioria aponta o mesmo problema, vale ajustar.', 'Ajustar e provar de novo: é assim que um prato melhora.'),
        tap('Refaça o prato com o ajuste.', 'Cozinhe a nova versão', 'Mexer', 4, 'Desta vez, os três aprovaram.', 'stir'),
      ] },
  ], [
    { title: 'Monte um cardápio de 5 pratos',
      intro: 'Um cardápio pequeno e variado mostra o que você sabe fazer. Vamos montar o seu.',
      done: 'Você montou um cardápio variado com entrada, pratos e sobremesa, e aprendeu a fotografar um prato.',
      steps: [
        multi('Um bom cardápio tem variedade e nada repetido.', 'Escolha os 5 itens do cardápio', ['Entrada: salada', 'Prato: frango grelhado', 'Prato: macarrão ao molho', 'Prato vegetariano: omelete de legumes', 'Sobremesa: brigadeiro de colher', 'Macarrão ao molho (de novo)', 'Mais um frango grelhado'], [0, 1, 2, 3, 4],
          'Fique com os cinco itens diferentes; os repetidos saem.', 'Entrada, três pratos e sobremesa: tem opção para todo mundo.'),
        q('Agora as fotos do cardápio.', 'Qual é a melhor forma de fotografar um prato?', ['Com luz natural, perto da janela', 'Com flash, no escuro', 'De longe, com a mão tremendo'], 0,
          'A comida precisa parecer tão boa quanto é.', 'Luz natural mostra as cores de verdade.', 'plate'),
      ] },
    { title: 'Estude higiene e manipulação de alimentos',
      intro: 'Comida boa é comida segura. Estas regras protegem quem come o que você prepara.',
      done: 'Você revisou as regras de higiene: mãos limpas, utensílios separados e conservação correta.',
      steps: [
        match('Cada alimento pede um cuidado.', 'Ligue os pares', [['Carne crua', 'Tábua e faca separadas'], ['Sobras', 'Geladeira em até 2 horas'], ['Frutas e verduras', 'Lavar em água corrente']],
          'Pense no risco de cada um: contaminar, estragar ou estar sujo.', 'Regras simples que evitam muita dor de barriga.'),
        q('O frango está congelado.', 'Qual é a forma segura de descongelar?', ['Na geladeira', 'Na pia, o dia todo', 'No sol'], 0,
          'Fora da geladeira, as bactérias se multiplicam rápido.', 'Na geladeira ele descongela sem sair da temperatura segura.'),
        tap('Antes de qualquer preparo, lave bem as mãos.', 'Lave as mãos', 'Esfregar', 5, 'Palmas, dorso, entre os dedos e unhas. Mãos limpas!', 'wash'),
      ] },
    { title: 'Venda a sua primeira encomenda',
      intro: 'Chegou um pedido de verdade: 20 docinhos para uma festa. Hora de calcular, organizar e entregar.',
      done: 'Você calculou o valor e o lucro, organizou a produção e entregou sua primeira encomenda.',
      steps: [
        calc('A cliente pediu 20 docinhos. Você vende cada um por R$ 2.', 'Quanto você vai receber? (R$)', 40, 'Multiplique: 20 × 2.', 'R$ 40 pelo pedido.', 'count'),
        calc('Cada docinho custa R$ 1 para fazer.', 'Qual é o seu lucro? (R$)', 20, 'Recebe R$ 40 e gasta 20 × R$ 1.', 'R$ 20 de lucro.'),
        order('Agora organize a encomenda.', 'Monte o passo a passo', ['Confirmar o pedido e a data', 'Comprar os ingredientes', 'Preparar no dia', 'Embalar com cuidado', 'Entregar e agradecer'],
          'Confirme antes de gastar, e entregue por último.', 'Encomenda organizada.'),
        tap('Mãos à obra.', 'Prepare os docinhos', 'Mexer', 5, 'Entregue no horário! A cliente já pediu seu contato para a próxima festa.', 'stir'),
      ] },
  ]],

  /* ================================================================== */
  dev: [[
    { title: 'Escolha um curso de lógica e faça a primeira aula',
      intro: 'Programar começa pela lógica. Na Guilda dos Códigos há dois cursos para iniciantes: escolha um, faça a matrícula e participe da primeira aula.',
      done: 'Você se matriculou em "{c:curso}" e, na primeira aula, deu ordens a um computador e viu o resultado.',
      steps: [
        pick('curso', 'Olá, {nome}! Temos duas turmas para quem está começando.', 'Escolha o seu curso', [
          ['Lógica com blocos', 'Monte programas encaixando comandos visuais, sem digitar código.'],
          ['Lógica com Python', 'Escreva seus primeiros comandos em uma linguagem de verdade.']], 'Confirmar matrícula'),
        branch('curso', [[
          robot('Um programa é uma lista de ordens. O robô faz exatamente o que você mandar, na ordem em que mandar.', 'Monte os comandos para levar o robô até a bandeira', ['S..', '..G'], 4,
            'Conte as casas: duas para a direita e uma para baixo.', 'O robô chegou! Você acabou de escrever um programa.'),
          q('Pense no que acabou de acontecer.', 'Em que ordem o computador executa os comandos?', ['Na ordem que ele achar melhor', 'De cima para baixo, um de cada vez', 'Todos ao mesmo tempo'], 1,
            'O robô fez um movimento por vez, na ordem da lista.', 'Isso se chama sequência: é a base de todo programa.'),
        ], [
          q('Este é o comando mais famoso da programação.', 'O que ele faz?', ['Imprime em papel', 'Mostra a mensagem na tela', 'Apaga o mundo'], 1,
            '"print" exibe um texto na tela.', 'Isso! Veja a saída do programa.', 'run', { code: 'print("Olá, mundo!")', out: 'Olá, mundo!' }),
          order('Agora um programa de três linhas, que cumprimenta alguém pelo nome.', 'Coloque as linhas na ordem certa', ['nome = "Ana"', 'saudacao = "Olá, " + nome', 'print(saudacao)'],
            'Uma variável precisa ser criada antes de ser usada.', 'O computador lê de cima para baixo: primeiro cria, depois usa.'),
          tap('Digite o programa no computador.', 'Digite o código', 'Digitar', 4, 'Na tela: "Olá, Ana". Seu primeiro código funcionou!', 'type'),
        ]]),
      ] },
    { title: 'Escreva o seu primeiro programa',
      intro: 'Agora é com você: um programa que mostra uma mensagem escolhida por você.',
      done: 'Você escreveu e executou seu primeiro programa. Ele mostrou: "{c:msg}".',
      steps: [
        q('Falta um pedaço neste programa.', 'O que entra no lugar de ____ ?', ['falar', 'print', 'mostrar_na_tela'], 1,
          'É o comando que exibe texto na tela.', 'print, sempre ele.', 'type', { code: '____("Olá, mundo!")' }),
        write('msg', 'Agora personalize.', 'Que mensagem o seu programa vai mostrar?', 'Ex.: Olá, vila!', 'Mensagem definida.'),
        tap('Tudo pronto.', 'Execute o programa', 'Executar', 1, 'Na tela: "{c:msg}". É o seu primeiro programa!', 'run'),
      ] },
    { title: 'Resolva três exercícios de lógica',
      intro: 'Três desafios curtos: uma condição, uma repetição e um caminho com obstáculo.',
      done: 'Você resolveu os três exercícios: leu uma condição, contou repetições e programou um caminho com obstáculo.',
      steps: [
        q('Exercício 1: condição.', 'O que este programa mostra?', ['adulto', 'menor', 'Nada'], 1,
          '17 é maior ou igual a 18? Se não for, vale o "else".', 'A condição é falsa, então o programa segue pelo "else".', 'run',
          { code: 'idade = 17\nif idade >= 18:\n    print("adulto")\nelse:\n    print("menor")', out: 'menor' }),
        calc('Exercício 2: repetição.', 'Quantas vezes "oi" aparece na tela?', 3, 'range(3) repete o bloco 3 vezes.', 'Três vezes. Um laço evita escrever a mesma linha várias vezes.', 'run'),
        robot('Exercício 3: há uma parede no caminho.', 'Leve o robô até a bandeira desviando da parede', ['S#G', '...'], 5,
          'Desça, ande duas casas para a direita e suba.', 'Você contornou o obstáculo. É isso que programadores fazem o dia todo.'),
      ] },
  ], [
    { title: 'Conclua o módulo de variáveis e funções',
      intro: 'Um módulo inteiro do curso: os quatro blocos de construção de qualquer programa.',
      done: 'Você concluiu o módulo: sabe o que são variável, função, laço e condição, e leu uma função de verdade.',
      steps: [
        match('Estes quatro conceitos aparecem em todo programa.', 'Ligue cada conceito ao que ele faz', [
          ['Variável', 'Guarda um valor com um nome'], ['Função', 'Bloco de comandos reutilizável'], ['Laço', 'Repete comandos'], ['Condição', 'Escolhe um caminho']],
          'Pense em guardar, reutilizar, repetir e decidir.', 'Com essas quatro peças dá para construir quase tudo.'),
        calc('Leia esta função com calma.', 'Que número aparece na tela?', 8, 'A função devolve x vezes 2, e x vale 4.', 'dobro(4) devolve 8.', 'run'),
        tap('Digite a função e teste com outros números.', 'Digite e teste', 'Digitar', 4, 'dobro(5) deu 10 e dobro(21) deu 42. Módulo concluído!', 'type'),
      ] },
    { title: 'Crie um jogo de adivinhação',
      intro: 'Seu primeiro projeto: o computador sorteia um número e o jogador tenta adivinhar.',
      done: 'Você planejou a lógica, previu as respostas do programa e testou seu jogo de adivinhação.',
      steps: [
        order('Antes de programar, planeje a lógica.', 'Organize os passos do jogo', ['Sortear um número secreto', 'Pedir um palpite ao jogador', 'Comparar o palpite com o segredo', 'Dizer "maior" ou "menor"', 'Repetir até acertar'],
          'O segredo precisa existir antes do primeiro palpite.', 'Isso é um algoritmo: os passos em ordem, antes de qualquer código.'),
        q('O segredo é 5 e o jogador chuta 7.', 'O que o jogo deve responder?', ['"O segredo é maior"', '"O segredo é menor"', '"Acertou!"'], 1,
          '5 é maior ou menor que 7?', 'O segredo é menor que o palpite.'),
        tap('Hora de programar e jogar.', 'Digite o jogo e teste', 'Digitar', 5, 'Você acertou o número em 3 tentativas. O jogo funciona!', 'type'),
      ] },
    { title: 'Publique o seu primeiro projeto',
      intro: 'Código guardado só no seu computador ninguém vê. Vamos publicar o jogo em um repositório.',
      done: 'Você publicou o projeto em um repositório, com uma boa mensagem de commit e sem expor dados sensíveis.',
      steps: [
        order('Publicar tem uma sequência.', 'Organize os passos', ['Criar um repositório', 'Adicionar os arquivos do projeto', 'Escrever uma mensagem de commit', 'Enviar para o repositório', 'Compartilhar o link'],
          'O repositório vem primeiro; o link, por último.', 'Essa é a rotina de quem programa todos os dias.'),
        q('A mensagem de commit conta o que mudou.', 'Qual é a melhor mensagem?', ['"mudanças"', '"Corrige a contagem de tentativas do jogo"', '"asdf"'], 1,
          'Quem lê precisa entender o que foi feito.', 'Clara e específica.'),
        q('Atenção ao que vai para a internet.', 'O que NUNCA deve ser publicado?', ['O código do jogo', 'Um arquivo com a sua senha', 'O texto de apresentação'], 1,
          'Um repositório público pode ser lido por qualquer pessoa.', 'Senhas e chaves ficam fora do repositório. Projeto publicado!', 'run'),
      ] },
  ], [
    { title: 'Construa um projeto que resolva um problema seu',
      intro: 'Os melhores projetos resolvem um problema de verdade. Escolha um problema seu e construa a primeira versão.',
      done: 'Você construiu a primeira versão de "{c:projeto}" com o essencial funcionando.',
      steps: [
        pick('projeto', 'Qual problema do seu dia a dia você quer resolver com código?', 'Escolha o seu projeto', [
          ['Lista de tarefas', 'Para não esquecer o que precisa fazer.'], ['Controle de gastos', 'Para saber para onde vai o dinheiro.'], ['Agenda de estudos', 'Para organizar a semana.']]),
        multi('A primeira versão precisa ser pequena.', 'O que entra na primeira versão? Marque 3', ['Adicionar um item', 'Marcar ou remover um item', 'Ver a lista', 'Login com rede social', 'Modo escuro animado', 'Ranking mundial'], [0, 1, 2],
          'Fique só com o essencial para o projeto ser útil.', 'Pequeno e funcionando vale mais do que grande e pela metade.'),
        order('Agora o caminho da construção.', 'Organize os passos', ['Rabiscar a tela no papel', 'Programar a função principal', 'Testar com dados de verdade', 'Corrigir o que falhou'],
          'Planeje antes de programar e teste antes de corrigir.', 'Um ciclo curto: planejar, fazer, testar e corrigir.'),
        tap('Mãos no teclado.', 'Programe a primeira versão', 'Digitar', 5, '"{c:projeto}" está funcionando. É simples, e é seu.', 'type'),
      ] },
    { title: 'Leia o código de outra pessoa',
      intro: 'Ler código é tão importante quanto escrever. Vamos estudar um trecho feito por outra pessoa.',
      done: 'Você leu um código que não era seu e identificou o que ele faz, o que torna um nome claro e para que serve um comentário.',
      steps: [
        q('Leia com atenção.', 'O que esta função faz?', ['Calcula a média das notas', 'Apaga as notas', 'Ordena as notas'], 0,
          'Ela soma tudo e divide pela quantidade.', 'Somar e dividir pela quantidade é calcular a média.', 'type', { code: 'def media(notas):\n    total = sum(notas)\n    return total / len(notas)' }),
        q('Nomes fazem diferença.', 'Qual nome de variável é mais claro?', ['x1', 'total_de_alunos', 'coisa'], 1,
          'Um bom nome diz o que o valor guarda.', 'Um nome claro dispensa explicação.'),
        q('O código tinha esta linha: # evita divisão por zero', 'Para que serve um comentário?', ['Explicar por que o código existe', 'Deixar o programa mais rápido', 'Esconder erros'], 0,
          'O computador ignora comentários; eles são para pessoas.', 'Comentários explicam o porquê para quem vier depois.'),
      ] },
    { title: 'Receba um teste e corrija um problema',
      intro: 'Uma colega testou o seu projeto e encontrou um erro. Encontrar e corrigir falhas faz parte do trabalho.',
      done: 'Você reproduziu o erro relatado, encontrou a linha com problema e aplicou a correção.',
      steps: [
        q('Ela relata: "Quando deixo o nome em branco, o programa trava."', 'Qual é o primeiro passo?', ['Dizer que no seu computador funciona', 'Repetir o que ela fez para ver o erro', 'Reescrever o projeto inteiro'], 1,
          'Antes de corrigir, é preciso ver o problema acontecer.', 'Reproduzir o erro é sempre o começo.'),
        q('Você reproduziu. Agora leia o código.', 'Onde está o problema?', ['Na linha 1', 'Na linha 2: nome[0] não existe quando o texto está vazio', 'Não há problema'], 1,
          'O que acontece ao pedir a primeira letra de um texto vazio?', 'Achou! Pedir a primeira letra de um texto vazio causa erro.', 'bug', { code: 'nome = input("Nome: ")\nprint("Olá, " + nome[0])' }),
        q('Hora de corrigir.', 'Qual é a melhor correção?', ['Apagar a linha 2', 'Conferir se o nome está vazio antes de usar', 'Proibir a colega de testar'], 1,
          'O programa precisa continuar funcionando para quem digita o nome.', 'Corrigido e testado. Agradeça a quem encontrou o erro!', 'run'),
      ] },
  ], [
    { title: 'Monte um portfólio com seus melhores projetos',
      intro: 'O portfólio é a sua vitrine. Vamos escolher o que mostrar e como apresentar.',
      done: 'Você selecionou seus melhores projetos e montou a apresentação de cada um.',
      steps: [
        multi('Nem tudo o que você fez vai para a vitrine.', 'Escolha os 3 projetos do portfólio', ['Jogo de adivinhação com texto de apresentação', 'Projeto que resolve um problema seu', 'Cópia de um tutorial, sem mudanças', 'Correção de erro com explicação', 'Uma pasta vazia chamada "teste_final_2"'], [0, 1, 3],
          'Mostre o que é seu e está completo.', 'Poucos projetos, bem apresentados.'),
        match('Cada projeto precisa de uma boa apresentação.', 'Ligue cada parte ao que ela mostra', [['Título e resumo', 'O que o projeto faz'], ['Como usar', 'O passo a passo para rodar'], ['Aprendizados', 'O que você descobriu fazendo']],
          'Pense na pergunta que cada parte responde.', 'Quem visitar vai entender em um minuto.'),
        tap('Publique o portfólio.', 'Publique', 'Publicar', 3, 'Seu portfólio está no ar.', 'run'),
      ] },
    { title: 'Atualize o seu currículo',
      intro: 'Um currículo de quem está começando mostra o que a pessoa já fez e aprendeu, com clareza.',
      done: 'Você montou um currículo com projetos, cursos e habilidades, descritos de forma concreta.',
      steps: [
        multi('O que entra no currículo de quem busca a primeira oportunidade?', 'Marque 3', ['Projetos com link', 'Cursos concluídos', 'Signo e time do coração', 'Habilidades que você pratica', 'Foto de festa'], [0, 1, 3],
          'Fique com o que mostra o que você sabe fazer.', 'Direto ao ponto.'),
        q('Agora descreva um projeto.', 'Qual frase é a melhor?', ['"Sei tudo de programação"', '"Criei um controle de gastos em Python e publiquei o código"', '"Tenho muita vontade"'], 1,
          'A melhor frase conta um fato que pode ser conferido.', 'Fatos concretos convencem mais do que adjetivos.', 'type'),
      ] },
    { title: 'Candidate-se a uma vaga de estágio',
      intro: 'Apareceu uma vaga de estágio na Guilda. Vamos ler o anúncio, escrever a mensagem e treinar para a entrevista.',
      done: 'Você analisou a vaga, escreveu uma mensagem de candidatura e treinou a entrevista. Candidatura enviada!',
      steps: [
        q('O anúncio pede: lógica de programação e vontade de aprender. Diferencial: saber usar repositórios.', 'Você deve se candidatar?', ['Não: é melhor esperar dominar tudo', 'Sim: você cumpre o essencial e pode contar o que está aprendendo', 'Só se conhecer alguém lá dentro'], 1,
          'Compare o que a vaga pede com o que você já fez na trilha.', 'Vaga de estágio é para quem está aprendendo.'),
        order('Agora a mensagem de candidatura.', 'Organize as partes da mensagem', ['Cumprimentar e dizer a vaga', 'Contar um projeto seu', 'Colocar o link do portfólio', 'Agradecer e se colocar à disposição'],
          'Comece dizendo quem é e o que quer; agradeça no fim.', 'Curta, educada e com provas do que você faz.'),
        q('Na entrevista, fazem uma pergunta técnica que você não sabe responder.', 'O que você faz?', ['Inventa uma resposta', 'Diz que ainda não sabe e explica como buscaria a resposta', 'Fica em silêncio'], 1,
          'Quem entrevista quer ver como você pensa.', 'Honestidade e raciocínio contam mais do que decorar tudo.'),
        tap('Revise e envie.', 'Envie a candidatura', 'Enviar', 1, 'Candidatura enviada. Seja qual for a resposta, você está no jogo.', 'run'),
      ] },
  ]],

  /* ================================================================== */
  design: [[
    { title: 'Escolha um curso de design e faça a primeira aula',
      intro: 'Design é resolver problemas de comunicação. No Ateliê das Cores há dois cursos para iniciantes: escolha um, faça a matrícula e participe da primeira aula.',
      done: 'Você se matriculou em "{c:curso}" e, na primeira aula, ajustou uma peça até ela ficar legível.',
      steps: [
        pick('curso', 'Que bom ter você no Ateliê, {nome}! Temos duas turmas abertas.', 'Escolha o seu curso', [
          ['Design gráfico', 'Cartazes, cores e letras: comunicar no papel e nas redes.'],
          ['Design de interfaces', 'Telas de aplicativos e sites: fáceis de usar e de entender.']], 'Confirmar matrícula'),
        branch('curso', [[
          design('Primeira aula: um cartaz precisa ser lido de longe. Mexa nas opções e veja a peça mudar.', 'Briefing: cartaz da festa junina da escola, alegre e fácil de ler de longe.', ['FESTA JUNINA', 'Sábado, 18h, no pátio'],
            [dCor(['Cinza sobre cinza', 'Vermelho e amarelo', 'Amarelo sobre branco'], [1]), dTam([1])],
            'Para ser lido de longe, o título precisa ser grande e contrastar com o fundo.', 'Cores quentes, alto contraste e título grande: dá para ler do outro lado do pátio.'),
        ], [
          design('Primeira aula: um botão precisa ser encontrado em um segundo. Mexa nas opções e veja a tela mudar.', 'Briefing: botão "Entrar" de um aplicativo, bem visível e legível.', ['ENTRAR', 'Toque para acessar'],
            [dCor(['Cinza sobre cinza', 'Azul e branco', 'Amarelo sobre branco'], [1]), dTam([1])],
            'Texto claro em fundo claro some. Procure contraste e tamanho.', 'Agora o botão se destaca e o texto é fácil de ler.'),
        ]]),
        q('Pense no que você acabou de fazer.', 'Como se chama a diferença entre a cor do texto e a do fundo?', ['Contraste', 'Margem', 'Sombra'], 0,
          'É o que faz o texto se destacar do fundo.', 'Contraste: o primeiro princípio que todo designer aprende.'),
      ] },
    { title: 'Estude os quatro princípios do design',
      intro: 'Contraste, alinhamento, repetição e proximidade: quatro princípios que organizam qualquer peça.',
      done: 'Você conheceu os quatro princípios e aplicou alinhamento e proximidade em um convite.',
      steps: [
        match('Quatro princípios, quatro ideias.', 'Ligue cada princípio à sua ideia', [
          ['Contraste', 'Diferenças destacam o que importa'], ['Alinhamento', 'Elementos seguem uma linha invisível'], ['Repetição', 'Os mesmos estilos criam unidade'], ['Proximidade', 'O que é relacionado fica junto']],
          'Leia o nome de cada princípio: ele já dá uma pista.', 'Guarde estes quatro: você vai usá-los em tudo.'),
        design('Agora aplique dois deles.', 'Briefing: convite de aniversário com tudo alinhado à esquerda e espaço para respirar.', ['ANIVERSÁRIO DA LU', 'Dia 12, 15h, na praça'],
          [dAlinh([0]), dEsp([1])], 'O briefing pede alinhamento à esquerda e respiro entre os elementos.', 'Alinhado e com respiro: o olho encontra tudo sem esforço.'),
      ] },
    { title: 'Monte uma paleta e escolha as fontes',
      intro: 'Cores e letras dão personalidade a uma marca. Vamos criar a identidade de uma padaria.',
      done: 'Você criou a identidade visual de uma padaria artesanal, com paleta acolhedora e fonte adequada.',
      steps: [
        design('A cliente é uma padaria artesanal de bairro.', 'Briefing: marca acolhedora e artesanal, com cara de pão quentinho.', ['PÃO DA VILA', 'Padaria artesanal'],
          [dCor(['Preto e dourado', 'Marrom e creme', 'Rosa e roxo'], [1]), dFonte(['Pixel divertida', 'Serifada elegante', 'Manuscrita'], [1, 2])],
          'Pense em pão, madeira e forno: tons quentes e uma letra com jeito de feita à mão ou tradicional.', 'Tons de pão e uma letra com personalidade: dá vontade de entrar.'),
        q('Sobre as letras.', 'Quantas fontes usar em uma mesma peça?', ['Uma ou duas', 'Cinco, para variar', 'Uma para cada palavra'], 0,
          'Fontes demais deixam a peça confusa.', 'Uma ou duas bastam: uma para títulos e outra para textos.'),
      ] },
  ], [
    { title: 'Conclua o módulo de hierarquia visual',
      intro: 'Hierarquia é decidir o que o olho vê primeiro. É o módulo central do curso.',
      done: 'Você concluiu o módulo: ordenou as informações por importância e aplicou a hierarquia em um cartaz.',
      steps: [
        order('Cartaz de um show na praça.', 'Organize do mais para o menos destacado', ['Nome da banda', 'Data e horário', 'Local', 'Patrocinadores'],
          'O que faz alguém parar para olhar vem primeiro.', 'Primeiro o que atrai, depois o que informa.'),
        design('Agora monte o cartaz.', 'Briefing: cartaz do show com título grande e centralizado.', ['OS VAGA-LUMES', 'Sexta, 20h, na praça'],
          [dTam([1]), dAlinh([1])], 'O título precisa ser o maior elemento e ficar no centro.', 'O nome da banda salta aos olhos. Módulo concluído!'),
      ] },
    { title: 'Recrie uma peça que você admira',
      intro: 'Copiar para estudar é um jeito clássico de aprender: você descobre as decisões por trás da peça.',
      done: 'Você observou uma capa de livro, identificou suas escolhas e a recriou como exercício de estudo.',
      steps: [
        design('Observe: uma capa de livro com fundo escuro, título dourado, centralizado, em letra clássica.', 'Recrie a capa descrita pela professora.', ['A ÚLTIMA ESTRELA', 'Romance'],
          [dCor(['Azul e branco', 'Preto e dourado', 'Verde e creme'], [1]), dAlinh([1]), dFonte(['Pixel divertida', 'Serifada elegante', 'Simples e limpa'], [1])],
          'Releia a descrição: fundo escuro, título dourado, no centro, letra clássica.', 'Ficou fiel ao original. Recriando, você entende cada decisão.'),
        q('Uma questão de ética.', 'O que você faz com uma peça recriada?', ['Usa como estudo e não apresenta como criação sua', 'Publica como se fosse original', 'Vende para um cliente'], 0,
          'A ideia original pertence a quem criou.', 'Estudo é estudo. No portfólio, só entra o que é seu.'),
      ] },
    { title: 'Crie um cartão de visitas para um amigo',
      intro: 'Seu primeiro trabalho para outra pessoa: um cartão de visitas simples e legível.',
      done: 'Você criou um cartão de visitas para {c:amigo}, com as informações certas e boa leitura.',
      steps: [
        pick('amigo', 'Quem vai receber o cartão?', 'Escolha o amigo', [['uma manicure', 'Atende em casa e quer mais clientes.'], ['um mecânico de bicicletas', 'Conserta bicicletas no bairro.'], ['uma professora de violão', 'Dá aulas particulares.']]),
        multi('Cartão é pequeno: cabe pouco.', 'O que entra no cartão? Marque 3', ['Nome', 'Serviço', 'Telefone', 'Biografia completa', 'Lista de passatempos'], [0, 1, 2],
          'Quem pega o cartão quer saber quem é, o que faz e como falar.', 'Só o essencial.'),
        design('Agora o visual.', 'Briefing: nome em destaque, boa leitura e espaço para respirar.', ['SEU NOME AQUI', 'Serviço e telefone'],
          [dTam([1]), dEsp([1]), dCor(['Cinza sobre cinza', 'Azul e branco', 'Verde e creme'], [1, 2])],
          'Nome grande, respiro e uma combinação de cores que dê leitura.', 'Limpo e profissional. Seu primeiro cliente ficou feliz!'),
      ] },
  ], [
    { title: 'Faça o design completo de um projeto pessoal',
      intro: 'Um projeto com várias telas ou peças, do rabisco à versão final.',
      done: 'Você conduziu "{c:projeto}" do entendimento do problema até telas consistentes entre si.',
      steps: [
        pick('projeto', 'Qual será o seu projeto?', 'Escolha o projeto', [['Aplicativo de receitas', 'Três telas: lista, receita e favoritos.'], ['Cartazes do grêmio', 'Três cartazes de uma mesma campanha.'], ['Loja de camisetas', 'Três páginas: vitrine, produto e carrinho.']]),
        order('Todo projeto de design segue um processo.', 'Organize as etapas', ['Entender o problema e o público', 'Rabiscar ideias no papel', 'Montar a versão digital', 'Testar com alguém', 'Ajustar e finalizar'],
          'Entender vem antes de desenhar; testar vem antes de finalizar.', 'Esse é o processo de design, do começo ao fim.'),
        design('A primeira peça é azul e branca, alinhada à esquerda. A segunda precisa combinar com ela.', 'Briefing: mantenha a consistência com a primeira peça.', ['SEGUNDA PEÇA', 'Mesma família visual'],
          [dCor(['Azul e branco', 'Vermelho e amarelo', 'Rosa e roxo'], [0]), dAlinh([0])], 'Consistência é repetir as escolhas: mesma paleta, mesmo alinhamento.', 'As peças parecem da mesma família. Isso é repetição bem usada.'),
      ] },
    { title: 'Mostre o seu trabalho e anote o feedback',
      intro: 'Duas pessoas vão ver o seu projeto. Ouvir sem se defender é uma habilidade.',
      done: 'Você apresentou o projeto, traduziu os comentários em problemas de design e anotou tudo.',
      steps: [
        match('Os comentários chegaram. O que cada um quer dizer?', 'Ligue cada comentário ao problema', [
          ['"Não achei o botão"', 'Falta destaque e contraste'], ['"Tem coisa demais"', 'Falta respiro e hierarquia'], ['"Não entendi do que é"', 'Falta um título claro']],
          'Pense no princípio de design por trás de cada queixa.', 'Você traduziu opiniões em problemas que dá para resolver.'),
        q('Uma das críticas foi dura.', 'Como reagir?', ['Explicar por que a pessoa está errada', 'Ouvir, perguntar mais e anotar', 'Desistir do projeto'], 1,
          'A crítica é sobre a peça, não sobre você.', 'Quem pergunta mais descobre o problema real.'),
      ] },
    { title: 'Refaça uma peça aplicando o feedback',
      intro: 'Com o feedback em mãos, é hora de voltar à peça e melhorar.',
      done: 'Você corrigiu a peça com base no feedback: mais contraste e mais espaço.',
      steps: [
        design('O feedback foi: "o texto some no fundo" e "está tudo apertado". Corrija.', 'Briefing: resolva os dois problemas apontados.', ['VERSÃO 2', 'Agora dá para ler'],
          [dCor(['Cinza sobre cinza', 'Amarelo sobre branco', 'Preto e dourado'], [2]), dEsp([1])], 'O texto precisa contrastar com o fundo, e os elementos precisam de espaço.', 'Compare com a versão anterior: a mesma peça, muito mais clara.'),
        q('Compare o antes e o depois.', 'O que você mudou?', ['O contraste e o espaço', 'O assunto da peça', 'Nada'], 0,
          'Foram exatamente os dois pontos do feedback.', 'Refazer é parte do trabalho, e não sinal de erro.'),
      ] },
  ], [
    { title: 'Monte um portfólio online',
      intro: 'Seu portfólio mostra o seu melhor trabalho e como você pensa.',
      done: 'Você selecionou as peças e organizou o portfólio com o melhor trabalho na frente.',
      steps: [
        multi('Menos é mais.', 'Escolha as 3 peças do portfólio', ['Projeto pessoal completo', 'Peça refeita, com antes e depois', 'Todos os 40 rascunhos', 'Cartão de visitas feito para um cliente', 'Cópia de estudo, sem aviso'], [0, 1, 3],
          'Mostre trabalhos seus e finalizados.', 'Três boas peças dizem mais do que quarenta medianas.'),
        order('A ordem importa.', 'Organize o portfólio', ['Seu melhor projeto', 'Outros bons projetos', 'Sobre você e contato'],
          'Quem visita vê o começo com mais atenção.', 'O melhor primeiro. Portfólio no ar!'),
      ] },
    { title: 'Escreva o estudo de caso de um projeto',
      intro: 'Um estudo de caso conta a história de um projeto: do problema à solução.',
      done: 'Você estruturou um estudo de caso e resumiu o problema que o seu projeto resolve.',
      steps: [
        order('Um estudo de caso é uma história com começo, meio e fim.', 'Organize as partes', ['O problema', 'O público', 'Ideias e rascunhos', 'A solução final', 'O resultado e o que você aprendeu'],
          'Comece pelo problema e termine pelo resultado.', 'Assim quem lê entende o seu raciocínio.'),
        write('caso', 'Agora a primeira frase do seu estudo de caso.', 'Que problema o seu projeto resolve?', 'Ex.: Ninguém achava os avisos do grêmio', 'Uma frase clara vale mais do que um parágrafo confuso.'),
      ] },
    { title: 'Atenda o seu primeiro cliente',
      intro: 'Uma loja de plantas da vila quer uma placa. É o seu primeiro trabalho pago.',
      done: 'Você fez as perguntas certas, calculou o preço e entregou a placa da loja de plantas.',
      steps: [
        multi('Antes de desenhar, pergunte.', 'O que perguntar à cliente? Marque 3', ['Quem é o público?', 'Qual é o prazo?', 'Onde a peça vai ser usada?', 'Qual é o seu signo?', 'Posso fazer do meu gosto?'], [0, 1, 2],
          'Boas perguntas falam do público, do prazo e do uso.', 'Isso se chama briefing: entender antes de criar.'),
        calc('Você estima 4 horas de trabalho e cobra R$ 25 por hora.', 'Qual é o preço do trabalho? (R$)', 100, 'Multiplique as horas pelo valor da hora: 4 × 25.', 'R$ 100. Seu tempo tem valor.'),
        design('Agora a placa.', 'Briefing: loja de plantas, visual natural e calmo.', ['JARDIM DA VILA', 'Plantas e vasos'],
          [dCor(['Vermelho e amarelo', 'Verde e creme', 'Rosa e roxo'], [1]), dFonte(['Pixel divertida', 'Serifada elegante', 'Simples e limpa'], [1, 2])],
          'Natural e calmo pede tons de planta e uma letra tranquila.', 'A cliente aprovou de primeira. Trabalho entregue!'),
      ] },
  ]],

  /* ================================================================== */
  saude: [[
    { title: 'Conheça as carreiras da saúde e escolha a sua',
      intro: 'A saúde tem muitas profissões além da medicina. Conheça algumas e escolha a que mais combina com você.',
      done: 'Você conheceu quatro carreiras da saúde e escolheu começar por {c:carreira}.',
      steps: [
        match('Cada profissional cuida de um jeito.', 'Ligue a carreira ao que ela faz', [
          ['Enfermagem', 'Cuida do paciente no dia a dia'], ['Fisioterapia', 'Recupera movimentos'], ['Nutrição', 'Orienta a alimentação'], ['Análises clínicas', 'Realiza exames em laboratório']],
          'Pense no que cada profissional faz com o paciente.', 'São profissões diferentes que trabalham juntas.'),
        pick('carreira', 'Agora que você conhece algumas, qual chama mais a sua atenção?', 'Escolha a sua carreira', [
          ['Enfermagem', 'Cuidado direto e contínuo.'], ['Fisioterapia', 'Movimento e reabilitação.'], ['Nutrição', 'Alimentação e saúde.'], ['Medicina', 'Diagnóstico e tratamento.']]),
        tap('Em qualquer uma delas, tudo começa pelo mesmo gesto.', 'Lave as mãos antes de entrar na sala de treino', 'Esfregar', 4, 'Mãos limpas. É o hábito número um de quem cuida.', 'wash'),
      ] },
    { title: 'Descubra o caminho de formação',
      intro: 'Curso técnico, faculdade, especialização: entenda os caminhos para entrar na área.',
      done: 'Você entendeu os caminhos de formação e decidiu começar por: {c:caminho}.',
      steps: [
        match('Cada etapa de formação tem uma duração e um papel.', 'Ligue os pares', [['Curso técnico', 'Cerca de 2 anos'], ['Graduação', 'De 4 a 6 anos de faculdade'], ['Especialização', 'Depois da graduação']],
          'Pense na ordem e no tempo de cada uma.', 'Agora você enxerga o caminho inteiro.', 'study'),
        q('Uma exigência em comum.', 'O que quase todo curso de saúde exige?', ['Estágio supervisionado com pacientes', 'Saber cantar', 'Ter carro'], 0,
          'Não se aprende a cuidar só nos livros.', 'O estágio é onde a teoria encontra gente de verdade.'),
        pick('caminho', 'Os dois caminhos levam à área. Por qual você quer começar?', 'Escolha o seu caminho', [['Curso técnico', 'Entra antes no mercado e pode seguir estudando.'], ['Vestibular', 'Vai direto para a graduação.']]),
      ] },
    { title: 'Converse com uma profissional sobre a rotina',
      intro: 'A Enfermeira Bia topou contar como é o dia a dia. Prepare boas perguntas e escute com atenção.',
      done: 'Você entrevistou uma enfermeira, ouviu sobre a rotina real e praticou a regra que ela mais valoriza.',
      steps: [
        multi('Você tem tempo para três perguntas.', 'Escolha 3 boas perguntas', ['Como é um plantão?', 'O que é mais difícil?', 'O que faz você continuar?', 'Quanto você pesa?', 'Pode me dar um atestado?'], [0, 1, 2],
          'Boas perguntas falam do trabalho, não da vida pessoal dela.', 'Perguntas respeitosas e curiosas.', 'talk'),
        say('"O plantão é corrido e cansa. O mais difícil é quando a gente não consegue ajudar. E o que me faz continuar é ver alguém sair andando. Ah, e a regra que mais salva vidas: lavar as mãos entre um paciente e outro."'),
        q('Você prestou atenção?', 'Qual é a regra que, segundo ela, mais salva vidas?', ['Lavar as mãos entre um paciente e outro', 'Chegar cedo', 'Usar roupa branca'], 0,
          'Ela disse isso no fim da resposta.', 'Um gesto simples que evita infecções.'),
        tap('Pratique do jeito que ela ensinou.', 'Lave as mãos', 'Esfregar', 5, 'Palmas, dorso, entre os dedos, unhas e punhos.', 'wash'),
      ] },
  ], [
    { title: 'Monte um plano de estudos semanal',
      intro: 'Para entrar na área, é preciso estudar com constância. Vamos montar a sua semana.',
      done: 'Você calculou as horas disponíveis, organizou uma sessão de estudo e incluiu descanso no plano.',
      steps: [
        calc('Você tem 2 horas livres por dia, de segunda a sexta.', 'Quantas horas de estudo na semana?', 10, 'São 5 dias com 2 horas cada.', 'Dez horas bem usadas rendem muito.'),
        order('Como aproveitar cada sessão?', 'Organize uma sessão de estudo', ['Revisar o que viu ontem', 'Estudar o assunto novo', 'Fazer exercícios', 'Anotar as dúvidas'],
          'Relembre antes de avançar, e pratique antes de encerrar.', 'Revisar, aprender, praticar e anotar.', 'study'),
        q('E o fim de semana?', 'Para que serve o dia de descanso?', ['Para nada: é tempo perdido', 'Para o cérebro fixar o que aprendeu', 'Para estudar em dobro'], 1,
          'O corpo e a mente precisam se recuperar.', 'Descanso faz parte do plano.'),
      ] },
    { title: 'Revise o corpo humano',
      intro: 'Uma revisão dos principais órgãos e uma prática no boneco de treino.',
      done: 'Você revisou a função de quatro órgãos e mediu o pulso no boneco de treino.',
      steps: [
        match('Quatro órgãos, quatro funções.', 'Ligue cada órgão à sua função', [['Coração', 'Bombeia o sangue'], ['Pulmões', 'Fazem a troca de gases'], ['Estômago', 'Inicia a digestão'], ['Rins', 'Filtram o sangue']],
          'Pense no que cada órgão movimenta: sangue, ar ou alimento.', 'Cada órgão faz a sua parte.', 'study'),
        q('Sobre o coração.', 'Quantos batimentos por minuto tem um adulto em repouso?', ['De 10 a 20', 'De 60 a 100', 'De 200 a 300'], 1,
          'Mais ou menos um batimento por segundo.', 'Entre 60 e 100 por minuto.'),
        tap('Agora a prática: sinta o pulso no punho do boneco.', 'Meça o pulso', 'Contar', 4, 'Você contou os batimentos com calma e sem apertar demais.', 'care'),
      ] },
    { title: 'Faça um curso de primeiros socorros',
      intro: 'Saber o básico pode fazer diferença até a ajuda chegar. Vamos treinar situações comuns.',
      done: 'Você aprendeu o que fazer em queimaduras leves, sangramento nasal e cortes, e a chamar o socorro.',
      steps: [
        q('Situação 1: queimadura leve na mão.', 'O que fazer?', ['Passar pasta de dente', 'Colocar em água corrente fria por alguns minutos', 'Estourar a bolha'], 1,
          'Nada de receitas caseiras: o objetivo é resfriar a pele.', 'Água corrente fria alivia e limita a lesão.'),
        q('Situação 2: o nariz de um colega começa a sangrar.', 'O que fazer?', ['Deitar e inclinar a cabeça para trás', 'Sentar, inclinar o corpo para a frente e apertar o nariz', 'Assoar com força'], 1,
          'Para trás, o sangue desce pela garganta.', 'Corpo para a frente, apertando a parte mole do nariz.'),
        calc('Situação 3: é grave e você precisa chamar uma ambulância.', 'Qual é o número do SAMU?', 192, 'São três dígitos e começa com 19.', '192. Vale guardar na memória.'),
        order('Situação 4: um corte que sangra.', 'Organize o atendimento', ['Lavar as mãos ou calçar luvas', 'Pressionar com um pano limpo', 'Manter a pressão por alguns minutos', 'Cobrir com um curativo', 'Procurar atendimento se não parar'],
          'Proteja-se primeiro; a pressão vem antes do curativo.', 'Proteger, pressionar, cobrir e buscar ajuda.'),
        tap('Pratique no boneco.', 'Faça o curativo', 'Enfaixar', 4, 'Curativo firme, sem apertar demais.', 'care'),
      ] },
  ], [
    { title: 'Faça um simulado da área',
      intro: 'Um simulado curto com perguntas que caem em provas de saúde.',
      done: 'Você fez o simulado e acertou as três questões.',
      steps: [
        q('Questão 1.', 'Qual é a unidade básica dos seres vivos?', ['A célula', 'O osso', 'O sangue'], 0, 'Todos os tecidos são formados por elas.', 'A célula.', 'study'),
        q('Questão 2.', 'Como funciona uma vacina?', ['Trata a doença depois que ela aparece', 'Ensina o corpo a se defender antes da doença', 'Substitui a alimentação'], 1,
          'A vacina age antes do contato com a doença.', 'Ela prepara as defesas do corpo.'),
        q('Questão 3.', 'Como a dengue é transmitida?', ['Pelo ar', 'Pela picada de um mosquito', 'Por aperto de mão'], 1, 'Por isso se combate a água parada.', 'Pelo mosquito, que se reproduz em água parada.'),
      ] },
    { title: 'Participe de uma campanha de saúde',
      intro: 'A Casa da Cura organiza campanhas na vila. Escolha uma e ajude a orientar as pessoas.',
      done: 'Você participou da campanha de {c:campanha}: montou o cartaz com informações corretas e orientou uma moradora com respeito.',
      steps: [
        pick('campanha', 'De qual campanha você quer participar?', 'Escolha a campanha', [['vacinação', 'Atualizar as cadernetas da vila.'], ['combate à dengue', 'Eliminar focos de água parada.'], ['doação de sangue', 'Convidar novos doadores.']]),
        multi('Um cartaz de saúde só pode ter informação correta.', 'Escolha as 3 mensagens certas', ['Lave as mãos com água e sabão', 'Elimine a água parada', 'Mantenha a vacinação em dia', 'Antibiótico cura gripe', 'Vacina causa a doença'], [0, 1, 2],
          'Duas das frases são mitos conhecidos.', 'Informação correta também salva vidas.'),
        q('Uma senhora diz que tem medo de vacina.', 'O que você faz?', ['Ri do medo dela', 'Ouve e explica com calma como funciona', 'Insiste até ela aceitar'], 1,
          'Ninguém muda de ideia sendo ridicularizado ou pressionado.', 'Ela agradeceu a paciência e disse que vai pensar com carinho.', 'talk'),
      ] },
    { title: 'Ensine primeiros socorros a alguém',
      intro: 'Ensinar é a melhor forma de fixar. Explique a um colega mais novo o que fazer em uma queimadura.',
      done: 'Você ensinou o atendimento de queimaduras, desfez um mito e confirmou que a pessoa aprendeu.',
      steps: [
        order('Explique com clareza.', 'Organize a explicação sobre queimadura', ['Afastar a pessoa da fonte de calor', 'Colocar em água corrente fria', 'Cobrir com um pano limpo', 'Procurar ajuda se for grande'],
          'Primeiro tire do perigo; depois resfrie.', 'Explicação clara e na ordem.', 'talk'),
        q('Ele pergunta: "E se eu passar manteiga?"', 'O que você responde?', ['"Pode passar, ajuda"', '"Não: gordura segura o calor e pode infeccionar"', '"Tanto faz"'], 1,
          'Lembre do objetivo: resfriar a pele.', 'Mito desfeito com explicação.'),
        q('Como saber se ele aprendeu?', 'Qual é a melhor forma?', ['Pedir que ele explique de volta', 'Perguntar "entendeu?"', 'Repetir mais alto'], 0,
          'Quase todo mundo responde "sim" a "entendeu?".', 'Ele explicou tudo certinho. Agora são dois que sabem.'),
      ] },
  ], [
    { title: 'Faça a sua inscrição',
      intro: 'Chegou o período de inscrição. Fazer tudo na ordem evita perder o prazo.',
      done: 'Você seguiu todas as etapas da inscrição e descobriu como funciona a isenção de taxa.',
      steps: [
        order('Inscrição tem etapas.', 'Organize os passos', ['Ler o edital', 'Separar os documentos', 'Preencher o formulário', 'Pagar a taxa ou pedir isenção', 'Guardar o comprovante'],
          'O edital explica tudo, então vem primeiro. O comprovante é a última coisa.', 'Inscrição feita sem sustos.'),
        q('Sobre a taxa.', 'Quem pode pedir isenção?', ['Ninguém', 'Quem cumpre os critérios do edital, como baixa renda', 'Só quem tirou nota 10'], 1,
          'As regras ficam no edital.', 'Vale sempre conferir: a isenção existe para que a taxa não seja uma barreira.', 'study'),
      ] },
    { title: 'Organize os seus documentos e prazos',
      intro: 'Documento faltando e prazo perdido eliminam muita gente. Vamos deixar tudo em ordem.',
      done: 'Você separou os documentos, colocou as datas em ordem e calculou quanto tempo tem.',
      steps: [
        match('Cada documento comprova uma coisa.', 'Ligue os pares', [['RG e CPF', 'Quem é você'], ['Histórico escolar', 'O que você estudou'], ['Comprovante de residência', 'Onde você mora']],
          'Pense no que cada papel mostra.', 'Pasta organizada.'),
        order('Agora o calendário.', 'Coloque as datas em ordem', ['Inscrição: 10 de agosto', 'Pagamento: 15 de agosto', 'Prova: 20 de outubro', 'Resultado: 5 de dezembro'],
          'Siga a ordem dos meses.', 'Com as datas em ordem, nada pega você de surpresa.'),
        calc('Hoje é 3 de agosto e a inscrição termina no dia 10.', 'Quantos dias faltam?', 7, 'Subtraia: 10 − 3.', 'Uma semana. Melhor não deixar para o último dia.', 'study'),
      ] },
    { title: 'Monte a sua rotina para os próximos 3 meses',
      intro: 'Com a prova marcada, falta o plano para chegar preparado.',
      done: 'Você distribuiu o conteúdo pelas semanas, montou uma rotina saudável e registrou o seu motivo.',
      steps: [
        calc('O conteúdo tem 24 capítulos e você tem 12 semanas.', 'Quantos capítulos por semana?', 2, 'Divida 24 por 12.', 'Dois por semana: um ritmo possível.'),
        multi('Uma rotina que dá para manter.', 'Escolha 3 hábitos para a sua rotina', ['Horário fixo de estudo', 'Simulado a cada duas semanas', 'Dormir de 7 a 8 horas', 'Virar noites antes da prova', 'Cortar todos os descansos'], [0, 1, 2],
          'Dois desses hábitos prejudicam a memória e a saúde.', 'Quem cuida dos outros começa cuidando de si.', 'study'),
        write('motivo', 'Nos dias difíceis, ajuda lembrar por que você começou.', 'Por que você quer trabalhar com saúde?', 'Escreva em uma frase', 'Guarde essa frase. Ela vai ser útil.'),
      ] },
  ]],

  /* ================================================================== */
  prof: [[
    { title: 'Escolha o que e para quem você quer ensinar',
      intro: 'Ensinar começa por duas escolhas: a matéria e a turma. Faça as suas e dê a primeira explicação no quadro.',
      done: 'Você escolheu ensinar {c:materia} para {c:turma} e deu a sua primeira explicação.',
      steps: [
        pick('materia', 'Qual matéria faz o seu olho brilhar?', 'Escolha a matéria', [['Matemática', 'Números, lógica e problemas.'], ['Português', 'Leitura, escrita e histórias.'], ['Ciências', 'Natureza, corpo e experiências.'], ['Artes', 'Criação e expressão.']]),
        pick('turma', 'E quem você quer ensinar?', 'Escolha a turma', [['crianças', 'De 6 a 10 anos.'], ['adolescentes', 'De 11 a 17 anos.'], ['adultos', 'Jovens e adultos que voltaram a estudar.']]),
        q('Um teste rápido de didática: você precisa explicar frações a uma criança.', 'O que ajuda mais?', ['Uma pizza cortada em fatias', 'Uma fórmula no quadro', 'Um texto de três páginas'], 0,
          'Crianças aprendem melhor com o que podem ver e tocar.', 'Um exemplo concreto vale mais do que mil definições.'),
        tap('Vá ao quadro e desenhe a pizza.', 'Desenhe no quadro', 'Desenhar', 4, 'Meia pizza, um quarto de pizza... a turma entendeu na hora.', 'write'),
      ] },
    { title: 'Descubra a formação necessária',
      intro: 'Para dar aula é preciso formação. Entenda qual curso leva a cada sala de aula.',
      done: 'Você entendeu a diferença entre pedagogia e licenciatura e o papel do estágio.',
      steps: [
        match('Cada formação leva a um lugar.', 'Ligue os pares', [['Pedagogia', 'Educação infantil e anos iniciais'], ['Licenciatura', 'Uma matéria, do 6º ano em diante'], ['Estágio', 'Prática em sala, com supervisão']],
          'Pense na idade dos alunos de cada uma.', 'Agora você sabe qual porta leva a qual sala.', 'plan'),
        q('Um caso prático.', 'Para dar aula de História no ensino médio, qual é o curso?', ['Licenciatura em História', 'Qualquer curso técnico', 'Nenhum: basta gostar'], 0,
          'No ensino médio, cada professor é formado na sua matéria.', 'Licenciatura na matéria que você vai ensinar.'),
      ] },
    { title: 'Converse com um professor sobre a rotina',
      intro: 'O Professor Paulo vai contar como é a vida de quem ensina, dentro e fora da sala.',
      done: 'Você entrevistou um professor e descobriu que boa parte do trabalho acontece fora da sala de aula.',
      steps: [
        multi('Você tem tempo para três perguntas.', 'Escolha 3 boas perguntas', ['Como você prepara uma aula?', 'O que é mais difícil?', 'O que mais te alegra?', 'Qual é o seu salário exato?', 'Pode me dar nota 10?'], [0, 1, 2],
          'Pergunte sobre o trabalho, com respeito.', 'Boas perguntas.', 'talk'),
        say('"Para cada hora de aula, gasto quase outra preparando e corrigindo. O mais difícil é alcançar quem desistiu de tentar. E a alegria é ver o rosto de alguém quando finalmente entende."'),
        q('Você prestou atenção?', 'O que acontece fora da sala de aula?', ['Preparação e correção', 'Nada: o trabalho acaba com o sinal', 'Só reuniões'], 0,
          'Ele falou do tempo gasto antes e depois de cada aula.', 'Planejar e corrigir são metade do trabalho.'),
      ] },
  ], [
    { title: 'Comece um curso de didática',
      intro: 'Saber a matéria não basta: é preciso saber ensinar. A Escola da Vila tem dois cursos de didática.',
      done: 'Você se matriculou em "{c:curso}" e aprendeu a estrutura básica de uma aula.',
      steps: [
        pick('curso', 'Temos duas turmas de didática.', 'Escolha o seu curso', [['Didática na prática', 'Planejar e conduzir aulas com objetivo claro.'], ['Jogos para ensinar', 'Usar jogos e brincadeiras para a turma aprender fazendo.']], 'Confirmar matrícula'),
        branch('curso', [[
          q('Primeira aula.', 'Por onde começa uma boa aula?', ['Por um objetivo claro', 'Pelo conteúdo mais difícil', 'Por uma prova surpresa'], 0, 'A turma precisa saber aonde vai chegar.', 'Com o objetivo claro, todo o resto se organiza.'),
        ], [
          q('Primeira aula.', 'Para que serve um jogo em aula?', ['Para passar o tempo', 'Para praticar o conteúdo de forma ativa', 'Para premiar só quem ganha'], 1, 'O jogo é um meio, não o fim.', 'No jogo a turma pratica sem perceber que está estudando.'),
        ]]),
        order('Toda aula tem uma estrutura.', 'Organize as partes da aula', ['Dizer o objetivo', 'Explicar com um exemplo', 'Deixar a turma praticar', 'Conferir o que aprenderam'],
          'Comece pelo objetivo e termine conferindo.', 'Objetivo, explicação, prática e conferência.', 'write'),
      ] },
    { title: 'Monte um plano de aula de 20 minutos',
      intro: 'Vinte minutos passam voando. Um plano divide o tempo para caber tudo.',
      done: 'Você montou um plano de aula de 20 minutos com objetivo, atividade e avaliação.',
      steps: [
        calc('A aula tem 20 minutos: 3 de abertura, 7 de explicação e 2 de fechamento.', 'Quantos minutos sobram para a prática?', 8, 'Some 3 + 7 + 2 e tire de 20.', 'Oito minutos de prática: a parte mais importante.'),
        match('As três partes de um plano.', 'Ligue os pares', [['Objetivo', 'O que a turma vai saber fazer'], ['Atividade', 'O que a turma faz para praticar'], ['Avaliação', 'Como você confere se aprenderam']],
          'Pense em aonde chegar, como chegar e como conferir.', 'Plano completo.'),
        tap('Passe o plano a limpo.', 'Escreva o plano', 'Escrever', 4, 'Seu primeiro plano de aula está pronto.', 'plan'),
      ] },
    { title: 'Explique um assunto e peça feedback',
      intro: 'Uma colega travou em porcentagem. Explique de um jeito que funcione e peça a opinião dela.',
      done: 'Você explicou porcentagem com um exemplo do dia a dia e pediu feedback de verdade.',
      steps: [
        q('Ela diz: "Não entendi porcentagem."', 'Como você explica?', ['Repete a mesma frase mais devagar', 'Usa um exemplo do dia a dia: 10% de desconto em R$ 50', 'Diz que é fácil'], 1,
          'Se a primeira explicação não funcionou, repetir não ajuda.', 'Um exemplo com dinheiro costuma destravar.', 'talk'),
        calc('Faça a conta com ela.', 'Quanto é 10% de R$ 50? (R$)', 5, 'Dez por cento é a décima parte: 50 ÷ 10.', 'R$ 5 de desconto. Ela sorriu: entendeu.', 'write'),
        q('Agora peça feedback.', 'Qual é a melhor pergunta?', ['"O que eu poderia explicar melhor?"', '"Você entendeu, né?"', 'Não perguntar nada'], 0,
          'Uma pergunta aberta traz respostas úteis.', 'Ela sugeriu usar mais exemplos assim. Anotado!'),
      ] },
  ], [
    { title: 'Dê uma aula de monitoria',
      intro: 'Sua primeira aula de verdade, para três colegas. Coisas inesperadas vão acontecer.',
      done: 'Você conduziu uma monitoria: escreveu no quadro, acolheu um erro e voltou um passo quando a turma se perdeu.',
      steps: [
        tap('Comece escrevendo o objetivo da aula no quadro.', 'Escreva no quadro', 'Escrever', 4, 'Objetivo no quadro: todos sabem aonde a aula vai chegar.', 'write'),
        q('Um aluno responde errado.', 'O que você faz?', ['Diz "errado" e segue', 'Pergunta como ele pensou e parte daí', 'Dá a resposta pronta'], 1,
          'O erro mostra onde está a dúvida.', 'Ouvindo o raciocínio dele, você achou a dúvida real.', 'talk'),
        q('Metade da turma parece perdida.', 'E agora?', ['Segue o plano mesmo assim', 'Volta um passo, com outro exemplo', 'Encerra a aula'], 1,
          'O plano serve à turma, e não o contrário.', 'Você voltou um passo e todos acompanharam. Isso é ensinar.'),
      ] },
    { title: 'Crie um material de apoio',
      intro: 'Um bom material ajuda a turma a estudar sem você por perto.',
      done: 'Você criou um material de apoio ({c:material}) claro, com exemplos e exercícios em ordem de dificuldade.',
      steps: [
        pick('material', 'Que tipo de material você vai criar?', 'Escolha o material', [['resumo de uma página', 'O essencial do assunto.'], ['lista de exercícios', 'Para praticar em casa.'], ['jogo de cartas', 'Para revisar brincando.']]),
        multi('O que faz um material ser bom?', 'Marque 3', ['Linguagem simples', 'Exemplos', 'Espaço para praticar', 'Letra miúda para caber tudo', 'Só teoria'], [0, 1, 2],
          'Pense em quem vai usar o material sem ajuda.', 'Claro, com exemplos e com prática.'),
        order('A ordem dos exercícios também ensina.', 'Organize do começo ao fim', ['Exemplo resolvido', 'Exercício fácil', 'Exercício médio', 'Desafio'],
          'Comece mostrando como se faz e aumente a dificuldade aos poucos.', 'Dificuldade crescente dá confiança.', 'plan'),
      ] },
    { title: 'Grave um vídeo curto explicando um tema',
      intro: 'Um vídeo curto alcança quem não estava na aula. Roteiro primeiro, gravação depois.',
      done: 'Você escreveu o roteiro e gravou um vídeo curto, com um tema só.',
      steps: [
        order('Todo vídeo precisa de um roteiro.', 'Organize o roteiro', ['Pergunta que desperta curiosidade', 'Explicação em três passos', 'Um exemplo', 'Resumo e convite a praticar'],
          'Prenda a atenção no começo e resuma no fim.', 'Roteiro pronto.', 'plan'),
        q('Sobre a duração.', 'Qual é o tamanho ideal de um vídeo de revisão?', ['De 3 a 5 minutos, com um tema só', 'Uma hora, com tudo', 'Dez segundos'], 0,
          'Curto o bastante para manter a atenção, longo o bastante para explicar.', 'Um tema, poucos minutos.'),
        tap('Luz, câmera...', 'Grave o vídeo', 'Gravar', 3, 'Gravado na terceira tentativa. Ficou claro e simpático.', 'talk'),
      ] },
  ], [
    { title: 'Inscreva-se em um programa de formação',
      intro: 'Hora de dar o passo oficial rumo à sala de aula.',
      done: 'Você fez a inscrição no programa de formação e conheceu as bolsas de iniciação à docência.',
      steps: [
        order('Uma inscrição bem feita segue etapas.', 'Organize os passos', ['Escolher o curso', 'Conferir os requisitos', 'Juntar os documentos', 'Enviar a inscrição no prazo'],
          'Confira os requisitos antes de juntar os papéis.', 'Inscrição enviada.', 'plan'),
        q('Uma boa notícia.', 'O que os programas de iniciação à docência oferecem?', ['Bolsa para praticar em escolas durante o curso', 'Diploma sem estudar', 'Dispensa do estágio'], 0,
          'É um apoio para quem está se formando.', 'Você pode praticar em escolas e receber uma bolsa por isso.'),
      ] },
    { title: 'Monte um portfólio com planos e materiais',
      intro: 'Tudo o que você criou até aqui pode mostrar como você ensina.',
      done: 'Você reuniu plano de aula, material e vídeo em um portfólio de quem ensina.',
      steps: [
        multi('Escolha o que representa o seu trabalho.', 'O que entra no portfólio? Marque 3', ['Seu plano de aula', 'O material que você criou', 'O vídeo que você gravou', 'Provas feitas por outros professores', 'Fotos de alunos sem autorização'], [0, 1, 2],
          'Só entra o que é seu e pode ser mostrado.', 'Três peças, todas suas.'),
        match('Cada peça mostra uma qualidade.', 'Ligue os pares', [['Plano de aula', 'Como você organiza'], ['Material de apoio', 'Sua criatividade'], ['Vídeo', 'Como você explica']],
          'Pense no que cada peça revela sobre você.', 'Um retrato completo de quem ensina.', 'plan'),
      ] },
    { title: 'Ofereça aulas particulares',
      intro: 'Um vizinho precisa de ajuda em matemática. É o seu primeiro aluno particular.',
      done: 'Você calculou seu ganho, acolheu um aluno desanimado e conduziu a primeira aula particular.',
      steps: [
        calc('Você cobra R$ 30 por aula, duas vezes por semana, durante 4 semanas.', 'Quanto recebe no mês? (R$)', 240, 'São 8 aulas: 8 × 30.', 'R$ 240. Ensinar também é trabalho.'),
        q('Ele chega dizendo: "Odeio matemática."', 'O que você responde?', ['"Vamos descobrir juntos onde travou"', '"Então nem adianta"', '"É só decorar"'], 0,
          'Por trás do "odeio" quase sempre há um ponto em que a pessoa travou.', 'Ele se sentiu ouvido, e isso muda tudo.', 'talk'),
        order('A primeira aula particular.', 'Organize a aula', ['Conversar e conhecer o aluno', 'Descobrir onde está a dificuldade', 'Ensinar um ponto de cada vez', 'Combinar a próxima aula'],
          'Antes de ensinar, descubra o que ele precisa.', 'Ao fim da aula ele disse: "Até que não foi ruim."', 'write'),
      ] },
  ]],

  /* ================================================================== */
  empre: [[
    { title: 'Encontre problemas ao seu redor',
      intro: 'Todo negócio nasce de um problema de alguém. Dona Marta vai ensinar você a enxergar os da vila.',
      done: 'Você aprendeu a separar problemas reais de simples desejos e identificou três oportunidades na vila.',
      steps: [
        multi('Olhe em volta, {nome}. A vila está cheia de problemas esperando solução.', 'Quais são problemas reais de outras pessoas? Marque 3', ['Fila enorme na cantina', 'Ninguém conserta bicicletas no bairro', 'Estudantes sem opção de lanche saudável', '"Eu quero ficar rico"', '"Seria legal ter um foguete"'], [0, 1, 2],
          'Um problema real incomoda outras pessoas, não só você.', 'Três problemas, três possíveis negócios.', 'idea'),
        q('Guarde esta lição.', 'De onde nasce um bom negócio?', ['De um problema real de alguém', 'Da vontade de ficar famoso', 'De copiar o vizinho'], 0,
          'Clientes pagam para resolver o que os incomoda.', 'Quem resolve um problema tem cliente.'),
      ] },
    { title: 'Escolha um problema e escreva a sua ideia',
      intro: 'Dos problemas que você encontrou, escolha um e transforme em uma ideia de negócio.',
      done: 'Você escolheu um problema ({c:negocio}) e escreveu a sua ideia: "{c:ideia}".',
      steps: [
        pick('negocio', 'Qual desses problemas você quer resolver?', 'Escolha o seu negócio', [['lanches saudáveis na saída da escola', 'Estudantes saem com fome e sem boas opções.'], ['conserto de bicicletas', 'Não há quem conserte no bairro.'], ['aulas de reforço', 'Muitos colegas precisam de ajuda nas matérias.']]),
        q('Antes de escrever.', 'O que uma ideia clara precisa dizer?', ['O que é, para quem e qual problema resolve', 'Que você vai ficar famoso', 'Todos os detalhes técnicos'], 0,
          'Quem ouve precisa entender em uma frase.', 'O quê, para quem e por quê.'),
        write('ideia', 'Agora é com você.', 'Descreva a sua solução em uma frase', 'Ex.: Vendo lanches naturais na porta da escola', 'Está no papel. Agora ela existe.', 'idea'),
      ] },
    { title: 'Converse com possíveis clientes',
      intro: 'Antes de gastar um centavo, descubra se as pessoas querem o que você imaginou.',
      done: 'Você entrevistou três possíveis clientes e descobriu que há interesse e qual preço eles esperam.',
      steps: [
        multi('Boas perguntas trazem respostas honestas.', 'Escolha 3 boas perguntas', ['Como você resolve isso hoje?', 'Quanto isso te incomoda?', 'Quanto você pagaria por uma solução?', 'Minha ideia é genial, né?', 'Você compraria só para me ajudar?'], [0, 1, 2],
          'Evite perguntas que pedem elogio ou favor.', 'Perguntas que revelam a verdade.', 'sell'),
        say('"Três pessoas responderam. Duas disseram que pagariam por volta de R$ 6. A terceira disse que hoje não gasta com isso, mas que o problema incomoda."'),
        q('O que as respostas mostram?', 'Qual é a conclusão?', ['Há interesse, e o preço esperado é perto de R$ 6', 'Todo mundo vai comprar', 'Ninguém quer'], 0,
          'Duas de três pagariam, e disseram um valor.', 'Agora você tem um dado real, não um palpite.'),
      ] },
  ], [
    { title: 'Faça um curso de empreendedorismo',
      intro: 'O Mercado Central oferece dois cursos curtos para quem está começando um negócio.',
      done: 'Você se matriculou em "{c:curso}" e aprendeu a calcular o lucro de uma venda.',
      steps: [
        pick('curso', 'Qual curso combina com o seu momento?', 'Escolha o seu curso', [['Negócio do zero', 'Da ideia à primeira venda, passo a passo.'], ['Finanças para começar', 'Custos, preço e controle do dinheiro.']], 'Confirmar matrícula'),
        branch('curso', [[
          order('Primeira aula: o caminho de um negócio.', 'Organize as etapas', ['Ter uma ideia', 'Testar com clientes', 'Fazer a primeira venda', 'Melhorar'], 'Teste antes de vender, e melhore depois.', 'Ideia, teste, venda e melhoria.'),
        ], [
          match('Primeira aula: três palavras que você vai usar sempre.', 'Ligue os pares', [['Custo', 'O que você gasta para produzir'], ['Preço', 'O que o cliente paga'], ['Lucro', 'O preço menos o custo']], 'Uma é gasto, outra é cobrança, e a terceira é a diferença.', 'Custo, preço e lucro.'),
        ]]),
        calc('Um exercício: você vende um produto por R$ 8 e gasta R$ 5 para fazer.', 'Qual é o lucro por unidade? (R$)', 3, 'O lucro é o preço menos o custo: 8 − 5.', 'R$ 3 em cada venda.', 'count'),
      ] },
    { title: 'Calcule os seus custos e defina um preço',
      intro: 'Preço não se chuta: se calcula. Vamos fazer as contas do seu negócio.',
      done: 'Você somou os custos, calculou o custo por unidade e escolheu um preço que dá lucro.',
      steps: [
        calc('Para produzir 10 unidades, você gasta R$ 30 em materiais e R$ 10 em embalagens.', 'Qual é o custo total? (R$)', 40, 'Some: 30 + 10.', 'R$ 40 para produzir 10.', 'count'),
        calc('Agora por unidade.', 'Quanto custa cada unidade? (R$)', 4, 'Divida 40 por 10.', 'R$ 4 cada.'),
        q('Seus possíveis clientes disseram que pagariam cerca de R$ 6.', 'Qual preço você define?', ['R$ 3', 'R$ 4', 'R$ 6'], 2,
          'O preço precisa ser maior que o custo e caber no bolso do cliente.', 'R$ 6: cobre o custo, dá lucro e é o que o cliente espera pagar.'),
      ] },
    { title: 'Descreva o seu cliente ideal',
      intro: 'Quem tenta vender para todo mundo não vende para ninguém. Vamos definir o seu cliente.',
      done: 'Você descreveu o seu cliente ideal: "{c:cliente}".',
      steps: [
        q('Compare duas descrições.', 'Qual é a mais útil?', ['"Todo mundo"', '"Estudantes de 12 a 17 anos que saem da escola com fome ao meio-dia"', '"Pessoas legais"'], 1,
          'Uma boa descrição diz quem é, onde está e quando precisa.', 'Com essa descrição você sabe onde estar e a que horas.'),
        q('Sabendo quem é o cliente...', 'Onde encontrá-lo?', ['Na porta da escola, na hora da saída', 'Em outra cidade', 'Em casa, à meia-noite'], 0,
          'Vá aonde o cliente já está.', 'O ponto certo é metade da venda.', 'sell'),
        write('cliente', 'Agora o seu.', 'Descreva o SEU cliente ideal em uma frase', 'Quem é, onde está, quando precisa', 'Agora você sabe para quem está trabalhando.', 'idea'),
      ] },
  ], [
    { title: 'Crie a versão mais simples do seu produto',
      intro: 'Não espere ficar perfeito. Monte a versão mais simples que já dá para vender.',
      done: 'Você montou a versão mais simples do seu negócio, só com o essencial, pronta para os primeiros clientes.',
      steps: [
        multi('O que você realmente precisa para começar?', 'Marque os 3 essenciais', ['O produto', 'Um jeito de receber o pagamento', 'Um cartaz com o preço', 'Uma loja de três andares', 'Um aplicativo próprio'], [0, 1, 2],
          'Deixe de fora o que custa caro e pode esperar.', 'Produto, pagamento e preço à vista. É o que basta.'),
        tap('Monte a sua banca.', 'Arrume os produtos na banca', 'Arrumar', 4, 'Banca montada. Simples e convidativa.', 'count'),
        q('Por que começar simples?', 'Para que serve a primeira versão?', ['Para aprender rápido com clientes de verdade', 'Para impressionar os concorrentes', 'Para nunca mais mudar'], 0,
          'Você ainda não sabe o que os clientes vão achar.', 'Cada cliente vai ensinar algo que nenhum plano mostra.'),
      ] },
    { title: 'Faça a sua primeira venda',
      intro: 'O primeiro cliente está chegando. Atenda bem e acerte as contas.',
      done: 'Você atendeu o primeiro cliente, calculou o total e o troco e fez sua primeira venda.',
      steps: [
        q('Um cliente se aproxima da banca.', 'Como você recebe?', ['"Compra aí!"', '"Oi! Quer conhecer o que temos hoje?"', 'Fica em silêncio'], 1,
          'Um bom atendimento convida sem pressionar.', 'Ele sorriu e se aproximou.', 'sell'),
        calc('Ele quer 2 unidades de R$ 7.', 'Qual é o total? (R$)', 14, 'Multiplique: 2 × 7.', 'R$ 14.'),
        calc('Ele paga com uma nota de R$ 20.', 'Qual é o troco? (R$)', 6, 'Subtraia: 20 − 14.', 'Troco certo, cliente satisfeito. Sua primeira venda!', 'sell'),
      ] },
    { title: 'Anote o que deu certo e ajuste',
      intro: 'O primeiro dia de vendas terminou. O que os resultados ensinam?',
      done: 'Você transformou os resultados do primeiro dia em ajustes e calculou o lucro.',
      steps: [
        match('Três situações do primeiro dia.', 'Ligue cada uma ao ajuste certo', [['"Vendi tudo em 20 minutos"', 'Produzir mais'], ['"Reclamaram do preço"', 'Explicar o valor ou rever custos'], ['"Ninguém viu a banca"', 'Melhorar o cartaz e o ponto']],
          'Pense na causa de cada situação.', 'Cada problema mostra o próximo passo.'),
        calc('Você vendeu 10 unidades a R$ 7 e gastou R$ 40.', 'Qual foi o lucro? (R$)', 30, 'Recebeu 10 × 7 e gastou 40.', 'R$ 30 de lucro no primeiro dia.', 'count'),
      ] },
  ], [
    { title: 'Crie uma página para o seu negócio',
      intro: 'Quem não é visto não é lembrado. Vamos criar a página do seu negócio.',
      done: 'Você definiu as informações da página e criou um banner legível para o negócio.',
      steps: [
        multi('O que o cliente procura na sua página?', 'Marque 3', ['O que você vende', 'O preço', 'Como comprar', 'Sua opinião sobre política', 'Fotos borradas'], [0, 1, 2],
          'O cliente quer saber o quê, quanto e como.', 'O quê, quanto e como comprar.'),
        design('Agora o banner da página.', 'Briefing: nome do negócio em destaque e fácil de ler.', ['MEU NEGÓCIO', 'Peça já o seu'],
          [dTam([1]), dCor(['Cinza sobre cinza', 'Vermelho e amarelo', 'Amarelo sobre branco'], [1])], 'Nome grande e cores com contraste.', 'Dá para ler até na tela do celular. Página no ar!'),
      ] },
    { title: 'Organize um controle de entradas e saídas',
      intro: 'Sem controle, você não sabe se está ganhando ou perdendo. Vamos organizar o caixa.',
      done: 'Você separou entradas de saídas, calculou o saldo e entendeu por que não misturar as contas.',
      steps: [
        multi('Entrada é o dinheiro que chega.', 'Marque só as ENTRADAS', ['Venda de 10 unidades', 'Compra de materiais', 'Encomenda paga por uma cliente', 'Embalagens', 'Passagem de ônibus'], [0, 2],
          'Entrada é o que você recebe; o resto é gasto.', 'Duas entradas e três saídas.', 'count'),
        calc('No fim da semana: entradas de R$ 120 e saídas de R$ 75.', 'Qual é o saldo? (R$)', 45, 'Subtraia: 120 − 75.', 'R$ 45 positivos.'),
        q('Um erro comum de quem começa.', 'O que acontece ao misturar o dinheiro do negócio com o seu?', ['Fica impossível saber se o negócio dá lucro', 'Nada', 'O lucro dobra'], 0,
          'Sem separar, as contas se confundem.', 'Um caderno ou uma planilha só para o negócio resolve.'),
      ] },
    { title: 'Pesquise como formalizar o negócio',
      intro: 'Formalizar dá direitos e abre portas. Entenda como funciona o registro de microempreendedor individual (MEI).',
      done: 'Você entendeu o que é o MEI, seus benefícios e o que precisa para se registrar quando tiver idade.',
      steps: [
        q('Primeiro, o básico.', 'O que é o MEI?', ['Um registro simples para quem trabalha por conta própria', 'Um imposto sobre lanches', 'Um curso'], 0,
          'É a forma mais simples de ter um negócio registrado.', 'Um registro simples para pequenos negócios.'),
        multi('Formalizar traz vantagens.', 'Quais são benefícios do MEI? Marque 3', ['Ter CNPJ', 'Emitir nota fiscal', 'Contribuir para a previdência', 'Nunca mais pagar nada', 'Ganhar um carro'], [0, 1, 2],
          'Dois itens são bons demais para ser verdade.', 'Com CNPJ você vende para empresas e garante direitos.'),
        q('Um detalhe importante: você tem 17 anos.', 'O que isso significa para o MEI?', ['Posso me registrar hoje, sem condição nenhuma', 'A regra geral pede 18 anos; até lá, eu me informo e me planejo', 'Nunca vou poder me registrar'], 1,
          'A regra geral pede maioridade.', 'Isso. Enquanto isso, você organiza o negócio e chega pronto.'),
        order('Quando chegar a hora, o caminho é este.', 'Organize os passos', ['Conferir se a atividade é permitida', 'Juntar os documentos', 'Fazer o cadastro no portal oficial', 'Guardar o certificado'],
          'Confira antes de cadastrar, e guarde o certificado no fim.', 'Você já sabe o caminho. O negócio está pronto para crescer.', 'count'),
      ] },
  ]],
};

/* Os títulos das missões vêm das atividades (uma fonte só). */
Object.keys(ACTIVITIES).forEach(t => ACTIVITIES[t].forEach((acts, s) => { TRAILS[t].stages[s].missions = acts.map(a => a.title); }));

/* Trechos de código usados por etapas "calc" de programação. */
ACTIVITIES.dev[0][2].steps[1].code = 'for i in range(3):\n    print("oi")';
ACTIVITIES.dev[0][2].steps[1].out = 'oi\noi\noi';
ACTIVITIES.dev[1][0].steps[1].code = 'def dobro(x):\n    return x * 2\n\nprint(dobro(4))';
ACTIVITIES.dev[1][0].steps[1].out = '8';
