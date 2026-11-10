# GeoGame Rotas

Jogo de adivinhar caminhos entre países por fronteiras terrestres, com fichas de clima, demografia, economia, história e política dos 198 países e uma trivia ao final de cada partida (uma pergunta por país da rota, num banco de 2.970 perguntas).

## Publicar

O jogo inteiro está em **`index.html`**: código, dados e textos num arquivo só. Para colocar numa página, envie esse arquivo para qualquer hospedagem de site estático, por exemplo:

- **GitHub Pages**: crie um repositório, envie o `index.html` e ative *Settings → Pages*.
- **Netlify Drop**: arraste a pasta com o `index.html` para app.netlify.com/drop.
- **Seu próprio servidor**: copie o `index.html` para a pasta pública do site.

Também dá para abrir o `index.html` direto no navegador, com duplo clique.

### O que a página baixa da internet

- **Contornos dos países**: amCharts geodata (`worldLow.js`) via cdnjs. Se não carregar, o jogo mostra um mapa simplificado com um ponto por país e funciona normalmente.
- **Fontes tipográficas**: Google Fonts. Sem internet, o navegador usa fontes do sistema.

O progresso do desafio do dia e a opção "modo desafio" ficam salvos no navegador de cada jogador (localStorage).

## Editar e gerar de novo

A pasta `fonte/` tem os arquivos usados para montar o `index.html`:

| Arquivo | O que contém |
|---|---|
| `src/data.js` | Países (nome, capital, continente, apelidos) e a lista de fronteiras |
| `src/stats.js` | População, área e PIB de cada país, com as fontes |
| `src/info/*.txt` | Textos das fichas, por região (linhas `C:` clima, `D:` demografia, `E:` economia, `H:` história, `P:` política) |
| `src/quiz/*.txt` | Banco da trivia, por região: 15 perguntas por país, uma por linha (`TEMA\|pergunta\|certa\|errada1\|errada2\|errada3\|explicação`; temas H história, G geografia, T turismo, C cinema/cultura, E economia, P geopolítica) |
| `src/logic.js` | Regras do jogo: distâncias, sorteio, cores, dicas |
| `src/app.js` | Interface, mapa, ficha, modo desafio e trivia |
| `src/template.html` | HTML e estilos |
| `build/d3.min.js` | Partes da biblioteca d3 usadas no mapa |
| `build.mjs` | Script que junta tudo em `index.html` |

Depois de editar, rode na pasta `fonte/` (precisa do Node.js 18 ou mais novo):

```
node build.mjs
```

O novo `index.html` aparece dentro de `fonte/`.

## Fontes dos números

- População: estimativas oficiais e da ONU (2022–2026), compiladas na Wikipedia.
- Área: Divisão de Estatística da ONU, compilada na Wikipedia.
- PIB e PIB per capita: FMI, World Economic Outlook de outubro de 2025.
- Área dos estados de SP e RJ e da cidade de São Paulo: IBGE.
- Contornos do mapa: amCharts geodata.
