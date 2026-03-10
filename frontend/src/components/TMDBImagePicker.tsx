import { useState } from "react";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

type TMDBMovie = {
  id: number;
  title: string;
  poster_path: string | null;
};

// BUSCAR IMAGEMS DO TMDB
export default function TMDBImagePicker({ onSelect, onClose }: Props) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<TMDBMovie[]>([]);

  async function buscar() {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
        busca
      )}&language=pt-BR`
    );

    const data = await res.json();
    setResultados(data.results.filter((f: TMDBMovie) => f.poster_path));
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
      <div className="bg-[#000220] p-4 rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold">Escolha uma capa</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="flex gap-2">
          <input
            className="flex-1 border border-slate-800 p-2 rounded-lg"
            placeholder="Buscar filme"
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
          <button
            onClick={buscar}
            className="bg-sky-500 px-4 rounded-lg cursor-pointer"
          >
            Buscar
          </button>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,140px)] gap-4 mt-4">
          {resultados.map(filme => (
            <img
              key={filme.id}
              src={`https://image.tmdb.org/t/p/w300${filme.poster_path}`}
              alt={filme.title}
              className="cursor-pointer rounded-lg hover:scale-105 transition"
              onClick={() => {
                onSelect(
                  `https://image.tmdb.org/t/p/w500${filme.poster_path}`
                );
                onClose();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
