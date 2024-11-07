import logo from '../images/logo_la.png';
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function Loginjog() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Verificar se os campos estão preenchidos
      if (!username || !password) {
        toast.error('Por favor, preencha todos os campos!');
        return;
      }

      // Buscar jogador pelo nome e senha
      const { data: jogador, error } = await supabase
        .from('jogadores')
        .select('*')
        .eq('nome', username)
        .eq('senha', password)
        .single();

      if (error) {
        console.error('Erro ao buscar jogador:', error);
        throw error;
      }

      if (jogador) {
        // Armazenar dados do jogador no localStorage
        localStorage.setItem('jogadorId', jogador.id);
        localStorage.setItem('jogadorNome', jogador.nome);
        localStorage.setItem('jogadorEquipeId', jogador.equipe_id);

        toast.success('Login realizado com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });

        // Redirecionar após o login
        setTimeout(() => {
          navigate("/cadequipe");
        }, 3000);
      } else {
        toast.error('Usuário ou senha incorretos!', {
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
      console.error('Erro no login:', error);
      toast.error(`Erro ao fazer login: ${error.message}`);
    }
  };

  return (
    <div className='w-full h-screen bg-black flex items-center justify-center'>
      <ToastContainer />
      <div className='flex flex-col justify-center items-center '>
        <img src={logo} className="m-4 w-[150px]" title='PaintBall - LA' alt='PaintBall - LA' />
        <h1 className='text-white font-bold text-3xl m-3'>Jogador! Acesse sua conta.</h1>
        <input
          id="username"
          type='text'
          className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
          placeholder='Digite seu nome'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          id="password"
          type='password'
          className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
          placeholder='Digite sua senha'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          id="bt-log"
          className='bg-primary p-1 rounded-sm text-center m-2 w-[250px]'
          onClick={handleLogin}
        >
          Acessar Conta
        </button>
        <p className='text-primary mt-10'><a href='/mudarsenhajog'>Esqueci minha senha</a></p>
        <p className='text-primary mt-10'>
          <span className='text-white'>Não possuo cadastro!!</span> 
          <a href='/cadjog' className='ml-2'>Clique aqui</a>
        </p>
      </div>
    </div>
  );
}

export default Loginjog;
