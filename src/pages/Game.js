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
    
    const [jogadores, setJogadores] = useState([{
        nome: '',
        numero: '1',
        items: [],
        selectedItem: '',
        isClosed: false
    }]); // Estado para armazenar os jogadores
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
    const [updateCounter, setUpdateCounter] = useState(0);

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

    //useEffect(() => {
        // Função para buscar dados atualizados
    //    fetchJogadores(); // Chame sua função de busca de dados aqui
    //}, [jogadores]); // O efeito será executado sempre que 'jogadores' mudar

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

            // Garante que items seja um array
            const items = Array.isArray(updatedJogadores[index].items) 
                ? updatedJogadores[index].items 
                : (typeof updatedJogadores[index].items === 'string' ? JSON.parse(updatedJogadores[index].items) : []);

            // Verifica se o item já existe na lista de itens do jogador
            const existingItem = items.find(item => item.nome === selectedItem.nome);
            if (existingItem) {
                existingItem.quantidade = (existingItem.quantidade || 1) + 1; // Incrementa a quantidade
            } else {
                selectedItem.quantidade = 1; // Define a quantidade como 1 se for um novo item
                items.push(selectedItem);
            }
            updatedJogadores[index].selectedItem = '';
            updatedJogadores[index].items = items;

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
            const items = Array.isArray(updatedJogadores[index].items) 
                ? updatedJogadores[index].items 
                : JSON.parse(updatedJogadores[index].items || '[]');
            const existingItem = items.find(i => i.nome === selectedItem.nome)
            if (existingItem) {
                existingItem.qtd = (existingItem.qtd || 1) + 1; // Incrementa a quantidade
            } else {
                selectedItem.qtd = 1; // Define a quantidade como 1 se for um novo item
                items.push(selectedItem);
            }
            updatedJogadores[index].selectedItem = '';
            updatedJogadores[index].items = items;
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
    
    const handleDeleteItem = (jogador, itemIndex) => {
        setItemToDelete({ jogador, itemIndex }); // Armazena o jogador e o índice do item a ser deletado
        setIsModalOpen(true); // Abre o modal de confirmação
    };

    const confirmDeleteItem = async () => {
        if (!itemToDelete) return;

        const { jogador, itemIndex } = itemToDelete;
        try {
            const pedidoId = jogador.id;
            const itemsArray = Array.isArray(jogador.items) ? jogador.items : JSON.parse(jogador.items || '[]');

            // Remove o item do array
            const updatedItems = itemsArray.filter((_, index) => index !== itemIndex);

            // Faz a chamada para a API para deletar o item
            const deleteResponse = await axios.delete(`/.netlify/functions/api-pedidos/${pedidoId}`, {
                data: { pedidoId, itemIndex }
            });

            if (deleteResponse.status === 200) {
                setJogadores(prevState => {
                    const updatedJogadores = [...prevState];
                    updatedJogadores[jogadores.indexOf(jogador)].items = JSON.stringify(updatedItems);
                    return updatedJogadores;
                });
                toast.success('Item removido com sucesso!');

                // Força uma atualização
                setUpdateCounter(prev => prev + 1);
            }
        } catch (error) {
            console.error('Erro ao remover o item:', error);
            toast.error('Erro ao remover o item.');
        } finally {
            setIsModalOpen(false); // Fecha o modal após a confirmação
            setItemToDelete(null); // Limpa o item a ser deletado
        }
        fetchJogadores();
    };

    const handleClosePedido = (index) => {
        const jogador = jogadores[index];

        // Verifique se o nome do jogador está preenchido
        if (!jogador.nome_jogador || jogador.nome_jogador.trim() === '') {
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
        const items = Array.isArray(jogador.items) ? jogador.items : JSON.parse(jogador.items || '[]');
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
            await axios.put('/.netlify/functions/api-pedidos', {
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
        fetchJogadores();
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
    const valorTotalVenda = jogador.items ? (Array.isArray(jogador.items) ? jogador.items : JSON.parse(jogador.items || '[]')).reduce((sum, item) => {
        const quantidade = item.quantidade || 1;
        const valor = parseFloat(item.valor) || 0;
        return sum + (quantidade * valor);
    }, 0) : 0;
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
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold ml-2">{jogador.nome_jogador || 'Despesa'}</h3>
                                <button
                                    onClick={() => {
                                        const items = Array.isArray(jogador.items) ? jogador.items : JSON.parse(jogador.items || '[]');
                                        const total = calculateTotalValue(items);
                                        const formasPagamento = jogador.forma_pagamento ? JSON.parse(jogador.forma_pagamento) : [];
                                        
                                        let mensagem = `*Detalhes do Pedido*\n\n`;
                                        mensagem += `*Jogador:* ${jogador.nome_jogador || 'Despesa'}\n\n`;
                                        mensagem += `*Itens:*\n`;
                                        
                                        items.forEach(item => {
                                            mensagem += `${item.qtd}x - ${item.nome} - R$ ${item.valor}\n`;
                                        });
                                        
                                        mensagem += `\n*Formas de Pagamento:*\n`;
                                        formasPagamento.forEach(pagamento => {
                                            mensagem += `${pagamento.metodo} - R$ ${pagamento.valor.toFixed(2)}\n`;
                                        });
                                        
                                        mensagem += `\n*Total:* R$ ${total.toFixed(2)}`;
                                        
                                        const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
                                        window.open(url, '_blank');
                                    }}
                                    className="bg-green-500 hover:bg-green-600 text-white p-1 rounded-full"
                                    title="Compartilhar via WhatsApp"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564c.173.087.287.129.332.202.045.073.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z"/>
                                    </svg>
                                </button>
                            </div>
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
                                        (Array.isArray(jogador.forma_pagamento) ? jogador.forma_pagamento : JSON.parse(jogador.forma_pagamento)).map(pagamento => (
                                            <p key={pagamento.metodo} className="text-center">
                                                {`${pagamento.metodo} - R$ ${pagamento.valor.toFixed(2)}`}
                                            </p>
                                        )) 
                                        : <p>Nenhuma forma de pagamento disponível</p>}
                                </div>
                            <p className="p-2 flex flex-col justify-center items-center"><strong>Valor Total:</strong> R$ {calculateTotalValue(Array.isArray(jogador.items) ? jogador.items : JSON.parse(jogador.items || '[]'))}</p>
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
                        </div>
                        <div className="w-full h-auto p-1">
                            <div className="p-2 flex flex-col justify-center items-center">
                                <h4>Itens:</h4>
                                {jogador.items ? (Array.isArray(jogador.items) ? jogador.items : JSON.parse(jogador.items)).map((item, itemIndex) => (
                                    <div key={itemIndex} className="p-2 flex justify-between items-center w-full">
                                        <div className="inline-flex">
                                        <button
                                            className="bg-black hover:bg-red-500 py-1 px-2 rounded text-white"
                                            onClick={() => handleDeleteItem(jogador, itemIndex)}
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
                                        <p>{item.qtd}x - {item.nome} - R$ {item.valor}</p>
                                        
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
                    <div className="bg-white p-6 rounded-lg w-[500px] text-black">
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
                        <div className="flex flex-col gap-4 mb-4 text-black">
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
                        <div className="mb-4 text-black">
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