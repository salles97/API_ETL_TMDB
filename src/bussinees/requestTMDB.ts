import axios from 'axios';
import { api_key } from '../config/api_key';
import { Request, Response } from "express";
import { prismaClient } from "../database/prismaClient";


//Função para gerar a relação de criador e serie
async function createRelationCriador(idPerson: number, idSerie: number) {

  //Busca os cadastros no banco pra nao repetir
  const verCriador = await prismaClient.criador_serie.findUnique({
    where: {
      pessoa_id_atores_serie_id_series: {
        pessoa_id_atores: idPerson,
        serie_id_series: idSerie,
      },
    },
  })

  if (verCriador != null) {
    // console.log("Criador já adicionado", idPerson);
  }
  else {
    try {
      await prismaClient.criador_serie.create({
        data: {
          pessoa_id_atores: idPerson,
          serie_id_series: idSerie,
        },
      });
      // console.log("Sucesso relação criador");
    } catch (error) {
      // console.log("Nao foi possivel Cadastrar relaçao de pessoa e serie");
    }
  }
}

//Função que busca no array se ja tem cadastro da pessoa, se nao tiver cadastra antes de associar.
async function createPeople(id: number) {
  const ver = await prismaClient.pessoa.findFirst({
    where: {
      id_pessoa: id,
    }

  });

  if (ver != null) {
    //tem cadastro
  }
  else { //Nao tem cadastro
    //Cria no banco a pessoa.
    try {
      await new Promise(r => setTimeout(r, 1000));
      const person = await axios.get(`https://api.themoviedb.org/3/person/${id}?api_key=${api_key}`) //busca pessoa

      await prismaClient.pessoa.create({
        data: {
          id_pessoa: person.data.id,
          nome: person.data.name,
          foto: person.data.profile_path,
          biografia: person.data.biography,
          genero: person.data.gender,
          data_nascimento: new Date(person.data.birthday),
          data_morte: new Date(person.data.deathday),
          lugar_nascimento: person.data.place_of_birth,
          popularidade: person.data.popularity,
        },
      });

      // console.log("--> Pessoa cadastrada com sucesso ", person.data.name);
      //Adiciona o id no array pra mostrar que ja foi cadastrado

    }
    catch (error) {
      // console.log(error);
      // console.log("error id pessoa ->", id);

    }
  }
};

//Criar elenco
async function createElenco(idPessoa: number, idSerie: number, character: string) {
  const ver = await prismaClient.elenco.findUnique({
    where: {
      pessoa_id_pessoa_serie_id_serie: {
        pessoa_id_pessoa: idPessoa,
        serie_id_serie: idSerie,
      }
    }
  })

  if (ver != null) {
    // console.log("Ator já cadastro no Elenco -->", idPessoa)
    //Aqui nao printa nada pq senao irá poluir mt, alias cada episodio tem seu elenco e são todos associados a serie.
  }
  else {
    const verPessoa = await prismaClient.pessoa.findFirst({
      where: {
        id_pessoa: idPessoa,
      }
    })
    if (verPessoa != null) {

      try {
        //Se nao tem cadastrado o elenco, agora cadastra
        await prismaClient.elenco.create({
          data: {
            pessoa_id_pessoa: idPessoa,
            serie_id_serie: idSerie,
            personagem: character,
          },
        });
        // console.log(idPessoa, " --> adicionada ao elenco da serie: ", idSerie);   
      }
      catch (error) {
        // console.log("Erro ao associar pessoa ao  Elenco", idPessoa);
      }
    }
  }
}

async function createEpisode(episodeNumber: number, idSerie: number, season_number: number, idSeason: number) {
  try {
    await new Promise(r => setTimeout(r, 1000));
    const episode = await axios.get(`https://api.themoviedb.org/3/tv/${idSerie}/season/${season_number}/episode/${episodeNumber}?api_key=${api_key}`)

    const ver = await prismaClient.episodio.findFirst({
      where: {
        id_episodio: episode.data.id,
      }
    });
    if (ver != null) {
      // console.log("Episodio já cadastrado -> ", episode.data.id)
    }
    else {
      let dataAr = episode.data.air_date
      if (!dataAr) {
        dataAr = new Date("03/03/20")
      }
      else {
        dataAr = new Date(episode.data.air_date)
      }

      await prismaClient.episodio.create({
        data: {
          id_episodio: episode.data.id,
          numero_episodio: episode.data.episode_number,
          nome: episode.data.name,
          descricao: episode.data.overview,
          data_estreia: dataAr,
          nota: episode.data.vote_average,
          temporadas_id_series: idSerie,
          temporadas_id_temporadas: idSeason,
        },
      });

    }
  }
  catch (error) {
    // console.log(error)
    // console.log("Erro ao criar episodio")
  }
}

async function createSeason(season_number: number, idSerie: number, totalEp: number) {
  try {

    await new Promise(r => setTimeout(r, 500));
    const seasons = await axios.get(`https://api.themoviedb.org/3/tv/${idSerie}/season/${season_number}?api_key=${api_key}`)

    const verSeason = await prismaClient.temporadas.findFirst({
      where: {
        id_temporadas: seasons.data.id,
      }
    })

    if (verSeason != null) {
      // console.log("Temporada ja cadastrada!", season_number)
    } else {
      // Cria a temporada
      await prismaClient.temporadas.create({
        data: {
          id_temporadas: seasons.data.id,
          nome: seasons.data.name,
          descricao: seasons.data.overview,
          link_foto: seasons.data.poster_path,
          quantidade_ep: totalEp,
          numero_temporarada: season_number,
          series_id_series: idSerie
        },
      });

      //Para cada episodio faça o seguinte
      console.log("------ Cadastrando os Episodios da temporada ", season_number, " e Associando Elenco da serie ------------");
      for (const episode in seasons.data.episodes) {
        //Cria o episodio

        await createEpisode(seasons.data.episodes[episode].episode_number, idSerie, season_number, seasons.data.id);

        const stars = seasons.data.episodes[episode].guest_stars;

        if (stars && stars.length > 0) {
          //Para cada ator que estrelou a temporada da serie, adiciona ele ao cadastro pessoa e dps associa a elenco
          for (const star in stars) {
            // await new Promise(r => setTimeout(r, 1000));
            await createPeople(stars[star].id);
          }

          for (const star in stars) {
            // sleep
            // await new Promise(r => setTimeout(r, 1000));
            await createElenco(stars[star].id, idSerie, stars[star].character)
          }
        }
      }
    }
  }
  catch (error) {
    console.log("falha ao criar temporada");
  }
}

async function createPlataforma(idPlataforma: number, nomePlataforma: string) {
  try {
    const ver = await prismaClient.plataforma.findFirst({
      where: {
        id_plataforma: idPlataforma,
      }
    })
    if (ver != null) {
      // console.log("plataforma ja cadastrada -> ", nomePlataforma);
    }
    else {
      await prismaClient.plataforma.create({
        data: {
          id_plataforma: idPlataforma,
          nome: nomePlataforma,
        },
      });

    }
  }
  catch (error) {
    console.log("Erro ao criar plataforma");
  }

}

//Criar Relação de plataforma e series tabela n existe
async function createRelationPlataformaSerie(idPlataforma: number, idSeason: number) {
  try {

    await prismaClient.plataforma_series.create({

      data: {
        series_id_series: idSeason,
        plataforma_id_plataforma: idPlataforma,
      },
    });
  } catch (error) {
    console.log(" -- erro ao associar plataforma e serie")
  }
}

//Função para associar genero e serie
async function createRelationGenreSerie(idGenre: number, idSerie: number, nameGenre: string) {
  const verGenero = await prismaClient.generos.findFirst({
    where: {
      id_generos: idGenre,
    }
  })

  if (verGenero != null) {
    try {
      await prismaClient.generos_series.create({
        data: {
          generos_id_generos: idGenre,
          series_id_series: idSerie,
        },
      });
    }
    catch (error) {
      // console.log(error)
      console.log("Erro ao associar genero e serie")
    }
  }
  else {
    try {
      await prismaClient.generos.create({
        data: {
          id_generos: idGenre,
          nome: nameGenre,
        }
      });
      await createRelationGenreSerie(idGenre, idSerie, nameGenre);
      console.log("Cadastrado novo genero");
    } catch (error) {
      console.log(error)
    }
  }
}

//Buscar a serie pelo ID. 
async function getSerieById(idSerie: number) {
  //Buscando a serie para ver se ja foi cadastrada
  const verSerie = await prismaClient.series.findFirst({
    where: {
      id_series: idSerie,
    }
  })
  //Se existir printa msg
  if (verSerie != null) {
    console.log(" --- A serie ", verSerie.nome, " já foi cadastrada.")
    return 0;
  }
  //Se não existir, cadastra
  else {
    //Criar a serie passando os dados dela
    try {
      await new Promise(r => setTimeout(r, 1000));
      const response = await axios.get(`https://api.themoviedb.org/3/tv/${idSerie}?api_key=${api_key}`);
      await prismaClient.series.create({
        data: {
          id_series: idSerie,
          nome: response.data.name,
          nota: response.data.vote_average,
          descricao: response.data.overview,
          imagem: response.data.poster_path,
          data_lancamento: new Date(response.data.first_air_date),
          pais_origem: response.data.origin_country[0],
          em_producao: response.data.in_production,
        }
      });


      // Receber o array de criadores, pegando os id e chamando as funções para adicionar pessoa e criar relação de criador
      console.log("------ Cadastrando os criadores da serie: ", response.data.name, " ------------");
      for (const criador in response.data.created_by) {
        const idCriador = response.data.created_by[criador].id
        // await new Promise(r => setTimeout(r, 1000));
        await createPeople(idCriador);
        await createRelationCriador(idCriador, response.data.id)
      }

      console.log("------ Adicionando as temporadas  ------------");

      //Adicionar cada temporada 
      for (const season in response.data.seasons) {
        await createSeason(response.data.seasons[season].season_number, response.data.id, response.data.seasons[season].episode_count)
      }

      //Para cada genero da serie, relaciona à serie.
      console.log("------ Associando Generos ------------");
      for (const genre in response.data.genres) {
        const idGenre = response.data.genres[genre].id
        createRelationGenreSerie(idGenre, idSerie, response.data.genres[genre].name)
      }

      // console.log("Criado com sucesso")
      console.log("------ Associando plataformas ------------");
      for (const network in response.data.networks) {
        await createPlataforma(response.data.networks[network].id, response.data.networks[network].name);
        createRelationPlataformaSerie(response.data.networks[network].id, idSerie);

      }
    }
    catch (error) {
      // console.log(error);
      console.log("erro ao pegar serie");
    }
    return 1;
  }
}

//Buscar Generos de series 
async function getGeneros() {
  try {

    await new Promise(r => setTimeout(r, 500));
    const generos = await axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${api_key}`)

    //Para cada genero cadastra com seu id e nome
    for (const genero in generos.data.genres) {
      // console.log(String(generos.data.genres));
      await prismaClient.generos.create({
        data: {
          id_generos: generos.data.genres[genero].id,
          nome: generos.data.genres[genero].name,
        }
      });

      console.log("--> Genero Cadastrado: ", generos.data.genres[genero].name);
    }

  }
  catch (error) {
    console.log("Erro ao cadastrar Genero")
  }
}


async function getTrailers(idSerie: number) {
  try {

    await new Promise(r => setTimeout(r, 500));
    const videos = await axios.get(`https://api.themoviedb.org/3/tv/${idSerie}/videos?api_key=${api_key}`)

    const videosRecebidos = videos.data.results

    for (const video in videosRecebidos) {

      const ver = await prismaClient.trailer.findFirst({
        where: {
          id_trailer: videosRecebidos[video].id,
        }
      });
      if (ver != null) {
        // console.log("Trailer já cadastrado")
      }
      else {
        if (videosRecebidos[video].type == "Trailer") {
          await prismaClient.trailer.create({
            data: {
              id_trailer: videosRecebidos[video].id,
              nome: videosRecebidos[video].nome,
              key_trailer: videosRecebidos[video].key,
              tipo: videosRecebidos[video].type,
              series_id_series: idSerie,
              website_plataform: videosRecebidos[video].site,
            },
          });
        }
      }
    }

  } catch (error) {
    // console.log(error)
    console.log("Erro ao cadastrar Trailer ")
  }

}


//Classe que vai chamar as series populares e depois chamar as funçoes para cadastrar todos os dados.
export class GetSeriesTmdb {
  async handle(request: Request, response: Response) {
    const { } = request.body;


    console.log("------ Carregando os Generos existentes para o banco ------------");
    //Carrega todos os generos na tabela de generos
    await getGeneros();
    //Definir quantas paginas de series buscaremos
    const maxPage = 24; //Total é 67195 sendo 20 series por pagina
    let page: number = 21;

    try {

      //Loop olhando cada pagina de busca
      for (let pageAt = page; pageAt <= maxPage; pageAt++) {
        console.log()
        console.log()
        console.log("------ Carregando a página", pageAt, " de ", maxPage, " ------------");
        //Buscar as series mais populares
        // await new Promise(r => setTimeout(r, 500));
        const response = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${api_key}&page=${pageAt}`)

        const arraySeries = response.data.results;

        //Agora vai ver cada serie do retorno e chamar a função para cadastrar a serie e trailers.
        for (const series in arraySeries) {
          console.log()
          console.log()
          console.log("------ Consultando a serie ", arraySeries[series].name, " ------------");
          //Chama a função que verifica se a serie ja existe, se nao exitir cadastra, retorna 0 para existe e 1 para cadastrado
          let confirm = await getSerieById(arraySeries[series].id);
          if (confirm == 1) {
            console.log("------ Cadastrando os trailers da serie ", arraySeries[series].name, " ------------");
            await getTrailers(arraySeries[series].id);
          }
        }

      }
    } catch (error) {
      console.log("Erro na main");
    }

    console.log();
    console.log();
    console.log("------------ FINALIZADO PAGINA ", page, " ATÉ A ", maxPage, " -------------");
  }
};
