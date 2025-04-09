import React, { useState, useEffect } from 'react';
import axios from 'axios';
import NavBar from '../pages/Componentes/Navbar';
import { useNavigate } from 'react-router-dom';
import { FaPlus } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";

const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .loading-spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
`;

export default function Estoque() {
  const navigate = useNavigate();
  const [estoque, setEstoque] = useState([]);
  const [inputs, setInputs] = useState({});
  const [editMode, setEditMode] = useState({});
  const [descontos, setDescontos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bolinhas, setBolinhas] = useState([]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('auth');
    if (!isAuthenticated) {
      navigate("/");  
    }
  }, [navigate]);
  
  const fetchEstoque = () => {
    setLoading(true);
    setError(null);
    axios.get('/.netlify/functions/api-estoque')
      .then(response => {
        setEstoque(response.data);
        setLoading(false);
      })
      .catch(error => {
        toast.error('Erro ao carregar o estoque. Tente novamente.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        setLoading(false);
      });
  };
  const fetchDescontos = () => {
    axios.get('/.netlify/functions/api-descontos')
        .then(response => {
            const descontosFormatados = Object.entries(response.data).map(([nome, valor]) => ({
                nome,
                valor,
                id: nome
            }));
            setDescontos(descontosFormatados);
        })
        .catch(error => console.error('Erro ao buscar descontos:', error));
  };
  const removeDesconto = (id) => {
    axios.delete(`/.netlify/functions/api-descontos/${id}`)
      .then(response => {
        toast.success('Desconto removido com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        fetchDescontos();
      })
      .catch(error => {
        console.error('Erro ao excluir desconto:', error);
        toast.error('Erro ao excluir desconto', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };
  
  const fetchBolinhas = () => {
    axios.get('/.netlify/functions/api-bolinhas')
      .then(response => {
        setBolinhas(response.data);
      })
      .catch(error => {
        toast.error('Erro ao carregar bolinhas. Tente novamente.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };

  useEffect(() => {
    fetchEstoque();
    fetchDescontos();
    fetchBolinhas();
  }, []);

  const addDesconto = () => {
    const nomeDesconto = document.getElementById('NomeDesconto').value;
    const valorDesconto = document.getElementById('ValorDesconto').value;
    
    if (!nomeDesconto || !valorDesconto) {
      toast.error('Preencha todos os campos do desconto', {
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

    axios.post('/.netlify/functions/api-descontos', { nome: nomeDesconto, valor: valorDesconto })
      .then(response => {
        toast.success('Desconto adicionado com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        fetchDescontos();
        document.getElementById('NomeDesconto').value = '';
        document.getElementById('ValorDesconto').value = '';
      })
      .catch(error => {
        toast.error('Erro ao adicionar desconto', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };

  const addEstoque = async () => {
    const nomeProduto = document.getElementById('NomeProduto').value;
    const valorProduto = document.getElementById('valorProduto').value;
    const qtdProduto = document.getElementById('QtdProduto').value;
    const custoProduto = document.getElementById('custoProduto').value;
    const tipoItem = document.getElementById('tipoItem').value;
    
    if (!nomeProduto || !valorProduto || !qtdProduto || !custoProduto) {
      toast.error('Preencha todos os campos do produto', {
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
      await axios.post('/.netlify/functions/api-estoque', {
        item: nomeProduto,
        valor: parseFloat(valorProduto),
        custo: parseInt(custoProduto),
        quantidade: parseInt(qtdProduto),
        tipo: tipoItem
      });
      
      toast.success('Produto adicionado com sucesso!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "light",
      });
      
      await fetchEstoque();
      
      document.getElementById('NomeProduto').value = '';
      document.getElementById('valorProduto').value = '';
      document.getElementById('QtdProduto').value = '';
      document.getElementById('custoProduto').value = '';
    } catch (error) {
      toast.error('Erro ao adicionar produto', {
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
  const updateDesconto = (id, novoValor) => {
    axios.put(`/.netlify/functions/api-descontos/${id}`, { valor: novoValor })
      .then(() => {
        fetchDescontos();
        setInputs(prev => ({ ...prev, [id]: { ...prev[id], valor: '' } }));
      })
      .catch(error => {
        console.error('Erro ao atualizar valor do desconto:', error);
        toast.error('Erro ao atualizar desconto', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };
  

  const removeEstoque = () => {
    const nomeProduto = document.getElementById('NomeProduto').value;

    axios.delete(`/.netlify/functions/api-estoque/${nomeProduto}`)
      .then(response => {
        fetchEstoque();
        document.getElementById('NomeProduto').value = '';
      })
      .catch(error => {
        console.error('Erro ao remover item do estoque:', error);
      });
  };

  const updateQuantidade = (nome, novaQuantidade) => {
    axios.put(`/.netlify/functions/api-estoque/${nome}`, { quantidade: novaQuantidade })
      .then(response => {
        toast.success('Quantidade atualizada com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        fetchEstoque();
        setInputs(prev => ({ ...prev, [nome]: { ...prev[nome], quantidade: '' } }));
      })
      .catch(error => {
        toast.error('Erro ao atualizar quantidade', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };
  const updateCusto = (nome, novoCusto) => {
    axios.put(`/.netlify/functions/api-estoque/${nome}`, { custo: novoCusto })
      .then(response => {
        toast.success('Quantidade atualizada com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        fetchEstoque();
        setInputs(prev => ({ ...prev, [nome]: { ...prev[nome], custo: '' } }));
      })
      .catch(error => {
        toast.error('Erro ao atualizar quantidade', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };

  const updateValor = (nome, novoValor) => {
    axios.put(`/.netlify/functions/api-estoque/${nome}`, { valor: novoValor })
      .then(response => {
        toast.success('Valor atualizado com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        fetchEstoque();
        setInputs(prev => ({ ...prev, [nome]: { ...prev[nome], valor: '' } }));
      })
      .catch(error => {
        toast.error('Erro ao atualizar valor', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };

  const handleInputChange = (nome, tipo, valor) => {
    setInputs(prev => ({
      ...prev,
      [nome]: {
        ...prev[nome],
        [tipo]: valor
      }
    }));
  };

  const toggleEditMode = (nome) => {
    setEditMode(prev => ({ ...prev, [nome]: !prev[nome] }));
  };

  const totalQuantidade = estoque.filter(item => item.tipo === 'Venda').reduce((total, item) => total + item.quantidade, 0);
  const totalValor = estoque.filter(item => item.tipo === 'Venda').reduce((total, item) => total + item.valor * item.quantidade, 0);
  const totalValorCusto = estoque.filter(item => item.tipo === 'Venda').reduce((total, item) => total + item.custo * item.quantidade, 0);

  
  const formatEstoqueToText = () => {
    return estoque.map(item => 
      `Produto: ${item.nome}, Quantidade: ${item.quantidade}, Valor: R$${item.valor}, Valor Total: R$${(item.valor * item.quantidade).toFixed(2)}, Custo: R$${item.custo}, Custo Total: R$${(item.custo * item.quantidade).toFixed(2)}`
    ).join('\n');
  };

  {/*
  const saveEstoqueToFile = () => {
    const estoqueText = formatEstoqueToText();
    const blob = new Blob([estoqueText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estoque.txt';
    a.click();
    window.URL.revokeObjectURL(url);
  };
*/}
  const printEstoque = () => {
    const estoqueText = formatEstoqueToText();
    const printWindow = window.open('', '', 'width=600,height=400');
    printWindow.document.write('<pre>' + estoqueText + '</pre>');
    printWindow.document.close();
    printWindow.print();
  };

  const addBolinhas = () => {
    const quantidade = document.getElementById('QuantidadeBolinhas').value;
    
    if (!quantidade) {
      toast.error('Preencha a quantidade de bolinhas', {
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

    axios.post('/.netlify/functions/api-bolinhas', { quantidade: parseInt(quantidade) })
      .then(response => {
        toast.success('Bolinhas adicionadas com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        fetchBolinhas();
        document.getElementById('QuantidadeBolinhas').value = '';
      })
      .catch(error => {
        toast.error('Erro ao adicionar bolinhas', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };

  const updateBolinhas = (id, novaQuantidade) => {
    axios.put(`/.netlify/functions/api-bolinhas/${id}`, { quantidade: novaQuantidade })
      .then(() => {
        fetchBolinhas();
        setInputs(prev => ({ ...prev, [id]: { ...prev[id], quantidade: '' } }));
      })
      .catch(error => {
        console.error('Erro ao atualizar quantidade de bolinhas:', error);
        toast.error('Erro ao atualizar quantidade', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      });
  };

  return (
    <div className="bg-black min-h-screen flex flex-col items-center justify-center">
      <style>{spinnerStyle}</style>
      <ToastContainer />
      <NavBar />
      <section className="w-full max-w-4xl flex flex-col items-center justify-center p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-5">
            <ClipLoader
              color="#ffffff"
              loading={loading}
              size={50}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
            <p className="text-white mt-4">Carregando estoque...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="w-full bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                {error}
              </div>
            )}
            
            <h1 className="text-white font-bold text-2xl mt-5 mb-10">Gerenciamento de Estoque</h1>
            
            <div className="w-full h-auto bg-gray-400 rounded-sm flex flex-col p-5 items-center justify-center mb-5">
              <h2 className="text-black font-bold mb-5">Adicionar/Remover Itens</h2>
              <input id="NomeProduto" type="text" className="w-full md:w-1/2 p-2 m-2 rounded-md text-center" placeholder="Nome do produto" />
              <input id="custoProduto" type="text" className="w-full md:w-1/2 p-2 m-2 rounded-md text-center" placeholder="Valor de custo" />
              <input id="valorProduto" type="text" className="w-full md:w-1/2 p-2 m-2 rounded-md text-center" placeholder="Valor de venda" />
              <input id="QtdProduto" type="number" className="w-full md:w-1/2 p-2 m-2 rounded-md text-center" placeholder="Quantidade" />
              <select id='tipoItem' className="w-full h-10 md:w-1/2 p-2 m-2 rounded-md text-center">
                <option>Venda</option>
                <option>Aluguel</option>
              </select>
              <div className="flex space-x-4 mt-3">
                <button id="AddEstoque" className="bg-primary hover:bg-green-500 duration-200 p-2 rounded-md" onClick={addEstoque}>
                  Adicionar
                </button>
                <button id="RemoveEstoque" className="bg-red-600 hover:bg-black hover:text-white duration-200 p-2 rounded-md" onClick={removeEstoque}>
                  Remover
                </button>
              </div>
            </div>

              <div className="w-full h-auto bg-red-600 rounded-sm flex flex-col p-5 items-center justify-center mb-5">
              <h2 className="font-bold mb-5 text-white">Desconto Programado</h2>
              <div className="flex flex-col md:flex-row items-center justify-center">
                <input 
                    id="NomeDesconto" 
                    type="text" 
                    className="w-full md:w-1/2 p-2 m-2 rounded-md text-center" 
                    placeholder="Nome do Desconto" 
                    onChange={(e) => {
                        const value = e.target.value;
                        const regex = /^[a-zA-Z0-9]*$/;

                        if (!regex.test(value)) {
                            toast.error('Apenas letras e números são permitidos!', {
                                position: "top-right",
                                autoClose: 3000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                theme: "light",
                            });
                            e.target.value = value.slice(0, -1);
                        }
                    }}
                />
                <input id="ValorDesconto" type="text" className="w-full md:w-1/2 p-2 m-2 rounded-md text-center" placeholder="Percentagem do desconto" />
                <button className="bg-primary hover:bg-green-500 duration-200 w-auto p-3 h-10 rounded-md flex items-center justify-center" onClick={addDesconto}>
                  <FaPlus /> Adicionar
                </button>
              </div>
            </div>

            <div className="bg-primary w-full max-w-4xl rounded-md shadow-lg flex flex-col p-6 items-center justify-center">
              <h2 className="text-black font-bold text-lg mb-5">Descontos Programados</h2>
              
              <div className="w-full flex justify-between items-center px-4 py-2 border-b border-gray-300 font-semibold text-black">
                <p className="w-1/3 text-left">Nome</p>
                <p className="w-2/3 ml-20">Valor</p>
              </div>
              
              {descontos.length > 0 ? (
                descontos.map((desconto) => (
                  <div
                    key={desconto.nome}
                    className="w-full flex justify-between items-center px-4 py-2 border-t border-gray-200"
                  >
                    <p className="w-1/3 text-black font-semibold text-left">{desconto.nome}</p>
                    {editMode[desconto.nome] ? (
                      <input
                        type="text"
                        className="text-black font-semibold w-1/3 text-left p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                        value={inputs[desconto.nome]?.valor || desconto.valor}
                        onChange={(e) => handleInputChange(desconto.nome, 'valor', e.target.value)}
                        onBlur={() => {
                          if (inputs[desconto.nome]?.valor) {
                            updateDesconto(desconto.nome, inputs[desconto.nome].valor);
                          }
                        }}
                      />
                    ) : (
                      <p className="w-1/3 mr-20 text-black font-semibold ">{desconto.valor}%</p>
                    )}
                    <button
                      className="text-blue-500 hover:text-blue-700 mx-2"
                      onClick={() => toggleEditMode(desconto.nome)}
                    >
                      {editMode[desconto.nome] ? 'Salvar' : <FaRegEdit />}
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeDesconto(desconto.nome)}
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-black font-semibold">Nenhum desconto cadastrado</p>
              )}
            </div>

            <div className="w-full h-auto bg-blue-600 rounded-sm flex flex-col p-5 items-center justify-center mb-5">
              <h2 className="font-bold mb-5 text-white">Gerenciamento de Bolinhas</h2>
              <div className="flex flex-col md:flex-row items-center justify-center">
                <input 
                    id="QuantidadeBolinhas" 
                    type="number" 
                    className="w-full md:w-1/2 p-2 m-2 rounded-md text-center" 
                    placeholder="Quantidade de bolinhas" 
                    min="0"
                />
                <button className="bg-primary hover:bg-green-500 duration-200 w-auto p-3 h-10 rounded-md flex items-center justify-center" onClick={addBolinhas}>
                  <FaPlus /> Adicionar
                </button>
              </div>
            </div>

            <div className="bg-primary w-full max-w-4xl rounded-md shadow-lg flex flex-col p-6 items-center justify-center mb-5">
              <h2 className="text-black font-bold text-lg mb-5">Estoque de Bolinhas</h2>
              
              <div className="w-full flex justify-between items-center px-4 py-2 border-b border-gray-300 font-semibold text-black">
                <p className="w-1/2 text-center">Quantidade</p>
                <p className="w-1/2 text-center">Ações</p>
              </div>
              
              {bolinhas.length > 0 ? (
                <div
                  key={bolinhas[0].id}
                  className="w-full flex justify-between items-center px-4 py-2 border-t border-gray-200"
                >
                  {editMode[bolinhas[0].id] ? (
                    <input
                      type="number"
                      className="text-black font-semibold w-1/2 text-center p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-400"
                      value={inputs[bolinhas[0].id]?.quantidade || bolinhas[0].quantidade}
                      onChange={(e) => handleInputChange(bolinhas[0].id, 'quantidade', e.target.value)}
                      onBlur={() => {
                        if (inputs[bolinhas[0].id]?.quantidade) {
                          updateBolinhas(bolinhas[0].id, inputs[bolinhas[0].id].quantidade);
                        }
                      }}
                    />
                  ) : (
                    <p className="w-1/2 text-black font-semibold text-center">{bolinhas[0].quantidade}</p>
                  )}
                  <div className="w-1/2 text-center">
                    <button
                      className="text-blue-500 hover:text-blue-700 mx-2"
                      onClick={() => toggleEditMode(bolinhas[0].id)}
                    >
                      {editMode[bolinhas[0].id] ? 'Salvar' : <FaRegEdit />}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-black font-semibold">Nenhuma bolinha registrada</p>
              )}
            </div>

            <div className="bg-primary w-full max-w-4xl rounded-sm flex flex-col p-5 items-center justify-center">
              <h2 className="text-black font-bold mb-5">Estoque Atual - Venda</h2>
              <div className="w-full flex flex-col">
                <div className="w-full flex justify-between px-3">
                  <p className="text-black font-semibold w-1/6 text-center">Editar</p>
                  <p className="text-black font-semibold w-1/4 text-center">Item</p>
                  <p className="text-black font-semibold w-1/4 text-center">Tipo</p>
                  <p className="text-black font-semibold w-1/4 text-center">Quantidade</p>
                  <p className="text-black font-semibold w-1/4 text-center">Valor Custo</p>
                  <p className="text-black font-semibold w-1/4 text-center">Valor Venda</p>
                  <p className="text-black font-semibold w-1/4 text-center">Valor Total</p>
                </div>
                {estoque.filter(item => item.tipo === 'Venda').map((item, index) => (
                  <div key={index} className="w-full flex justify-between items-center px-3 py-2 border-t border-gray-300">
                    <div className="w-1/6 text-center">
                      <button 
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => toggleEditMode(item.nome)}
                      >
                        {editMode[item.nome] ? 'Cancelar' : 'Editar'}
                      </button>
                    </div>
                    <div className="w-1/4 text-center">
                      <p className="text-black font-semibold">{item.nome}</p>
                    </div>
                    <div className="w-1/4 text-center">
                      <p className="text-black font-semibold">{item.tipo}</p>
                    </div>
                    <div className="w-1/4 text-center">
                      <div className="flex items-center justify-center">
                        <p className="text-black font-semibold">{item.quantidade}</p>
                        {editMode[item.nome] && (
                          <input
                            type="number"
                            value={inputs[item.nome]?.quantidade || ''}
                            onChange={(e) => handleInputChange(item.nome, 'quantidade', e.target.value)}
                            className="w-24 p-1 m-1 rounded-md text-center"
                            placeholder="Nova qtd"
                            onBlur={() => {
                              if (inputs[item.nome]?.quantidade) {
                                updateQuantidade(item.nome, inputs[item.nome].quantidade);
                                toggleEditMode(item.nome);
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="w-1/4 text-center">
                      <div className="flex items-center justify-between">
                        <p className="text-black font-semibold w-full">{item.custo}</p>
                        {editMode[item.nome] && (
                          <input
                            type="number"
                            value={inputs[item.nome]?.custo || ''}
                            onChange={(e) => handleInputChange(item.nome, 'custo', e.target.value)}
                            className="w-24 p-1 m-1 rounded-md text-center"
                            placeholder="Novo custo"
                            onBlur={async () => {
                              if (inputs[item.nome]?.custo) {
                                try {
                                  await updateCusto(item.nome, inputs[item.nome].custo);
                                  toggleEditMode(item.nome); 
                                } catch (error) {
                                  toast.error('Erro ao atualizar custo: ' + error.message, {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    theme: "light",
                                  });
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="w-1/4 text-center">
                      <div className="flex items-center justify-between">
                        <p className="text-black font-semibold w-full">{item.valor}</p>
                        {editMode[item.nome] && (
                          <input
                            type="number"
                            value={inputs[item.nome]?.valor || ''}
                            onChange={(e) => handleInputChange(item.nome, 'valor', e.target.value)}
                            className="w-24 p-1 m-1 rounded-md text-center"
                            placeholder="Novo valor"
                            onBlur={async () => {
                              if (inputs[item.nome]?.valor) {
                                try {
                                  await updateValor(item.nome, inputs[item.nome].valor);
                                  toggleEditMode(item.nome); 
                                } catch (error) {
                                  toast.error('Erro ao atualizar valor: ' + error.message, {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    theme: "light",
                                  });
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <div className="w-1/4 text-center">
                      <p className="text-black font-semibold">R${(item.valor * item.quantidade).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full flex justify-between px-3 py-5 mt-5 border-t border-gray-300">
              <div className="w-1/3 text-center">
                <p className="text-black text-lg font-semibold">Qtd Total de itens:</p>
                <p className="text-red-500 text-lg font-bold">{totalQuantidade}</p>
              </div>
              <div className="w-1/3 text-center">
                <p className="text-black text-lg font-semibold">Valor Total de Venda:</p>
                <p className="text-red-500 text-lg font-bold">R${totalValor.toFixed(2)}</p>
              </div>
              <div className="w-1/3 text-center">
                <p className="text-black text-lg font-semibold">Valor Total de Custo:</p>
                <p className="text-red-500 text-lg font-bold">R${totalValorCusto.toFixed(2)}</p>
              </div>
            </div>
            
            </div>
            
            <div className="bg-primary w-full max-w-4xl rounded-sm flex flex-col p-5 items-center justify-center">
              <h2 className="text-black font-bold mb-5">Estoque Atual - Aluguel</h2>
              <div className="w-full flex flex-col">
                <div className="w-full flex justify-between px-3">
                  <p className="text-black font-semibold w-1/6 text-center">Editar</p>
                  <p className="text-black font-semibold w-1/4 text-center">Item</p>
                  <p className="text-black font-semibold w-1/4 text-center">Tipo</p>
                  <p className="text-black font-semibold w-1/4 text-center">Valor Venda</p>
                </div>
                {estoque.filter(item => item.tipo === 'Aluguel').map((item, index) => (
                  <div key={index} className="w-full flex justify-between items-center px-3 py-2 border-t border-gray-300">
                    <div className="w-1/6 text-center">
                      <button 
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => toggleEditMode(item.nome)}
                      >
                        {editMode[item.nome] ? 'Cancelar' : 'Editar'}
                      </button>
                    </div>
                    <div className="w-1/4 text-center">
                      <p className="text-black font-semibold">{item.nome}</p>
                    </div>
                    <div className="w-1/4 text-center">
                      <p className="text-black font-semibold">{item.tipo}</p>
                    </div>
                    <div className="w-1/4 text-center">
                      <div className="flex items-center justify-between">
                        <p className="text-black font-semibold w-full">{item.valor}</p>
                        {editMode[item.nome] && (
                          <input
                            type="number"
                            value={inputs[item.nome]?.valor || ''}
                            onChange={(e) => handleInputChange(item.nome, 'valor', e.target.value)}
                            className="w-24 p-1 m-1 rounded-md text-center"
                            placeholder="Novo valor"
                            onBlur={async () => {
                              if (inputs[item.nome]?.valor) {
                                try {
                                  await updateValor(item.nome, inputs[item.nome].valor);
                                  toggleEditMode(item.nome); 
                                } catch (error) {
                                  toast.error('Erro ao atualizar valor: ' + error.message, {
                                    position: "top-right",
                                    autoClose: 3000,
                                    hideProgressBar: false,
                                    closeOnClick: true,
                                    pauseOnHover: true,
                                    draggable: true,
                                    theme: "light",
                                  });
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            

            <div className="w-full h-24 bg-third rounded-md flex justify-center md:justify-end items-center gap-3 px-2 mt-5">
              <button 
                className="bg-yellow-500 text-white p-2 rounded-sm"
                onClick={printEstoque}
              >
                Imprimir ESTOQUE ATUAL
              </button>
              {/*
              <button 
                className="bg-red-500 text-white p-2 rounded-sm"
                onClick={saveEstoqueToFile}
              >
                Salvar ESTOQUE EM ARQUIVO
              </button>
              */}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
