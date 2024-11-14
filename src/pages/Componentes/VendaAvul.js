import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function VendaAvul({ vendas, setVendas, handleAddVendaAvulsa }) {
    const [estoque, setEstoque] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [vendaIndexForPayment, setVendaIndexForPayment] = useState(null);

    useEffect(() => {
        axios.get('/.netlify/functions/api-estoque')
            .then(response => setEstoque(response.data))
            .catch(error => console.error('Erro ao buscar estoque:', error));
    }, []);

    const handleRemoveVendaAvulsa = (index) => {
        if (vendas.length > 1) {
            const updatedVendas = vendas.filter((_, i) => i !== index);
            setVendas(updatedVendas);
        } else {
            toast.error('Deve haver pelo menos uma venda na tela.');
        }
    };

    const handleNomeChange = (index, event) => {
        const updatedVendas = [...vendas];
        updatedVendas[index].nome = event.target.value;
        setVendas(updatedVendas);
    };

    const handleNumeroChange = (index, event) => {
        const updatedVendas = [...vendas];
        updatedVendas[index].numero = event.target.value;
        setVendas(updatedVendas);
    };

    const handleItemSelectChange = (index, event) => {
        const updatedVendas = [...vendas];
        const selectedItem = estoque.find(item => item.nome === event.target.value);
        updatedVendas[index].selectedItem = selectedItem;
        setVendas(updatedVendas);
    };

    const handleAddItem = (index) => {
        const updatedVendas = [...vendas];
        if (updatedVendas[index].selectedItem) {
            const selectedItem = {...updatedVendas[index].selectedItem };
            selectedItem.valor = parseFloat(selectedItem.valor) || 0;
            updatedVendas[index].items.push(selectedItem);
            updatedVendas[index].selectedItem = '';
            setVendas(updatedVendas);
        }
    };

    const handleRemoveItem = (vendaIndex, itemIndex) => {
        const updatedVendas = [...vendas];
        updatedVendas[vendaIndex].items.splice(itemIndex, 1);
        setVendas(updatedVendas);
    };

    const handleClosePedido = (index) => {
        if (vendas[index].isClosed) {
            const updatedVendas = [...vendas];
            updatedVendas[index].isClosed = false;
            updatedVendas[index].items = [];
            setVendas(updatedVendas);
        } else {
            setVendaIndexForPayment(index);
            setShowPaymentModal(true);
        }
    };

    const handlePaymentSelection = (paymentMethod) => {
        setSelectedPayment(paymentMethod);
    };

    const handleConfirmPayment = () => {
        const venda = vendas[vendaIndexForPayment];
        const itemsToUpdate = venda.items;
        const valorTotalVenda = venda.items.reduce((sum, item) => sum + item.valor, 0);

        if (!selectedPayment) {
            toast.error('Por favor, selecione uma forma de pagamento', {
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

        if (!venda.nome) {
            toast.error('Por favor, preencha o nome do cliente', {
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

        const itemCountMap = itemsToUpdate.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
        }, {});

        let podeFechar = true;

        const promises = Object.keys(itemCountMap).map(nome => {
            const quantidadeParaSubtrair = itemCountMap[nome];
            return axios.get(`/.netlify/functions/api-estoque/${nome}`)
                .then(response => {
                    const quantidadeAtual = response.data.quantidade;
                    if (quantidadeAtual < quantidadeParaSubtrair) {
                        toast.error(`Quantidade insuficiente no estoque para o item ${nome}`, {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            theme: "light",
                        });
                        podeFechar = false;
                    } else {
                        const novaQuantidade = quantidadeAtual - quantidadeParaSubtrair;
                        return axios.put(`/.netlify/functions/api-estoque/${nome}`, { quantidade: novaQuantidade })
                            .then(() => {
                                console.log(`Estoque atualizado para o item ${nome} com nova quantidade ${novaQuantidade}`);
                            })
                            .catch(error => {
                                console.error('Erro ao atualizar estoque:', error);
                                toast.error('Erro ao atualizar estoque', {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    theme: "light",
                                });
                            });
                    }
                })
                .catch(error => {
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
                });
        });

        Promise.all(promises).then(() => {
            if (!podeFechar) {
                toast.error('Não foi possível fechar o pedido devido à quantidade insuficiente no estoque.', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                });
            } else {
                const dataJogo = localStorage.getItem('dataJogo');
                const horaJogo = localStorage.getItem('horaJogo');
                const dataHoraJogo = `${dataJogo} ${horaJogo}:00`;

                axios.post('/.netlify/functions/api-pedidos', {
                    nomeJogador: venda.nome,
                    items: venda.items,
                    formaPagamento: selectedPayment,
                    valorTotal: valorTotalVenda,
                    dataJogo: dataHoraJogo,
                })
                .then(() => {
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
                    setVendas(updatedVendas);
                    setShowPaymentModal(false);

                    const pagamentosAnteriores = JSON.parse(localStorage.getItem('pagamentos')) || [];
                    pagamentosAnteriores.push({
                        valorTotal: valorTotalVenda,
                        formaPagamento: selectedPayment,
                    });
                    localStorage.setItem('pagamentos', JSON.stringify(pagamentosAnteriores));
                })
                .catch(error => {
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
                });
            }
        });
    };

    return (
        <div className="flex flex-wrap gap-4">
            <ToastContainer />
            {vendas.map((venda, index) => {
                const valorTotalVenda = venda.items.reduce((sum, item) => sum + item.valor, 0);
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
                                    value={venda.selectedItem?.nome || ''}
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
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-2xl font-semibold mb-4">Selecione a Forma de Pagamento</h2>
                        <select
                            value={selectedPayment}
                            onChange={(e) => handlePaymentSelection(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mb-4"
                        >
                            <option value="">Selecione</option>
                            <option value="dinheiro">Dinheiro</option>
                            <option value="credito">Crédito</option>
                            <option value="debito">Debito</option>
                            <option value="pix">PIX</option>
                        </select>
                        <div className="flex justify-between mt-4">
                            <button
                                className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg"
                                onClick={() => setShowPaymentModal(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className="bg-black hover:bg-secondary py-1 px-2 rounded-lg text-white"
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