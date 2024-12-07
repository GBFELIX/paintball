import logo from '../../images/logo_la.png';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
//import NavBar from '../Componentes/Navbar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Estilos do toastify
// inputmask
import { InputMask } from '@react-input/mask';

function CadJog() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  //const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleCadastro = async () => {
    // Validar campos obrigatórios antes de enviar
    if (!username || !email || !telefone || !senha) {
      toast.error('Por favor, preencha os campos obrigatórios (nome, email, telefone e senha).', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/api-cadastro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username, 
          email,  
          telefone, 
          senha 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Cadastro realizado com sucesso!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        navigate("/loginjog");
      } else {
        throw new Error(data.message || 'Erro ao realizar o cadastro.');
      }
    } catch (error) {
      console.error('Erro na solicitação:', error);
      toast.error(error.message || 'Erro ao realizar o cadastro.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
    }
  };

  return (
    <div>
      <ToastContainer />
      <div className='w-full h-screen bg-black flex items-center justify-center'>
        <div className='flex flex-col justify-center items-center'>
          <img src={logo} className="m-4 w-[150px]" title='PaintBall - LA' alt='PaintBall - LA' />
          <h1 className='text-white font-bold text-3xl m-3'>Jogador! Faça seu cadastro.</h1>
          <input
            id="username"
            type='text'
            className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
            placeholder='Digite seu nome'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            id="email"
            type='email'
            className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
            placeholder='Digite seu Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <InputMask
            id="telefone"
            type='text'
            className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
            placeholder='(xx) x xxxx-xxxx'
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            mask="(__) _ ____-____" replacement={{ _: /\d/ }}
          />
          <input
            id="senha"
            type='password'
            className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]'
            placeholder='Digite sua senha'
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <button
            id="bt-log"
            className='bg-primary p-1 rounded-sm text-center m-2 w-[250px]'
            onClick={handleCadastro}
          >
            Fazer Cadastro
          </button>
          <p className='text-primary mt-10'>
          <span className='text-white'>Já cadastro!!</span>{' '}
          <Link 
            to="/loginjog" 
            className="hover:underline"
          >
            Clique aqui
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}

export default CadJog;
