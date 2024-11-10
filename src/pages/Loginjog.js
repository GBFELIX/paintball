import logo from '../images/logo_la.png';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";

function Loginjog() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Validação dos campos
    if (!username || !email) {
      toast.error('Por favor, preencha todos os campos', {
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

    setLoading(true);

    try {
      const response = await fetch('./.netlify/functions/api-jogador', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Login realizado com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        
        // Pequeno delay antes de redirecionar para garantir que o usuário veja o toast
        setTimeout(() => {
          navigate("/cadequipe");
        }, 1000);
      } else {
        toast.error('Usuário ou senha incorretos!', {
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
      toast.error('Erro ao conectar com o servidor. Tente novamente.', {
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

  return (
    <div className='w-full h-screen bg-black flex items-center justify-center'>
      <ToastContainer />
      <div className='flex flex-col justify-center items-center'>
        <img src={logo} className="m-4 w-[150px]" title='PaintBall - LA' alt='PaintBall - LA' />
        <h1 className='text-white font-bold text-3xl m-3'>Jogador! Acesse sua conta.</h1>
        
        <input
          id="username"
          type='text'
          className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
          placeholder='Digite seu nome'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        <input
          id="password"
          type='password'
          className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
          placeholder='Digite sua senha'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        
        <button
          id="bt-log"
          className='bg-primary p-1 rounded-sm text-center m-2 w-[250px] flex justify-center items-center'
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ClipLoader
              color="#000000"
              loading={loading}
              size={20}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          ) : (
            'Acessar Conta'
          )}
        </button>

        <p className='text-primary mt-10'>
          <Link 
            to="/mudarsenhajog" 
            className="hover:underline"
          >
            Esqueci minha senha
          </Link>
        </p>
        <p className='text-primary mt-10'>
          <span className='text-white'>Não possuo cadastro!!</span>{' '}
          <Link 
            to="/cadjog" 
            className="hover:underline"
          >
            Clique aqui
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Loginjog;
