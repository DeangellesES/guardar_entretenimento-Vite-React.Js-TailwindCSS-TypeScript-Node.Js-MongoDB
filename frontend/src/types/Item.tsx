export type Item = {
  _id: string;
  titulo: string;
  tipo: string;
  tempo: string;
  capa?: string;
  temporada?: number;
  epsodio?: number;

  status: 'pretendo' | 'assistindo';
};

export type TmdbSearchResult = {
  id: number
  title: string
  release_date?: string
}