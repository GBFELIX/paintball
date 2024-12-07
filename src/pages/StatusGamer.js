import React, { useState, useEffect } from 'react';
import VendaAvulsa from './Componentes/VendaAvul';
import CardJog from './Componentes/Cardjog';
import CardDespesas from './Componentes/CardDespesas';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from "react-icons/fa6";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";
import axios from 'axios';
import { IoMdClose } from "react-icons/io";

export default function StatusGame() {
    const [jogo, setJogo] = useState({});
    const [jogadores, setJogadores] = useState([{
        nome: '',
        numero: '1',
        items: [],
        selectedItem: '',
        isClosed: false
    }]);
    const [vendasAvulsas, setVendasAvulsas] = useState([{
        nome: '',
        numero: '1',
        items: [],
        selectedItem: '',
        isClosed: false
    }]);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [despesas, setDespesas] = useState([{
        nome: '',
        numero: '1',
        items: [],
        selectedItem: '',
        isClosed: false
    }]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        const storedData = localStorage.getItem('dataJogo');
        const storedHora = localStorage.getItem('horaJogo');

        if (storedData) {
            setJogo({ data: storedData, hora: storedHora });
        } else {
            toast.error('Erro ao carregar dados do jogo', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
        setLoading(false);
    }, []);

    const handleAddJogador = () => {
        const newNumero = (jogadores.length + 1).toString();
        setJogadores([...jogadores, {
            nome: '',
            numero: newNumero,
            items: [],
            selectedItem: '',
            isClosed: false
        }]);
        toast.success('Novo jogador adicionado!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });
    };

    const handleAddVendaAvulsa = () => {
        const newNumero = (vendasAvulsas.length + 1).toString();
        setVendasAvulsas([...vendasAvulsas, {
            nome: '',
            numero: newNumero,
            items: [],
            selectedItem: '',
            isClosed: false
        }]);
    };

    const handleAddDespesa = () => {
        const newNumero = (despesas.length + 1).toString();
        setDespesas([...despesas, {
            nome: '',
            numero: newNumero,
            items: [],
            selectedItem: '',
            isClosed: false
        }]);
    };

    const handleClosePedido = (index) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].isClosed = !updatedJogadores[index].isClosed;
        setJogadores(updatedJogadores);
    };

    const jogadoresAtivos = jogadores.filter(jogador => !jogador.isClosed).length;
    const jogadoresInativos = jogadores.filter(jogador => jogador.isClosed).length;

    const handleFecharPartida = () => {
        const jogadoresAbertos = jogadores.filter(jogador => !jogador.isClosed);
        const vendasAbertos = vendasAvulsas.filter(venda => !venda.isClosed);
        const despesasAbertas = despesas.filter(despesa => !despesa.isClosed);

        if (jogadoresAbertos.length > 0 || vendasAbertos.length > 0 || despesasAbertas.length > 0) {
            toast.error('Não é possível fechar a partida com cards abertos!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            return;
        }

        setShowConfirmationModal(true);
    };

    const confirmCloseGame = async () => {
        const jogadoresAbertos = jogadores.filter(jogador => !jogador.isClosed);
        const vendasAbertas = vendasAvulsas.filter(venda => !venda.isClosed);
        const despesasAbertas = despesas.filter(despesa => !despesa.isClosed);

        if (jogadoresAbertos.length > 0 || vendasAbertas.length > 0 || despesasAbertas.length > 0) {
            toast.error('Não é possível fechar a partida com cards abertos!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            setShowConfirmationModal(false);
            return;
        }

        setLoading(true);
        try {
            // Lógica para diminuir os valores no banco de dados
            const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
            const promises = Object.keys(storedItems).map(async (itemName) => {
                const quantidadeParaSubtrair = storedItems[itemName];
                const response = await axios.get(`/.netlify/functions/api-estoque/${itemName}`);
                const selectedItems = response.data;
                if (selectedItems.length === 0) {
                    throw new Error(`Item ${itemName} não encontrado no estoque`);
                }

                const selectedItem = selectedItems[0];

                if (selectedItem.quantidade < quantidadeParaSubtrair) {
                    throw new Error(`Quantidade insuficiente no estoque para o item ${itemName}`);
                }

                const novaQuantidade = selectedItem.quantidade - quantidadeParaSubtrair;

                // Atualiza o estoque no banco de dados
                await axios.put(`/.netlify/functions/api-estoque/${itemName}`, { nome: itemName, quantidade: novaQuantidade });

                // Atualiza o localStorage após a subtração
                storedItems[itemName] -= quantidadeParaSubtrair; // Decrementa a quantidade
                if (storedItems[itemName] <= 0) {
                    delete storedItems[itemName]; // Remove o item se a quantidade for zero
                }
            });

            // Aguarda todas as promessas serem resolvidas
            await Promise.all(promises); 

            // Atualiza o localStorage com o novo estado
            localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems)); 

            // Limpa o localStorage da chave 'itensVendaAvul' após o processamento
            localStorage.removeItem('itensVendaAvul'); // Remove o item do localStorage

            setShowConfirmationModal(false);
            toast.success('Partida finalizada com sucesso!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            setTimeout(() => {
                navigate('/resumogame');
            }, 1000);
        } catch (error) {
            console.error('Erro ao finalizar partida:', error);
            toast.error('Erro ao finalizar partida', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        } finally {
            setLoading(false);
        }
    };

    const cancelCloseGame = () => {
        setShowConfirmationModal(false);
    };

    const calcularTotalAvulsos = () => {
        return vendasAvulsas.reduce((total, venda) => {
            if (!venda || !venda.items) return total;
            return total + venda.items.reduce((subtotal, item) => {
                return subtotal + (Number(item && item.valor) || 0);
            }, 0);
        }, 0);
    };

    const calcularTotalDespesas = () => {
        const totalDespesas = despesas.reduce((total, despesa) => {
            if (!despesa || !despesa.items) return total;
            return total + despesa.items.reduce((subtotal, item) => {
                return subtotal + (Number(item && item.valor) || 0);
            }, 0);
        }, 0);
        
        // Armazena o total de despesas no localStorage
        localStorage.setItem('totdespesas', totalDespesas.toFixed(2)); // Armazena com duas casas decimais

        return totalDespesas;
    };

    const calcularTotalJogadores = () => {
        return jogadores.reduce((total, jogador) => {
            if (!jogador || !jogador.items) return total;
            return total + jogador.items.reduce((subtotal, item) => {
                return subtotal + (Number(item && item.valor) || 0);
            }, 0);
        }, 0);
    };

    return (
        <section className="bg-black text-white min-h-screen w-full h-auto rounded-md p-3 flex flex-col gap-4">
            <ToastContainer />
            {loading ? (
                <div className="flex flex-col items-center justify-center h-screen">
                    <ClipLoader
                        color="#ffffff"
                        loading={loading}
                        size={50}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                    />
                    <p className="text-white mt-4">Carregando...</p>
                </div>
            ) : (
                <>
                    <section className="bg-black text-white w-full h-auto rounded-md p-3 flex flex-col gap-4">
                        <div className="flex justify-between w-full gap-4 mb-4">
                            <div className="flex flex-col items-start">
                                <p className="font-semibold">Data da Partida</p>
                                <p id="dataPartida" className="font-semibold text-3xl">
                                    {jogo && jogo.data 
                                        ? new Date(new Date(jogo.data).getTime() + (24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR') 
                                        : 'Carregando...'}
                                </p>
                            </div>
                            <div className="flex flex-col items-start">
                                <p className="font-semibold">Jogadores Ativos</p>
                                <p id="playerAtivo" className="font-semibold text-3xl">{jogadoresAtivos}</p> 
                            </div>
                            <div className="flex flex-col items-start">
                                <p className="font-semibold">Jogadores Finalizados</p>
                                <p id="playerInativo" className="font-semibold text-3xl">{jogadoresInativos}</p> 
                            </div>
                            <div className="flex flex-col items-start">
                                <p className="font-semibold">Total dos Jogadores</p>
                                <p id="TotalJogadores" className="font-semibold text-3xl">
                                    R$ {calcularTotalJogadores().toFixed(2)}
                                </p> 
                            </div>
                            <div className="flex flex-col items-start">
                                <p className="font-semibold">Avulsos</p>
                                <p id="Avulsos" className="font-semibold text-3xl">
                                    R$ {calcularTotalAvulsos().toFixed(2)}
                                </p> 
                            </div>
                            <div className="flex flex-col items-start">
                                <p className="font-semibold">Despesas</p>
                                <p id="Despesas" className="font-semibold text-3xl">
                                    R$ {calcularTotalDespesas().toFixed(2)}
                                </p> 
                            </div>
                        </div>

   
                        <div className="flex flex-wrap gap-4 text-black">
                            <CardJog 
                                jogadores={jogadores} 
                                setJogadores={setJogadores} 
                                handleAddJogador={handleAddJogador} 
                                handleClosePedido={handleClosePedido}   
                            />
                            <VendaAvulsa 
                                vendas={vendasAvulsas} 
                                setVendas={setVendasAvulsas} 
                                handleAddVendaAvulsa={handleAddVendaAvulsa} 
                                handleClosePedido={handleClosePedido}
                            />
                            <CardDespesas 
                                despesas={despesas}
                                setDespesas={setDespesas}
                                handleAddDespesa={handleAddDespesa}
                                handleClosePedido={handleClosePedido}
                            />
                        </div>
                    </section>
                    <div className="flex justify-end mt-auto">
                        <button
                            onClick={handleAddJogador}
                            className="bg-primary hover:bg-white duration-300 m-2 w-16 h-16 rounded-full flex justify-center items-center"
                            title="Adicionar Jogador"
                        >
                            <FaPlus size={30} />
                        </button>
                        <button
                            onClick={handleAddVendaAvulsa}
                            className="bg-primary hover:bg-white duration-300 m-2 w-16 h-16 rounded-full flex justify-center items-center"
                        >
                            <FaPlus size={30} />
                        </button>
                        <button 
                            onClick={handleAddDespesa}
                            className="bg-primary hover:bg-white duration-300 m-2 w-16 h-16 rounded-full flex justify-center items-center"
                        >
                            <FaPlus size={30} />
                        </button>
                        <button 
                            onClick={handleFecharPartida}
                            className="bg-white hover:bg-red-600 duration-300 m-2 w-16 h-16 rounded-full flex justify-center items-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <ClipLoader
                                    color="#000000"
                                    loading={loading}
                                    size={20}
                                    aria-label="Loading Spinner"
                                    data-testid="loader"
                                />
                            ) : (
                                <IoMdClose size={30}/>
                            )}
                        </button>
                    </div>

                    {/* Modal de confirmação */}
                    {showConfirmationModal && (
                        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                            <div className="bg-white p-6 rounded-lg w-96">
                                <h2 className="text-black text-2xl font-semibold mb-4">
                                    Tem certeza que deseja fechar a partida?
                                </h2>
                                <div className="flex justify-between mt-4">
                                    <button
                                        className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg"
                                        onClick={cancelCloseGame}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        className="bg-black hover:bg-primary py-2 px-4 rounded-lg text-white"
                                        onClick={confirmCloseGame}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <ClipLoader
                                                color="#ffffff"
                                                loading={loading}
                                                size={20}
                                                aria-label="Loading Spinner"
                                                data-testid="loader"
                                            />
                                        ) : (
                                            'OK'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}