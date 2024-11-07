import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import NavBar from './Componentes/Navbar';
import logo from '../images/logo_la.png';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function AddJogo() {
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  const navigate = useNavigate();

  // Função para obter a data e hora atual no formato correto
  useEffect(() => {
    const now = new Date();
    const dataAtual = now.toISOString().split('T')[0];
    const horaAtual = now.toTimeString().split(':').slice(0, 2).join(':');

    setData(dataAtual);
    setHora(horaAtual);
  }, []);

  const handleAdicionar = async () => {
    try {
      // Formatar a data e hora para o formato PostgreSQL
      const dataFormatada = new Date(data);
      const dataHoraCompleta = `${dataFormatada.toISOString().split('T')[0]}T${hora}:00`;

      // Inserir novo jogo na tabela jogos
      const { data: jogoData, error } = await supabase
        .from('jogos')
        .insert([
          { 
            data_jogo: data,
            hora_jogo: `${hora}:00`,  // Adiciona segundos para formato completo
            status: 'ativo',
            data_hora_completa: dataHoraCompleta  // Campo adicional com data e hora juntos
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Erro detalhado:', error);
        throw error;
      }

      // Armazena a data e a hora no localStorage
      localStorage.setItem('dataJogo', data);
      localStorage.setItem('horaJogo', hora);
      localStorage.setItem('jogoId', jogoData.id);

      toast.success('Jogo adicionado com sucesso!');
      navigate('/statusgame');
    } catch (error) {
      console.error('Erro ao adicionar jogo:', error);
      toast.error(`Erro ao adicionar jogo: ${error.message}`);
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
