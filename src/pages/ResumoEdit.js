import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

export default function ResumoEdit() {
    const navigate = useNavigate();
    const location = useLocation();
    const [jogo, setJogo] = useState({});
    const [pagamentos, setPagamentos] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState({
        credito: 0,
        debito: 0,
        dinheiro: 0,
        avulso: 0,
        pix: 0,
        deposito: 0,
    });
    const [totalAvulso, setTotalAvulso] = useState(0);
    const [despesas, setDespesas] = useState([]);

    useEffect(() => {
        const storedData = localStorage.getItem('dataJogo');
        const storedHora = localStorage.getItem('horaJogo');
        const storedTotalAvulso = localStorage.getItem('totalAvulso');  
        
        if (storedTotalAvulso) {
            setTotalAvulso(parseFloat(storedTotalAvulso));
        }

        if (storedData) {
            setJogo({ data: storedData, hora: storedHora });
        }

        const pagamentosArmazenados = JSON.parse(localStorage.getItem('pagamentos')) || [];
        setPagamentos(pagamentosArmazenados);

        const totais = pagamentosArmazenados.reduce((acc, pagamento) => {
            const valor = parseFloat(pagamento.valorTotal);

            acc[pagamento.formaPagamento] = (acc[pagamento.formaPagamento] || 0) + valor;
            return acc;
        }, {
            credito: 0,
            debito: 0,
            dinheiro: 0,
            avulso: 0,
            pix: 0, 
            deposito: 0,
        });

        setFormasPagamento(totais);

        const despesasArmazenadas = JSON.parse(localStorage.getItem('despesas')) || [];
        setDespesas(despesasArmazenadas);

        const dataFromGame = location.state || {};
        console.log(dataFromGame);

        setJogo({
            data: dataFromGame.dataJogo,
            hora: dataFromGame.horaJogo,
        });

        setPagamentos(dataFromGame.formaPagamento || []);
        const totaisFromGame = dataFromGame.formaPagamento.reduce((acc, pagamento) => {
            acc[pagamento.metodo] = (acc[pagamento.metodo] || 0) + pagamento.valor;
            return acc;
        }, {
            credito: 0,
            debito: 0,
            dinheiro: 0,
            avulso: 0,
            pix: 0,
            deposito: 0,
        });
        setFormasPagamento(totaisFromGame);
    }, [location.state]);

    const imprimirResumo = () => {
        const conteudo = document.getElementById('resumo-partida').innerHTML;
        const janelaImpressao = window.open('', '', 'height=600,width=800');
        janelaImpressao.document.write('<html><head><title>Resumo da Partida</title>');
        janelaImpressao.document.write('<style>');
        janelaImpressao.document.write(`
            body { font-family: Arial, sans-serif; }
            .container { display: flex; justify-content: center; }
            .section { margin: 10px; padding: 10px; }
            h1, h2, p { text-align: center; }
            .summary-box { border: 1px solid black; padding: 20px; margin-bottom: 20px; }
        `);
        janelaImpressao.document.write('</style></head><body>');
        janelaImpressao.document.write(conteudo);
        janelaImpressao.document.write('</body></html>');
        janelaImpressao.document.close();
        janelaImpressao.focus();
        janelaImpressao.print();
        janelaImpressao.close();
    };

    const fecharPartida = () => {
        const totalArrecadado = Object.values(formasPagamento).reduce((acc, val) => acc + val, 0) + totalAvulso;
        const totalDespesas = despesas.reduce((acc, despesa) => acc + parseFloat(despesa.valorTotal), 0);
        const valortot = totalArrecadado - totalDespesas;
        const dataFinanceira = {
            dataJogo: jogo.data,
            horaJogo: jogo.hora,
            totalJogadores: pagamentos.length,
            formasPagamento,
            totalAvulso,
            totalArrecadado,
            totalDespesas,
            valortot
        };
        axios.put('./.netlify/functions/api-financeiro', dataFinanceira)
        .then(() => {
            toast.success('Partida fechada com sucesso!', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        })
        .catch(error => {
            console.error('Erro ao enviar dados financeiros:', error);
            toast.error('Erro ao finalizar partida', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        });
        
        localStorage.removeItem('pagamentos');
        localStorage.removeItem('totalAvulso');
        localStorage.removeItem('dataJogo');
        localStorage.removeItem('horaJogo');
        localStorage.removeItem('itensVendaAvul'); 
        localStorage.removeItem('despesas'); 
        
        navigate('/estoque');
    };

    return (
        <section id="resumo-partida" className="bg-black flex flex-col justify-center items-center pt-10 min-h-screen">
            <h1 className="text-white text-3xl font-semibold">Resumo da Partida</h1>
            <div className="w-1/2 h-auto pt-10">
                <div className="grid grid-flow-row md:grid-cols-2 gap-2">
                    <div className="bg-primary rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-2xl font-bold">Data Partida</h1>
                        <h2 id="datapartida" className="text-3xl font-semibold">{jogo.data ? new Date(jogo.data).toLocaleDateString('pt-BR') : 'Carregando...'}</h2>
                    </div>
                    <div className="bg-primary rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-2xl font-bold">Hora do Jogo</h1>
                        <h2 id="horaJogo" className="text-3xl font-semibold">{jogo.hora || 'Carregando...'}</h2>
                    </div>
                </div>
                <div className="bg-primary rounded-md w-full h-auto p-5 mt-3 gap-4 flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-bold">Formas de pagamento</h1>
                    <div className="w-full px-3">
                        {pagamentos.map((pagamento, index) => (
                            <div key={index} className="flex flex-row justify-around items-start">
                                <p className="text-xl font-semibold">{pagamento.metodo}</p>
                                <p>R$ {(pagamento.valor && !isNaN(pagamento.valor)) ? pagamento.valor.toFixed(2) : '0.00'}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-flow-row md:grid-cols-2 gap-2 mt-3">
                    <div className="bg-[#1D0C82] rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-white text-2xl font-bold">Valor Total</h1>
                        <h2 id="valorPartida" className="text-primary text-3xl font-semibold">R${Object.values(formasPagamento).reduce((acc, val) => acc + val, 0).toFixed(2)}</h2>
                    </div>
                    <div className="bg-[#1D0C82] rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-white text-2xl font-bold">Total Arrecadado</h1>
                        <h2 id="valortot" className="text-primary text-3xl font-semibold">
                            R${(Object.values(formasPagamento).reduce((acc, val) => acc + val, 0) - despesas.reduce((acc, despesa) => acc + parseFloat(despesa.valorTotal), 0)).toFixed(2)}
                        </h2>
                    </div>
                </div>
                <div className="grid grid-flow-row md:grid-cols-2 p-2 gap-2">
                    <button
                        onClick={imprimirResumo}
                        className="bg-primary hover:bg-green-700 duration-300 text-black hover:text-white font-semibold p-5 rounded-md"
                    >
                        <p>Imprimir Resumo</p>
                    </button>
                    <button 
                        onClick={fecharPartida} 
                        className="bg-white hover:bg-red-700 duration-300 text-black hover:text-white font-semibold p-5 rounded-md">
                        <p>Fechar Partida</p>
                    </button>
                </div>
            </div>
        </section>
    );
}
