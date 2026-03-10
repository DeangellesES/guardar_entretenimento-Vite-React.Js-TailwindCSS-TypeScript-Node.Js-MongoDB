export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
}
