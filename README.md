# Agente de Crescimento Enjoei - Palming Brecho

Este workspace contem um agente operacional para ajudar o perfil `@palmingbrxo` na Enjoei com foco em:

- nomeacao de anuncios com potencial de busca e clique
- descricao de produto a partir da foto
- adequacao de imagem para o formato ideal da plataforma
- criacao futura de um guia proprietario de fotos
- dicas de melhores postagens
- analise quinzenal do perfil
- crosspost do Instagram `@palmingbrecho` para Enjoei

## Estrutura

- [AGENTE_ENJOEI_PALMING.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/AGENTE_ENJOEI_PALMING.md): prompt mestre e regras do agente
- [GUIA_OPERACIONAL.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/GUIA_OPERACIONAL.md): como operar o agente no dia a dia
- [GUIA_FOTOS_INICIAL.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/GUIA_FOTOS_INICIAL.md): padrao inicial para fotos de produtos
- [CALENDARIO_EDITORIAL.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/CALENDARIO_EDITORIAL.md): ideias de postagens e rotinas
- [MODELO_ANALISE_QUINZENAL.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/MODELO_ANALISE_QUINZENAL.md): template de acompanhamento a cada 15 dias
- [TEMPLATES/ANUNCIO_TEMPLATE.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/TEMPLATES/ANUNCIO_TEMPLATE.md): saida padrao para cada anuncio
- [TEMPLATES/CROSSPOST_INSTAGRAM_ENJOEI.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/TEMPLATES/CROSSPOST_INSTAGRAM_ENJOEI.md): fluxo para transformar posts do Instagram em anuncios

## Contexto Base Considerado

Sinais publicos observados em 7 de julho de 2026:

- Instagram `@palmingbrecho`: 225 seguidores, 103 seguindo, 25 posts
- Bio publica: "Moda e musica com alma vintage", pecas e vinis, presenca em SP no `@coletivo110`
- Posicionamento sugerido: brecho curado com apelo vintage, musical e autoral

Observacao: o HTML publico da Enjoei carregou, mas os contadores detalhados do perfil nao vieram expostos de forma estavel sem execucao autenticada. Por isso o modelo de analise quinzenal foi desenhado para preencher esses numeros manualmente ou por coleta assistida.

## Como usar

1. Abra [AGENTE_ENJOEI_PALMING.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/AGENTE_ENJOEI_PALMING.md) e use como prompt base.
2. Para cada novo produto, envie foto + dados conhecidos e siga [TEMPLATES/ANUNCIO_TEMPLATE.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/TEMPLATES/ANUNCIO_TEMPLATE.md).
3. Para publicar produtos do Instagram na Enjoei, siga [TEMPLATES/CROSSPOST_INSTAGRAM_ENJOEI.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/TEMPLATES/CROSSPOST_INSTAGRAM_ENJOEI.md).
4. A cada 15 dias, preencha [MODELO_ANALISE_QUINZENAL.md](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/MODELO_ANALISE_QUINZENAL.md).

## Pagina simples para o cliente

Foi criada uma interface leve para uso direto do cliente:

- [public/index.html](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/public/index.html)
- [public/app.js](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/public/app.js)
- [public/styles.css](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/public/styles.css)
- [server.js](/Users/rawierqueiroga/Documents/Codex/2026-07-07/https-www-enjoei-com-br-palmingbrxo/server.js)

### O que a pagina faz

- upload de 1 foto do produto
- campos simples: nome, categoria, marca, cor, tamanho, estado, medidas e observacoes
- retorno com:
  - titulo sugerido
  - 3 variacoes de titulo
  - descricao pronta
  - nota de `venda quente` de 1 a 5
  - motivos da nota
  - leitura rapida da foto

### Como rodar

1. `npm run dev`
2. abrir `http://127.0.0.1:3000`

### Modo de IA

- Com `OPENAI_API_KEY` configurada, a pagina usa analise por IA com imagem.
- Sem chave, entra em modo local de fallback e continua gerando sugestoes basicas por regra.
