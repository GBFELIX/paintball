import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";

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
      const response = await axios.get(`./.netlify/functions/api-equipes/${equipe.equipe_id}/jogadores`);
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

  return (
    <section className="bg-black text-white p-4 w-full h-screen flex flex-col items-center">
      <ToastContainer />
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
              <th className="w-full flex justify-start">Ação</th>
            </tr>
          </thead>
          <tbody>
            {equipes.length > 0 && equipes.map((equipe, index) => (
              <tr key={index} className="p-1 text-white flex justify-around items-center border border-gray-500">
                <td className="w-full">{equipe.nomeEquipe}</td>
                <td className="w-full">{equipe.nomeJogador}</td>
                <td className="w-full">{equipe.contato}</td>
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
                      toast.info('Funcionalidade em desenvolvimento', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "light",
                      });
                    }}
                  >
                    Entrar em contato
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
            <h2 className="text-black font-bold mb-5">Equipe: {selectedEquipe.nomeEquipe}</h2>
            <div className="w-full flex flex-col">
              <div className="w-full flex justify-between px-3">
                <p className="text-black font-semibold w-1/2 text-center">Nome do Jogador</p>
                <p className="text-black font-semibold w-1/2 text-center">Contato</p>
              </div>
              {jogadores.map((jogador, index) => (
                <div key={index} className="w-full flex justify-between items-center px-3 py-2 border-t border-gray-300">
                  <div className="w-1/2 text-center">
                    <p className="text-black font-semibold">{jogador.nomeJogador}</p>
                  </div>
                  <div className="w-1/2 text-center">
                    <p className="text-black font-semibold">{jogador.contato}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="mt-5 p-2 bg-red-600 text-white rounded-md"
              onClick={() => setShowModal(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
