# VITTA — versão web

Versão simples do projeto de extensão VITTA em HTML, CSS e JavaScript, com Bootstrap via CDN.

## Como executar

Abra `index.html` no navegador. Para testar com um servidor local, execute na pasta:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## O que já funciona

- Navegação responsiva entre as seções.
- Diário de emoções com registro salvo no navegador.
- Inclusão e remoção de lembretes na agenda.
- Conteúdos educativos em modal.
- Layout adaptado para celular e computador.
- Logo oficial do VITTA aplicada no cabeçalho.
- Navegação por sessões com botões de avanço e retorno.

Sem configurar o banco, o site continua usando `localStorage` apenas neste navegador.

## Ativar MySQL e login no InfinityFree

1. No painel do InfinityFree, crie um banco em **MySQL Databases**.
2. Abra o phpMyAdmin e execute o arquivo `schema.sql`.
3. Edite `api/config.php` com o host, nome, usuário e senha do banco.
4. Envie `index.html`, `style.css`, `script.js`, `assets/` e `api/` diretamente para `htdocs`.
5. Teste o botão **Entrar** e crie um usuário com nome de usuário e senha.

O botão **Entrar** abre `login.html`, que possui os fluxos de login e cadastro e retorna para `index.html` após o sucesso.

O navegador continua usando JavaScript; os arquivos PHP da pasta `api/` fazem a ponte segura com o MySQL. Sem preencher `api/config.php`, o site continua funcionando localmente com `localStorage`, mas não sincroniza dados online.

### Diário alimentar em um banco já existente

Se o banco atual já está criado e em uso, execute uma vez o conteúdo de `migration_diario_alimentar.sql` no phpMyAdmin. Depois, envie o novo arquivo `api/food-diary.php` e os arquivos atualizados do site para `htdocs`.


## Atualização da Área Kids

- Jogo de coleta com personagem controlável por teclado ou toque.
- Barra fictícia de bem-estar, pontuação, dificuldade progressiva e finais de vitória/rodada encerrada.
- O jogo esclarece que seus efeitos são regras de fantasia e não representam orientação nutricional.
- O conteúdo educativo agora explica a diferença entre comportamento alimentar transtornado e transtorno alimentar.

### Atualização do jogo da Área Kids

O minijogo agora usa um layout em três áreas no computador: personagem à esquerda, área de coleta ao centro e painel de desempenho à direita. O painel mostra pontuação, barra de bem-estar fictício e um gráfico com a evolução durante a rodada. O personagem usa `assets/kids-character.png`, derivado do modelo fornecido. Em telas menores, os painéis se reorganizam para manter os controles acessíveis.


### Atualização visual do jogo Kids
- O cenário pixel-art fica em `assets/kids-game-background.webp`.
- O bonequinho mantém a proporção original e recebe expressões conforme o bem-estar fictício da partida.
- No computador, o campo de jogo usa uma área maior em formato paisagem.
