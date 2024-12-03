import { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "./Componentes/Navbar";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";

export default function Financeiro() {
  const [financeiroData, setFinanceiroData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    buscarDadosFinanceiros();
  }, []);

  const buscarDadosFinanceiros = () => {
    setLoading(true);
    axios.get(`./.netlify/functions/api-financeiro`)
      .then((response) => {
        setFinanceiroData(response.data);
        toast.success('Dados financeiros carregados com sucesso!', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      })
      .catch((error) => {
        toast.error('Erro ao buscar dados financeiros. Tente novamente.', {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const imprimirRelatorio = () => {
    if (financeiroData.length === 0) {
      toast.error('Não há dados para imprimir', {
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
    
    toast.success('Preparando impressão...', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "light",
    });
    
    window.print();
  };

  return (
    <section className="bg-black p-4 w-full h-screen flex flex-col items-center overflow-auto"> 
      <ToastContainer />
      <NavBar />
      <div className="gap-2 flex flex-col lg:flex-row justify-center items-center w-auto">
        <h1 className="text-white text-3xl text-center m-5">Departamento Financeiro</h1>

        <button 
          onClick={imprimirRelatorio} 
          className="bg-white hover:bg-secondary duration-300 w-[300px] p-2 rounded-sm"
        >
          <span className="text-black">Imprimir Relatório</span>
        </button>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center p-10">
          <ClipLoader
            color="#ffffff"
            loading={loading}
            size={50}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
          <p className="text-white mt-4">Carregando dados financeiros...</p>
        </div>
      ) : (
        <div className="overflow-auto w-full max-h-[80vh]">
          <table className="w-full flex flex-col mt-5">
            <thead className="bg-primary text-black">
              <tr className="flex justify-around">
                <th className="w-full flex justify-start">Data do Jogo</th>
                <th className="w-full flex justify-start">Total de Pedidos</th> 
                <th className="w-full flex justify-start">Crédito</th>
                <th className="w-full flex justify-start">Débito</th>
                <th className="w-full flex justify-start">Dinheiro</th>
                <th className="w-full flex justify-start">Pix</th>
                <th className="w-full flex justify-start">Avulso</th>
                <th className="w-full flex justify-start">Total Arrecadado</th>
              </tr>
            </thead>
            <tbody>
              {financeiroData.map((item, index) => (
                <tr key={index} className="p-1 text-white flex justify-around hover:bg-green-700 duration-300 border border-gray-500">
                  <td className="w-full">
                    {item && item.data_jogo 
                      ? new Date(new Date(item.data_jogo).getTime() + (24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR') 
                      : ''}
                  </td>
                  <td className="w-full">{item && item.total_jogadores}</td>
                  <td className="w-full">R${item && item.credito}</td>
                  <td className="w-full">R${item && item.debito}</td>
                  <td className="w-full">R${item && item.dinheiro}</td>
                  <td className="w-full">R${item && item.pix}</td>
                  <td className="w-full">R${item && item.avulso}</td>
                  <td className="w-full">R${item && item.total_arrecadado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
