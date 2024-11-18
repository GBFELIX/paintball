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
                onClick={() => setShowPaymentModal(true)}
              >
                Fechar Pedido
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
                Valor Total: R$ {jogadores[jogadorIndexForPayment].items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0).toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <select
                value={descontoSelecionado}
                onChange={(e) => {
                  setDescontoSelecionado(e.target.value);
                  const valorTotal = jogadores[jogadorIndexForPayment] && 
                    jogadores[jogadorIndexForPayment].items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
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