import { useEffect, useState } from "react";
import axios from "axios";
import NavBar from "./Componentes/Navbar";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ClipLoader } from "react-spinners";
import Datepicker from "react-tailwindcss-datepicker";
import Game from "./Game";
import { BrowserRouter as Router, Route, Routes, useNavigate, Link } from 'react-router-dom';

export default function Financeiro() {
    const [value, setValue] = useState({
        startDate: null,
        endDate: null,
    });
    const [financeiroData, setFinanceiroData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [jogosFiltrados, setJogosFiltrados] = useState([]);
    const [jogos, setJogos] = useState([]);
    const [loadingEquipe, setLoadingEquipe] = useState(false);
    const [dadosPedido, setDadosPedido] = useState(null);
    const [showStatusGamer, setShowStatusGamer] = useState(false);
    const navigate = useNavigate();
    const [totalArrecadado, setTotalArrecadado] = useState(0);
    const [totalDespesas, setTotalDespesas] = useState(0);

    useEffect(() => {
        const today = new Date();
        today.setDate(today.getDate() - 1);
        const formattedDate = today.toISOString().split("T")[0];
        setValue({ startDate: formattedDate, endDate: formattedDate });

    }, []);

    const buscarDadosFinanceiros = (startDate, endDate) => {
        setLoading(true);

        if (!startDate || !endDate) {
            toast.error('Datas inválidas. Por favor, selecione datas válidas.', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            setLoading(false);
            return;
        }

        const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
        const formattedEndDate = new Date(endDate).toISOString().split("T")[0];

        axios.get(`./.netlify/functions/api-financeiro?startDate=${formattedStartDate}&endDate=${formattedEndDate}`)
            .then((response) => {
                const data = response.data;
                setFinanceiroData(data);

                // Cálculo dos totais
                const totalArrecadado = data.reduce((acc, item) => acc + (item.total_arrecadado || 0), 0);
                const totalDespesas = data.reduce((acc, item) => acc + (item.despesas || 0), 0);

                // Atualiza os estados dos totais
                setTotalArrecadado(totalArrecadado);
                setTotalDespesas(totalDespesas);

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

    const handleDateChange = (newValue) => {
        setValue(newValue);
    };

    const buscarDados = () => {
        if (value.startDate && value.endDate) {
            buscarDadosFinanceiros(value.startDate, value.endDate).then(() => {
                // Após buscar os dados, calcule os totais
                const totalArrecadado = (financeiroData || []).reduce((acc, item) => acc + (item.total_arrecadado || 0), 0);
                const totalDespesas = (financeiroData || []).reduce((acc, item) => acc + (item.despesas || 0), 0);

                // Atualiza os estados dos totais
                setTotalArrecadado(totalArrecadado);
                setTotalDespesas(totalDespesas);
            });
        } else {
            toast.error('Por favor, selecione uma data válida', {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
        }
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
    const filtrarJogos = () => {
        if (jogos.length === 0) return;

        const agora = new Date();
        const primeiroDiaDoMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const primeiroDiaDoMesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
        const primeiroDiaDoProximoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

        const jogosFiltrados = jogos.filter(jogo => {
            const dataJogo = new Date(jogo.data);
            return (dataJogo >= primeiroDiaDoMesAtual && dataJogo < primeiroDiaDoProximoMes) ||
                (dataJogo >= primeiroDiaDoMesPassado && dataJogo < agora);
        });

        setJogosFiltrados(jogosFiltrados);
    };

    const handleMostrarJogo = (dataJogo, horaJogo) => {
        navigate('/game', { state: { dataJogo, horaJogo } });
    };

    useEffect(() => {
        // Filtra os dados com base nas datas
        const filteredData = financeiroData.filter(item => {
            const itemDate = new Date(item.data_jogo); // Supondo que você tenha uma propriedade data_jogo
            return itemDate >= new Date(value.startDate) && itemDate <= new Date(value.endDate);
        });

        // Calcula os totais
        const arrecadado = filteredData.reduce((acc, item) => acc + (item.total_arrecadado || 0), 0);
        const despesas = filteredData.reduce((acc, item) => acc + (item.despesas || 0), 0);

        setTotalArrecadado(arrecadado);
        setTotalDespesas(despesas);
    }, [financeiroData, value.startDate, value.endDate]); // Dependências para recalcular quando as datas mudarem

    return ( <
        section className = "bg-black p-4 w-full h-screen flex flex-col items-center overflow-auto" >
        <
        ToastContainer / >
        <
        NavBar / >
        <
        div className = "gap-2 flex flex-col lg:flex-row justify-center items-center w-auto" >
        <
        h1 className = "text-white text-3xl text-center m-5" > Departamento Financeiro < /h1> <
        div className = "w-auto" >
        <
        Datepicker showShortcuts = { true }
        configs = {
            {
                shortcuts: {
                    yesterday: "Ontem",
                    customToday: {
                        period: {
                            start: new Date(),
                            end: new Date()
                        }
                    },
                    last7Days: {
                        text: "Ultimos 7 dias",
                        period: {
                            start: new Date(new Date().setDate(new Date().getDate() - 7)),
                            end: new Date(new Date().setDate(new Date().getDate() - 1))
                        }
                    },
                    last15Days: {
                        text: "Ultimos 15 dias",
                        period: {
                            start: new Date(new Date().setDate(new Date().getDate() - 15)),
                            end: new Date(new Date().setDate(new Date().getDate() - 1))
                        }
                    },
                    last30Days: {
                        text: "Ultimos 30 dias",
                        period: {
                            start: new Date(new Date().setDate(new Date().getDate() - 30)),
                            end: new Date(new Date().setDate(new Date().getDate() - 1))
                        }
                    },
                },
                footer: {
                    cancel: "CText",
                    apply: "AText"
                }
            }
        }
        value = { value }
        onChange = { handleDateChange }
        />  <
        /div> <
        button onClick = { buscarDados }
        className = "bg-blue-500 hover:bg-blue-700 duration-300 w-[100px] p-2 rounded-sm" >
        <
        span className = "text-white" > OK < /span> <
        /button> <
        button onClick = { imprimirRelatorio }
        className = "bg-white hover:bg-secondary duration-300 w-[300px] p-2 rounded-sm" >
        <
        span className = "text-black" > Imprimir Relatório < /span> <
        /button> <
        /div>

        {
            loading ? ( <
                div className = "flex flex-col items-center justify-center p-10" >
                <
                ClipLoader color = "#ffffff"
                loading = { loading }
                size = { 50 }
                aria - label = "Loading Spinner"
                data - testid = "loader" /
                >
                <
                p className = "text-white mt-4" > Carregando dados financeiros... < /p> <
                /div>
            ) : ( <
                div className = "overflow-auto w-full max-h-[80vh]" >
                <
                table className = "w-full flex flex-col mt-5" >
                <
                thead className = "bg-primary text-black" >
                <
                tr className = "flex justify-around" >
                <
                th className = "w-full flex justify-start" > Data do Jogo < /th> <
                    th className = "w-full flex justify-start" > Hora do Jogo < /th> <
                        th className = "w-full flex justify-start" > Total de Pedidos < /th>  <
                        th className = "w-full flex justify-start" > Crédito < /th> <
                        th className = "w-full flex justify-start" > Débito < /th> <
                        th className = "w-full flex justify-start" > Dinheiro < /th> <
                        th className = "w-full flex justify-start" > Pix < /th> <
                        th className = "w-full flex justify-start" > Depósito < /th> <
                        th className = "w-full flex justify-start" > Despesas < /th> <
                        th className = "w-full flex justify-start" > Total < /th> <
                        th className = "w-full flex justify-start" > Total Arrecadado < /th> <
                        th className = "w-full flex justify-start" > Visualizar < /th> <
                        /tr> <
                        /thead> <
                        tbody > {
                            financeiroData
                            .sort((a, b) => new Date(b.data_jogo) - new Date(a.data_jogo))
                            .map((item, index) => ( <
                                tr key = { index }
                                className = "p-1 text-white flex justify-around hover:bg-green-700 duration-300 border border-gray-500" >
                                <
                                td className = "w-full" > {
                                    item && item.data_jogo ?
                                    new Date(item.data_jogo).toLocaleDateString('pt-BR') :
                                        ''
                                } <
                                /td> <
                                td className = "w-full" > { item && item.hora_jogo } < /td> <
                                td className = "w-full" > { item && item.total_jogadores } < /td> <
                                td className = "w-full" > R$ { item && item.credito } < /td> <
                                td className = "w-full" > R$ { item && item.debito } < /td> <
                                td className = "w-full" > R$ { item && item.dinheiro } < /td> <
                                td className = "w-full" > R$ { item && item.pix } < /td> <
                                td className = "w-full" > R$ { item && item.deposito } < /td> <
                                td className = "w-full" > R$ { item && item.despesas } < /td> <
                                td className = "w-full" > R$ { item && item.total_arrecadado } < /td> <
                                td className = "w-full" > R$ { item && item.valortot } < /td> <
                                td className = "w-full flex gap-2" >
                                <
                                button className = "rounded-md bg-primary p-2 text-black hover:bg-black duration-300 hover:text-white flex items-center justify-center min-w-[120px]"
                                onClick = {
                                    () => handleMostrarJogo(item.data_jogo, item.hora_jogo) }
                                disabled = { loadingEquipe } >
                                {
                                    loadingEquipe ? ( <
                                        ClipLoader color = "#000000"
                                        loading = { loadingEquipe }
                                        size = { 20 }
                                        aria - label = "Loading Spinner"
                                        data - testid = "loader" /
                                        >
                                    ) : (
                                        'Mostrar Jogo'
                                    )
                                } <
                                /button> <
                                /td> <
                                /tr>
                            ))
                        } <
                        /tbody> <
                        /table> <
                        div className = "w-full flex justify-between px-3 py-5 mt-5 border-t border-gray-300" >
                        <
                        div className = "w-1/3 text-center" >
                        <
                        p className = "text-primary text-lg font-semibold" > Valor Total Arrecadado: < /p> <
                        p className = "text-red-500 text-lg font-bold" > R$ {
                            (typeof totalArrecadado === 'number' ? totalArrecadado : 0).toFixed(2) } < /p> <
                        /div> <
                        div className = "w-1/3 text-center" >
                        <
                        p className = "text-primary text-lg font-semibold" > Valor Total de Despesas: < /p> <
                        p className = "text-red-500 text-lg font-bold" > R$ {
                            (typeof totalDespesas === 'number' ? totalDespesas : 0).toFixed(2) } < /p> <
                        /div> <
                        div className = "w-1/3 text-center" >
                        <
                        p className = "text-primary text-lg font-semibold" > Total Geral: < /p> <
                        p className = "text-red-500 text-lg font-bold" > R$ {
                            ((typeof totalArrecadado === 'number' ? totalArrecadado : 0) - (typeof totalDespesas === 'number' ? totalDespesas : 0)).toFixed(2) } < /p> <
                        /div> <
                        /div> <
                        /div>
            )
        }

        { /* Renderizar o componente StatusGamer se showStatusGamer for true */ } {
            showStatusGamer && dadosPedido && ( <
                Game dadosPedido = { dadosPedido }
                onClose = {
                    () => setShowStatusGamer(false) }
                />
            )
        } <
        /section>
    );
}