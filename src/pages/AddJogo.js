import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from './Componentes/Navbar';
import logo from '../images/logo_la.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilos do toastify

function AddJogo() {
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const navigate = useNavigate(); // Hook para redirecionar

  // Função para obter a data e hora atual no formato correto
  useEffect(() => {
    const now = new Date();

    // Formatando a data no formato YYYY-MM-DD
    const dataAtual = now.toISOString().split('T')[0];

    // Formatando a hora no formato HH:MM
    const horaAtual = now.toTimeString().split(':').slice(0, 2).join(':');

    setData(dataAtual);
    setHora(horaAtual);
  }, []);

  const handleAdicionar = async () => {
    try {
      const response = await fetch('http://localhost:5000/addjogo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data, hora })
      });
  
      const result = await response.json();
  
      if (result.success) {
        // Armazena a data e a hora no localStorage
        localStorage.setItem('dataJogo', data);
        localStorage.setItem('horaJogo', hora);
        toast('Jogo adicionado com sucesso!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        navigate('/statusgame'); // Redireciona para StatusGame
      } else {
        toast.error('Erro ao adicionar jogo.', {
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
    } catch (error) {
      console.error('Erro na solicitação:', error);
      toast.error('Erro ao adicionar jogo.', {
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

  return (
    <>
      <NavBar />
      <ToastContainer />
      <div className='w-full h-screen bg-black flex items-center justify-center'>
        <div className='flex flex-col justify-center items-center'>
          <img src={logo} className="m-4 w-[150px]" title='PaintBall - LA' alt='PaintBall - LA' />
          <h1 className='text-white font-bold text-3xl m-3'>Iniciar jogo</h1>
          <input
            id="data"
            type='date'
            className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
            placeholder='Digite a data'
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
          <input
            id="hora"
            type='time'
            className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
            placeholder='Digite a hora'
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
          <button
            id="bt-log"
            className='bg-primary p-1 rounded-sm text-center m-2 w-[250px]'
            onClick={handleAdicionar}
          >
            Cadastrar e adicionar jogo
          </button>
        </div>
      </div>
    </>
  );
}

export default AddJogo;
