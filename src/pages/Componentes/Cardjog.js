import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function CardJogador({ jogadores, setJogadores }) {
  const [estoque, setEstoque] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [jogadorIndexForPayment, setJogadorIndexForPayment] = useState(null);

  // Carregar estoque inicial
  useEffect(() => {
    const fetchEstoque = async () => {
      try {
        const { data, error } = await supabase
          .from('estoque')
          .select('*');
        
        if (error) throw error;
        setEstoque(data);
      } catch (error) {
        console.error('Erro ao buscar estoque:', error);
      }
    };

    fetchEstoque();
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

  const handlePaymentSelection = (paymentMethod) => {
    setSelectedPayment(paymentMethod);
  };

  const handleConfirmPayment = async () => {
    const jogador = jogadores[jogadorIndexForPayment];
    const itemsToUpdate = jogador.items;
    const valorTotalJogador = jogador.items.reduce((sum, item) => sum + item.valor, 0);

    const itemCountMap = itemsToUpdate.reduce((acc, item) => {
      acc[item.nome] = (acc[item.nome] || 0) + 1;
      return acc;
    }, {});

    let podeFechar = true;

    try {
      // Verificar e atualizar estoque
      for (const nome of Object.keys(itemCountMap)) {
        const quantidadeParaSubtrair = itemCountMap[nome];
        
        // Buscar quantidade atual
        const { data: itemEstoque, error: getError } = await supabase
          .from('estoque')
          .select('quantidade')
          .eq('nome', nome)
          .single();
        
        if (getError) throw getError;

        const quantidadeAtual = itemEstoque.quantidade;
        
        if (quantidadeAtual < quantidadeParaSubtrair) {
          toast.error(`Quantidade insuficiente no estoque para o item ${nome}`);
          podeFechar = false;
          break;
        }

        // Atualizar quantidade
        const novaQuantidade = quantidadeAtual - quantidadeParaSubtrair;
        const { error: updateError } = await supabase
          .from('estoque')
          .update({ quantidade: novaQuantidade })
          .eq('nome', nome);
        
        if (updateError) throw updateError;
      }

      if (podeFechar) {
        const dataJogo = localStorage.getItem('dataJogo');
        const horaJogo = localStorage.getItem('horaJogo');
        const jogoId = localStorage.getItem('jogoId');
        
        // Formatar data e hora corretamente
        const dataHoraFormatada = new Date(`${dataJogo}T${horaJogo}`).toISOString();

        // Inserir pedido com estrutura atualizada
        const { error: pedidoError } = await supabase
          .from('pedidos')
          .insert([{
            nome_jogador: jogador.nome,
            items: jogador.items, // será armazenado como JSONB
            forma_pagamento: selectedPayment,
            valor_total: valorTotalJogador,
            data_hora: dataHoraFormatada,
            tipo_pedido: 'jogador',
            jogo_id: jogoId
          }]);

        if (pedidoError) {
          console.error('Erro detalhado:', pedidoError);
          throw pedidoError;
        }

        const updatedJogadores = [...jogadores];
        updatedJogadores[jogadorIndexForPayment].isClosed = true;
        setJogadores(updatedJogadores);
        setShowPaymentModal(false);

        // Armazenar os dados no localStorage
        const pagamentosAnteriores = JSON.parse(localStorage.getItem('pagamentos')) || [];
        pagamentosAnteriores.push({
          valorTotal: valorTotalJogador,
          formaPagamento: selectedPayment
        });
        localStorage.setItem('pagamentos', JSON.stringify(pagamentosAnteriores));

        toast.success('Pedido cadastrado com sucesso!');
      }
    } catch (error) {
      console.error('Erro detalhado ao processar pagamento:', error);
      toast.error(`Erro ao processar pagamento: ${error.message}`);
    }
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
                  value={jogador.selectedItem?.nome || ''}
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
                className="bg-black hover:bg-primary py-1 px-2 rounded-lg text-white"
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
