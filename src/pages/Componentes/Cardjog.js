import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function CardJogador({ jogadores, setJogadores }) {
    const [estoque, setEstoque] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [jogadorIndexForPayment, setJogadorIndexForPayment] = useState(null);
    const [paymentValues, setPaymentValues] = useState({
        dinheiro: 0,
        credito: 0,
        debito: 0,
        pix: 0
    });
    const [paymentMethods, setPaymentMethods] = useState({
        dinheiro: false,
        credito: false,
        debito: false,
        pix: false
    });
    const [descontos, setDescontos] = useState({});
    const [descontoSelecionado, setDescontoSelecionado] = useState('');
    const [valorComDesconto, setValorComDesconto] = useState(0);

    useEffect(() => {
        axios.get('/.netlify/functions/api-estoque')
            .then(response => setEstoque(response.data))
            .catch(error => console.error('Erro ao buscar estoque:', error));
    }, []);

    useEffect(() => {
        axios.get('/.netlify/functions/api-descontos')
            .then(response => setDescontos(response.data))
            .catch(error => console.error('Erro ao buscar descontos:', error));
    }, []);

    const handleAddJogador = () => {
        const newNumero = (jogadores.length + 1).toString();
        setJogadores([...jogadores, { nome: '', numero: newNumero, items: [], selectedItem: '', isClosed: false }]);
    };

    const handleRemoveJogador = (index) => {
        if (jogadores.length > 1) {
            const updatedJogadores = jogadores.filter((_, i) => i !== index);
            setJogadores(updatedJogadores);
        } else {
            toast.error('Deve haver pelo menos um card na tela', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
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

    const handleItemSelectChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        const selectedItem = estoque.find(item => item.nome === event.target.value);
        updatedJogadores[index].selectedItem = selectedItem;
        setJogadores(updatedJogadores);
    };

    const handleAddItem = (index) => {
        const updatedJogadores = [...jogadores];
        if (updatedJogadores[index].selectedItem) {
            const selectedItem = { ...updatedJogadores[index].selectedItem };
            selectedItem.valor = parseFloat(selectedItem.valor) || 0;
            updatedJogadores[index].items.push(selectedItem);
            updatedJogadores[index].selectedItem = '';
            setJogadores(updatedJogadores);
        }
    };

    const handleRemoveItem = (jogadorIndex, itemIndex) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[jogadorIndex].items.splice(itemIndex, 1);
        setJogadores(updatedJogadores);
    };

    const handleClosePedido = (index) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].isClosed = !updatedJogadores[index].isClosed;
        setJogadores(updatedJogadores);
    };

    const handleConfirmPayment = () => {
        const jogador = jogadores[jogadorIndexForPayment];

        // Verifique se o jogador está definido
        if (!jogador) {
            toast.error('Jogador não encontrado', {
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

        // Verifique se items estão definidos
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

        const itemsToUpdate = jogador.items;
        const valorTotalJogador = itemsToUpdate.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
        const valorFinal = valorComDesconto || valorTotalJogador;
        const totalPagamento = Object.values(paymentValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);

        // Verifica se algum método de pagamento foi selecionado
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

        // Verifica se o valor total do pagamento está correto
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

        // Mapeia a quantidade de cada item
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
                const formasPagamento = Object.entries(paymentMethods)
                    .filter(([_, selected]) => selected)
                    .map(([method]) => ({
                        tipo: method,
                        valor: paymentValues[method]
                    }));

                // Lógica para finalizar o pedido
                axios.post('/.netlify/functions/api-pedidos', {
                    nomeJogador: jogador.nome,
                    items: itemsToUpdate,
                    formasPagamento: formasPagamento,
                    valorTotal: valorTotalJogador,
                    valorComDesconto: valorComDesconto,
                    descontoAplicado: descontoSelecionado,
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
                    // Atualiza o estado do jogador para fechado
                    const updatedJogadores = [...jogadores];
                    updatedJogadores[jogadorIndexForPayment].isClosed = true;
                    setJogadores(updatedJogadores);
                    setShowPaymentModal(false);
                })
                .catch(error => {
                    console.error('Erro ao finalizar pedido:', error);
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
        <div>
            <ToastContainer />
            {/* Renderização do componente */}
            {jogadores.map((jogador, index) => (
                <div key={index}>
                    {/* Renderização do card do jogador */}
                    <h2>{jogador.nome}</h2>
                    <button onClick={() => handleClosePedido(index)}>
                        {jogador.isClosed ? 'Reabrir Pedido' : 'Fechar Pedido'}
                    </button>
                    <button onClick={() => setJogadorIndexForPayment(index) || setShowPaymentModal(true)}>
                        Confirmar Pagamento
                    </button>
                </div>
            ))}
            {showPaymentModal && (
                <div className="modal">
                    {/* Modal de pagamento */}
                    <h2>Selecione a Forma de Pagamento</h2>
                    <select onChange={(e) => setDescontoSelecionado(e.target.value)}>
                        <option value="">Selecione o desconto</option>
                        {Object.entries(descontos).map(([tipo, percentual]) => (
                            <option key={tipo} value={tipo}>
                                {tipo} - {percentual}%
                            </option>
                        ))}
                    </select>
                    <button onClick={handleConfirmPayment}>Confirmar Pagamento</button>
                </div>
            )}
        </div>
    );
}
