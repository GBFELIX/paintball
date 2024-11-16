import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
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
        progress: undefined,
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
    if (jogadores[index].isClosed) {
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

    const itemsToUpdate = jogador.items;
    const valorTotalJogador = itemsToUpdate.reduce((sum, item) => sum + item.valor, 0);
    const valorFinal = valorComDesconto || valorTotalJogador;
    const totalPagamento = Object.values(paymentValues).reduce((a, b) => a + b, 0);

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

    if (!jogador.nome) {
        toast.error('Por favor, preencha o nome do jogador', {
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
        return axios.get(`/.netlify/functions/api-estoque/${nome}`)
            .then(response => {
                const quantidadeAtual = response.data.quantidade;

                // Verifique se quantidadeAtual e quantidadeParaSubtrair são números válidos
                if (typeof quantidadeAtual !== 'number' || typeof itemCountMap[nome] !== 'number') {
                    toast.error(`Quantidade inválida para o item ${nome}`, {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "light",
                    });
                    podeFechar = false;
                    return;
                }

                console.log(`Quantidade atual: ${quantidadeAtual}, quantidade para subtrair: ${itemCountMap[nome]}`); // Adicionei log para depuração

                if (quantidadeAtual < itemCountMap[nome]) {
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
                    const novaQuantidade = quantidadeAtual - itemCountMap[nome];
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

            const formasPagamento = Object.entries(paymentMethods)
                .filter(([_, selected]) => selected)
                .map(([method]) => ({
                    tipo: method,
                    valor: paymentValues[method]
                }));

            axios.post('/.netlify/functions/api-pedidos', {
                nomeJogador: jogador.nome,
                items: jogador.items,
                formasPagamento: formasPagamento,
                valorTotal: valorTotalJogador,
                valorComDesconto: valorComDesconto,
                descontoAplicado: descontoSelecionado,
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

                const updatedJogadores = [...jogadores];
                updatedJogadores[jogadorIndexForPayment].isClosed = true;
                setJogadores(updatedJogadores);
                setShowPaymentModal(false);
                setPaymentValues({dinheiro: 0, credito: 0, debito: 0, pix: 0});
                setPaymentMethods({dinheiro: false, credito: false, debito: false, pix: false});
                setDescontoSelecionado('');
                setValorComDesconto(0);

                const pagamentosAnteriores = JSON.parse(localStorage.getItem('pagamentos')) || [];
                pagamentosAnteriores.push({
                    valorTotal: valorTotalJogador,
                    valorComDesconto: valorComDesconto,
                    formasPagamento: formasPagamento
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
      {jogadores.map((jogador, index) => {
        const valorTotalJogador = jogador.items.reduce((sum, item) => sum + item.valor, 0);
        return (
          <section key={index} className={`w-[300px] h-auto rounded-lg bg-white ${jogador.isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
            <header className="bg-primary w-full p-3 rounded-t-lg gap-2 flex flex-col justify-center items-center text-black font-normal md:flex-col md:justify-between">
              <p className="text-black">Jogador</p>
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
                  placeholder="Jogador"
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
                  </div>
                  <p>{item.nome}</p>
                  <p>R${parseFloat(item.valor).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="inline-flex gap-4 justify-around w-full items-center mt-4">
              <h1 className="text-md font-semibold">Total: R${valorTotalJogador.toFixed(2)}</h1>
            </div>

            <div className="flex justify-center items-center mt-2">
              <button
                className="w-[180px] bg-gray-300 hover:bg-primary text-gray-800 font-bold py-2 px-4 rounded-l"
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
              <p className="font-bold">
                Valor Total: R$ {jogadores[jogadorIndexForPayment] && 
                  jogadores[jogadorIndexForPayment].items.reduce((sum, item) => sum + item.valor, 0).toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <select
                value={descontoSelecionado}
                onChange={(e) => {
                  setDescontoSelecionado(e.target.value);
                  const valorTotal = jogadores[jogadorIndexForPayment] && 
                    jogadores[jogadorIndexForPayment].items.reduce((sum, item) => sum + item.valor, 0);
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

            <div className="grid grid-cols-2 gap-4 mb-4">
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
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentValues({dinheiro: 0, credito: 0, debito: 0, pix: 0});
                  setPaymentMethods({dinheiro: false, credito: false, debito: false, pix: false});
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
