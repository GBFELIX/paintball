import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { FaPlus, FaTrashAlt, FaEdit } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { useNavigate } from 'react-router-dom';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function CadEquipe() {
  const [nomeEquipe, setNomeEquipe] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [jogadores, setJogadores] = useState([]); 
  const [editIndex, setEditIndex] = useState(null); 
  const navigate = useNavigate();

  const handleAdd = () => {
    if (nome && email && telefone) {
      const novoJogador = { nome, email, telefone };

      if (editIndex !== null) {
        const jogadoresAtualizados = [...jogadores];
        jogadoresAtualizados[editIndex] = novoJogador;
        setJogadores(jogadoresAtualizados);
        setEditIndex(null); 
      } else {
        setJogadores([...jogadores, novoJogador]);
      }

      setNome('');
      setEmail('');
      setTelefone('');
    } else {
      alert('Preencha todos os campos antes de adicionar.');
    }
  };

  const handleEdit = (index) => {
    const jogador = jogadores[index];
    setNome(jogador.nome);
    setEmail(jogador.email);
    setTelefone(jogador.telefone);
    setEditIndex(index); 
  };

  const handleDelete = (index) => {
    const jogadoresAtualizados = jogadores.filter((_, i) => i !== index);
    setJogadores(jogadoresAtualizados);
  };

  const handleSubmit = async () => {
    if (!nomeEquipe) {
      toast.error('Preencha o nome da equipe antes de finalizar o cadastro.');
      return;
    }

    if (jogadores.length === 0) {
      toast.error('Adicione pelo menos um jogador antes de finalizar o cadastro.');
      return;
    }

    try {
      // Primeiro, inserir a equipe
      const { data: equipe, error: equipeError } = await supabase
        .from('equipes')
        .insert([
          { 
            nome: nomeEquipe,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (equipeError) throw equipeError;

      // Depois, inserir os jogadores vinculados à equipe
      const jogadoresComEquipe = jogadores.map(jogador => ({
        ...jogador,
        equipe_id: equipe.id,
        created_at: new Date().toISOString()
      }));

      const { error: jogadoresError } = await supabase
        .from('jogadores')
        .insert(jogadoresComEquipe);

      if (jogadoresError) throw jogadoresError;

      toast.success('Cadastro da equipe realizado com sucesso', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });

      // Limpar formulário
      setJogadores([]);
      setNomeEquipe(''); 

      // Redirecionar após 5 segundos
      setTimeout(() => {
        navigate("/estoque");
      }, 5000);

    } catch (error) {
      console.error('Erro detalhado:', error);
      toast.error(`Erro ao realizar cadastro: ${error.message || 'Erro desconhecido'}`, {
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
  };

  return (
    <section className="bg-black w-full h-screen flex flex-col items-center p-5">
      <ToastContainer />
      <div className="flex flex-col justify-center items-center gap-2 mb-7">
        <h1 className="text-white text-4xl font-semibold m-3">Cadastro de Equipe</h1>
        <h2 className="text-white">Adicione todos os jogadores da sua equipe</h2>
        <h2 className="text-red-600">Depois de cadastrar todos os jogadores, clique em finalizar cadastro.</h2>
      </div>

      {/* Campo para o nome da equipe */}
      <input 
        type="text" 
        placeholder="Nome da Equipe" 
        value={nomeEquipe}
        onChange={(e) => setNomeEquipe(e.target.value)}
        className="text-center rounded-sm p-2 mb-4"
      />

      <div id="cadEquipe" className="p-1 w-full flex flex-col lg:flex-row justify-center items-center gap-2">
        <input 
          type="text" 
          placeholder="Nome e Sobrenome" 
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="text-center rounded-sm p-2"
        />
        <input 
          type="email" 
          placeholder="Email do Jogador" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="text-center rounded-sm p-2"
        />
        <input 
          type="text" 
          placeholder="Telefone Jogador" 
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="text-center rounded-sm p-2"
        />

        <button 
          className="w-[220px] lg:w-10 h-10 rounded-sm bg-primary hover:bg-green-600 duration-300 p-2 flex justify-center items-center"
          onClick={handleAdd}
        >
          <FaPlus size={20} className="text-white" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto text-white bg-black p-1 gap-3 w-full flex flex-col justify-start items-center">
        <table className="table-auto w-full text-left bg-black text-white rounded-md">
          <thead className="bg-primary">
            <tr>
              <th className="p-2">Nome</th>
              <th className="p-2">Email</th>
              <th className="p-2">Telefone</th>
              <th className="p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {jogadores.map((jogador, index) => (
              <tr key={index}>
                <td className="p-2">{jogador.nome}</td>
                <td className="p-2">{jogador.email}</td>
                <td className="p-2">{jogador.telefone}</td>
                <td className="p-2 flex gap-2">
                  <button onClick={() => handleEdit(index)} className="bg-yellow-400 hover:bg-yellow-500 p-1 rounded">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(index)} className="bg-red-600 hover:bg-red-700 p-1 rounded">
                    <FaTrashAlt />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button 
        onClick={handleSubmit}
        className="mt-4 rounded-sm bg-green-600 text-white px-4 py-2 hover:bg-green-700 duration-300"
      >
        Finalizar Cadastro
      </button>
    </section>
  );
}
