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

Os dados são apenas demonstrativos e ficam no `localStorage`; não há banco de dados nem autenticação.
