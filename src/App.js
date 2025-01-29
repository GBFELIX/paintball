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
import Game from './pages/Game.js';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";

function Login() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('auth'); 
    navigate('/'); 
  };
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
    <div className='w-full h-screen flex flex-col items-center justify-center bg-black'>
    <nav className="bg-black dark:bg-black bg-gray-800 fixed top-0 left-0 w-full z-10">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <img src={logo} className="h-8" alt="LA PaintBall" />
        <div className="hidden w-full md:block md:w-auto" id="navbar-default">
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-black md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-black">
            <li>
              <Link to="/loginjog" className="text-white hover:text-primary duration-150">Administradores</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
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
        <Route path="/game" element={<Game/>}/>
        <Route path="/financeiro" element={<PrivateRoute role={['admin']}><Financeiro/></PrivateRoute>}/>
        <Route path="/preagenda" element={<PrivateRoute role={['admin']}><PreAgendado/></PrivateRoute>}/>
      </Routes>
    </Router>
  );
}

export default App;
