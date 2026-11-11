# Trilha — RPG de Profissões

Jogo de chat em estilo RPG 16-bits. Você cria um personagem, escolhe uma trilha de
profissão e evolui cumprindo missões **da vida real**: fazer o curso, praticar,
montar portfólio e manter pequenos hábitos diários.

## Como jogar

Abra o `index.html` no navegador — não precisa instalar nada.

1. **Personagem** – 6 opções, cada uma com uma profissão de origem.
2. **Nome** – como você será chamado no jogo.
3. **Origem** – humilde, classe média, rica ou *deixar o acaso decidir* (sorteio).
   Quem começa com menos moedas ganha mais XP (bônus de Garra).
4. **Trilha** – Programação, Design, Saúde, Gastronomia, Educação ou
   Empreendedorismo. Seguir a profissão do personagem dá +10% de XP.

No jogo, converse com o **Mestre Ori** pelos botões ou digitando
(`missões`, `feito 2`, `diárias`, `status`, `loja`, `diário`, `ajuda`).

- **Missões da trilha**: 4 etapas com 3 missões cada. Ao concluir, conte o que
  aprendeu — o relato vai para o seu diário e vale XP extra.
- **Missões do dia**: 3 hábitos sorteados a cada dia; mantêm a sequência (🔥).
- **Loja**: gaste moedas em café (XP em dobro), livro (+XP) ou troca das diárias.

O progresso fica salvo no próprio navegador (`localStorage`).

## Publicar no GitHub Pages

Em *Settings → Pages*, escolha a branch e a pasta `/ (root)`. O jogo é só
HTML, CSS e JavaScript, sem etapa de build.

## Estrutura

| Arquivo | O que tem |
| --- | --- |
| `js/data.js` | Personagens, origens, trilhas, missões e loja — edite aqui o conteúdo |
| `js/sprites.js` | Personagens em pixel art desenhados por código |
| `js/scene.js` | Cenário animado da vila |
| `js/game.js` | Criação de personagem, chat, missões e progresso |
