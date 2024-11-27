import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

export default function CardDespesas({ despesas, setDespesas, handleAddDespesa}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [despesaIndexForPayment, setDespesaIndexForPayment] = useState(null);
  const [valorTotalGeral, setValorTotalGeral] = useState(0);
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
  const [estoque, setEstoque] = useState([]);

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
    localStorage.setItem('totalAvulso', valorTotalGeral);
  }, [valorTotalGeral]);

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

  const handleRemoveDespesa = (index) => {
      const updatedDespesas = despesas.filter((_, i) => i !== index);
      setDespesas(updatedDespesas);
  };

  const handleNomeChange = (index, event) => {
    const updatedDespesas = [...despesas];
    updatedDespesas[index].nome = event.target.value;
    setDespesas(updatedDespesas);
  };

  const handleNumeroChange = (index, event) => {
    const updatedDespesas = [...despesas];
    updatedDespesas[index].numero = event.target.value;
    setDespesas(updatedDespesas);
  };

  const handleItemSelectChange = (index, event) => {
    const updatedDespesas = [...despesas];
    const selectedItem = estoque.find(item => item.nome === event.target.value);
    updatedDespesas[index].selectedItem = selectedItem;
    setDespesas(updatedDespesas);
  };

  const handleAddItem = (index) => {
    const updatedDespesas = [...despesas];
    if (updatedDespesas[index].selectedItem) {
      const selectedItem = { ...updatedDespesas[index].selectedItem };
      selectedItem.valor = parseFloat(selectedItem.valor) || 0;
      updatedDespesas[index].items.push(selectedItem);
      updatedDespesas[index].selectedItem = '';

      // Armazenar a quantidade e o nome dos itens no localStorage da página VendaAvul
      const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
      const itemName = selectedItem.nome;
      storedItems[itemName] = (storedItems[itemName] || 0) + 1; // Incrementa a quantidade
      localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));

      setDespesas(updatedDespesas);
    }
  };

  const handleRemoveItem = (despesaIndex, itemIndex) => {
    const updatedDespesas = [...despesas];
    const itemName = updatedDespesas[despesaIndex].items[itemIndex].nome;

    // Atualiza o localStorage ao remover um item
    const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
    if (storedItems[itemName]) {
      storedItems[itemName] -= 1; // Decrementa a quantidade
      if (storedItems[itemName] <= 0) {
        delete storedItems[itemName]; // Remove o item se a quantidade for zero
      }
    }
    localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));

    updatedDespesas[despesaIndex].items.splice(itemIndex, 1);
    setDespesas(updatedDespesas);
  };

  const handleClosePedido = (index) => {
    const despesa = despesas[index];

    if (despesa.isClosed) {
        const updatedDespesas = [...despesas];
        updatedDespesas[index].isClosed = false;
        updatedDespesas[index].items = [];
        setDespesas(updatedDespesas);
    } else {
        setDespesaIndexForPayment(index);
        setShowPaymentModal(true);
    }
  };

  const handleConfirmPayment = async () => {
    const despesa = despesas[despesaIndexForPayment];

    if (!despesa) {
        toast.error('Despesa não encontrada', {
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

    const itemsToUpdate = despesa.items;
    const valorTotalDespesa = itemsToUpdate.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
    const valorFinal = valorComDesconto || valorTotalDespesa;
    const totalPagamento = Object.values(paymentValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);

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

    const itemCountMap = itemsToUpdate.reduce((acc, item) => {
        acc[item.nome] = (acc[item.nome] || 0) + 1;
        return acc;
    }, {});

    try {
        // Finaliza pedido
        const dataJogo = `${localStorage.getItem('dataJogo')} ${localStorage.getItem('horaJogo')}:00`;
        await axios.post('/.netlify/functions/api-pedidos', {
            nomeJogador: despesa.nome,
            items: despesa.items,
            formaPagamento: Object.keys(paymentMethods).find(method => paymentMethods[method]),
            valorTotal: valorFinal,
            dataJogo,
        });

        // Atualiza estado e localStorage
        const updatedDespesas = [...despesas];
        updatedDespesas[despesaIndexForPayment].isClosed = true;
        setDespesas(updatedDespesas);
        setShowPaymentModal(false);

        const pagamentosAnteriores = JSON.parse(localStorage.getItem('pagamentos')) || [];
        const formasSelecionadas = Object.keys(paymentMethods).filter(method => paymentMethods[method]);
        const valorPorForma = valorFinal / formasSelecionadas.length;

        formasSelecionadas.forEach(forma => {
            pagamentosAnteriores.push({
                valorTotal: valorPorForma,
                formaPagamento: forma,
            });
        });

        localStorage.setItem('pagamentos', JSON.stringify(pagamentosAnteriores));
        toast.success('Pedido finalizado com sucesso!', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });

    } catch (error) {
        console.error(error.message);
        toast.error(error.message || 'Erro ao processar pedido', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });
    }
};

  
  return (
    <div className="flex flex-wrap gap-4">

      {despesas.map((despesa, index) => {
        const valorTotalDespesa = despesa.items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
        return (
          <section key={index} className={`w-[300px] h-auto rounded-lg bg-white ${despesa.isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
            <header className="bg-secondary w-full p-3 rounded-t-lg gap-2 flex flex-col justify-center items-center text-black font-normal md:flex-col md:justify-between">
              <p className="text-black">Despesas</p>
              <div className="flex flex-col justify-center items-center gap-2 md:flex-row md:justify-between">
                <input
                  type="text"
                  className="text-center w-10 rounded-sm px-2 py-1"
                  placeholder="N°"
                  value={despesa.numero}
                  onChange={(e) => handleNumeroChange(index, e)}
                  disabled={despesa.isClosed}
                />
                <input
                  type="text"
                  className="text-center w-44 rounded-sm px-2 py-1"
                  placeholder="Cliente"
                  value={despesa.nome}
                  onChange={(e) => handleNomeChange(index, e)}
                  disabled={despesa.isClosed}
                />
                <div className="inline-flex">
                  <button
                    className="bg-white hover:bg-green-600 text-black py-1 px-2 rounded-l"
                    onClick={handleAddDespesa}
                  >
                    +
                  </button>
                  <button
                    className="bg-black hover:bg-primary py-1 px-2 rounded-r text-white"
                    onClick={() => handleRemoveDespesa(index)}
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
                  value={despesa.selectedItem?.nome || ''}
                  onChange={(e) => handleItemSelectChange(index, e)}
                  disabled={despesa.isClosed}
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
                    disabled={despesa.isClosed}
                  >
                    +
                  </button>
                </div>
              </div>

              {despesa.items.map((item, itemIndex) => (
                <div key={itemIndex} className="p-2 flex flex-col justify-center items-center md:flex-row md:justify-between">
                  <div className="inline-flex">
                    <button
                      className="bg-black hover:bg-red-500 py-1 px-2 rounded text-white"
                      onClick={() => handleRemoveItem(index, itemIndex)}
                      disabled={despesa.isClosed}
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
              <h1 className="text-md font-semibold">Total: R${valorTotalDespesa.toFixed(2)}</h1>
            </div>

            <div className="flex justify-center items-center mt-2">
              <button
                className="w-[180px] bg-gray-300 hover:bg-secondary text-gray-800 font-bold py-2 px-4 rounded-l"
                onClick={() => handleClosePedido(index)}
              >
                {despesa.isClosed ? 'Fechado' : 'Fechar Pedido'}
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
                Valor Total: R$ {despesas[despesaIndexForPayment] && despesas[despesaIndexForPayment].items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0).toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <select
                value={descontoSelecionado}
                onChange={(e) => {
                  setDescontoSelecionado(e.target.value);
                  const valorTotal = despesas[despesaIndexForPayment] && 
                    despesas[despesaIndexForPayment].items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
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
}