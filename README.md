# Trilha — uma vida no campo

RPG de vida no campo em pixel art 16-bits. Você chega aos 17 anos ao Sítio
Beira-Rio, uma propriedade abandonada que a Vila Aroeira decidiu confiar a
quem tivesse coragem de recomeçá-la. Com ferramentas usadas e algumas moedas,
você planta, cuida de galinhas, explora o bosque e conhece os moradores. Não há
profissões nem fim obrigatório: os dias passam, a fazenda evolui e as amizades
crescem.

## Como jogar

Abra o `index.html` no navegador (com as pastas `css/` e `js/` ao lado) ou jogue
pelo GitHub Pages. Não precisa instalar nada.

| Ação | Computador | Celular |
| --- | --- | --- |
| Andar | Setas (ou W, A, S, D) | Direcional na tela |
| Interagir (porta, baú, cama, morador, galinha) | Clique no alvo | Toque no alvo |
| Usar a ferramenta, semente ou muda | Clique na terra ou no objeto | Toque na terra ou no objeto |
| Escolher o item da barra | Clique na barra ou teclas 1 a 9 e 0 | Toque na barra |
| Avançar conversa | Clique na caixa, E, Espaço ou Enter | Toque na caixa de conversa |
| Fechar painel | Esc ou clique fora | Botão ✕ |

**Só funciona de perto.** O alvo precisa estar ao lado do personagem (na fazenda,
o quadrado onde você está ou um vizinho). Ao passar o mouse sobre algo, ele fica
destacado e o nome da ação aparece na parte de baixo do cenário; se estiver longe,
a dica diz para chegar mais perto, e o clique não faz nada além de avisar. O
personagem se vira para o alvo e executa a animação.

**A ação depende do item na mão.** Machado corta galhos, árvores e tocos;
picareta quebra pedras e rochas; foice (ou espada) corta o mato; enxada prepara a
terra; regador rega (e se enche clicando no lago); semente planta em terra
preparada; espada golpeia o boneco de treino. Plantação madura e árvore com
frutos se colhem com qualquer item. Com a ferramenta errada nada é removido e
nenhuma energia é gasta: uma dica curta diz qual usar.

**Vários golpes.** Galhos, pedras, tocos, árvores e rochas resistem: cada clique
com a ferramenta certa é um golpe, com animação, lascas e energia gasta. Uma
barrinha mostra quanto falta. Segurar o botão não repete golpes, e cliques
durante a animação são ignorados. O dano parcial fica salvo, mesmo trocando de
ferramenta, saindo da área ou fechando o jogo. Sem energia, o golpe não
acontece; com a mochila cheia, o golpe final espera até haver espaço.

| Objeto | Ferramenta | Golpes | Rende |
| --- | --- | --- | --- |
| Mato | foice ou espada | 1 | — |
| Galho | machado | 2 | 1 madeira |
| Pedra | picareta | 3 | 1 pedra |
| Toco | machado | 4 | 2 madeiras |
| Árvore do bosque | machado | 5 | 3 madeiras (fica um toco) |
| Rocha do bosque | picareta | 5 | 2 pedras |

Com um painel ou conversa aberta, cliques no cenário não fazem nada.

## Personagem

Na criação: gênero, tom de pele, cabelo (13 cortes, do careca às tranças, rabo
de cavalo e coque), cor do cabelo, roupa de cima (camiseta, camisa, blusa ou
jardineira), roupa de baixo (calça, short ou saia), calçado, cores de cada peça
e nome. Qualquer cabelo e roupa serve para qualquer gênero. A aparência vale nas
quatro direções e no uso das ferramentas. O guarda-roupa de casa permite mudar
cabelo, roupas e chapéu a qualquer momento. A idade é 17 anos e não avança.

## O mapa

Um mapa externo maior que a tela, com a câmera acompanhando o personagem:

- **Fazenda** (oeste): casa, 200 canteiros de terra — parte tomada por mato,
  galhos, pedras e tocos —, lago para encher o regador, galinheiro com cercado e um
  boneco de treino.
- **Vila** (centro): praça com fonte, Armazém e as casas dos moradores.
- **Bosque** (leste): árvores comuns, rochas, amoras, cogumelos e flores.

Interiores: a **casa** (cama, baú e guarda-roupa) e o **Armazém**.

## Fazenda

- **Ferramentas** (gastam energia a cada uso ou golpe): enxada ara, regador rega
  (10 usos por carga), machado corta galhos, tocos e árvores comuns, picareta
  quebra pedras, foice corta o mato. A espada simples serve para treinar no boneco.
- **Cultivos**: rabanete (2 dias, semente 8, vende 18), tomate (4 dias, 15 → 40)
  e abóbora (6 dias, 25 → 75). Cada dia regado conta um dia de crescimento; sem
  rega a planta pausa, mas não morre. O crescimento acontece só ao dormir.
- **Árvores frutíferas**: laranjeira e goiabeira. A muda precisa de grama livre,
  sem outra árvore encostada. Ficam adultas em 5 ou 6 dias e dão 2 frutos a cada
  3 dias. Não precisam de rega.
- **Galinhas**: a primeira vem de uma missão; outras são vendidas no Armazém
  (até 4). Cada porção de ração no comedouro alimenta uma galinha por noite, e
  galinha alimentada bota um ovo, que aparece no ninho na manhã seguinte. Dá
  para dar nome, fazer carinho (uma vez por dia) e ver o bem-estar.
- **Bosque**: a árvore cortada deixa um toco, que também pode ser removido;
  ela volta em 4 dias e as rochas em 3. Os itens de coleta mudam de lugar todo dia.

## Moradores e amizade

Cinco moradores, cada um com rotina, personalidade e gostos: Dona Celeste
(Armazém), Seu Honório, Bia, Tomé e Iara. A amizade vai de 0 a 5 corações:

- clique no morador para conversar; a primeira conversa do dia dá pontos; as seguintes continuam disponíveis, sem pontos;
- cada morador aceita um presente por dia (com um produto na mão, a conversa oferece a opção), e os preferidos rendem mais;
- com 1 coração surge o pedido pessoal de cada um; com 3, uma pequena cena e um presente;
- as falas mudam conforme a amizade. Não há romance.

## Missões

As primeiras ensinam jogando: chegar à vila, a primeira plantação, a primeira
colheita, o galinheiro e o primeiro ovo. Depois vêm os pedidos pessoais (o banco
da praça, o chapéu perdido, flores para a tela, a encomenda de tintas, ovos para
a festa). O **Diário** mostra quem pediu, objetivo, progresso e recompensa.
Toda missão depende de ações no mundo; itens entregues saem da mochila e a
recompensa é dada uma única vez.

## Dias, energia e loja

O relógio vai das 6h até o fim da noite, com a luz mudando entre manhã, tarde e
noite, e para enquanto há conversa ou painel aberto. Nada de ruim acontece se anoitecer: o dia só termina quando você dorme, o
que recupera a energia e mostra um resumo da noite. Andar e conversar não
gastam energia.

O Armazém (Dona Celeste atende das 6h às 18h) vende sementes, mudas, ração,
galinhas e um chapéu, e compra colheitas, ovos, frutos, madeira, pedra e itens
do bosque. Preço, quantidade e total aparecem antes de confirmar.

## Itens

Mochila com 20 espaços (os 10 primeiros são a barra de acesso rápido) e baú com
20. Itens iguais empilham até 99. Se a mochila estiver cheia, o item fica onde
está e o jogo avisa. Três chapéus equipáveis: de palha, boina e de pescador.

## Salvamento

O progresso fica no navegador (`localStorage`): personagem e aparência, posição,
dia e horário, mochila, baú, moedas, canteiros, árvores, galinhas, amizades,
limites diários, missões e mudanças no mapa. Use o mesmo navegador e aparelho
para continuar.

Jogos salvos das versões com profissões não têm como continuar, porque a
estrutura da partida mudou. A tela de título explica isso e oferece começar a
nova fazenda mantendo o nome e a aparência. O jogo antigo não é apagado.

## Publicar no GitHub Pages

Em *Settings → Pages*, escolha *Deploy from a branch*, a branch desejada e a
pasta `/ (root)`. O jogo é só HTML, CSS e JavaScript, sem etapa de build.

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Página de entrada |
| `css/style.css` | Visual da interface |
| `js/data.js` | Itens, cultivos, árvores, moradores, missões e loja |
| `js/sprites.js` | Personagens em pixel art (cabelos, roupas, chapéus, 4 direções) |
| `js/world.js` | Mapa, interiores, colisão, câmera, ícones e desenho do mundo |
| `js/game.js` | Salvamento, criação, ferramentas, fazenda, moradores, missões e painéis |

Toda a arte é desenhada por código, sem imagens de terceiros.
