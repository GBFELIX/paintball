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

function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleVerifyUser = async () => {
    try {
      if (!username || !email) {
        toast.error('Preencha todos os campos!');
        return;
      }

      // Verificar se existe um jogador com esse nome e email
      const { data: jogador, error } = await supabase
        .from('jogadores')
        .select('*')
        .eq('nome', username)
        .eq('email', email)
        .single();

      if (error) {
        console.error('Erro ao verificar jogador:', error);
        throw error;
      }

      if (jogador) {
        setStep(2);
        toast.success('Usuário verificado com sucesso!');
      } else {
        toast.error('Usuário ou email incorretos!', {
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
      console.error('Erro na verificação:', error);
      toast.error(`Erro ao verificar usuário: ${error.message}`);
    }
  };

  const handleResetPassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        toast.error('As senhas não coincidem.');
        return;
      }

      if (newPassword.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres.');
        return;
      }

      // Atualizar a senha do jogador
      const { error: updateError } = await supabase
        .from('jogadores')
        .update({ 
          senha: newPassword,
          updated_at: new Date().toISOString()
        })
        .eq('nome', username)
        .eq('email', email);

      if (updateError) {
        console.error('Erro ao atualizar senha:', updateError);
        throw updateError;
      }

      toast.success('Senha alterada com sucesso!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      // Redirecionar após 3 segundos
      setTimeout(() => {
        navigate("/loginjog");
      }, 3000);

    } catch (error) {
      console.error('Erro na alteração de senha:', error);
      toast.error(`Erro ao alterar senha: ${error.message}`);
    }
  };

  return (
    <div className='w-full h-screen bg-black flex items-center justify-center'>
      <ToastContainer />
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
            />
            <input 
              id="email" 
              type='email' 
              className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]' 
              placeholder='Digite seu Email' 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button 
              id="bt-log" 
              className='bg-primary p-1 rounded-sm text-center m-2 w-[250px]' 
              onClick={handleVerifyUser}>Verificar Usuário</button>
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
            />
            <input 
              id="confirm-password" 
              type='password' 
              className='border border-white p-1 rounded-sm text-center mt-2 w-[250px]' 
              placeholder='Confirme sua nova senha'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button 
              id="bt-log" 
              className='bg-primary p-1 rounded-sm text-center m-2 w-[250px]' 
              onClick={handleResetPassword}>Alterar Senha</button>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
