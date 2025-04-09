import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

export default function CardJogador({ jogadores, setJogadores, handleAddJogador }) {
    const [estoque, setEstoque] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [jogadorIndexForPayment, setJogadorIndexForPayment] = useState(null);
    const [paymentValues, setPaymentValues] = useState({ dinheiro: 0, credito: 0, debito: 0, pix: 0, deposito: 0 });
    const [paymentMethods, setPaymentMethods] = useState({ dinheiro: false, credito: false, debito: false, pix: false, deposito: false });
    const [descontos, setDescontos] = useState({});
    const [descontoSelecionado, setDescontoSelecionado] = useState('');
    const [valorDesconto, setValorDesconto] = useState(0);
    const [valorComDesconto, setValorComDesconto] = useState(0);
    const [valorTotalVendaAtual, setValorTotalVendaAtual] = useState(0);

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

    const updateJogadores = (updatedJogadores) => {
        setJogadores(updatedJogadores);
    };

    const handleRemoveJogador = (index) => {
        if (jogadores.length >= 0) {
            const updatedJogadores = jogadores.filter((_, i) => i !== index);
            updateJogadores(updatedJogadores);
        } else {
            toast.error('Deve haver pelo menos um jogador na tela.');
        }
    };

    const handleNomeChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].nome = event.target.value;
        updateJogadores(updatedJogadores);
    };

    const handleNumeroChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].numero = event.target.value;
        updateJogadores(updatedJogadores);
    };

    const handleItemSelectChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        const selectedItem = estoque.find(item => item.nome === event.target.value);
        updatedJogadores[index].selectedItem = selectedItem;
        updateJogadores(updatedJogadores);
    };

    const handleAddItem = (index) => {
        const updatedJogadores = [...jogadores];
        if (updatedJogadores[index].selectedItem) {
            const selectedItem = { ...updatedJogadores[index].selectedItem };
            selectedItem.valor = parseFloat(selectedItem.valor) || 0;

            // Check if it's a ball item
            const ballItems = ['saco com 500 bolinhas', 'saco com 50', 'saco com 2000'];
            const isBallItem = ballItems.includes(selectedItem.nome);
            
            const existingItem = updatedJogadores[index].items.find(item => item.nome === selectedItem.nome);
            if (existingItem) {
                if (isBallItem) {
                    // For ball items, we want to keep them as separate entries
                    selectedItem.quantidade = 1;
                    updatedJogadores[index].items.push(selectedItem);
                } else {
                    existingItem.quantidade = (existingItem.quantidade || 1) + 1;
                }
            } else {
                selectedItem.quantidade = 1;
                updatedJogadores[index].items.push(selectedItem);
            }
            updatedJogadores[index].selectedItem = '';

            const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
            const itemName = selectedItem.nome;
            storedItems[itemName] = (storedItems[itemName] || 0) + 1;
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
            
            const existingItem = updatedJogadores[index].items.find(i => i.nome === selectedItem.nome)
            if (existingItem) {
                existingItem.quantidade = (existingItem.quantidade || 1) + 1; 
            } else {
                selectedItem.quantidade = 1; 
                updatedJogadores[index].items.push(selectedItem);
            }
            updatedJogadores[index].selectedItem = '';
            
            const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
            const itemName = selectedItem.nome;
            storedItems[itemName] = (storedItems[itemName] || 0) + 1; // Incrementa a quantidade
            localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));
            updateJogadores(updatedJogadores);
        } else {
            toast.error('Por favor, selecione um item antes de adicionar.');
        }
    };

    const handleRemoveItem = (jogadorIndex, itemIndex) => {
        const updatedJogadores = [...jogadores];
        const itemName = updatedJogadores[jogadorIndex].items[itemIndex].nome;

        const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
        if (storedItems[itemName]) {
            storedItems[itemName] -= 1; 
            if (storedItems[itemName] <= 0) {
                delete storedItems[itemName]; 
            }
        }
        localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));

        if (updatedJogadores[jogadorIndex].items[itemIndex].quantidade > 1) {
            updatedJogadores[jogadorIndex].items[itemIndex].quantidade -= 1; 
        } else {
            updatedJogadores[jogadorIndex].items.splice(itemIndex, 1); 
        }
        
        updateJogadores(updatedJogadores);
    };

    const handleClosePedido = (index) => {
        const jogador = jogadores[index];

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
            return; 
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

        const valorTotal = jogador.items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);;
        setValorTotalVendaAtual(valorTotal); 
    };

    const handleConfirmPayment = async () => {
        const jogador = jogadores[jogadorIndexForPayment];
        const valorFinal = valorComDesconto || valorTotalVendaAtual;
        if (!jogador.items || jogador.items.length === 0) {
            toast.error('Nenhum item encontrado para o jogador', {
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

        if (!Object.values(paymentMethods).some(method => method === true)) {
            toast.error('Por favor, selecione pelo menos uma forma de pagamento', {
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

        const totalPagamento = Object.values(paymentValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        const valorTotal = jogador.items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);;
        setValorTotalVendaAtual(valorTotal);
        if (totalPagamento !== valorTotal) {
            toast.error('O valor total do pagamento deve ser igual ao valor total dos itens', {
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

        const itemCountMap = jogador.items.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
        }, {});

        // Check for ball items and reduce stock
        const ballItems = ['SACO 500 BOLAS', 'SACO 50 BOLAS', 'SACO 2000 BOLAS'];
        for (const item of jogador.items) {
            if (ballItems.includes(item.nome)) {
                try {
                    // Call the API for each quantity of the ball item
                    for (let i = 0; i < (item.quantidade || 1); i++) {
                        await axios.patch('/.netlify/functions/api-bolinhas', {
                            itemNome: item.nome
                        });
                    }
                } catch (error) {
                    console.error('Erro ao reduzir quantidade de bolinhas:', error);
                    toast.error('Erro ao reduzir quantidade de bolinhas', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "light",
                    });
                    return; // Stop the process if there's an error
                }
            }
        }
     
        const updatedJogadores = [...jogadores];
        updatedJogadores[jogadorIndexForPayment].isClosed = true;
        updateJogadores(updatedJogadores);
        setShowPaymentModal(false);
        toast.dismiss();
        toast.success('Pagamento confirmado com sucesso!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });

        const formaPagamento = Object.keys(paymentMethods).map(method => {
            if (paymentMethods[method]) {
                return {
                    metodo: method,
                    valor: paymentValues[method] || 0 
                };
            }
            return null; 
        }).filter(Boolean); 

        const dadosParaEnviar = {
            items: jogador.items.map(item => ({ nome: item.nome, valor: item.valor, qtd: item.quantidade })),
            formaPagamento: formaPagamento, 
        };

        const dataJogo = localStorage.getItem('dataJogo');
        const horaJogo = localStorage.getItem('horaJogo');
        try {
            await axios.post('/.netlify/functions/api-pedidos', {
                nomeJogador: jogador.nome,
                items: dadosParaEnviar.items,
                formaPagamento: dadosParaEnviar.formaPagamento,
                valorTotal: valorFinal,
                dataPedido: dataJogo,
                horaPedido: horaJogo,
            });
            
            
        } catch (error) {
            console.error('Erro ao cadastrar pedido:', error);
            toast.error('Erro ao finalizar pedido', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
        const pagamentosAnteriores = JSON.parse(localStorage.getItem('pagamentos')) || [];
            const formasSelecionadas = Object.keys(paymentMethods).filter(method => paymentMethods[method]);

            formasSelecionadas.forEach(forma => {
                const valorForma = paymentValues[forma]; 
                pagamentosAnteriores.push({
                    valorTotal: valorForma, 
                    formaPagamento: forma,
                });
            });
            localStorage.setItem('pagamentos', JSON.stringify(pagamentosAnteriores));
    };

    const calcularTotal = () => {
        return jogadores.reduce((total, jogador) => {
            const valorJogador = jogador.items.reduce((soma, item) => soma + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
            return total + valorJogador;
        }, 0);
    };
    const calcularDesconto = (valorTotal) => {
        if (!descontoSelecionado) return valorTotal;
        const valorDesconto = descontos[descontoSelecionado] || 0;
        setValorDesconto(valorDesconto);
        return Math.max(0, valorTotal - valorDesconto);
    };
    
    useEffect(() => {
        const total = calcularTotal();
        setValorTotalVendaAtual(total);
    }, [jogadores]); 

    return (
        <div className="flex flex-wrap gap-4">

            {jogadores.map((jogador, index) => {
                const valorTotalVenda = jogador.items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
                return (
                    <section key={index} className={`w-[300px] h-auto rounded-lg bg-white ${jogador.isClosed ? 'opacity-50' : ''}`}>
                        <header className="bg-primary w-full p-3 rounded-t-lg gap-2 flex flex-col justify-center items-center text-black font-normal md:flex-col md:justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-black">Jogador</p>
                                {jogador.isClosed && (
                                    <button
                                        onClick={() => {
                                            const items = jogador.items || [];
                                            const total = items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
                                            const formaPagamento = jogador.forma_pagamento ? JSON.parse(jogador.forma_pagamento) : [];
                                            
                                            let mensagem = `*Detalhes do Pedido*\n\n`;
                                            mensagem += `*Jogador:* ${jogador.nome || 'Despesa'}\n\n`;
                                            mensagem += `*Itens:*\n`;
                                            
                                            items.forEach(item => {
                                                mensagem += `${item.quantidade || 1}x - ${item.nome} - R$ ${item.valor}\n`;
                                            });
                                            
                                            mensagem += `\n*Formas de Pagamento:*\n`;
                                            formaPagamento.forEach(pagamento => {
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
                                )}
                            </div>
                            <div className="flex flex-col justify-center items-center gap-2 md:flex-row md:justify-between">
                                <input
                                    type="text"
                                    className="text-center w-10 rounded-sm px-2 py-1"
                                    placeholder="N°"
                                    value={jogador.numero}
                                    onChange={(e) => handleNumeroChange(index, e)}
                                    disabled={jogador.isClosed}
                                />
                                <input
                                    type="text"
                                    className="text-center w-44 rounded-sm px-2 py-1"
                                    placeholder="Cliente"
                                    value={jogador.nome}
                                    onChange={(e) => handleNomeChange(index, e)}
                                    disabled={jogador.isClosed}
                                />
                                <div className="inline-flex">
                                    <button
                                        className="bg-white hover:bg-green-600 text-black py-1 px-2 rounded-l"
                                        onClick={handleAddJogador}
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
                            </div>
                        </header>
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
                            {jogador.items.map((item, itemIndex) => (
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
                    </section>
                );
            })}

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
        </div>
    );
} 