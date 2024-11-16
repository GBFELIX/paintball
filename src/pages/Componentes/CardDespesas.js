import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 

export default function CardDespesas({ despesas, setDespesas, handleAddDespesa}) {
  const [estoque, setEstoque] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [despesaIndexForPayment, setDespesaIndexForPayment] = useState(null);
  const [valorTotalGeral, setValorTotalGeral] = useState(0);

  useEffect(() => {
    axios.get('/.netlify/functions/api-estoque')
      .then(response => setEstoque(response.data))
      .catch(error => console.error('Erro ao buscar estoque:', error));
  }, []);
  useEffect(() => {
    localStorage.setItem('totalAvulso', valorTotalGeral);
  }, [valorTotalGeral]);

  const handleRemoveDespesa = (index) => {
    if (despesas.length > 1) {
      const updatedDespesas = despesas.filter((_, i) => i !== index);
      setDespesas(updatedDespesas);
    } else {
      toast.error('Deve haver pelo menos um card de despesas na tela.', {
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
      setDespesas(updatedDespesas);
    }
  };

  const handleRemoveItem = (despesaIndex, itemIndex) => {
    const updatedDespesas = [...despesas];
    updatedDespesas[despesaIndex].items.splice(itemIndex, 1);
    setDespesas(updatedDespesas);
  };

  const handleClosePedido = (index) => {
    if (despesas[index].isClosed) {
      const updatedDespesas = [...despesas];
      updatedDespesas[index].isClosed = false;
      updatedDespesas[index].items = [];
      setDespesas(updatedDespesas);
    } else {
      setDespesaIndexForPayment(index);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSelection = (paymentMethod) => {
    setSelectedPayment(paymentMethod);
  };

  const handleConfirmPayment = () => {
    const despesa = despesas[despesaIndexForPayment];
    const itemsToUpdate = despesa.items;  
    
    const valorTotalDespesa = despesa.items.reduce((sum, item) => sum + item.valor, 0);
  
    setValorTotalGeral((prevTotal) => prevTotal + valorTotalDespesa);

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
        const storedData = localStorage.getItem('dataJogo');

        axios.post('/.netlify/functions/api-pedidos', {
          nomeDespesa: despesa.nome,
          items: despesa.items,
          formaPagamento: selectedPayment,
          valorTotal: valorTotalDespesa,
          dataJogo: storedData,  
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
          
          const updatedDespesas = [...despesas];
          updatedDespesas[despesaIndexForPayment].isClosed = true;
          setDespesas(updatedDespesas);
          setShowPaymentModal(false);

          const pagamentosAnteriores = JSON.parse(localStorage.getItem('pagamentos')) || [];
          pagamentosAnteriores.push({
            valorTotal: valorTotalDespesa,
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
      {despesas.map((despesa, index) => {
        const valorTotalDespesa = despesa.items.reduce((sum, item) => sum + item.valor, 0);
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