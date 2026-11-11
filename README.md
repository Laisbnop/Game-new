# Trilha — RPG de Profissões

RPG de história em pixel art 16-bits. Você cria um personagem de 17 anos,
escolhe uma trilha profissional e evolui, dia após dia, realizando as missões
como **atividades jogáveis**: aulas, exercícios, projetos e atendimentos
inspirados na vida real de cada profissão. Enquanto isso, a história da sua
família acontece em casa.

## Como jogar

Abra o `index.html` no navegador (com as pastas `css/` e `js/` ao lado) ou
jogue pelo GitHub Pages. Não precisa instalar nada.

### Criação do personagem

Cada jogador cria o próprio personagem, nesta ordem:

1. **Gênero** — feminino, masculino ou não-binário (muda só a roupa).
2. **Cor da pele** — seis tons.
3. **Tipo de cabelo** — careca, longo liso, longo ondulado, crespo, cacheado ou tranças.
4. **Cor do cabelo** — oito cores.
5. **Nome.**
6. **Contexto socioeconômico** — pobre, classe média, rico ou *deixar o destino decidir*.
7. **Trilha profissional** — Programação, Design, Saúde, Gastronomia, Educação ou Empreendedorismo.

Uma prévia em pixel art acompanha as escolhas, e essa aparência é a usada no jogo.
Aparência e gênero não influenciam profissão, dinheiro, história nem recompensas.
Todo personagem começa com 17 anos; a idade não avança sozinha.

### Contexto socioeconômico

É a realidade da **família** do personagem, não uma fortuna ou carreira dele.

- Todos começam com o mesmo dinheiro pessoal (10 moedas) e ganham o mesmo XP e
  as mesmas moedas por missão. Não há bônus nem multiplicadores por origem.
- O contexto muda a **história**: a casa, a rotina, os recursos disponíveis e os
  dilemas. Cada contexto tem seis capítulos com escolhas próprias — por exemplo,
  conciliar trabalho e estudo, decidir o que cabe no orçamento da família ou
  lidar com a pressão para seguir uma carreira já escolhida pelos pais.
- Nenhuma escolha é "errada": todas dão a mesma recompensa e mudam apenas o
  rumo da história, registrado em "Suas escolhas" na ficha.
- A renda pessoal (mesada ou salário) só aparece depois da conversa sobre
  dinheiro, no capítulo 3.

### Deixar o destino decidir

Não há sorteio na tela. A condição é definida uma única vez, ao iniciar a
partida, e fica salva e **oculta**: o HUD e a ficha não a mostram. O jogador
descobre pela história — a casa onde mora, as conversas com o responsável e os
recursos que tem. Depois do capítulo 3, a ficha passa a mostrar o contexto.

### Tela principal

O cenário e o personagem são o foco. Na tela ficam só um HUD compacto (nome,
idade, nível, moedas e dia), o objetivo atual e os botões:

- **Iniciar / Continuar atividade / Receber recompensa** — abre a missão atual da trilha.
- **Ir para casa / Ir para a praça** — muda de cenário. Os capítulos da história acontecem em casa.
- **Conversar** — o Mestre Ori (praça) explica a missão conforme o estado dela e
  oferece o próximo passo; em casa, fala o responsável.
- **Missões** — trilha (4 etapas com 3 missões) e treinos do dia.
- **Diário** — atividades concluídas, reflexões e escolhas da história.
- **Loja** — mochila e itens (café: XP em dobro; livro: +XP; trocar os treinos do dia).
- **Ficha** — personagem, curso, progresso, família (quando descoberta) e escolhas.

Novos capítulos da história são liberados conforme o número de atividades
concluídas (0, 1, 3, 5, 8 e 11).

### Missões são atividades jogáveis

Cada uma das 72 missões (6 trilhas × 12) é uma atividade realizada dentro do
jogo, em uma sala própria da profissão (cozinha, laboratório, ateliê, sala de
treino, sala de aula ou banca), com o personagem criado e um professor.

1. O Mestre Ori explica a missão e oferece **Iniciar atividade**.
2. A atividade tem de 2 a 5 etapas. Conforme a missão, o jogador escolhe um
   curso, seleciona ingredientes ou itens, coloca passos em ordem, liga pares,
   faz contas, monta comandos para um robô, ajusta uma composição até atender
   ao briefing, escreve uma frase ou executa uma ação (mexer, cortar, digitar,
   escrever no quadro...). O personagem anima a cada ação.
3. Resposta errada mostra uma orientação e permite tentar de novo; nada trava.
4. Com todas as etapas cumpridas aparece o resultado e o botão
   **Receber recompensa**. Depois dele, o jogo mostra o próximo objetivo e
   oferece uma reflexão opcional para o diário.

Não existe conclusão por clique nem por relato: a missão só é concluída quando
o jogo confere todas as etapas. As missões de uma etapa são feitas em ordem.
Escolhas de curso valem de verdade: em Gastronomia, "Culinária do dia a dia" e
"Introdução à confeitaria" levam a aulas diferentes.

Dá para **sair** de uma atividade a qualquer momento e retomá-la da etapa em
que parou — inclusive depois de fechar o jogo. A recompensa é entregue uma
única vez, mesmo com cliques repetidos ou ao recarregar a página.

**Treinos do dia**: até 3 atividades já concluídas da trilha, sorteadas a cada
dia, para refazer como prática (+15 XP e +8 moedas cada; +20 moedas pelos três).
Mantêm a sequência de dias.

## Salvamento

O progresso fica no navegador (`localStorage`): aparência, nome, idade, trilha,
condição familiar, estado da descoberta, história, curso escolhido, atividade em
andamento (com a etapa), resultados, missões concluídas e diário. Para
continuar outro dia, use o mesmo navegador e aparelho.

Jogos salvos da versão anterior (com personagens prontos) são detectados na
tela de título e podem ser **convertidos**: nome, trilha, nível, moedas,
missões e diário são mantidos; a aparência é aproximada e a história da
família começa do início. Nada é apagado sem aviso — um jogo salvo só é
substituído depois de uma confirmação.

## Publicar no GitHub Pages

Em *Settings → Pages*, escolha *Deploy from a branch*, a branch desejada e a
pasta `/ (root)`. O jogo é só HTML, CSS e JavaScript, sem etapa de build.

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `index.html` | Página de entrada |
| `css/style.css` | Visual da interface |
| `js/data.js` | Contextos, trilhas e loja |
| `js/activities.js` | As 72 atividades (uma por missão) e os professores |
| `js/activity.js` | Motor das atividades: etapas, conferência e interações |
| `js/story.js` | Capítulos da história de cada contexto |
| `js/sprites.js` | Personagens em pixel art gerados a partir da aparência |
| `js/scene.js` | Cenários da praça, das casas e das salas de atividade |
| `js/game.js` | Salvamento, criação, diálogos, progresso e painéis |

Toda a arte é desenhada por código, sem imagens de terceiros.
