import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import Datepicker from "react-tailwindcss-datepicker";
import NavBar from "./Componentes/Navbar";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function Financeiro() {
  const [value, setValue] = useState({
    startDate: null,
    endDate: null,
  });
  const [financeiroData, setFinanceiroData] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setValue({ startDate: today, endDate: today });
    buscarDadosFinanceiros(today);
  }, []);

  const buscarDadosFinanceiros = async (data) => {
    try {
      const { data: financeiro, error } = await supabase
        .from('vw_financeiro')
        .select('*')
        .eq('data_jogo::date', data)
        .single();

      if (error) throw error;

      setFinanceiroData([{
        ...financeiro,
        data_jogo: financeiro.data_jogo,
        credito: financeiro.credito?.toFixed(2) || '0.00',
        debito: financeiro.debito?.toFixed(2) || '0.00',
        dinheiro: financeiro.dinheiro?.toFixed(2) || '0.00',
        pix: financeiro.pix?.toFixed(2) || '0.00',
        avulso: financeiro.avulso?.toFixed(2) || '0.00',
        total_arrecadado: financeiro.total_arrecadado?.toFixed(2) || '0.00'
      }]);
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
      toast.error("Erro ao buscar dados financeiros");
    }
  };

  const handleDateChange = (newValue) => {
    setValue(newValue);
    
    if (newValue.startDate) {
      const dataFormatada = new Date(newValue.startDate).toISOString().split('T')[0]; 
      buscarDadosFinanceiros(dataFormatada);
    }
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <section className="bg-black p-4 w-full h-screen flex flex-col items-center overflow-auto"> 
      <ToastContainer />
      <NavBar />
      <div className="gap-2 flex flex-col lg:flex-row justify-center items-center w-auto">
        <h1 className="text-white text-3xl text-center m-5">Departamento Financeiro</h1>

        <div className="w-auto">
          <Datepicker
            displayFormat="DD/MM/YYYY"
            placeholder="Selecione a data"
            separator="a"
            value={value}
            onChange={handleDateChange}
            primaryColor={"yellow"}
            useRange={false}
            asSingle={true}
            showFooter={true}
            showShortcuts={true}
            configs={{
              shortcuts: {
                today: "Hoje",
                yesterday: "Ontem",
                currentMonth: "Mês Atual",
                pastMonth: "Mês Passado",
              },
              footer: {
                cancel: "Cancelar",
                apply: "Aplicar",
              },
            }}
            inputClassName="w-[300px] p-2 bg-black rounded-md placeholder:text-white text-center m-3 border border-gray-400"
          />
        </div>

        <button onClick={imprimirRelatorio} className="bg-white hover:bg-secondary duration-300 w-[300px] p-2 rounded-sm">
          <span className="text-black">Imprimir Relatório</span>
        </button>
      </div>
      <div className="overflow-auto w-full max-h-[80vh]"> 
        <table className="w-full flex flex-col mt-5">
          <thead className="bg-primary text-black">
            <tr className="flex justify-around">
              <th className="w-full flex justify-start">Data do Jogo</th>
              <th className="w-full flex justify-start">Total de Jogadores</th>
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
                <td className="w-full">{new Date(item.data_jogo).toLocaleDateString('pt-BR')}</td>
                <td className="w-full">{item.total_jogadores}</td>
                <td className="w-full">R${item.credito}</td>
                <td className="w-full">R${item.debito}</td>
                <td className="w-full">R${item.dinheiro}</td>
                <td className="w-full">R${item.pix}</td>
                <td className="w-full">R${item.avulso}</td>
                <td className="w-full">R${item.total_arrecadado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
