import { useEffect, useState, useRef, useMemo } from 'react'
import { api } from '../../services/api'

import type { Item, TmdbSearchResult } from '../../types/Item'
import type { ReactNode } from 'react';

//componente cabecalho
import { Cabecalho } from '../../components/Cabecalho';

//BLIBLIOTECA PARA MENSAGENS QUE APARENCEM NA TELA
import toast from 'react-hot-toast'

// ICONES DO REACT ICONS
import { IoPlayOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { FaFilm, FaRegTrashAlt, FaRegEdit } from "react-icons/fa";
import { LuTv } from "react-icons/lu";
import { BsFileEarmarkPlay } from "react-icons/bs";
import { GiNinjaHeroicStance } from "react-icons/gi";

// blibioteca para modificar o select option
import Select from 'react-select';

import TMDBImagePicker from '../../components/TMDBImagePicker';

//TIPOS QUE TÊM temporada/episódio OBRIGATÓRIOS
const TIPOS_COM_TEMP_EP = ['anime', 'serie'];
//TIPOS QUE PODEM EXIBIR temporada/episódio (inclui documentário como opcional)
const TIPOS_MOSTRAR_TEMP_EP = ['anime', 'serie', 'documentario'];

type ItemPayload = {
  titulo: string;
  tipo: string;
  tempo: string;
  capa?: string;
  temporada?: number;
  epsodio?: number;
  status: string;
};

//INICIO DA PÁGINA
export default function Guardar() {
  // estados do formulário e informações nos campos do entretenimento
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('')
  const [temporada, setTemporada] = useState<number>(1);
  const [epsodio, setEpsodio] = useState<number>(1);
  const [usarTempEpDocumentario, setUsarTempEpDocumentario] = useState(false);
  const [tempo, setTempo] = useState('')

  // funcionalidade de mostrar e esconder formulario ao clicar no botão principal
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // lista vinda da API
  const [items, setItems] = useState<Item[]>([])
  const [itemEditando, setItemEditando] = useState<Item | null>(null)


  // -----------------------------------------------------------------------
  //adicionar capas
  const [capa, setCapa] = useState<string>('');
  const [mostrarBuscaImagem, setMostrarBuscaImagem] = useState(false);
  const [previewCapas, setPreviewCapas] = useState<Record<string, string>>({});

  //funcao adicionar capas
  async function handleUploadCapaItem(
    e: React.ChangeEvent<HTMLInputElement>,
    itemId: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    // preview imediato
    const previewUrl = URL.createObjectURL(file);
    setPreviewCapas(prev => ({ ...prev, [itemId]: previewUrl }));

    const formData = new FormData();
    formData.append("capa", file);

    try {
      const response = await api.patch(
        `/items/${itemId}/capa`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // atualiza item na tela
      setItems(prev =>
        prev.map(item =>
          item._id === itemId ? response.data : item
        )
      );

      toast.success("Capa adicionada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar capa.");
    } finally {
      // remove preview temporário
      setPreviewCapas(prev => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
    }
  }
  // ------------------------------- X ---------------------------------------- //


  // carrossel
  const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});



  //-------------------------------------------------------------------------------
  // ROOKS PARA TRAZER NOMES PRE COMPLETADOS DO TMDB
  const [sugestoesTitulo, setSugestoesTitulo] = useState<TmdbSearchResult[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [buscandoTitulo, setBuscandoTitulo] = useState(false)
  const [tituloInput, setTituloInput] = useState('')

  // useEffect PARA TRAZER NOMES PRE COMPLETADOS DO TMDB
  useEffect(() => {
    if (tituloInput.trim().length < 2) {
      setSugestoesTitulo([]);
      setMostrarSugestoes(false);
      return;
    }

    const delay = setTimeout(() => {
      buscarTitulosTMDB(tituloInput);
    }, 500);

    return () => clearTimeout(delay);
  }, [tituloInput]);

  // FUNÇÃO PARA TRAZER NOMES PRE COMPLETADOS DO TMDB
  async function buscarTitulosTMDB(query: string) {
    if (query.length < 2) {
      setSugestoesTitulo([])
      setMostrarSugestoes(false)
      return
    }

    try {
      setBuscandoTitulo(true)

      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
          query
        )}&language=pt-BR&include_adult=false&api_key=${import.meta.env.VITE_TMDB_API_KEY
        }`
      )

      const data = await response.json()

      console.log('TMDB RESPONSE:', data) // DEBUG IMPORTANTE

      if (!data.results) {
        setSugestoesTitulo(data.results.slice(0, 5));
        setMostrarSugestoes(true)
        return
      }

      setSugestoesTitulo(data.results.slice(0, 5))
      setMostrarSugestoes(true)
    } catch (error) {
      console.error('Erro ao buscar títulos TMDB', error)
    } finally {
      setBuscandoTitulo(false)
    }
  }
  // ------------------------------- X ---------------------------------------- //



  // função de carregar itens (apenas status "assistindo")
  // async function loadItems() {
  //   const response = await api.get<Item[]>('/items?status=assistindo')
  //   setItems(response.data)
  // }

  //status assistindo
  useEffect(() => {
    async function fetchItems() {
      const response = await api.get<Item[]>('/items?status=assistindo')
      setItems(response.data)
    }

    fetchItems()
  }, [])


  // --------------------------------------------------------------------------- //
  // função de registras os items na tela e banco de dados
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (!titulo || !tipo) {
      // alert('Preencha título e tipo');
      return;
    }

    const isTipoComTempEpObrigatorio = TIPOS_COM_TEMP_EP.includes(tipo);
    const isDocumentario = tipo === 'documentario';

    if (isTipoComTempEpObrigatorio) {
      if (!temporada || temporada < 1 || !epsodio || epsodio < 1) {
        return;
      }
    } else if (isDocumentario && usarTempEpDocumentario) {
      if (!temporada || temporada < 1 || !epsodio || epsodio < 1) {
        return;
      }
    }

    const payload: ItemPayload = {
      titulo,
      tipo,
      tempo,
      capa,
      status: 'assistindo'
    };

    // Sempre que tiver valores válidos, envia temporada/epsodio
    const deveEnviarTempEp =
      TIPOS_COM_TEMP_EP.includes(tipo) ||
      (tipo === 'documentario' && usarTempEpDocumentario);

    if (deveEnviarTempEp) {
      if (temporada && temporada > 0) {
        payload.temporada = temporada;
      }

      if (epsodio && epsodio > 0) {
        payload.epsodio = epsodio;
      }
    }

    try {
      if (itemEditando) {
        const response = await api.put(`/items/${itemEditando._id}`, payload);
        toast.success('Item atualizado com sucesso!')
        setItems(prev => prev.map(item =>
          item._id === itemEditando._id ? response.data : item
        ));
        setItemEditando(null);

        // Fecha o formulário após editar
        setMostrarFormulario(false);
      } else {
        const response = await api.post('/items', payload);
        toast.success('Item adicionado com sucesso!')
        setItems(prev => [response.data, ...prev]); // Adiciona no início

        // Rola o carrossel do tipo do item para o início
        setTimeout(() => {
          const carouselEl = carouselRefs.current[tipo];
          if (carouselEl) {
            carouselEl.scrollTo({ left: 0, behavior: 'smooth' });
          }
        }, 100);

        // Fecha o formulário após adicionar
        setMostrarFormulario(false);
      }
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast.error('Erro ao salvar item. Verifique o console.');
    }
  }
  // ----------------------------------- X ---------------------------------------- //



  const formRef = useRef<HTMLFormElement | null>(null)

  // Limpa o formulário quando for fechado
  useEffect(() => {
    if (!mostrarFormulario && !itemEditando) {
      setTitulo('')
      setTipo('')
      setTemporada(1)
      setEpsodio(1)
      setTempo('')
      setCapa('')
    }
  }, [mostrarFormulario, itemEditando])

  // função de editar os items já adicionados
  function handleEdit(item: Item) {
    setItemEditando(item);

    setTitulo(item.titulo ?? '');
    setTipo(item.tipo ?? '');
    setTemporada(item.temporada ?? 1);
    setEpsodio(item.epsodio ?? 1);
    setTempo(item.tempo ?? '');
    setCapa(item.capa ?? '');

    // ESSENCIAL: abrir formulário só depois
    setMostrarFormulario(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 100)
  }

  // função de deletar item
  async function handleDelete(id: string) {
    try {
      await api.delete(`/items/${id}`)
      setItems(items.filter(item => item._id !== id))
      toast.success('Item excluído com sucesso!')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err.response?.data?.error || 'Erro ao excluir item')
    }
  }

  // array de objetos dos tipos categorias de entretenimento, titulo e icones
  const options = [
    { value: 'anime', label: 'Anime', icon: <GiNinjaHeroicStance /> },
    { value: 'serie', label: 'Série', icon: <LuTv /> },
    { value: 'filme', label: 'Filme', icon: <FaFilm /> },
    { value: 'documentario', label: 'Documentário', icon: <BsFileEarmarkPlay /> },
  ];

  type OptionType = {
    value: string;
    label: string;
    icon: ReactNode;
  };

  // --------------------------------------------------------------------------- //
  // cores e nomes corretos para categorias
  // adicionando cores aos tipos de icones existentes na categoria
  const tipoIconeMap: Record<string, ReactNode> = {
    anime: <GiNinjaHeroicStance className="text-pink-400 text-xl" />,
    serie: <LuTv className="text-sky-400 text-xl" />,
    filme: <FaFilm className="text-yellow-400 text-xl" />,
    documentario: <BsFileEarmarkPlay className="text-green-400 text-xl" />,
  };

  // nomes corretos com assento e inicial maiuscula indo para os tipos dos items
  const tipoLabelMap: Record<string, string> = {
    anime: 'Anime',
    filme: 'Filme',
    serie: 'Série',
    documentario: 'Documentário',
  };

  const ORDEM_TIPOS = ['anime', 'serie', 'filme', 'documentario'] as const;

  const itemsPorTipo = useMemo(() => {
    const grupos: Record<string, Item[]> = {
      anime: [],
      serie: [],
      filme: [],
      documentario: [],
    };
    items.forEach((item) => {
      if (grupos[item.tipo]) grupos[item.tipo].push(item);
    });
    return grupos;
  }, [items]);
  // ----------------------------------- X ---------------------------------------- //



  // INICIO DO RETURN
  return (
    <>
      <Cabecalho />
      <section className="flex flex-col px-50 gap-4 pt-20 bg-slate-950 h-full text-white">
        <h1 className="text-2xl font-bold flex items-center">
          <IoPlayOutline className='text-blue-700 text-5xl bg-[#020749] rounded-lg mr-4 animate-pulse' />
          Watch and Save
        </h1>

        <p className='text-lg text-sky-200'>Guarde onde você parou de assistir seus filmes, séries, documentários e animes.</p>

        {/* funcao para mostrar formulario ao clicar no botao adicionar novo item */}
        {!mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
            className='flex justify-center items-center gap-3 bg-sky-500 hover:bg-sky-600 transition-all duration-500 ease-in-out rounded-lg p-3 cursor-pointer'>
            <FaPlus /> Adicionar Novo Item
          </button>
        )}

        {/* INICIO FORMULARIO */}
        {mostrarFormulario && (
          <form
            ref={formRef}
            onSubmit={handleRegister}
            className="flex flex-col px-20 gap-2 flex-wrap border border-slate-800 rounded-lg p-5 bg-[#000220]"
          >

            <h1 className='text-2xl font-bold'>Novo item</h1>

            {/* lable titulo */}
            <label>Título</label>
            <div className="relative mx-2">
              <input
                placeholder="Ex: Cosmos"
                value={titulo}
                onFocus={() => {
                  if (sugestoesTitulo.length > 0) {
                    setMostrarSugestoes(true);
                  }
                }}
                onChange={(e) => {
                  const valor = e.target.value;
                  setTitulo(valor);       // texto livre SEMPRE
                  setTituloInput(valor); // só para buscar
                }}
                onBlur={() => {
                  setTimeout(() => setMostrarSugestoes(false), 150);
                }}
                className="border border-slate-800 rounded-lg p-2 w-full"
              />

              {buscandoTitulo && (
                <span className="absolute right-3 top-2 text-xs text-gray-400">
                  Buscando...
                </span>
              )}

              {mostrarSugestoes && sugestoesTitulo.length > 0 && (
                <ul className="absolute z-20 bg-[#000220] border border-slate-800 w-full mt-1 rounded-lg shadow-lg">
                  {sugestoesTitulo.map(item => (
                    <li
                      key={item.id}
                      className="p-2 cursor-pointer hover:bg-[#020749]"
                      onClick={() => {
                        setTitulo(item.title);
                        setTituloInput(item.title);
                        setMostrarSugestoes(false);
                      }}
                    >
                      {item.title}
                      {item.release_date && (
                        <span className="text-xs text-gray-400 ml-2">
                          ({item.release_date.slice(0, 4)})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* botao de buscar imagens TMDB */}
            <div className="flex items-center gap-3 mx-2">
              <button
                type="button"
                onClick={() => setMostrarBuscaImagem(true)}
                className="flex items-center gap-2 bg-[#020749] px-4 py-2 rounded-lg hover:bg-[#030a9b] transition"
              >
                <FaFilm />
                Buscar imagens
              </button>

              {capa && (
                <img
                  src={capa}
                  alt="Capa selecionada"
                  className="h-20 rounded-md border border-slate-700"
                />
              )}
            </div>

            {/* INICIO TIPO */}
            {/* label e select tipo */}
            <label htmlFor="">Tipo</label>
            {/* INICIO SELECT */}
            <Select<OptionType>
              className="mx-2 border border-slate-800 rounded-lg"
              options={options}
              value={options.find(opt => opt.value === tipo) || null}
              onChange={(option) => {
                const novoTipo = option?.value || '';
                setTipo(novoTipo);

                // Quando mudar o tipo, se não for documentário, desliga o uso de temporada/epsódio opcional
                if (novoTipo !== 'documentario') {
                  setUsarTempEpDocumentario(false);
                }
              }}
              placeholder="Selecione o tipo"

              formatOptionLabel={(option) => (
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span>{option.label}</span>
                </div>
              )}

              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '44px',
                  backgroundColor: '#000220',
                  borderColor: '#000220',
                  boxShadow: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  '&:hover': { borderColor: '#000220' },
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#000220',
                  borderRadius: '0.5rem',
                }),
                option: (base, state) => ({
                  ...base,
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  cursor: 'pointer',
                  backgroundColor: state.isFocused || state.isSelected
                    ? '#020749'
                    : '#000220',
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#020749' },
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#ffffff',
                }),
                placeholder: (base) => ({
                  ...base,
                  color: '#9ca3af',
                }),
                input: (base) => ({
                  ...base,
                  color: '#ffffff',
                }),
              }}
              required
            />
            {/* FIM SELECT TIPO*/}

            {TIPOS_MOSTRAR_TEMP_EP.includes(tipo) && (
              <>
                {tipo === 'documentario' && (
                  <div className="flex items-center gap-2 mx-2 mt-2">
                    <input
                      id="usar-temp-ep-documentario"
                      type="checkbox"
                      checked={usarTempEpDocumentario}
                      onChange={(e) => setUsarTempEpDocumentario(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="usar-temp-ep-documentario"
                      className="text-sm text-slate-200"
                    >
                      Adicionar temporada e episódio para este documentário
                    </label>
                  </div>
                )}

                {(tipo !== 'documentario' || usarTempEpDocumentario) && (
                  <div className="flex justify-between mt-2">
                    <div className="flex flex-col w-100 gap-1.5">
                      <label>Temporada</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={temporada}
                        onChange={e => {
                          const value = parseInt(e.target.value) || 1;
                          setTemporada(value);
                        }}
                        onBlur={e => {
                          const value = parseInt(e.target.value) || 1;
                          setTemporada(value);
                        }}
                        className="border border-slate-800 rounded-lg p-2 mx-2"
                      />
                    </div>

                    <div className="flex flex-col w-100 gap-1.5">
                      <label>Episódio</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={epsodio}
                        onChange={e => {
                          const value = parseInt(e.target.value) || 1;
                          setEpsodio(value);
                        }}
                        onBlur={e => {
                          const value = parseInt(e.target.value) || 1;
                          setEpsodio(value);
                        }}
                        className="border border-slate-800 rounded-lg p-2 mx-2"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
            {/* FIM TIPO */}

            {/* INICIO TEMPO INDE PAROU */}
            <label htmlFor="">Tempo (onde parou)</label>
            <input
              placeholder="Ex: 06:45"
              value={tempo}
              onChange={e => setTempo(e.target.value)}
              className='border border-slate-800 rounded-lg p-2 mx-2'
              required
            />

            {/* BOTAO DE ADICIONAR OU SALVAR ALTERAÇÕES */}
            <button
              type="submit"
              className='flex justify-center items-center gap-3 bg-sky-500 rounded-lg p-3 mx-2 mt-4 cursor-pointer'>
              {!itemEditando && <FaPlus />}
              {itemEditando ? 'Salvar alterações' : 'Adicionar'}
            </button>

            {/* BOTAO CANCELAR PARA FECHAR O FORMULARIO */}
            <button
              type="button"
              onClick={() => {
                setMostrarFormulario(false);
                setItemEditando(null);
              }}
              className='border border-slate-800 rounded-lg p-3 mx-2 cursor-pointer'>
              Cancelar
            </button>
          </form>
        )}
        {/* FIM DO FORMULARIO */}

        {/* INICIO CARROSSÉIS POR TIPO — Assistir */}
        <div className="flex flex-col gap-10 px-2 mt-10 mb-10">
          {ORDEM_TIPOS.map((tipoKey) => {
            const itensDoTipo = itemsPorTipo[tipoKey];
            if (!itensDoTipo?.length) return null;

            const scrollCarousel = (dir: 'prev' | 'next') => {
              const el = carouselRefs.current[tipoKey];
              if (!el) return;
              const cardWidth = el.querySelector('[data-carousel-card]')?.getBoundingClientRect().width ?? 280;
              const gap = 16;
              const step = cardWidth + gap;
              el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
            };


            // INICIO SECAO ITEMS ADICIONADOS
            return (
              <div key={tipoKey} className="flex flex-col gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2 border-b border-slate-700 pb-2">
                  {tipoIconeMap[tipoKey]}
                  {tipoLabelMap[tipoKey]}
                </h2>
                <div className="relative flex items-center gap-4">
                  {itensDoTipo.length > 3 && (
                    <button
                      type="button"
                      onClick={() => scrollCarousel('prev')}
                      className="flex-shrink-0 z-10 w-10 h-10 rounded-full bg-[#020749] hover:bg-[#030a9b] flex items-center justify-center transition"
                      aria-label="Anterior"
                    >
                      <IoChevronBack className="text-xl" />
                    </button>
                  )}
                  <div
                    ref={(el) => { carouselRefs.current[tipoKey] = el; }}
                    className="carousel-no-scrollbar flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 w-full"
                  >
                    {itensDoTipo.map((item) => (
                      <div
                        key={item._id}
                        data-carousel-card
                        className="flex-shrink-0 snap-start flex justify-center border border-slate-800 p-4 rounded-lg bg-[#010430] relative min-w-[200px] w-[calc((100%-2rem)/3)]"
                      >
                        <div>
                          <p className="text-2xl"><strong>{item.titulo}</strong></p>
                          <p className="flex items-center gap-2">
                            <span className="font-bold">Tipo: {tipoLabelMap[item.tipo] ?? item.tipo}</span>
                            {tipoIconeMap[item.tipo]}
                          </p>

                          {previewCapas[item._id] || item.capa ? (
                            <img
                              src={
                                previewCapas[item._id]
                                  ? previewCapas[item._id]
                                  : item.capa
                              }
                              alt={item.titulo}
                              className="w-full aspect-[2/3] object-cover my-4 rounded-md border border-slate-700"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 my-4">
                              <label className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-700 transition text-sm">
                                📁 Adicionar capa
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleUploadCapaItem(e, item._id)}
                                />
                              </label>
                            </div>
                          )}

                          <div className="flex flex-col gap-2 mt-2 items-center">
                            {item.temporada && item.epsodio && (
                              <p className="bg-[#171344] p-1 px-3 rounded-2xl font-bold border border-gray-300/20">
                                Temporada: {item.temporada} | Epsódio: {item.epsodio}
                              </p>
                            )}
                            <p className="bg-[#171344] p-1 px-3 rounded-2xl font-bold border border-gray-300/20">Tempo: {item.tempo}</p>
                          </div>
                        </div>

                        {/* INICIO EDITAR E EXCLUIR */}
                        <div className="absolute top-1 right-2">
                          <button type="button" onClick={() => handleEdit(item)}>
                            <FaRegEdit className="mr-2 cursor-pointer" />
                          </button>
                          <button type="button" onClick={() => handleDelete(item._id)}>
                            <FaRegTrashAlt className="mr-1 cursor-pointer" />
                          </button>
                        </div>
                        {/* FIM EDITAR E EXCLUIR */}
                      </div>
                    ))}
                  </div>
                  
                  {itensDoTipo.length > 3 && (
                    <button
                      type="button"
                      onClick={() => scrollCarousel('next')}
                      className="flex-shrink-0 z-10 w-10 h-10 rounded-full bg-[#020749] hover:bg-[#030a9b] flex items-center justify-center transition"
                      aria-label="Próximo"
                    >
                      <IoChevronForward className="text-xl" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* FIM CARROSSÉIS POR TIPO */}

        {mostrarBuscaImagem && (
          <TMDBImagePicker
            onSelect={(url) => setCapa(url)}
            onClose={() => setMostrarBuscaImagem(false)}
          />
        )}
      </section>
    </>

  )
}