import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilos do toastify

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
            setJogadores(updatedJogadores);
        } else {
            setJogadorIndexForPayment(index);
            setShowPaymentModal(true);
        }
    };

    const handleConfirmPayment = () => {
        // Obtenha o jogador atual
        const jogador = jogadores[jogadorIndexForPayment];

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

        // Verifique se pelo menos uma forma de pagamento foi selecionada
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

        // Verifique se os valores foram inseridos
        const totalPagamento = Object.values(paymentValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        const valorTotal = jogador.items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
        
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

        // Se todas as validações passarem, feche o pedido
        const updatedJogadores = [...jogadores];
        updatedJogadores[jogadorIndexForPayment].isClosed = true; // Marcar o jogador como fechado
        setJogadores(updatedJogadores); // Atualizar o estado dos jogadores
        setShowPaymentModal(false); // Fechar o modal
        toast.success('Pagamento confirmado com sucesso!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });
    };

    return (
        <div>
            {jogadores.map((jogador, index) => (
                <section key={index}>
                    <h2>{jogador.nome || 'Jogador ' + jogador.numero}</h2>
                    <div>
                        <input
                            type="text"
                            value={jogador.nome}
                            onChange={(e) => handleNomeChange(index, e)}
                        />
                        <button onClick={() => handleRemoveJogador(index)}>Remover Jogador</button>
                    </div>
                    <div>
                        <select
                            value={jogador.selectedItem && jogador.selectedItem.nome || ''}
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
                        <button onClick={() => handleAddItem(index)} disabled={jogador.isClosed}>Adicionar Item</button>
                        <div>
                            {jogador.items.map((item, itemIndex) => (
                                <div key={itemIndex}>
                                    <span>{item.nome} - R$ {item.valor.toFixed(2)}</span>
                                    <button onClick={() => handleRemoveItem(index, itemIndex)}>Remover</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h1>Total: R$ {jogador.items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0).toFixed(2)}</h1>
                    </div>
                </section>
            ))}

            {showPaymentModal && (
                <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg w-[500px]">
                        <h2 className="text-2xl font-semibold mb-4">Formas de Pagamento</h2>
                        <div className="mb-4">
                            <p className="font-bold">
                                Valor Total: R$ {jogadores[jogadorIndexForPayment].items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="mb-4">
                            <select
                                value={descontoSelecionado}
                                onChange={(e) => {
                                    setDescontoSelecionado(e.target.value);
                                    const valorTotal = jogadores[jogadorIndexForPayment].items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
                                    const desconto = descontos[e.target.value] || 0;
                                    setValorComDesconto(valorTotal * (1 - desconto / 100));
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
                        <div className="grid grid-cols-1 gap-4 mb-4">
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
                                Valor Total Inserido: R$ {Object.values(paymentValues).reduce((a, b) => a + (parseFloat(b) || 0), 0).toFixed(2)}
                            </p>
                        </div>
                        <div className="flex justify-between mt-4">
                            <button
                                className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg"
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    setPaymentValues({ dinheiro: 0, credito: 0, debito: 0, pix: 0 });
                                    setPaymentMethods({ dinheiro: false, credito: false, debito: false, pix: false });
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