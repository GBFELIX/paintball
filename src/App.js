import './App.css';
import logo from './images/logo_la.png';
import { useState } from "react";  
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
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
import { supabase } from './utils/supabase'

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
    const handleLogin = async () => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
  
        if (error) {
          toast.error(error.message || 'Credenciais inválidas');
        } else if (data) {
          localStorage.setItem('auth', 'true');
          const role = data.user.user_metadata?.role || 'admin';
          localStorage.setItem('role', role);
  
          toast.success('Login realizado com sucesso!');
          setTimeout(() => {
            switch(role) {
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
          }, 500);
        }
      } catch (error) {
        console.error('Erro ao fazer login:', error);
        toast.error('Erro ao conectar com o servidor');
      }
    };

  return (
    <div className='w-full h-screen flex flex-col items-center justify-center bg-black'>
      <ToastContainer />
      <div className='flex flex-col justify-center items-center '>
        <img src={logo} className="m-4 w-[150px]" title='PaintBall - LA' alt='PaintBall - LA'/>
        <h1 className='text-white text-4xl font-bold m-4'>Administradores</h1>
        <input 
          id="email" 
          type='email' 
          className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]' 
          placeholder='Digite seu email' 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
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
        <p className='text-primary mt-10'><a href='/mudarsenhaadm'>Esqueci minha senha</a></p>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadjog" element={<PrivateRoute role={['admin', 'usuario', 'operador']}><CadJog /></PrivateRoute>} />
        <Route path="/loginjog" element={<PrivateRoute role={['admin', 'usuario', 'operador']}><Loginjog /></PrivateRoute>} />
        <Route path="/Navbar" element={<NavBar />} />
        <Route path="/mudarsenhajog" element={<PrivateRoute role={['admin', 'usuario', 'operador']}><ForgotPassword /></PrivateRoute>} />
        <Route path="/mudarsenhaadm" element={<Changepass />} />
        <Route path="/estoque" element={<PrivateRoute role="admin"><Estoque /></PrivateRoute>}/>
        <Route path="/addjogo" element={<PrivateRoute role={['admin', 'operador']}><AddJogo /></PrivateRoute>} />
        <Route path="/cardjogador" element={<CardJogador />} />
        <Route path="/vendaavulsa" element={<CardVendaAvulsa />} />
        <Route path="/carddespesas" element={<CardDespesas />} />
        <Route path="/statusgame" element={<PrivateRoute role={['admin', 'operador']}><StatusGame /></PrivateRoute>} />
        <Route path="/resumogame" element={<PrivateRoute role={['admin', 'operador']}><ResumoGame/></PrivateRoute>}/>
        <Route path="/cadequipe" element={<PrivateRoute role={['admin', 'operador']}><CadEquipe/></PrivateRoute>}/>
        <Route path="/financeiro" element={<PrivateRoute role={['admin']}><Financeiro/></PrivateRoute>}/>
        <Route path="/preagenda" element={<PrivateRoute role={['admin']}><PreAgendado/></PrivateRoute>}/>
      </Routes>
    </Router>
  );
}

export default App;
