# Trilha — RPG de Profissões

RPG de história em pixel art 16-bits. Você cria um personagem de 17 anos,
escolhe uma trilha profissional e evolui, dia após dia, cumprindo missões
**da vida real**: fazer o curso, praticar, montar portfólio e manter pequenos
hábitos. Enquanto isso, a história da sua família acontece em casa.

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

- **Ir para casa / Ir para a praça** — muda de cenário. Os capítulos da história acontecem em casa.
- **Conversar** — fala com o Mestre Ori (praça) ou com o responsável (casa).
- **Missões** — trilha (4 etapas com 3 missões) e 3 missões do dia. Ao concluir
  uma missão da trilha, você pode escrever um relato (+10 XP), que vai para o diário.
- **Diário** — relatos e escolhas da história.
- **Loja** — mochila e itens (café: XP em dobro; livro: +XP; trocar as missões do dia).
- **Ficha** — personagem, progresso, família (quando descoberta) e escolhas.

Os diálogos aparecem em uma caixa de conversa somente quando algo acontece.
Novos capítulos são liberados conforme o número de missões cumpridas
(0, 1, 3, 5, 8 e 11).

## Salvamento

O progresso fica no navegador (`localStorage`): aparência, nome, idade, trilha,
condição familiar, estado da descoberta, história, missões e diário. Para
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
| `js/data.js` | Contextos, trilhas, missões e loja |
| `js/story.js` | Capítulos da história de cada contexto |
| `js/sprites.js` | Personagens em pixel art gerados a partir da aparência |
| `js/scene.js` | Cenários da praça e das casas |
| `js/game.js` | Salvamento, criação, diálogos, missões e painéis |

Toda a arte é desenhada por código, sem imagens de terceiros.
