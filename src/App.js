import './App.css';
import logo from './images/logo_la.png';
import { useState } from "react";  
import { BrowserRouter as Router, Route, Routes, useNavigate, Link } from 'react-router-dom';
import CadJog from './pages/login/CadJog';
import Loginjog from './pages/Loginjog';
import NavBar from './pages/Componentes/Navbar';
import ForgotPassword from './pages/MudaSenhaJog';
import Changepass from './pages/MudaSenhaAdm';
import Estoque from './pages/Estoque';
import AddJogo from './pages/AddJogo';
import CardJogador from './pages/Componentes/Cardjog';
import CardVendaAvulsa from './pages/Componentes/VendaAvul';
import StatusGame from './pages/StatusGamer';
import ResumoGame from './pages/ResumoGame';
import PrivateRoute from './pages/Privateroute';
import CadEquipe from './pages/CadastroEquipe.js';
import Financeiro from './pages/Financeiro.js';
import PreAgendado from './pages/PreAgendado.js';
import CardDespesas from './pages/Componentes/CardDespesas.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

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
      <nav className="bg-black">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <img src={logo} className="h-8" alt="LA PaintBall" />
          <div className="hidden w-full md:block md:w-auto" id="navbar-default">
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadjog" element={<CadJog />} />
        <Route path="/loginjog" element={<Loginjog />} />
        <Route path="/Navbar" element={<NavBar />} />
        <Route path="/mudarsenhajog" element={<ForgotPassword />} />
        <Route path="/mudarsenhaadm" element={<Changepass />} />
        <Route path="/estoque" element={<PrivateRoute role="admin"><Estoque /></PrivateRoute>}/>
        <Route path="/addjogo" element={<PrivateRoute role={['admin', 'operador']}><AddJogo /></PrivateRoute>} />
        <Route path="/cardjogador" element={<CardJogador />} />
        <Route path="/vendaavulsa" element={<CardVendaAvulsa />} />
        <Route path="/carddespesas" element={<CardDespesas />} />
        <Route path="/statusgame" element={<PrivateRoute role={['admin', 'operador']}><StatusGame /></PrivateRoute>} />
        <Route path="/resumogame" element={<PrivateRoute role={['admin', 'operador']}><ResumoGame/></PrivateRoute>}/>
        <Route path="/cadequipe" element={<CadEquipe/>}/>
        <Route path="/financeiro" element={<PrivateRoute role={['admin']}><Financeiro/></PrivateRoute>}/>
        <Route path="/preagenda" element={<PrivateRoute role={['admin']}><PreAgendado/></PrivateRoute>}/>
      </Routes>
    </Router>
  );
}

export default App;
