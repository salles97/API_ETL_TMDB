# Readme

## Projeto de Inteligência de Negócios - API de Séries

Este projeto foi desenvolvido como parte da disciplina de Inteligência de Negócios, com o objetivo de explorar conceitos e ferramentas de BI (Business Intelligence). A API criada tem como propósito popular um banco de dados relacional (PostgreSQL) com informações de séries de TV, incluindo suas temporadas, episódios e outros detalhes relevantes, obtidos da API da TMDB (The Movie Database).

A finalidade do banco de dados é servir como base de dados para um Data Warehouse, onde serão realizados testes e estudos relacionados a ferramentas e metodologias de BI. A API foi desenvolvida utilizando tecnologias como Node.js, Express.js e Prisma.

## Funcionalidades
A API oferece as seguintes funcionalidades:

Consulta de séries: é possível obter informações sobre séries específicas, como título, sinopse, ano de lançamento, entre outros.
Consulta de temporadas: é possível visualizar detalhes das temporadas de uma série, incluindo número de episódios, sinopse e data de lançamento.
Consulta de episódios: permite obter informações detalhadas sobre os episódios de uma temporada, como título, número do episódio, duração e resumo.
Pesquisa por gênero: é possível buscar séries com base no gênero, como comédia, drama, ação, entre outros.

## Tecnologias Utilizadas

Node.js: ambiente de execução JavaScript de plataforma cruzada para o desenvolvimento da API.
Express.js: framework web minimalista que simplifica a construção de aplicativos da web no Node.js.
Prisma: ferramenta de ORM (Object-Relational Mapping) que facilita a interação com o banco de dados relacional PostgreSQL.
## REQUISITOS
Obter acesso a api https://developer.themoviedb.org/reference/intro/getting-started 

## Como Executar
Certifique-se de ter o Node.js instalado na sua máquina.
Clone este repositório e acesse o diretório do projeto.
Execute o comando npm install para instalar as dependências do projeto.
Configure as informações de conexão com o banco de dados no arquivo .env.
Adicione em um arquivo nomeado 'api_keys.ts' dentro da pasta src/config a seguinte linha de codigo: 
### export const api_key = "sua_key";
Sendo 'sua_key' a key da api da TMDB.

Execute o comando npm start para iniciar a API.
A API estará disponível em http://localhost:4003.
