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
  const [estoque, setEstoque] = useState([]);
  const [ballItemsConfig, setBallItemsConfig] = useState([]);

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

    axios.get('/.netlify/functions/api-bolinhas?config=true')
      .then(response => {
        setBallItemsConfig(response.data);
      })
      .catch(error => {
        console.error('Erro ao carregar configuração de bolinhas:', error);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('totalAvulso', valorTotalGeral);
  }, [valorTotalGeral]);

  const updateDespesas = (updatedDespesas) => {
    setDespesas(updatedDespesas);
};
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


      const ballItemConfig = ballItemsConfig.find(config => config.nome === selectedItem.nome);
      const isBallItem = ballItemConfig !== undefined;

      const existingItem = updatedDespesas[index].items.find(item => item.nome === selectedItem.nome);
      if (existingItem) {
        if (isBallItem) {
          selectedItem.quantidade = 1;
          updatedDespesas[index].items.push(selectedItem);
        } else {
          existingItem.quantidade = (existingItem.quantidade || 1) + 1;
        }
      } else {
        selectedItem.quantidade = 1;
        updatedDespesas[index].items.push(selectedItem);
      }
      updatedDespesas[index].selectedItem = '';

      const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
      const itemName = selectedItem.nome;
      storedItems[itemName] = (storedItems[itemName] || 0) + 1;
      localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));

      setDespesas(updatedDespesas);
    }
  };

  const handleRemoveItem = (despesaIndex, itemIndex) => {
    const updatedDespesas = [...despesas];
    const itemName = updatedDespesas[despesaIndex].items[itemIndex].nome;

    const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
    if (storedItems[itemName]) {
      storedItems[itemName] -= 1; 
      if (storedItems[itemName] <= 0) {
        delete storedItems[itemName]; 
      }
    }
    localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));

    if (updatedDespesas[despesaIndex].items[itemIndex].quantidade > 1) {
            updatedDespesas[despesaIndex].items[itemIndex].quantidade -= 1; 
        } else {
            updatedDespesas[despesaIndex].items.splice(itemIndex, 1); 
        }
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
    const valorTotalDespesa = itemsToUpdate.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
    const valorFinal = valorTotalDespesa;
    const totalPagamento = Object.values(paymentValues).reduce((a, b) => a + (parseFloat(b) || 0), 0);

    for (const item of despesa.items) {
        const ballItemConfig = ballItemsConfig.find(config => config.nome === item.nome);
        if (ballItemConfig) {
            try {

                for (let i = 0; i < (item.quantidade || 1); i++) {
                    await axios.patch('/.netlify/functions/api-bolinhas', {
                        itemNome: item.nome
                    });
                }
            } catch (error) {
                console.error('Erro ao reduzir quantidade de bolinhas:', error);
                toast.error('Erro ao reduzir quantidade de bolinhas', {
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
        }
    }

    try {
        const dataJogo = localStorage.getItem('dataJogo');
        const horaJogo = localStorage.getItem('horaJogo');
        await axios.post('/.netlify/functions/api-pedidos', {
          nomeJogador: "Despesa",
          items: despesa.items.map(item => ({ nome: item.nome, valor: item.valor, qtd: item.quantidade })),
          valorTotal: valorFinal,
          dataPedido: dataJogo,
          horaPedido: horaJogo,
        }).catch(error => {
            if (error.response && error.response.status === 409) {
                toast.error('Esta despesa já foi registrada anteriormente', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                });
            } else {
                throw error;
            }
        });

        const updatedDespesas = [...despesas];
        updatedDespesas[despesaIndexForPayment].isClosed = true;
        updatedDespesas[despesaIndexForPayment].valorTotal = valorFinal;
        setDespesas(updatedDespesas);
        setShowPaymentModal(false);

        const despesasAnteriores = JSON.parse(localStorage.getItem('despesas')) || [];
        despesasAnteriores.push({
            valorTotal: valorFinal,
        });

        localStorage.setItem('despesas', JSON.stringify(despesasAnteriores));
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

const handleAddItemNovo = (index, item) => {
  const updatedDespesas = [...despesas];
  if (item) {
      const selectedItem = { ...item };
      selectedItem.valor = parseFloat(selectedItem.valor) || 0;
      
      const ballItemConfig = ballItemsConfig.find(config => config.nome === selectedItem.nome);
      const isBallItem = ballItemConfig !== undefined;
      
      const existingItem = updatedDespesas[index].items.find(i => i.nome === selectedItem.nome);
      if (existingItem) {
          if (isBallItem) {
              selectedItem.quantidade = 1;
              updatedDespesas[index].items.push(selectedItem);
          } else {
              existingItem.quantidade = (existingItem.quantidade || 1) + 1;
          }
      } else {
          selectedItem.quantidade = 1;
          updatedDespesas[index].items.push(selectedItem);
      }
      updatedDespesas[index].selectedItem = '';
      const storedItems = JSON.parse(localStorage.getItem('itensVendaAvul')) || {};
      const itemName = selectedItem.nome;
      storedItems[itemName] = (storedItems[itemName] || 0) + 1;
      localStorage.setItem('itensVendaAvul', JSON.stringify(storedItems));
      updateDespesas(updatedDespesas);
  } else {
      toast.error('Por favor, selecione um item antes de adicionar.');
  }
};
const handleAddDespesaValor = (index, event) => {
    const updatedDespesas = [...despesas];
    updatedDespesas[index].valor = parseFloat(event.target.value) || 0; 
    updateDespesas(updatedDespesas);
};



  return (
    <div className="flex flex-wrap gap-4">

      {despesas.map((despesa, index) => {
        const valorTotalDespesa = despesa.items.reduce((sum, item) => sum + (parseFloat(item.valor) * (item.quantidade || 1) || 0), 0);
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
              
              <input
                type="text"
                className="w-full border border-slate-400 rounded px-2 p-1 text-center"
                placeholder="Nome do Item"
                value={despesa.novoItemNome || ''}
                onChange={(e) => {
                  const updatedDespesas = [...despesas];
                  updatedDespesas[index].novoItemNome = e.target.value;
                  setDespesas(updatedDespesas);
                }}
                disabled={despesa.isClosed}
              />
              <input
                type="text"
                className="w-full border border-slate-400 rounded px-2 p-1 text-center"
                placeholder="Valor do Item"
                value={despesa.novoItemValor || ''}
                onChange={(e) => {
                  const updatedDespesas = [...despesas];
                  updatedDespesas[index].novoItemValor = parseFloat(e.target.value) || 0;
                  setDespesas(updatedDespesas);
                }}
                disabled={despesa.isClosed}
              />
              <button
                className="w-full bg-black hover:bg-primary py-1 px-2 rounded text-white"
                onClick={() => {
                  const updatedDespesas = [...despesas];
                  const novoItem = {
                    nome: updatedDespesas[index].novoItemNome,
                    valor: updatedDespesas[index].novoItemValor,
                  };
                  updatedDespesas[index].items.push(novoItem);
                  updatedDespesas[index].novoItemNome = '';
                  updatedDespesas[index].novoItemValor = 0;
                  setDespesas(updatedDespesas);
                }}
                disabled={despesa.isClosed}
              >
                Adicionar Item
              </button>
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
                    <button
                        className="bg-black hover:bg-primary py-1 px-2 rounded text-white"
                        onClick={() => handleAddItemNovo(index, item)}
                        disabled={despesa.isClosed}
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
            <h2 className="text-2xl font-semibold mb-4">Deseja realmente fechar o card?</h2>
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
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
