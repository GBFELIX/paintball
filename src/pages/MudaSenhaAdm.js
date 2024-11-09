import logo from '../images/logo_la.png';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";

function Changepass(){
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerifyAdm = async () => {
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
      const response = await fetch('./.netlify/functions/api-verifyadm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Usuário verificado com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        setStep(2);
      } else {
        toast.error('Usuário ou email incorretos!', {
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

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
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

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem', {
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
      const response = await fetch('./.netlify/functions/api-resetpasswordadm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, newPassword })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Senha alterada com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error('Erro ao alterar senha', {
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
    <div>
      <ToastContainer />
      <div className='w-full h-screen bg-black flex items-center justify-center'>
        <div className='flex flex-col justify-center items-center'>
          <img src={logo} className="m-4 w-[150px]" title='PaintBall - LA' alt='PaintBall - LA'/>
          {step === 1 ? (
            <>
              <h1 className='text-white font-bold text-3xl m-3'>Esqueci Minha Senha</h1>
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
                id="email" 
                type='email' 
                className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]' 
                placeholder='Digite seu Email' 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <button 
                id="bt-log" 
                className='bg-primary p-1 rounded-sm text-center m-2 w-[250px] flex justify-center items-center' 
                onClick={handleVerifyAdm}
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
                  'Verificar Usuário'
                )}
              </button>
            </>
          ) : (
            <>
              <h1 className='text-white font-bold text-3xl m-3'>Nova Senha</h1>
              <input 
                id="new-password" 
                type='password' 
                className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]' 
                placeholder='Digite sua nova senha'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <input 
                id="confirm-password" 
                type='password' 
                className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]' 
                placeholder='Confirme sua nova senha'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              <button 
                id="bt-log" 
                className='bg-primary p-1 rounded-sm text-center m-2 w-[250px] flex justify-center items-center' 
                onClick={handleResetPassword}
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
                  'Alterar Senha'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Changepass;