import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';

export default function ResumoEdit() {
    const navigate = useNavigate();
    const location = useLocation();
    const [jogo, setJogo] = useState({});
    const [pagamentos, setPagamentos] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState([]);

    useEffect(() => {
        const dataFromGame = location.state || {};
        setJogo({ data: dataFromGame.dataJogo, hora: dataFromGame.horaJogo });
        setPagamentos(dataFromGame.pagamentos || []);
        setFormasPagamento(dataFromGame.formaPagamento || []);
        console.log(dataFromGame);
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

    const atualizarDadosFinanceiros = async () => {
        const totalArrecadado = formasPagamento.reduce((acc, jogador) => {
            return acc + jogador.formaPagamento.reduce((innerAcc, pagamento) => innerAcc + (parseFloat(pagamento.valor) || 0), 0);
        }, 0).toFixed(2);

        const dataFinanceira = {
            dataJogo: jogo.data,
            horaJogo: jogo.hora,
            totalJogadores: pagamentos.length,
            formasPagamento: {
                credito: formasPagamento.reduce((acc, jogador) => {
                    const pagamento = jogador.formaPagamento.find(p => p.metodo === 'credito');
                    return acc + (parseFloat(pagamento?.valor) || 0);
                }, 0),
                debito: formasPagamento.reduce((acc, jogador) => {
                    const pagamento = jogador.formaPagamento.find(p => p.metodo === 'debito');
                    return acc + (parseFloat(pagamento?.valor) || 0);
                }, 0),
                dinheiro: formasPagamento.reduce((acc, jogador) => {
                    const pagamento = jogador.formaPagamento.find(p => p.metodo === 'dinheiro');
                    return acc + (parseFloat(pagamento?.valor) || 0);
                }, 0),
                pix: formasPagamento.reduce((acc, jogador) => {
                    const pagamento = jogador.formaPagamento.find(p => p.metodo === 'pix');
                    return acc + (parseFloat(pagamento?.valor) || 0);
                }, 0),
                deposito: formasPagamento.reduce((acc, jogador) => {
                    const pagamento = jogador.formaPagamento.find(p => p.metodo === 'deposito');
                    return acc + (parseFloat(pagamento?.valor) || 0);
                }, 0),
            },
            totalArrecadado: parseFloat(totalArrecadado)
        };

        try {
            await axios.put('./.netlify/functions/api-financeiro', dataFinanceira);
            toast.success('Dados financeiros atualizados com sucesso!', {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });

            localStorage.removeItem('pagamentos');
            localStorage.removeItem('dataJogo');
            localStorage.removeItem('horaJogo');
            localStorage.removeItem('itensVendaAvul'); 

            setTimeout(() => {
                navigate('/estoque');
            }, 2000); 
        } catch (error) {
            console.error('Erro ao atualizar dados financeiros:', error);
            toast.error('Erro ao atualizar dados financeiros');
        }
    };

    return (
        <section id="resumo-partida" className="bg-black flex flex-col justify-center items-center pt-10 min-h-screen">
            <h1 className="text-white text-3xl font-semibold">Resumo da Partida</h1>
            <div className="w-1/2 h-auto pt-10">
                <div className="grid grid-flow-row md:grid-cols-2 gap-2">
                    <div className="bg-primary rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-2xl font-bold">Data Partida</h1>
                        <h2 id="datapartida" className="text-3xl font-semibold">
                            {jogo.data ? new Date(jogo.data).toLocaleDateString('pt-BR') : 'Carregando...'}
                        </h2>
                    </div>
                    <div className="bg-primary rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-2xl font-bold">Hora da partida</h1>
                        <h2 id="totalJogadores" className="text-3xl font-semibold">{jogo.hora}</h2>
                    </div>
                </div>
                <div className="bg-primary rounded-md w-full h-auto p-5 mt-3 gap-4 flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-bold">Formas de pagamento</h1>
                    <div className="w-full px-3">
                        {formasPagamento && formasPagamento.length > 0 ? (                            
                            formasPagamento.reduce((acc, jogador) => {
                                if (jogador.formaPagamento && jogador.formaPagamento.length > 0) {
                                    jogador.formaPagamento.forEach(pagamento => {
                                        if (!acc[pagamento.metodo]) {
                                            acc[pagamento.metodo] = 0;
                                        }
                                        acc[pagamento.metodo] += pagamento.valor;
                                    });
                                }
                                return acc;
                            }, {}),
                            Object.entries(formasPagamento.reduce((acc, jogador) => {
                                if (jogador.formaPagamento && jogador.formaPagamento.length > 0) {
                                    jogador.formaPagamento.forEach(pagamento => {
                                        if (!acc[pagamento.metodo]) {
                                            acc[pagamento.metodo] = 0;
                                        }
                                        acc[pagamento.metodo] += pagamento.valor;
                                    });
                                }
                                return acc;
                            }, {})).map(([metodo, valor]) => (
                                <div key={metodo} className="flex flex-row justify-around items-start">
                                    <p className="text-xl font-semibold">{metodo || 'Método Indefinido'}</p>
                                    <p id={metodo ? metodo.toLowerCase() : 'metodo-indefinido'}>
                                        R$ {valor.toFixed(2)}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <p>Nenhuma forma de pagamento disponível</p>
                        )}
                    </div>
                </div>
                <div className="bg-[#1D0C82] rounded-md w-full h-auto p-5 mt-3 flex flex-col justify-center items-center">
                    <h1 className="text-white text-2xl font-bold">Valor Total</h1>
                    <h2 id="valorPartida" className="text-primary text-3xl font-semibold">
                        R$ {formasPagamento.reduce((acc, jogador) => {
                            return acc + jogador.formaPagamento.reduce((innerAcc, pagamento) => innerAcc + (parseFloat(pagamento.valor) || 0), 0);
                        }, 0).toFixed(2)}
                    </h2>
                </div>
                <div className="grid grid-flow-row md:grid-cols-2 p-2 gap-2">
                    <button
                        onClick={imprimirResumo}
                        className="bg-primary hover:bg-green-700 duration-300 text-black hover:text-white font-semibold p-5 rounded-md"
                    >
                        <p>Imprimir Resumo</p>
                    </button>
                    <button onClick={atualizarDadosFinanceiros} className="bg-primary hover:bg-white duration-300 text-black hover:text-white font-semibold p-5 rounded-md">
                        Atualizar Dados Financeiros
                    </button>
                </div>
            </div>
        </section>
    );
}
