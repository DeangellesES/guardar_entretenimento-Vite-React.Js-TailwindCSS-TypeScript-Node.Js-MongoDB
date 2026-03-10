import type { TMDBSearchResponse, TMDBMovie } from "../types/tmdb";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
const BASE_URL = "https://api.themoviedb.org/3";

export async function buscarCapasFilmes(query: string): Promise<TMDBMovie[]> {
  if (!query) return [];

  const response = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
      query
    )}&language=pt-BR`
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar filmes no TMDB");
  }

  const data: TMDBSearchResponse = await response.json();

  return data.results.filter(filme => filme.poster_path !== null);
}
