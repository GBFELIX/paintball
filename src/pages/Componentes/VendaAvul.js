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
        // Recupera os itens do localStorage ao montar o componente
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

            // Verifica se o item já existe na lista de itens do jogador
            const existingItem = updatedVendas[index].items.find(item => item.nome === selectedItem.nome);
            if (existingItem) {
                existingItem.quantidade = (existingItem.quantidade || 1) + 1; // Incrementa a quantidade
            } else {
                selectedItem.quantidade = 1; // Define a quantidade como 1 se for um novo item
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
            // Verifica se o item já existe na lista de itens do jogador
            const existingItem = updatedVendas[index].items.find(i => i.nome === selectedItem.nome)
            if (existingItem) {
                existingItem.quantidade = (existingItem.quantidade || 1) + 1; // Incrementa a quantidade
            } else {
                selectedItem.quantidade = 1; // Define a quantidade como 1 se for um novo item
                updatedVendas[index].items.push(selectedItem);
            }
            updatedVendas[index].selectedItem = '';
            // Armazenar a quantidade e o nome dos itens no localStorage da p��gina VendaAvul
            const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
            const itemName = selectedItem.nome;
            storedItems[itemName] = (storedItems[itemName] || 0) + 1; // Incrementa a quantidade
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
            updatedVendas[vendaIndex].items[itemIndex].quantidade -= 1; // Decrementa a quantidade
        } else {
            updatedVendas[vendaIndex].items.splice(itemIndex, 1); // Remove o item se a quantidade for zero
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
                    // Armazena as quantidades no localStorage
                    localStorage.setItem('itensVenda', JSON.stringify(newQuantities));
                    return newQuantities;
                });
            });
        }
    };

    const calcularDesconto = (valorTotal) => {
        if (!descontoSelecionado) return valorTotal;
        const percentualDesconto = descontos[descontoSelecionado] || 0;
        return valorTotal * (1 - percentualDesconto / 100);
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
        const itemsToUpdate = venda.items;

        // Contabiliza a quantidade total de cada item
        const itemCountMap = itemsToUpdate.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
        }, {});

        try {
            // Finaliza pedido
            const dataJogo = localStorage.getItem('dataJogo');
            const horaJogo = localStorage.getItem('horaJogo');
            await axios.post('/.netlify/functions/api-pedidos', {
                nomeJogador: venda.nome,
                items: venda.items.map(item => item.nome),
                formaPagamento: Object.keys(paymentMethods).find(method => paymentMethods[method]),
                valorTotal: valorFinal,
                dataPedido: dataJogo,
                horaPedido: horaJogo,
            });

            // Atualiza estado e localStorage
            const updatedVendas = [...vendas];
            updatedVendas[vendaIndexForPayment].isClosed = true;
            updateVendas(updatedVendas);
            setShowPaymentModal(false);

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
            showToast('Pedido finalizado com sucesso!', 'success');

        } catch (error) {
            console.error(error.message);
            showToast(error.message || 'Erro ao processar pedido', 'error');
        }
    };

    // Função para centralizar mensagens toast
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
                    <section key={index} className={`w-[300px] h-auto rounded-lg bg-white ${venda.isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
                        <header className="bg-blue-600 w-full p-3 rounded-t-lg gap-2 flex flex-col justify-center items-center text-black font-normal md:flex-col md:justify-between">
                            <p className="text-black">Venda Avulsa</p>
                            <div className="flex flex-col justify-center items-center gap-2 md:flex-row md:justify-between">
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
                                        {tipo} - {percentual}%
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
