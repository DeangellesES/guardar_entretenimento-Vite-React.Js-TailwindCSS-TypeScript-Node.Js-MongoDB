import { useEffect, useState, useRef, useMemo } from 'react'
import { api } from '../../services/api'
import type { Item, TmdbSearchResult } from '../../types/Item'

import type { ReactNode } from 'react';
// COMPONENTE CABECALHO
import { Cabecalho } from '../../components/Cabecalho';

//BLIBLIOTECA PARA MENSAGENS QUE APARENCEM NA TELA
import toast from 'react-hot-toast'

// ICONES DO REACT ICONS
import { IoPlayOutline } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { FaFilm, FaRegTrashAlt, FaRegEdit } from "react-icons/fa";
import { LuTv } from "react-icons/lu";
import { BsFileEarmarkPlay } from "react-icons/bs";
import { GiNinjaHeroicStance } from "react-icons/gi";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

// blibioteca para modificar o select option
import Select from 'react-select';

//BUSCAR IMAGEMS
import TMDBImagePicker from '../../components/TMDBImagePicker';

type ItemPayload = {
    titulo: string;
    tipo: string;
    capa?: string;
    status: 'pretendo' | 'assistindo';
};

//INICIO DA PÁGINA
export default function Pretendo() {
    // estados do formulário e informações nos campos do entretenimento
    const [titulo, setTitulo] = useState('')
    const [tipo, setTipo] = useState('')

    // funcionalidade de mostrar e esconder formulario ao clicar no botão principal
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // lista vinda da API
    const [items, setItems] = useState<Item[]>([])
    const [itemEditando, setItemEditando] = useState<Item | null>(null)

    // BUSCAR E ADICIONAR CAPAS -----------------------------------------------------//
    //adicionar capas
    const [capa, setCapa] = useState<string>('');
    const [mostrarBuscaImagem, setMostrarBuscaImagem] = useState(false);

    const [previewCapas, setPreviewCapas] = useState<Record<string, string>>({});

    async function handleUploadCapaItem(
        e: React.ChangeEvent<HTMLInputElement>,
        itemId: string
    ) {
        const file = e.target.files?.[0];
        if (!file) return;

        const previewUrl = URL.createObjectURL(file);

        setPreviewCapas(prev => ({
            ...prev,
            [itemId]: previewUrl
        }));

        const formData = new FormData();
        formData.append("capa", file);

        try {
            const response = await api.patch(
                `/items/${itemId}/capa`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setItems(prev =>
                prev.map(item =>
                    item._id === itemId ? response.data : item
                )
            );

        } catch (error) {
            console.error(error);
        } finally {
            setPreviewCapas(prev => {
                const copy = { ...prev };
                delete copy[itemId];
                return copy;
            });
        }
    }
    // FIM BUSCAR E ADICIONAR CAPAS ---------------------------- X ------------------------//


    // refs dos carrosséis por tipo (para botões anterior/próximo)
    const carouselRefs = useRef<Record<string, HTMLDivElement | null>>({});


    // AUTO COMPLETAR TITULOS -----------------------------------------------------//
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

            console.log('TMDB RESPONSE:', data) // 👈 DEBUG IMPORTANTE

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

    // FIM AUTO COMPLETAR TITULOS ------------------------- X ----------------------------//


    // função de carregar itens
    // async function loadItems() {
    //     const response = await api.get<Item[]>('/items?status=pretendo')
    //     setItems(response.data)
    // }

    // função de carregar itens EM PRETENDO ASSISTIR
    useEffect(() => {
        async function fetchItems() {
            const response = await api.get<Item[]>('/items?status=pretendo')
            setItems(response.data)
        }

        fetchItems()
    }, [])


    // ADICIONAR ITEMS NO BANCO DE DADOS -----------------------------------------------------//
    // função de registras os items na tela e banco de dados
    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();

        if (!titulo || !tipo) {
            toast.error('Preencha título e tipo');
            return;
        }

        const payload: ItemPayload = {
            titulo,
            tipo,
            capa,
            status: 'pretendo',
        };

        console.log('PAYLOAD ENVIADO:', payload);

        try {
            if (itemEditando) {
                const response = await api.put(`/items/${itemEditando._id}`, payload);
                toast.success('Item atualizado com sucesso!');
                setItems(prev => prev.map(item =>
                    item._id === itemEditando._id ? response.data : item
                ));
                setItemEditando(null);

                // Fecha o formulário após editar
                setMostrarFormulario(false);
            } else {
                const response = await api.post('/items', payload);
                toast.success('Item adicionado com sucesso!');
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

        } catch (error: any) {
            console.error('ERRO AO SALVAR:', error);
            toast.error(
                error.response?.data?.error || 'Erro ao salvar item'
            );
        }
    }
    // FIM ADICIONAR ITEMS NO BANCO DE DADOS --------------------------- X --------------------------//


    const formRef = useRef<HTMLFormElement | null>(null)

    // Limpa o formulário quando for fechado
    useEffect(() => {
        if (!mostrarFormulario && !itemEditando) {
            setTitulo('')
            setTipo('')
            setCapa('')
        }
    }, [mostrarFormulario, itemEditando])

    // função de editar os items já adicionados
    function handleEdit(item: Item) {
        setItemEditando(item);

        setTitulo(item.titulo ?? '');
        setTipo(item.tipo ?? '');
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


    // array de objetos dos tipos de entretenimneto, titulo e icones
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
    // adicionando cores aos tipos de icones existentes
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

    // ordem fixa dos tipos para exibir as seções
    const ORDEM_TIPOS = ['anime', 'serie', 'filme', 'documentario'] as const;

    // agrupa itens por tipo para exibir em seções separadas
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
            <section className="flex flex-col px-7 md:px-30 lg:px-40 gap-4 pt-30 sm:pt-30 bg-slate-950 h-full text-white">
                <h1 className="text-2xl font-bold flex items-center">
                    <IoPlayOutline className='text-blue-700 text-5xl bg-[#020749] rounded-lg mr-4 animate-pulse' />
                    Quero Assistir
                </h1>

                <p className='text-lg text-sky-200'>Guarde o que você pretende assistir.</p>

                {/* funcao para mostrar formulario ao clicar no botao adicionar novo item */}
                {!mostrarFormulario && (
                    <button
                        onClick={() => setMostrarFormulario(true)}
                        className='flex justify-center items-center gap-3 bg-sky-500 hover:bg-sky-600 transition-all duration-500 ease-in-out rounded-lg p-3 cursor-pointer'
                    >
                        <FaPlus /> Adicionar Novo Item
                    </button>
                )}

                {/* INICIO FORMULARIO */}
                {mostrarFormulario && (
                    <form
                        ref={formRef}
                        onSubmit={handleRegister}
                        className="flex flex-col px-10 sm:px-20 gap-2 flex-wrap border border-slate-800 rounded-lg p-5 bg-[#000220]"
                    >
                        <h1 className='text-2xl font-bold'>Novo item</h1>

                        {/* inicio label e input titulo */}
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
                                    setTituloInput(valor); // só para buscars
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
                        {/* fim label e input titulo */}

                        {/* buscar imagens TMDB */}
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
                        <label htmlFor="">Tipo</label>
                        {/* INICIO SELECT */}
                        <Select<OptionType>
                            className="mx-2 border border-slate-800 rounded-lg"
                            options={options}
                            value={options.find(opt => opt.value === tipo) || null}
                            onChange={(option) => setTipo(option?.value || '')}
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

                        />
                        {/* FIM TIPO */}

                        {/* BOTAO DE ADICIONAR OU SALVAR ALTERAÇÕES */}
                        <button
                            type="submit"
                            className='flex justify-center items-center gap-3 bg-sky-500 rounded-lg p-3 mx-2 mt-4 cursor-pointer'
                        >
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

                {/* INICIO CONTEUDO ADICIONADO */}
                {/* INICIO CARROSSÉIS POR TIPO — 3 itens visíveis na tela */}
                <div className="flex flex-col gap-10 md:px-2 mt-10 mb-10">
                    {ORDEM_TIPOS.map((tipoKey) => {
                        const itensDoTipo = itemsPorTipo[tipoKey];
                        if (!itensDoTipo?.length) return null;

                        const scrollCarousel = (dir: 'prev' | 'next') => {
                            const el = carouselRefs.current[tipoKey];
                            if (!el) return;
                            const cardWidth = el.querySelector('[data-carousel-card]')?.getBoundingClientRect().width ?? 280;
                            const gap = 16;
                            const step = cardWidth + gap; // um item por vez
                            el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
                        };

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
                                                className="flex-shrink-0 snap-start flex justify-center border border-slate-800 p-4 rounded-lg bg-[#010430] relative min-w-[230px] md:min-w-[200px] w-[calc((100%-2rem)/3)]"
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
                                                            className="w-full h-80 object-cover my-4 rounded-md border border-slate-700"
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
                                                </div>

                                                {/* FUNCAO EDITAR E APAGAR */}
                                                <div className="absolute top-1 right-2">
                                                    <button type="button" onClick={() => handleEdit(item)}>
                                                        <FaRegEdit className="mr-2 cursor-pointer" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(item._id)}>
                                                        <FaRegTrashAlt className="mr-1 cursor-pointer" />
                                                    </button>
                                                </div>

                                            </div>
                                        ))}

                                    </div>

                                    {/* BOTAO PROXIMO DO CARROSSEL */}
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
    );
}