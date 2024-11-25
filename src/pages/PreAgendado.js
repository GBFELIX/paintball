import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";
import { FaTrashAlt, FaExchangeAlt } from "react-icons/fa";
import NavBar from './Componentes/Navbar';

export default function PreAgendado() {
  const [equipes, setEquipes] = useState([]); 
  const [selectedEquipe, setSelectedEquipe] = useState(null);
  const [jogadores, setJogadores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEquipe, setLoadingEquipe] = useState(false);
  
  useEffect(() => {
    const fetchEquipes = async () => {
      setLoading(true);
      try {
        const response = await axios.get('./.netlify/functions/api-equipes'); 
        setEquipes(response.data);
        if (response.data.length === 0) {
          toast.info('Nenhuma equipe pré-agendada encontrada', {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
          });
        }
      } catch (error) {
        toast.error('Erro ao carregar equipes. Tente novamente.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEquipes();
  }, []);

  const handleMostrarEquipe = async (equipe) => {
    setLoadingEquipe(true);
    try {
      const response = await axios.get(`./.netlify/functions/api-jogador?team_id=${equipe.equipe_id}`); 
      
      setJogadores(response.data);
      setSelectedEquipe(equipe);
      setShowModal(true);
      
      if (response.data.length === 0) {
        toast.info('Nenhum jogador encontrado nesta equipe', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      }
    } catch (error) {
      toast.error('Erro ao carregar jogadores da equipe', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    } finally {
      setLoadingEquipe(false);
    }
  };

  const fecharPartida = (equipeId) => {
    setEquipes((prevEquipes) =>
      prevEquipes.map((equipe) =>
        equipe.equipe_id === equipeId
          ? { ...equipe, status: equipe.status === 'Confirmado' ? 'Cancelado' : 'Confirmado' }
          : equipe
      )
    );
  };

  const imprimirNomesJogadores = () => {
    if (jogadores.length > 0 && selectedEquipe) {
      // Cria uma nova janela
      const printWindow = window.open('', '_blank');
      
      // Adiciona conteúdo à nova janela
      printWindow.document.write(`
        <html>
          <head>
            <title>Nomes dos Jogadores da Equipe: ${selectedEquipe.nomeEquipe}</title>
            <style>
              body { font-family: Arial, sans-serif; }
              h1 { text-align: center; }
              .player { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Nomes dos Jogadores da Equipe: ${selectedEquipe.nomeEquipe}</h1>
            ${jogadores.map(jogador => `<div class="player">${jogador.username}</div>`).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      
      printWindow.print();
    } else {
      alert('Nenhum jogador encontrado para imprimir ou equipe não selecionada.');
    }
  };

  return (
    <section className="bg-black text-white p-4 w-full h-screen flex flex-col items-center">
      <ToastContainer />
      <NavBar />
      <div className="gap-2 flex flex-col lg:flex-row justify-center items-center w-auto">
        <h1 className="text-white text-3xl text-center m-5">Jogos Pré-Agendados</h1> 
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-10">
          <ClipLoader
            color="#ffffff"
            loading={loading}
            size={50}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
          <p className="text-white mt-4">Carregando equipes...</p>
        </div>
      ) : (
        <table className="w-full flex flex-col">
          <thead className="bg-primary text-black">
            <tr className="flex justify-around">
              <th className="w-full flex justify-start">Nome da Equipe</th>
              <th className="w-full flex justify-start">Nome do Jogador</th>
              <th className="w-full flex justify-start">Contato</th>
              <th className="w-full flex justify-start">Status</th>
              <th className="w-full flex justify-start">Ação</th>
            </tr>
          </thead>
          <tbody>
            {equipes.length > 0 && equipes.map((equipe, index) => (
              <tr key={index} className="p-1 text-white flex justify-around items-center border border-gray-500">
                <td className="w-full">{equipe.nomeEquipe}</td>
                <td className="w-full">{equipe.nomeJogador}</td>
                <td className="w-full">{equipe.contato}</td>
                <td className="w-full">{equipe.status}</td>
                <td className="w-full flex gap-2">
                  <button
                    className="rounded-md bg-primary p-2 text-black hover:bg-black duration-300 hover:text-white flex items-center justify-center min-w-[120px]"
                    onClick={() => handleMostrarEquipe(equipe)}
                    disabled={loadingEquipe}
                  >
                    {loadingEquipe ? (
                      <ClipLoader
                        color="#000000"
                        loading={loadingEquipe}
                        size={20}
                        aria-label="Loading Spinner"
                        data-testid="loader"
                      />
                    ) : (
                      'Mostrar Equipe'
                    )}
                  </button>
                  <button 
                    className="rounded-md bg-green-600 p-2 hover:bg-black duration-300"
                    onClick={() => {
                      const numeroWhatsApp = `55${equipe.contato}`; // Adiciona o código do país 55 ao número de contato da equipe
                      const mensagem = "Olá, gostaria de mais informações sobre a equipe."; // Mensagem pré-definida
                      const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
                      
                      window.open(urlWhatsApp, "_blank"); // Abre o WhatsApp em uma nova aba
                    }}
                  >
                    Entrar em contato
                  </button>
                  <button 
                    className="bg-red-500 text-white hover:bg-red-600 duration-300 flex items-center justify-center p-2 rounded-md"
                    onClick={() => fecharPartida(equipe.equipe_id)}
                  >
                    <FaExchangeAlt className="text-black" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-primary w-full max-w-4xl rounded-sm flex flex-col p-5 items-center justify-center">
            <h2 className="text-black font-bold mb-5" id="modal-title">
              Equipe: {selectedEquipe && selectedEquipe.nomeEquipe}
            </h2>
            <div className="w-full flex flex-col">
              <div className="w-full flex justify-between px-3">
                <p className="text-black font-semibold w-1/2 text-center">Nome do Jogador</p>
                <p className="text-black font-semibold w-1/2 text-center">Contato</p>
              </div>
              {jogadores.length > 0 ? (
                jogadores.map((jogador, index) => (
                  <div key={index} className="w-full flex justify-between items-center px-3 py-2 border-t border-gray-300">
                    <div className="w-1/2 text-center">
                      <p className="text-black font-semibold">{jogador.username}</p>
                    </div>
                    <div className="w-1/2 text-center">
                      <p className="text-black font-semibold">{jogador.telefone}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-black text-center">Nenhum jogador encontrado nesta equipe.</p>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                className="p-2 bg-red-600 text-white rounded-md"
                onClick={() => setShowModal(false)}
                aria-label="Fechar modal"
              >
                Fechar
              </button>
              <button
                className="p-2 bg-blue-600 text-white rounded-md"
                onClick={imprimirNomesJogadores}
                aria-label="Imprimir nomes dos jogadores"
              >
                Imprimir Equipes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
