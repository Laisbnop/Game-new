# Trilha — RPG de vida na vila

RPG em pixel art 16-bits. Você cria um personagem de 17 anos que já começa
trabalhando na profissão escolhida, explora uma vila caminhando, entra nas
construções, conhece os moradores e cumpre as tarefas do dia. À noite, volta
para casa e dorme para começar o dia seguinte. Enquanto isso, a história da sua
família acontece em casa.

## Como jogar

Abra o `index.html` no navegador (com as pastas `css/` e `js/` ao lado) ou jogue
pelo GitHub Pages. Não precisa instalar nada.

| Ação | Teclado | Celular |
| --- | --- | --- |
| Andar | Setas (ou W, A, S, D) | Direcional na tela |
| Interagir com pessoas, portas e objetos | E ou Espaço | Botão E |
| Avançar conversa | E, Espaço ou Enter | Toque na caixa de conversa |
| Fechar painel | Esc | Botão ✕ |

Quando há algo para interagir por perto, aparece um "E" sobre o personagem e o
nome da ação na parte de baixo do cenário. Uma seta amarela aponta para o
objetivo atual. Com conversa, bancada de trabalho ou painel aberto, o
personagem não anda.

## Criação do personagem

Gênero, cor da pele, tipo de cabelo (careca, longo liso, longo ondulado, crespo,
cacheado ou tranças), cor do cabelo, nome, contexto socioeconômico e profissão.
A aparência escolhida vale em todo o jogo, nas quatro direções de caminhada, e
não influencia profissão, dinheiro nem história. A idade começa em 17 anos e
não avança com os dias.

### Contexto socioeconômico

É a realidade da **família**: pobre, classe média, rico ou *deixar o destino
decidir*. Todos começam com as mesmas 20 moedas e ganham o mesmo por tarefa. O
contexto muda a casa (por fora e por dentro) e os seis capítulos da história,
vividos em conversas com o responsável.

Com *deixar o destino decidir* não há sorteio na tela: a condição é definida uma
única vez, fica salva e oculta. O jogador descobre pela casa onde acorda e pelas
conversas; a ficha só mostra o contexto depois do capítulo 3.

## A vila

O mapa é maior que a tela e a câmera acompanha o personagem. Paredes, árvores,
móveis, cercas, água e pessoas são obstáculos; o rio só se atravessa pela ponte.

- **Sua casa**: cama (encerra o dia), baú (guarda itens) e decoração conforme a família.
- **Praça**: fonte, quadro de avisos (cartazes feitos pelo designer), mural de arte (quadros do pintor) e o Mestre Ori, que lembra o objetivo.
- **Locais de trabalho com interior próprio**: Hospital, Restaurante, Estúdio de Design, Ateliê de Pintura, Ferraria, Oficina Mecânica, Torre de Magia, Guilda dos Códigos, Escola e Mercado.
- **Fazenda**: 18 canteiros, celeiro e galinheiro, do outro lado do rio.
- **Casas de moradores** e oito moradores que fazem pedidos e conversam.

No Mercado, Dona Marta vende lanche (recupera energia) e vaso de flor (enfeita a
casa) e compra a colheita.

## Profissões

Não há cursos nem aulas obrigatórias: o aprendizado acontece no serviço, com
dicas do colega de trabalho. Cada tarefa é feita com ações no cenário.

| Profissão | Local | O que se faz |
| --- | --- | --- |
| Médico | Hospital | Chama o paciente, avalia com instrumentos, busca o cuidado no armário, aplica e registra. Situações leves e cuidados fictícios. |
| Cozinheiro | Restaurante | Anota o pedido, busca ingredientes, corta no ritmo, controla o fogo e serve. |
| Designer | Estúdio de Design | Conversa com quem pediu, monta o cartaz arrastando elementos e escolhendo cores e letra, e pendura na praça. Qualquer composição legível vale. |
| Artista — pintor | Ateliê de Pintura | Separa tintas, pinta livremente em uma tela e expõe a obra no mural da praça e no ateliê. |
| Ferreiro | Ferraria | Separa materiais, aquece o metal, martela no ritmo, tempera e entrega. |
| Mecânico | Oficina Mecânica | Inspeciona a bicicleta, acha as peças gastas, busca peças, aperta e testa. |
| Feiticeiro | Torre de Magia | Colhe ervas-lua pela vila, mexe a poção e repete a sequência de runas. |
| Fazendeiro | Fazenda | Ara, planta, rega e colhe. As plantas crescem a cada noite se regadas. |
| Programador | Guilda dos Códigos | Monta a rota de um autômato com comandos e entrega ao morador. |
| Professor | Escola da Vila | Separa o material, escreve na lousa e tira a dúvida de um aluno. |
| Comerciante | Mercado | Repõe a banca, atende o cliente e dá o troco. |

Cada tarefa informa quem pediu, onde é feita, os passos, o progresso e o
resultado (painel **Tarefas**). Só é concluída quando o jogo confere todos os
passos; errar mostra uma orientação e permite tentar de novo. Ao terminar, a
consequência aparece no mundo — cartaz no quadro, quadro exposto, ferramenta ao
lado do morador, prato na mesa, plantação crescendo — e a recompensa é entregue
uma única vez.

## O dia

1. Acorda em casa às 6h, com 100 de energia.
2. Consulta os compromissos em **Tarefas** (duas no primeiro dia, três depois).
3. Caminha até o trabalho e faz as tarefas. Cada passo gasta energia e tempo.
4. Pode explorar, conversar e passar no Mercado.
5. Volta para casa e dorme na cama.

Ao dormir aparece um resumo: tarefas feitas, ganhos, nível e crescimento das
plantações. Tarefas não terminadas **continuam no dia seguinte**. Sem energia, o
trabalho não começa: é preciso comer um lanche ou dormir.

## Interface

O cenário é o foco. Na tela ficam só o HUD (dia, horário, moedas e energia) e o
objetivo atual. **Tarefas**, **Mochila**, **Diário** e **Ficha** abrem em um
painel. A bancada de trabalho abre logo abaixo do cenário, no local da tarefa.

## Salvamento

O progresso fica no navegador (`localStorage`): aparência, nome, profissão,
contexto familiar e estado da descoberta, dia e horário, local e posição,
mochila, baú e moedas, tarefas e passos em andamento, cartazes, quadros e
enfeites, canteiros e recompensas já recebidas. Para continuar outro dia, use o
mesmo navegador e aparelho.

Jogos salvos de versões anteriores são detectados na tela de título e podem ser
**convertidos**: aparência, nome, profissão (Saúde vira Médico), contexto
familiar, história já vivida, nível, moedas e diário são mantidos. Os cursos e
as missões antigas deixaram de existir, e a rotina recomeça no dia 1. Nada é
apagado sem aviso e confirmação.

## Publicar no GitHub Pages

Em *Settings → Pages*, escolha *Deploy from a branch*, a branch desejada e a
pasta `/ (root)`. O jogo é só HTML, CSS e JavaScript, sem etapa de build.

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Página de entrada |
| `css/style.css` | Visual da interface |
| `js/data.js` | Contextos, profissões, moradores e itens |
| `js/story.js` | Capítulos da história de cada contexto |
| `js/sprites.js` | Personagens em pixel art, nas quatro direções |
| `js/world.js` | Vila, interiores, colisão, câmera e desenho do mundo |
| `js/tasks.js` | Tarefas de cada profissão e suas variações |
| `js/minigames.js` | Interações de trabalho (ritmo, calor, runas, inspeção, cartaz, pintura...) |
| `js/game.js` | Salvamento, criação, movimento, interação, dia e painéis |

Toda a arte é desenhada por código, sem imagens de terceiros.
