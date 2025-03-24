import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useGameContext } from '../context/GameContext';
import { useLocation, useNavigate } from 'react-router-dom';
import ClipLoader from 'react-spinners/ClipLoader'; // Importar o ClipLoader
import { toast } from 'react-toastify';
import VendaAvulsa from './Componentes/VendaAvul';
import { FaPlus } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

// Adicione o estilo do spinner
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
`;

const Game = () => {

    const location = useLocation();
    const { dataJogo, horaJogo } = location.state || {}; // Recebe os dados passados
    const navigate = useNavigate();

    useEffect(() => {
        if (dataJogo && horaJogo) {
            localStorage.setItem('dataJogo', dataJogo);
            localStorage.setItem('horaJogo', horaJogo);
        }
    }, [dataJogo, horaJogo]);
    
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
    const [jogador, setJogador] = useState({
        id: null,
        items: '[]', // Inicialize com um valor padrão
        // outras propriedades...
    });
    const [isModalOpen, setIsModalOpen] = useState(false); // Estado para o modal
    const [itemToDelete, setItemToDelete] = useState(null); // Estado para armazenar o item a ser deletado

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

    // Função para buscar os dados dos jogadores
    const fetchJogadores = async () => {
        try {
            const response = await axios.get(`/.netlify/functions/api-pedidos?data=${dataJogo}&hora=${horaJogo}`);
            setJogadores(response.data || []); // Certifique-se de que é um array
        } catch (error) {
            console.error('Erro ao buscar jogadores:', error);
        } finally {
            setLoading(false); // Define loading como false após a busca
        }
    };

    useEffect(() => {
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
            <div className="flex items-center justify-center h-screen bg-black">
                <style>{spinnerStyle}</style>
                <div className="loading-spinner"></div>
                <p className="text-white mt-4">Carregando dados...</p>
            </div>
        );
    }

    if (jogadores.length === 0) {
        return <p>Nenhum jogador encontrado.</p>;
    }

    const updateJogadores = (updatedJogadores) => {
        setJogadores(updatedJogadores);
    };

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
        if (updatedJogadores[index].selectedItem) {
            const selectedItem = { ...updatedJogadores[index].selectedItem };
            selectedItem.valor = parseFloat(selectedItem.valor) || 0;

            // Verifica se o item já existe na lista de itens do jogador
            const existingItem = updatedJogadores[index].items.find(item => item.nome === selectedItem.nome);
            if (existingItem) {
                existingItem.quantidade = (existingItem.quantidade || 1) + 1; // Incrementa a quantidade
            } else {
                selectedItem.quantidade = 1; // Define a quantidade como 1 se for um novo item
                updatedJogadores[index].items.push(selectedItem);
            }
            updatedJogadores[index].selectedItem = '';

            // Armazenar a quantidade e o nome dos itens no localStorage da página VendaAvul
            const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
            const itemName = selectedItem.nome;
            storedItems[itemName] = (storedItems[itemName] || 0) + 1; // Incrementa a quantidade
            localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));

            updateJogadores(updatedJogadores);
        } else {
            toast.error('Por favor, selecione um item antes de adicionar.');
        }
    };

    const handleAddItemNovo = (index, item) => {
        const updatedJogadores = [...jogadores];
        if (item) {
            const selectedItem = { ...item };
            selectedItem.valor = parseFloat(selectedItem.valor) || 0;
            // Verifica se o item já existe na lista de itens do jogador
            const existingItem = updatedJogadores[index].items.find(i => i.nome === selectedItem.nome)
            if (existingItem) {
                existingItem.quantidade = (existingItem.quantidade || 1) + 1; // Incrementa a quantidade
            } else {
                selectedItem.quantidade = 1; // Define a quantidade como 1 se for um novo item
                updatedJogadores[index].items.push(selectedItem);
            }
            updatedJogadores[index].selectedItem = '';
            // Armazenar a quantidade e o nome dos itens no localStorage da página VendaAvul
            const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
            const itemName = selectedItem.nome;
            storedItems[itemName] = (storedItems[itemName] || 0) + 1; // Incrementa a quantidade
            localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));
            updateJogadores(updatedJogadores);
        } else {
            toast.error('Por favor, selecione um item antes de adicionar.');
        }
    };
    
    const handleDeleteItem = async (jogador, itemIndex) => {
        if (!itemToDelete) return;

        
        try {
            const pedidoId = jogador.id;
            const itemsArray = JSON.parse(jogador.items);

            // Decrementa a quantidade do item
            const itemToUpdate = itemsArray[itemIndex];
            if (itemToUpdate) {
                itemToUpdate.qtd -= 1; // Decrementa a quantidade

                // Se a quantidade chegar a zero, remove o item do banco de dados
                if (itemToUpdate.qtd <= 0) {
                    // Faz a chamada para a API para deletar o item
                    const deleteResponse = await axios.delete(`/.netlify/functions/api-pedidos/${pedidoId}`, {
                        data: { pedidoId, itemIndex }
                    });

                    if (deleteResponse.status === 200) {
                        itemsArray.splice(itemIndex, 1); // Remove o item do array
                    }
                }
            }

            // Se a quantidade não chegou a zero, apenas atualiza o pedido
            if (itemToUpdate.qtd > 0) {
                // Faz a chamada para a API para atualizar o pedido
                const updateResponse = await axios.put(`/.netlify/functions/api-pedidos/${pedidoId}`, {
                    pedidoId,
                    items: JSON.stringify(itemsArray)
                });

                if (updateResponse.status === 200) {
                    toast.success('Item atualizado com sucesso!');
                }
            } else {
                toast.success('Item removido com sucesso!');
            }

            // Atualiza o estado local
            setJogadores(prevState => {
                const updatedJogadores = [...prevState];
                updatedJogadores[jogadores.indexOf(jogador)].items = JSON.stringify(itemsArray);
                return updatedJogadores;
            });
        } catch (error) {
            console.error('Erro ao remover o item:', error);
            toast.error('Erro ao remover o item.');
        } finally {
            setIsModalOpen(false); // Fecha o modal após a confirmação
            setItemToDelete(null); // Limpa o item a ser deletado
        }
    };

    const handleClosePedido = (index) => {
        const jogador = jogadores[index];

        // Verifique se o nome do jogador está preenchido
        if (!jogador.nome || jogador.nome.trim() === '') {
            toast.error('O nome do jogador é obrigatório antes de fechar o pedido.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            return; // Não fecha o pedido se o nome não estiver preenchido
        }

        if (jogador.isClosed) {
            const updatedJogadores = [...jogadores];
            updatedJogadores[index].isClosed = false;
            updatedJogadores[index].items = [];
            updateJogadores(updatedJogadores);
        } else {
            setJogadorIndexForPayment(index);
            setShowPaymentModal(true);
        }

        // Calcular o valor total após fechar o pedido
        const items = jogador.items ? JSON.parse(jogador.items) : [];
        if (!Array.isArray(items)) {
            console.error('items não é um array:', items);
            return;
        }
        const valorTotal = items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
        setValorTotalVendaAtual(valorTotal); // Atualiza o estado com o novo total
    };
    const handleRemoveItem = (jogadorIndex, itemIndex) => {
        const updatedJogadores = [...jogadores];
        const itemName = updatedJogadores[jogadorIndex].items[itemIndex].nome;

        // Atualiza o localStorage ao remover um item
        const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
        if (storedItems[itemName]) {
            storedItems[itemName] -= 1; // Decrementa a quantidade
            if (storedItems[itemName] <= 0) {
                delete storedItems[itemName]; // Remove o item se a quantidade for zero
            }
        }
        localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));

        // Reduz a quantidade do item ou remove o item se a quantidade for zero
        if (updatedJogadores[jogadorIndex].items[itemIndex].quantidade > 1) {
            updatedJogadores[jogadorIndex].items[itemIndex].quantidade -= 1; // Decrementa a quantidade
        } else {
            updatedJogadores[jogadorIndex].items.splice(itemIndex, 1); // Remove o item se a quantidade for zero
        }
        
        updateJogadores(updatedJogadores);
    };
    const handleItemSelectChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        const selectedItem = estoque.find(item => item.nome === event.target.value);
        updatedJogadores[index].selectedItem = selectedItem;
        updateJogadores(updatedJogadores);
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
                formaPagamento: jogador.forma_pagamento ? JSON.parse(jogador.forma_pagamento) : [],
                valorTotal: valorTotal,
                dataPedido: dataJogo,
                horaPedido: horaJogo,
            });
        } catch (error) {
            console.error('Erro ao cadastrar pedido:', error);
            toast.error('Erro ao finalizar pedido');
        }
    };

    const calculateTotalValue = (items) => {
        return items.reduce((acc, item) => {
            const quantidade = item.qtd || 0; // Pega a quantidade, se não existir, usa 0
            const valor = parseFloat(item.valor) || 0; // Pega o valor, se não existir, usa 0
            return acc + (quantidade * valor); // Soma a quantidade multiplicada pelo valor
        }, 0);
    };

    const handleFecharPartida = () => {
        // Coletar dados de pagamento de todos os jogadores
        const pagamentos = jogadores.map(jogador => {
            return {
                nomeJogador: jogador.nome_jogador,
                formaPagamento: jogador.forma_pagamento ? JSON.parse(jogador.forma_pagamento) : [],
                valorTotal: calculateTotalValue(jogador.items ? JSON.parse(jogador.items) : []), // Supondo que você tenha uma função para calcular o valor total
            };
        });

        const dataToSend = {
            formaPagamento: pagamentos,
            // Adicione outros dados necessários aqui, como data do jogo, hora, etc.
            dataJogo: dataJogo,
            horaJogo: horaJogo,
        };

        // Redireciona para a página ResumoEdit com os dados
        navigate('/resumoedit', { state: dataToSend });
    };
    const valorTotalVenda = jogador.items ? JSON.parse(jogador.items).reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0) : 0;
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
                                    className="bg-black hover:bg-primary py-1 px-2 rounded-r text-white"
                                    onClick={() => handleRemoveJogador(index)}
                                >
                                    -
                                </button>
                            </div>
                        </header>
                        <div className="p-2">
                        <div className="flex flex-col items-center">
                            <p><strong>Formas de Pagamento:</strong></p>
                                    {jogador.forma_pagamento ? 
                                        JSON.parse(jogador.forma_pagamento).map(pagamento => (
                                            <p key={pagamento.metodo} className="text-center">
                                                {`${pagamento.metodo} - R$ ${pagamento.valor.toFixed(2)}`}
                                            </p>
                                        )) 
                                        : <p>Nenhuma forma de pagamento disponível</p>}
                                </div>
                            <p className="p-2 flex flex-col justify-center items-center"><strong>Valor Total:</strong> R$ {calculateTotalValue(jogador.items ? JSON.parse(jogador.items) : [])}</p>
                        </div>
                        <div className="w-full h-auto p-1" id="itemsObrigatorio">
                            <div className="p-2 flex flex-col justify-center items-center gap-2 md:flex-row md:justify-between">
                                <select
                                    className="w-full border border-slate-400 rounded px-2 p-1 text-center"
                                    value={(jogador.selectedItem && jogador.selectedItem.nome) || ''}
                                    onChange={(e) => handleItemSelectChange(index, e)}
                                    disabled={jogador.isClosed}
                                >
                                    <option value="">Selecione o item</option>
                                    {estoque.map((item) => (
                                        <option key={item.id} value={item.nome}>
                                            {item.nome}
                                        </option>
                                    ))}
                                </select>
                                <div className="inline-flex">
                                    <button
                                        className="bg-black hover:bg-primary py-1 px-2 rounded text-white"
                                        onClick={() => handleAddItem(index)}
                                        disabled={jogador.isClosed}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            {Array.isArray(jogador.items) && jogador.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="p-2 flex flex-col justify-center items-center md:flex-row md:justify-between">
                                    <div className="inline-flex">
                                        <button
                                            className="bg-black hover:bg-red-500 py-1 px-2 rounded text-white"
                                            onClick={() => handleRemoveItem(index, itemIndex)}
                                            disabled={jogador.isClosed}
                                        >
                                            -
                                        </button>
                                        <button
                                            className="bg-black hover:bg-primary py-1 px-2 rounded text-white"
                                            onClick={() => handleAddItemNovo(index, item)}
                                            disabled={jogador.isClosed}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <p>{item.nome} - {item.quantidade || 1}</p>
                                    <p>R${parseFloat(item.valor).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="inline-flex gap-4 justify-around w-full items-center mt-4">
                            <h1 className="text-md font-semibold">Total: R${valorTotalVenda.toFixed(2)}</h1>
                        </div>
                        <div className="flex justify-center items-center mt-2">
                            <button
                                className="w-[180px] bg-gray-300 hover:bg-secondary text-gray-800 font-bold py-2 px-4 rounded-l"
                                onClick={() => handleClosePedido(index)}
                            >
                                {jogador.isClosed ? 'Fechado' : 'Fechar Pedido'}
                            </button>
                        </div>
                        <div className="w-full h-auto p-1">
                            <div className="p-2 flex flex-col justify-center items-center">
                                <h4>Itens:</h4>
                                {jogador.items ? JSON.parse(jogador.items).map((item, itemIndex) => (
                                    <div key={itemIndex} className="p-2 flex justify-between items-center w-full">
                                        <p>{item.qtd}x - {item.nome} - R$ {item.valor}</p>
                                        <button
                                            className="bg-black hover:bg-red-500 py-1 px-2 rounded text-white"
                                            onClick={() => handleDeleteItem(jogador, itemIndex)}
                                        >
                                            -
                                        </button>
                                    </div>
                                )) : <p>Nenhum item disponível</p>}
                            </div>
                        </div>
                    </section>
                ))}
                <div className="flex flex-col justify-center items-center w-[300px]">
                    <VendaAvulsa 
                        vendas={vendasAvulsas} 
                        setVendas={setVendasAvulsas} 
                        handleAddVendaAvulsa={handleAddVendaAvulsa} 
                        handleClosePedido={handleClosePedido}
                    />
                </div>
            </div>
            <div className="flex justify-end mt-auto">
                <button
                    onClick={handleAddVendaAvulsa}
                    className="bg-primary hover:bg-white duration-300 m-2 w-16 h-16 rounded-full flex justify-center items-center"
                >
                    <FaPlus size={30} />
                </button>
                <div className="p-2 flex flex-col justify-center items-center">
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
            </div>
            {showPaymentModal && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg w-[500px]">
                        <h2 className="text-2xl font-semibold mb-4">Formas de Pagamento</h2>
                        <div className="mb-4">
                            <p className="font-bold">Valor Total: R$ {valorTotalVendaAtual.toFixed(2)}</p>
                        </div>
                        <div className="mb-4">
                            <select
                                value={descontoSelecionado}
                                onChange={(e) => {
                                    setDescontoSelecionado(e.target.value);
                                    setValorComDesconto(calcularDesconto(valorTotalVendaAtual));
                                }}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Selecione o desconto</option>
                                {Object.entries(descontos).map(([tipo, percentual]) => (
                                    <option key={tipo} value={tipo}>
                                        {tipo} - {percentual}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-4 mb-4">
                            {['dinheiro', 'credito', 'debito', 'pix', 'deposito'].map((method) => (
                                <div key={method} className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={paymentMethods[method]}
                                        onChange={(e) => {
                                            setPaymentMethods({
                                                ...paymentMethods,
                                                [method]: e.target.checked
                                            });
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <input
                                        type="number"
                                        value={paymentValues[method]}
                                        onChange={(e) => {
                                            setPaymentValues({
                                                ...paymentValues,
                                                [method]: parseFloat(e.target.value) || 0
                                            });
                                        }}
                                        disabled={!paymentMethods[method]}
                                        placeholder={`Valor ${method}`}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <label className="capitalize">{method}</label>
                                </div>
                            ))}
                        </div>
                        <div className="mb-4">
                            <p className="font-bold">
                                Valor com Desconto: R$ {typeof valorComDesconto === 'number' ? valorComDesconto.toFixed(2) : '0.00'}
                            </p>
                            <p className="font-bold">
                                Valor Total Inserido: R$ {Object.values(paymentValues).reduce((a, b) => a + b, 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex justify-between mt-4">
                            <button
                                className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentValues({ dinheiro: 0, credito: 0, debito: 0, pix: 0, deposito: 0 });
                                    setPaymentMethods({ dinheiro: false, credito: false, debito: false, pix: false, deposito: false });
                                    setDescontoSelecionado('');
                                    setValorComDesconto(0);
                                }}
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
            {/* Modal de Confirmação */}
            {isModalOpen && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-black text-2xl font-semibold mb-4">
                            Realmente deseja apagar o item?
                        </h2>
                        <div className="flex justify-between mt-4">
                            <button onClick={confirmDeleteItem} className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg">Sim</button>
                            <button onClick={() => setIsModalOpen(false)} className="bg-black hover:bg-primary py-2 px-4 rounded-lg text-white">Não</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;