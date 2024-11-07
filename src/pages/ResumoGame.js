import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default function ResumoGame() {
    const navigate = useNavigate();
    const [jogo, setJogo] = useState({});
    const [pagamentos, setPagamentos] = useState([]);
    const [formasPagamento, setFormasPagamento] = useState({
        credito: 0,
        debito: 0,
        dinheiro: 0,
        avulso: 0,
        pix: 0,
    });
    const [totalAvulso, setTotalAvulso] = useState(0);

    const normalizarFormaPagamento = (forma) => {
        if (typeof forma !== 'string') return '';
    
        const mapaFormas = {
            credito: 'credito',
            debito: 'debito',
            dinheiro: 'dinheiro',
            dinehrio: 'dinheiro',
            pix: 'pix',
            avulso: 'avulso',
        };
        return mapaFormas[forma.toLowerCase()] || forma.toLowerCase();
    };

    const calcularTotais = useCallback((pagamentos) => {
        return pagamentos.reduce((acc, pagamento) => {
            const forma = normalizarFormaPagamento(pagamento.formaPagamento);
            const valor = parseFloat(pagamento.valorTotal);

            if (forma in acc) {
                acc[forma] += valor;
            } else {
                acc[forma] = valor;
            }
            return acc;
        }, {
            credito: 0,
            debito: 0,
            dinheiro: 0,
            avulso: 0,
            pix: 0,
        });
    }, []);

    const carregarDadosJogo = useCallback(() => {
        const storedData = localStorage.getItem('dataJogo');
        const storedHora = localStorage.getItem('horaJogo');
        const storedTotalAvulso = localStorage.getItem('totalAvulso');  
        const pagamentosArmazenados = JSON.parse(localStorage.getItem('pagamentos')) || [];
        
        if (storedTotalAvulso) {
            setTotalAvulso(parseFloat(storedTotalAvulso));
        }

        if (storedData) {
            setJogo({ data: storedData, hora: storedHora });
        }

        setPagamentos(pagamentosArmazenados);

        const totais = calcularTotais(pagamentosArmazenados);
        setFormasPagamento(totais);
    }, [calcularTotais]);

    useEffect(() => {
        carregarDadosJogo();
    }, [carregarDadosJogo]);

    const fecharPartida = async () => {
        try {
            const totalArrecadado = Object.values(formasPagamento).reduce((acc, val) => acc + val, 0) + totalAvulso;
            
            const { error } = await supabase
                .from('financeiro')
                .insert({
                    data_jogo: jogo.data,
                    total_jogadores: pagamentos.length,
                    credito: formasPagamento.credito,
                    debito: formasPagamento.debito,
                    dinheiro: formasPagamento.dinheiro,
                    pix: formasPagamento.pix,
                    avulso: totalAvulso,
                    total_arrecadado: totalArrecadado,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Partida fechada com sucesso!');

            // Limpar localStorage
            localStorage.removeItem('pagamentos');
            localStorage.removeItem('totalAvulso');
            localStorage.removeItem('dataJogo');
            localStorage.removeItem('horaJogo');
            
            setTimeout(() => {
                navigate('/estoque');
            }, 2000);

        } catch (error) {
            console.error('Erro ao fechar partida:', error);
            toast.error('Erro ao fechar partida');
        }
    };

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

    return (
        <section id="resumo-partida" className="bg-black flex flex-col justify-center items-center pt-10 min-h-screen">
            <h1 className="text-white text-3xl font-semibold">Resumo da Partida</h1>
            <div className="w-1/2 h-auto pt-10">
                <div className="grid grid-flow-row md:grid-cols-2 gap-2">
                    <div className="bg-primary rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-2xl font-bold">Data Partida</h1>
                        <h2 id="datapartida" className="text-3xl font-semibold">{jogo.data || 'Carregando...'}</h2>
                    </div>
                    <div className="bg-primary rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-2xl font-bold">Total Jogadores</h1>
                        <h2 id="totalJogadores" className="text-3xl font-semibold">{pagamentos.length}</h2>
                    </div>
                </div>
                <div className="bg-primary rounded-md w-full h-auto p-5 mt-3 gap-4 flex flex-col justify-center items-center">
                    <h1 className="text-2xl font-bold">Formas de pagamento</h1>
                    <div className="w-full px-3">
                        <div className="flex flex-row justify-around items-start">
                            <p className="text-xl font-semibold">Crédito</p>
                            <p id="credito">R${formasPagamento.credito.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-row justify-around items-start">
                            <p className="text-xl font-semibold">Debito</p>
                            <p id="debito">R${formasPagamento.debito.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-row justify-around items-start">
                            <p className="text-xl font-semibold">Dinheiro</p>
                            <p id="dinheiro">R${formasPagamento.dinheiro.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-row justify-around items-start">
                            <p className="text-xl font-semibold">Pix</p>
                            <p id="pix">R${formasPagamento.pix.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-flow-row md:grid-cols-2 gap-2 mt-3">
                    <div className="bg-[#1D0C82] rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-white text-2xl font-bold">Avulso</h1>
                        <h2 id="avulsoTotal" className="text-primary text-3xl font-semibold">R${totalAvulso.toFixed(2)}</h2>
                    </div>
                    <div className="bg-[#1D0C82] rounded-md w-full h-30 flex flex-col justify-center items-center py-14">
                        <h1 className="text-white text-2xl font-bold">Valor da Partida</h1>
                        <h2 id="valorPartida" className="text-primary text-3xl font-semibold">
                            R${Object.values(formasPagamento).reduce((acc, val) => acc + val, 0).toFixed(2)}
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
