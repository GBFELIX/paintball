import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const VendaAvul = ({ vendas, setVendas, handleAddVendaAvulsa }) => {
    const [estoque, setEstoque] = useState([]);
    const [quantidadeLocal, setQuantidadeLocal] = useState({});
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [vendaIndexForPayment, setVendaIndexForPayment] = useState(null);
    const [paymentValues, setPaymentValues] = useState({ dinheiro: 0, credito: 0, debito: 0, pix: 0, deposito: 0 });
    const [paymentMethods, setPaymentMethods] = useState({ dinheiro: false, credito: false, debito: false, pix: false, deposito: false });
    const [descontos, setDescontos] = useState({});
    const [descontoSelecionado, setDescontoSelecionado] = useState('');
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

    useEffect(() => {
        const storedItems = JSON.parse(localStorage.getItem('itensVenda')) || {};
        setQuantidadeLocal(storedItems);
    }, []);

    const updateVendas = (updatedVendas) => {
        setVendas(updatedVendas);
    };

    const handleRemoveVendaAvulsa = (index) => {
        const updatedVendas = vendas.filter((_, i) => i !== index);
        updateVendas(updatedVendas);
    };

    const handleNomeChange = (index, event) => {
        const updatedVendas = [...vendas];
        updatedVendas[index].nome = event.target.value;
        updateVendas(updatedVendas);
    };

    const handleNumeroChange = (index, event) => {
        const updatedVendas = [...vendas];
        updatedVendas[index].numero = event.target.value;
        updateVendas(updatedVendas);
    };

    const handleItemSelectChange = (index, event) => {
        const updatedVendas = [...vendas];
        const selectedItem = estoque.find(item => item.nome === event.target.value);
        updatedVendas[index].selectedItem = selectedItem ? {
            id: selectedItem.id,
            nome: selectedItem.nome,
            valor: parseFloat(selectedItem.valor || 0),
            quantidade: selectedItem.quantidade
        } : null;
        updateVendas(updatedVendas);
    };

    const handleAddItem = (index) => {
        const updatedVendas = [...vendas];
        
        if (updatedVendas[index].selectedItem) {
            const selectedItem = { ...updatedVendas[index].selectedItem };
            selectedItem.valor = parseFloat(selectedItem.valor) || 0;

            const existingItem = updatedVendas[index].items.find(item => item.nome === selectedItem.nome);
            if (existingItem) {
                existingItem.quantidade = (existingItem.quantidade || 1) + 1;
            } else {
                selectedItem.quantidade = 1; 
                updatedVendas[index].items.push(selectedItem);
            }
            updatedVendas[index].selectedItem = '';

            const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
            const itemName = selectedItem.nome;

            storedItems[itemName] = (storedItems[itemName] || 0) + 1;
            localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));
            setVendas(updatedVendas);
        }  else {
            toast.error('Por favor, selecione um item antes de adicionar.');
        }
    };
    const handleAddItemNovo = (index, item) => {
        const updatedVendas = [...vendas];
        if (item) {
            const selectedItem = { ...item };
            selectedItem.valor = parseFloat(selectedItem.valor) || 0;
            
            const existingItem = updatedVendas[index].items.find(i => i.nome === selectedItem.nome)
            if (existingItem) {
                existingItem.quantidade = (existingItem.quantidade || 1) + 1; 
            } else {
                selectedItem.quantidade = 1; 
                updatedVendas[index].items.push(selectedItem);
            }
            updatedVendas[index].selectedItem = '';
            const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
            const itemName = selectedItem.nome;
            storedItems[itemName] = (storedItems[itemName] || 0) + 1; 
            localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));
            updateVendas(updatedVendas);
        } else {
            toast.error('Por favor, selecione um item antes de adicionar.');
        }
    };

    const handleRemoveItem = (vendaIndex, itemIndex) => {
        const updatedVendas = [...vendas];
        const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
        const itemName = updatedVendas[vendaIndex].items[itemIndex].nome;

        if (storedItems[itemName]) {
            storedItems[itemName] -= 1;
            if (storedItems[itemName] <= 0) {
                delete storedItems[itemName];
            }
        }
        localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));

        if (updatedVendas[vendaIndex].items[itemIndex].quantidade > 1) {
            updatedVendas[vendaIndex].items[itemIndex].quantidade -= 1; 
        } else {
            updatedVendas[vendaIndex].items.splice(itemIndex, 1);
        }
        updateVendas(updatedVendas);
    };

    const handleClosePedido = (index) => {
        const updatedVendas = [...vendas];
        const venda = updatedVendas[index];

        if (venda.isClosed) {
            venda.isClosed = false;
            venda.items = [];
            updateVendas(updatedVendas);
        } else {
            const valorTotal = venda.items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
            setValorTotalVendaAtual(valorTotal);
            setVendaIndexForPayment(index);
            setShowPaymentModal(true);

            venda.items.forEach(item => {
                setQuantidadeLocal(prev => {
                    const newQuantities = {
                        ...prev,
                        [item.nome]: (prev[item.nome] || 0) + 1
                    };
                    localStorage.setItem('itensVenda', JSON.stringify(newQuantities));
                    return newQuantities;
                });
            });
        }
    };

    const calcularDesconto = (valorTotal) => {
        if (!descontoSelecionado) return valorTotal;
        const valorDesconto = descontos[descontoSelecionado] || 0;
        return Math.max(0, valorTotal - valorDesconto);
    };

    const handleConfirmPayment = async () => {
        const totalPagamento = Object.values(paymentValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        const valorFinal = valorComDesconto || valorTotalVendaAtual;

        if (totalPagamento !== valorFinal) {
            showToast('O valor total do pagamento deve ser igual ao valor final', 'error');
            return;
        }

        if (!Object.values(paymentMethods).some(method => method === true)) {
            showToast('Por favor, selecione pelo menos uma forma de pagamento', 'error');
            return;
        }

        const venda = vendas[vendaIndexForPayment];
        
        const nomeCliente = venda.nome.trim() === '' ? 'venda avulsa' : venda.nome;

        const itemsToUpdate = venda.items;

        const itemCountMap = itemsToUpdate.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
        }, {});

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
            items: venda.items.map(item => ({ nome: item.nome, valor: item.valor, qtd: item.quantidade })),
            formaPagamento: formaPagamento, 
        };
        
        try {
            // Finaliza pedido
            const dataJogo = localStorage.getItem('dataJogo');
            const horaJogo = localStorage.getItem('horaJogo');
            await axios.post('/.netlify/functions/api-pedidos', {
                nomeJogador: nomeCliente,
                items: dadosParaEnviar.items,
                formaPagamento: dadosParaEnviar.formaPagamento,
                valorTotal: valorFinal,
                dataPedido: dataJogo,
                horaPedido: horaJogo,
            });

            const updatedVendas = [...vendas];
            updatedVendas[vendaIndexForPayment].isClosed = true;
            updateVendas(updatedVendas);
            setShowPaymentModal(false);

            const pagamentosAnteriores = JSON.parse(localStorage.getItem('pagamentos')) || [];
            dadosParaEnviar.formaPagamento.forEach(forma => {
                const valorForma = forma.valor; 
                pagamentosAnteriores.push({
                    valorTotal: valorForma, 
                    formaPagamento: forma.metodo,
                });
            });

            localStorage.setItem('pagamentos', JSON.stringify(pagamentosAnteriores));
            showToast('Pedido finalizado com sucesso!', 'success');

        } catch (error) {
            console.error(error.message);
            showToast(error.message || 'Erro ao processar pedido', 'error');
        }
    };

    const showToast = (message, type = 'info') => {
        const options = {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        };
        type === 'success' ? toast.success(message, options)
            : type === 'error' ? toast.error(message, options)
            : toast.info(message, options);
    };

    return (
        <div className="flex flex-wrap gap-4">
            {vendas.map((venda, index) => {
                const valorTotalVenda = venda.items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
                return (
                    <section key={index} className={`w-[300px] h-auto rounded-lg bg-white ${venda.isClosed ? 'opacity-50' : ''}`}>
                        <header className="bg-blue-600 w-full p-3 rounded-t-lg gap-2 flex flex-col justify-center items-center text-black font-normal md:flex-col md:justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-black">Venda Avulsa</p>
                                {venda.isClosed && (
                                    <button
                                        onClick={() => {
                                            const items = venda.items || [];
                                            const total = items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
                                            const formaPagamento = venda.forma_pagamento ? JSON.parse(venda.forma_pagamento) : [];
                                            
                                            let mensagem = `*Detalhes da Venda Avulsa*\n\n`;
                                            mensagem += `*Cliente:* ${venda.nome || 'Despesa'}\n\n`;
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
                            <div className={`flex flex-col justify-center items-center gap-2 md:flex-row md:justify-between ${venda.isClosed ? 'pointer-events-none' : ''}`}>
                                <input
                                    type="text"
                                    className="text-center w-10 rounded-sm px-2 py-1"
                                    placeholder="N°"
                                    value={venda.numero}
                                    onChange={(e) => handleNumeroChange(index, e)}
                                    disabled={venda.isClosed}
                                />
                                
                                    <input
                                        type="text"
                                        className="text-center w-44 rounded-sm px-2 py-1"
                                        placeholder="Cliente"
                                        value={venda.nome}
                                        onChange={(e) => handleNomeChange(index, e)}
                                        disabled={venda.isClosed}
                                    />
                                    
                                <div className="inline-flex">
                                    <button
                                        className="bg-white hover:bg-green-600 text-black py-1 px-2 rounded-l"
                                        onClick={handleAddVendaAvulsa}
                                    >
                                        +
                                    </button>
                                    <button
                                        className="bg-black hover:bg-primary py-1 px-2 rounded-r text-white"
                                        onClick={() => handleRemoveVendaAvulsa(index)}
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
                                    value={(venda.selectedItem && venda.selectedItem.nome) || ''}
                                    onChange={(e) => handleItemSelectChange(index, e)}
                                    disabled={venda.isClosed}
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
                                        disabled={venda.isClosed}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {venda.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="p-2 flex flex-col justify-center items-center md:flex-row md:justify-between">
                                    <div className="inline-flex">
                                        <button
                                            className="bg-black hover:bg-red-500 py-1 px-2 rounded text-white"
                                            onClick={() => handleRemoveItem(index, itemIndex)}
                                            disabled={venda.isClosed}
                                        >
                                            -
                                        </button>
                                        <button
                                            className="bg-black hover:bg-primary py-1 px-2 rounded text-white"
                                            onClick={() => handleAddItemNovo(index, item)}
                                            disabled={venda.isClosed}
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
                                {venda.isClosed ? 'Fechado' : 'Fechar Pedido'}
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
                                Valor com Desconto: R$ {valorComDesconto.toFixed(2)}
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
                                className="bg-black hover:bg-secondary py-2 px-4 rounded-lg text-white"
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

export default VendaAvul;
