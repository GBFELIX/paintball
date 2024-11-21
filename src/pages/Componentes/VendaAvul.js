import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const VendaAvul = ({ vendas, setVendas, handleAddVendaAvulsa }) => {
    const [estoque, setEstoque] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [vendaIndexForPayment, setVendaIndexForPayment] = useState(null);
    const [paymentValues, setPaymentValues] = useState({ dinheiro: 0, credito: 0, debito: 0, pix: 0 });
    const [paymentMethods, setPaymentMethods] = useState({ dinheiro: false, credito: false, debito: false, pix: false });
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
        if (updatedVendas[index].selectedItem && updatedVendas[index].selectedItem.id) {
            const selectedItem = {
                id: updatedVendas[index].selectedItem.id,
                nome: updatedVendas[index].selectedItem.nome,
                valor: parseFloat(updatedVendas[index].selectedItem.valor || 0),
                quantidade: updatedVendas[index].selectedItem.quantidade
            };
            updatedVendas[index].items.push(selectedItem);
            updatedVendas[index].selectedItem = '';
            updateVendas(updatedVendas);
        }
    };

    const handleRemoveItem = (vendaIndex, itemIndex) => {
        const updatedVendas = [...vendas];
        updatedVendas[vendaIndex].items.splice(itemIndex, 1);
        updateVendas(updatedVendas);
    };

    const handleClosePedido = (index) => {
        const updatedVendas = [...vendas];
        if (updatedVendas[index].isClosed) {
            updatedVendas[index].isClosed = false;
            updatedVendas[index].items = [];
            updateVendas(updatedVendas);
        } else {
            const valorTotal = updatedVendas[index].items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
            setValorTotalVendaAtual(valorTotal);
            setVendaIndexForPayment(index);
            setShowPaymentModal(true);
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
            toast.error('O valor total do pagamento deve ser igual ao valor final', {
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

        const venda = vendas[vendaIndexForPayment];
        const itemsToUpdate = venda.items;
        const valorTotalVenda = itemsToUpdate.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);

        const itemCountMap = itemsToUpdate.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
        }, {});

        let podeFechar = true;

        const promises = Object.keys(itemCountMap).map(async (nome) => {
            const quantidadeParaSubtrair = itemCountMap[nome];
            try {
                const selectedItem = estoque.find(item => item.nome === nome);
                
                if (!selectedItem) {
                    throw new Error(`Item ${nome} não encontrado no estoque`);
                }

                const quantidadeAtual = selectedItem.quantidade;

                if (quantidadeAtual === undefined) {
                    throw new Error(`Quantidade não encontrada para o item ${nome}`);
                }

                if (isNaN(quantidadeAtual) || quantidadeAtual < quantidadeParaSubtrair) {
                    toast.error(`Quantidade insuficiente no estoque para o item ${nome}`, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "light",
                    });
                    podeFechar = false;
                    return; // Retorna para não continuar com a atualização
                }

                const novaQuantidade = quantidadeAtual - quantidadeParaSubtrair;
                await axios.put(`/.netlify/functions/api-estoque/${nome}`, { quantidade: novaQuantidade });
                console.log(`Estoque atualizado para o item ${nome} com nova quantidade ${novaQuantidade}`);
            } catch (error) {
                console.error('Erro ao obter quantidade atual do estoque:', error);
                toast.error('Erro ao verificar estoque', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                });
            }
        });

        await Promise.all(promises); // Aguarda todas as promessas serem resolvidas

        if (podeFechar) {
            const dataJogo = localStorage.getItem('dataJogo');
            const horaJogo = localStorage.getItem('horaJogo');
            const dataHoraJogo = `${dataJogo} ${horaJogo}:00`;

            try {
                await axios.post('/.netlify/functions/api-pedidos', {
                    nomeJogador: venda.nome,
                    items: venda.items,
                    formaPagamento: Object.keys(paymentMethods).find(method => paymentMethods[method]),
                    valorTotal: valorTotalVenda,
                    dataJogo: dataHoraJogo,
                });
                toast.dismiss();
                toast.success('Pedido finalizado com sucesso!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                });

                const updatedVendas = [...vendas];
                updatedVendas[vendaIndexForPayment].isClosed = true;
                updateVendas(updatedVendas);
                setShowPaymentModal(false);

                const pagamentosAnteriores = JSON.parse(localStorage.getItem('pagamentos')) || [];
                const formasSelecionadas = Object.keys(paymentMethods).filter(method => paymentMethods[method]);

                const valorPorForma = valorTotalVenda / formasSelecionadas.length;

                formasSelecionadas.forEach(forma => {
                    pagamentosAnteriores.push({
                        valorTotal: valorPorForma,
                        formasPagamento: forma,
                    });
                });

                localStorage.setItem('pagamentos', JSON.stringify(pagamentosAnteriores));
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
        }
    };

    return (
        <div className="flex flex-wrap gap-4">

            {vendas.map((venda, index) => {
                const valorTotalVenda = venda.items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
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
                                    </div>
                                    <p>{item.nome}</p>
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
                            {['dinheiro', 'credito', 'debito', 'pix'].map((method) => (
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
                                onClick={() => setShowPaymentModal(false)}
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