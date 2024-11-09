import React, { useState, useEffect } from 'react';
import VendaAvulsa from './Componentes/VendaAvul';
import CardJog from './Componentes/Cardjog';
import CardDespesas from './Componentes/CardDespesas';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from "react-icons/fa6";

export default function StatusGame() {
  const [jogo, setJogo] = useState({});
  const [jogadores, setJogadores] = useState([{ 
    nome: '', 
    numero: '1', 
    items: [], 
    selectedItem: '', 
    isClosed: false 
  }]);
  const [vendasAvulsas, setVendasAvulsas] = useState([{ 
    nome: '', 
    numero: '1', 
    items: [], 
    selectedItem: '', 
    isClosed: false 
  }]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [despesas, setDespesas] = useState([{ 
    nome: '', 
    numero: '1', 
    items: [], 
    selectedItem: '', 
    isClosed: false 
  }]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem('dataJogo');
    const storedHora = localStorage.getItem('horaJogo');
  
    if (storedData) {
      setJogo({ data: storedData, hora: storedHora });
    }
  }, []);

  const handleAddJogador = () => {
    const newNumero = (jogadores.length + 1).toString();
    setJogadores([...jogadores, { 
      nome: '', 
      numero: newNumero, 
      items: [], 
      selectedItem: '', 
      isClosed: false 
    }]);
  };

  const handleAddVendaAvulsa = () => {
    const newNumero = (vendasAvulsas.length + 1).toString();
    setVendasAvulsas([...vendasAvulsas, { 
      nome: '', 
      numero: newNumero, 
      items: [], 
      selectedItem: '', 
      isClosed: false 
    }]);
  };
  
  const handleAddDespesa = () => {
    const newNumero = (despesas.length + 1).toString();
    setDespesas([...despesas, { 
      nome: '', 
      numero: newNumero, 
      items: [], 
      selectedItem: '', 
      isClosed: false 
    }]);
  };

  const handleClosePedido = (index) => {
    const updatedJogadores = [...jogadores];
    updatedJogadores[index].isClosed = !updatedJogadores[index].isClosed;
    setJogadores(updatedJogadores);
  };

  const jogadoresAtivos = jogadores.filter(jogador => !jogador.isClosed).length;
  const jogadoresInativos = jogadores.filter(jogador => jogador.isClosed).length;

  const handleFecharPartida = () => {
    setShowConfirmationModal(true);
  };

  const confirmCloseGame = () => {
    setShowConfirmationModal(false);
    navigate('/resumogame');
  };

  const cancelCloseGame = () => {
    setShowConfirmationModal(false);
  };
  
  return (
    <section className="bg-black text-white min-h-screen w-full h-auto rounded-md p-3 flex flex-col gap-4">
      <div className="flex justify-between w-full gap-4 mb-4">
        <div className="flex flex-col items-start">
          <p className="font-semibold">Data da Partida</p>
          <p id="dataPartida" className="font-semibold text-3xl">{jogo.data || 'Carregando...'}</p>
        </div>
        <div className="flex flex-col items-start">
          <p className="font-semibold">Jogadores Ativos</p>
          <p id="playerAtivo" className="font-semibold text-3xl">{jogadoresAtivos}</p> 
        </div>
        <div className="flex flex-col items-start">
          <p className="font-semibold">Jogadores Finalizados</p>
          <p id="playerInativo" className="font-semibold text-3xl">{jogadoresInativos}</p> 
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-black">
        <CardJog 
          jogadores={jogadores} 
          setJogadores={setJogadores} 
          handleAddJogador={handleAddJogador} 
          handleClosePedido={handleClosePedido}   
        />
        <VendaAvulsa 
          vendas={vendasAvulsas} 
          setVendas={setVendasAvulsas} 
          handleAddVendaAvulsa={handleAddVendaAvulsa} 
          handleClosePedido={handleClosePedido}
        />
        <CardDespesas 
          despesas={despesas}
          setDespesas={setDespesas}
          handleAddDespesa={handleAddDespesa}
          handleClosePedido={handleClosePedido}
        />
      </div>

      <div className="flex justify-end mt-auto">
        <button 
          onClick={handleAddJogador}
          className="bg-primary hover:bg-white duration-300 m-2 w-20 h-20 rounded-full flex justify-center items-center"
        >
          <FaPlus size={30} />
        </button>
        <button 
          onClick={handleAddVendaAvulsa}
          className="bg-blue-600 hover:bg-white duration-300 m-2 w-20 h-20 rounded-full flex justify-center items-center"
        >
          <FaPlus size={30} />
        </button>
        <button 
          onClick={handleAddDespesa}
          className="bg-red-600 hover:bg-white duration-300 m-2 w-20 h-20 rounded-full flex justify-center items-center"
        >
          <FaPlus size={30} />
        </button>

        <button 
          onClick={handleFecharPartida}
          className="mt-4 mb-4 rounded-md w-[150px] h-[40px] bg-primary flex justify-center items-center hover:bg-red-500 transition-colors"
        >
          <p>Fechar Partida</p>
        </button>
      </div>

      {showConfirmationModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-black text-2xl font-semibold mb-4">Tem certeza que deseja fechar a partida?</h2>
            <div className="flex justify-between mt-4">
              <button
                className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg"
                onClick={cancelCloseGame}
              >
                Cancelar
              </button>
              <button
                className="bg-black hover:bg-primary py-2 px-4 rounded-lg text-white"
                onClick={confirmCloseGame}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}