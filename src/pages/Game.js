import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useGameContext } from '../context/GameContext';
import { useLocation } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader'; // Importar o ClipLoader
import { toast } from 'react-toastify';
import VendaAvulsa from './Componentes/VendaAvul';
import { FaPlus } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

const Game = () => {

    const location = useLocation();
    const { dataJogo, horaJogo } = location.state || {}; // Recebe os dados passados
    
    const [jogadores, setJogadores] = useState([]); // Estado para armazenar os jogadores
    const [loading, setLoading] = useState(true); // Estado para controlar o carregamento
    const [estoque, setEstoque] = useState([]); // Adicionando estado para estoque
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [jogadorIndexForPayment, setJogadorIndexForPayment] = useState(null);
    const [paymentValues, setPaymentValues] = useState({ dinheiro: 0, credito: 0, debito: 0, pix: 0, deposito: 0 });
    const [paymentMethods, setPaymentMethods] = useState({ dinheiro: false, credito: false, debito: false, pix: false, deposito: false });
    const [descontos, setDescontos] = useState({});
    const [descontoSelecionado, setDescontoSelecionado] = useState('');
    const [valorComDesconto, setValorComDesconto] = useState(0);
    const [valorTotalVendaAtual, setValorTotalVendaAtual] = useState(0);
    const [vendasAvulsas, setVendasAvulsas] = useState([{
        nome: '',
        numero: '1',
        items: [],
        selectedItem: '',
        isClosed: false
    }]);
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

    useEffect(() => {
        // Função para buscar os dados dos jogadores
        const fetchJogadores = async () => {
            try {
                const response = await axios.get(`./.netlify/functions/api-pedidos?data=${dataJogo}&hora=${horaJogo}`);
                setJogadores(response.data || []); // Certifique-se de que é um array
            } catch (error) {
                console.error('Erro ao buscar jogadores:', error);
            } finally {
                setLoading(false); // Define loading como false após a busca
            }
        };

        if (dataJogo && horaJogo) {
            fetchJogadores();
        }
    }, [dataJogo, horaJogo]);

    useEffect(() => {
        const fetchEstoque = async () => {
            try {
                const response = await axios.get('/.netlify/functions/api-estoque');
                setEstoque(response.data);
            } catch (error) {
                console.error('Erro ao buscar estoque:', error);
            }
        };
        fetchEstoque();
    }, []);

    useEffect(() => {
        const fetchDescontos = async () => {
            try {
                const response = await axios.get('/.netlify/functions/api-descontos');
                setDescontos(response.data);
            } catch (error) {
                console.error('Erro ao buscar descontos:', error);
            }
        };
        fetchDescontos();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <ClipLoader
                    color="#ffffff"
                    loading={loading}
                    size={50}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                />
                <p className="text-white mt-4">Carregando dados...</p> {/* Mensagem de carregamento */}
            </div>
        ); // Mensagem de carregamento
    }

    if (jogadores.length === 0) {
        return <p>Nenhum jogador encontrado.</p>;
    }

    const handleAddJogador = () => {
        setJogadores([...jogadores, {
            nome: '',
            numero: newNumero,
            items: [],
            selectedItem: '',
            isClosed: false
        }]);
    };

    const handleRemoveJogador = (index) => {
        const updatedJogadores = jogadores.filter((_, i) => i !== index);
        setJogadores(updatedJogadores);
    };

    const handleNomeChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].nome = event.target.value;
        setJogadores(updatedJogadores);
    };

    const handleNumeroChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].numero = event.target.value;
        setJogadores(updatedJogadores);
    };

    const handleAddItem = (index) => {
        const updatedJogadores = [...jogadores];
        const selectedItem = { nome: updatedJogadores[index].selectedItem, valor: 10 }; // Exemplo de valor
        updatedJogadores[index].items.push({ ...selectedItem, quantidade: 1 });
        updatedJogadores[index].selectedItem = '';
        setJogadores(updatedJogadores);
    };

    const handleRemoveItem = (jogadorIndex, itemIndex) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[jogadorIndex].items.splice(itemIndex, 1);
        setJogadores(updatedJogadores);
    };

    const handleClosePedido = (index) => {
        const jogador = jogadores[index];
        if (!jogador.nome || jogador.nome.trim() === '') {
            toast.error('O nome do jogador é obrigatório antes de fechar o pedido.');
            return;
        }
        if (jogador.isClosed) {
            const updatedJogadores = [...jogadores];
            updatedJogadores[index].isClosed = false;
            updatedJogadores[index].items = [];
            setJogadores(updatedJogadores);
        } else {
            setJogadorIndexForPayment(index);
            setShowPaymentModal(true);
        }
        const valorTotal = jogador.items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
        setValorTotalVendaAtual(valorTotal);
    };

    const handleConfirmPayment = async () => {
        const jogador = jogadores[jogadorIndexForPayment];
        if (!jogador.items || jogador.items.length === 0) {
            toast.error('Nenhum item encontrado para o jogador');
            return;
        }
        if (!Object.values(paymentMethods).some(method => method === true)) {
            toast.error('Por favor, selecione pelo menos uma forma de pagamento');
            return;
        }
        const totalPagamento = Object.values(paymentValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        const valorTotal = jogador.items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
        setValorTotalVendaAtual(valorTotal);
        if (totalPagamento !== valorTotal) {
            toast.error('O valor total do pagamento deve ser igual ao valor total dos itens');
            return;
        }
        const updatedJogadores = [...jogadores];
        updatedJogadores[jogadorIndexForPayment].isClosed = true;
        setJogadores(updatedJogadores);
        setShowPaymentModal(false);
        toast.success('Pagamento confirmado com sucesso!');
        // Enviar o pedido para a API
        const dataJogo = localStorage.getItem('dataJogo');
        const horaJogo = localStorage.getItem('horaJogo');
        try {
            await axios.post('/.netlify/functions/api-pedidos', {
                nomeJogador: jogador.nome,
                items: jogador.items.map(item => item.nome),
                formaPagamento: Object.keys(paymentMethods).find(method => paymentMethods[method]),
                valorTotal: valorTotal,
                dataPedido: dataJogo,
                horaPedido: horaJogo,
            });
        } catch (error) {
            console.error('Erro ao cadastrar pedido:', error);
            toast.error('Erro ao finalizar pedido');
        }
    };

    return (
        <div className="bg-black text-white min-h-screen w-full h-auto rounded-md p-3 flex flex-col gap-4">
            <div className="flex justify-between w-full gap-4 mb-4">
                <h1 className="text-3xl font-semibold mb-4">Detalhes do Jogo</h1>
                <div className="flex flex-col items-start">
                    <p className="text-white">Data do Jogo: </p>
                    <p className="font-semibold text-3xl">{new Date(dataJogo).toLocaleDateString('pt-BR')}</p> 
                    
                </div>
                <div className="flex flex-col items-start">
                    <p className="text-white">Hora do Jogo: </p>
                    <p className="font-semibold text-3xl">{horaJogo}</p>
                </div>
            </div>
            <div className="flex flex-wrap gap-4 text-black">
                {jogadores.map((jogador, index) => (
                    <section key={index} className={`w-[300px] h-auto rounded-lg bg-white ${jogador.isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
                        <header className="bg-primary w-full p-3 rounded-t-lg text-black font-normal flex justify-between items-center">
                            <h3 className="text-lg font-semibold ml-2">{jogador.nome_jogador || 'Despesa'}</h3>
                            <div>
                                <button
                                    className="bg-white hover:bg-green-600 text-black py-1 px-2 rounded-l inline-flex ml-2"
                                    onClick={() => handleAddJogador()}
                                >
                                    +
                                </button>
                                <button
                                    className="bg-black hover:bg-primary py-1 px-2 rounded-r text-white"
                                    onClick={() => handleRemoveJogador(index)}
                                >
                                    -
                                </button>
                            </div>
                        </header>
                        <div className="p-2">
                            <p><strong>Forma de Pagamento:</strong> {Array.isArray(jogador.forma_pagamento) ? jogador.forma_pagamento.join(' e ') : 'N/A'}</p>
                            <p><strong>Valor Total:</strong> R$ {jogador.valor_total || '0'}</p>
                        </div>
                        <div className="w-full h-auto p-1">
                            <div className="p-2 flex flex-col justify-center items-center">
                                <h4>Itens:</h4>
                                {jogador.items ? JSON.parse(jogador.items).map((item, itemIndex) => (
                                    <div key={itemIndex} className="p-2 flex flex-col justify-center items-center">
                                        <p>{item.nome} - R$ {item.valor}</p>
                                    </div>
                                )) : <p>Nenhum item disponível</p>}
                            </div>
                        </div>
                        <div className="flex justify-center items-center mt-2">
                            <button
                                className="w-[180px] bg-gray-300 hover:bg-secondary text-gray-800 font-bold py-2 px-4 rounded-l"
                                onClick={() => handleClosePedido(index)}
                            >
                                {jogador.isClosed ? 'Fechado' : 'Fechar Pedido'}
                            </button>
                        </div>
                        <VendaAvulsa 
                            vendas={vendasAvulsas} 
                            setVendas={setVendasAvulsas} 
                            handleAddVendaAvulsa={handleAddVendaAvulsa} 
                            handleClosePedido={handleClosePedido}
                        />
                    </section>
                ))}
            </div>
            <div className="flex flex-wrap gap-4 text-black">
                <button
                    onClick={handleAddVendaAvulsa}
                    className="bg-primary hover:bg-white duration-300 m-2 w-16 h-16 rounded-full flex justify-center items-center"
                >
                    <FaPlus size={30} />
                </button>
                <button 
                            //onClick={handleFecharPartida}
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
            {showPaymentModal && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg w-[500px]">
                        <h2 className="text-2xl font-semibold mb-4">Formas de Pagamento</h2>
                        <div className="mb-4">
                            <p className="font-bold">Valor Total: R$ {valorTotalVendaAtual.toFixed(2)}</p>
                        </div>
                        {/* ... código para seleção de desconto e métodos de pagamento ... */}
                        <div className="flex justify-between mt-4">
                            <button
                                className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="bg-black hover:bg-primary py-2 px-4 rounded-lg text-white"
                                onClick={handleConfirmPayment}
                            >
                                Confirmar Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;