import logo from '../images/logo_la.png';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";

function Loginjog() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('auth'); 
    navigate('/'); 
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`/.netlify/functions/api-login`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }), 
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth', 'true');
        localStorage.setItem('role', data.role);
        
        toast.success('Login realizado com sucesso!', {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });

        setTimeout(() => {
          switch(data.role) {
            case 'admin':
              navigate('/estoque');
              break;
            case 'usuario':
              navigate('/cadjog');
              break;
            case 'operador':
              navigate('/addjogo');
              break;
            default:
              toast.error('Tipo de usuário não reconhecido');
          }
        }, 1000);

      } else {
        toast.error(data.message || 'Credenciais inválidas', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error('Erro ao conectar com o servidor', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div className='w-full h-screen flex flex-col items-center justify-center bg-black'>
      <nav className="bg-black dark:bg-black bg-gray-800">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <img src={logo} className="h-8" alt="LA PaintBall" />
          <div className="hidden w-full md:block md:w-auto" id="navbar-default">
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-black md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-black">
              <li>
                <Link to="/loginjog" className="text-white hover:text-primary duration-150">Administradores</Link>
              </li>
              <li>
                <button onClick={handleLogout} className="text-white hover:text-primary duration-150">
                  Sair do sistema
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <ToastContainer />
      <div className='flex flex-col justify-center items-center '>
        <img src={logo} className="m-4 w-[150px]" title='PaintBall - LA' alt='PaintBall - LA'/>
        <h1 className='text-white text-4xl font-bold m-4'>Administradores</h1>
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
          Acessa sistema
        </button>
        <p className='text-primary mt-10'>
          <Link 
            to="/mudarsenhaadm" 
            className="hover:underline"
          >
            Esqueci minha senha
          </Link>
        </p>
      </div>
    </div>
  );
}
export default Loginjog;
