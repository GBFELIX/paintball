import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useGameContext } from '../context/GameContext';
import { useLocation } from 'react-router-dom';

const Game = () => {

    const location = useLocation();
    const { dataJogo, horaJogo } = location.state || {}; // Recebe os dados passados
    
    const [jogadores, setJogadores] = useState([]); // Estado para armazenar os jogadores

    useEffect(() => {
        // Função para buscar os dados dos jogadores
        const fetchJogadores = async () => {
            try {
                const response = await axios.get(`./.netlify/functions/api-pedidos?data=${dataJogo}&hora=${horaJogo}`);
                setJogadores(response.data.jogadores || []); // Certifique-se de que é um array
                console.log(response.data);
            } catch (error) {
                console.error('Erro ao buscar jogadores:', error);
            }
        };

        if (dataJogo && horaJogo) {
            fetchJogadores();
        }
    }, [dataJogo, horaJogo]);

    const handleAddJogador = () => {
        const newNumero = (jogadores.length + 1).toString();
        setJogadores([...jogadores, {
            nome: '',
            numero: newNumero,
            items: [],
            selectedItem: '',
            isClosed: false
        }]);
    };

    const handleRemoveJogador = (index) => {
        const updatedJogadores = jogadores.filter((_, i) => i !== index);
        setJogadores(updatedJogadores);
    };

    const handleNomeChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].nome = event.target.value;
        setJogadores(updatedJogadores);
    };

    const handleNumeroChange = (index, event) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].numero = event.target.value;
        setJogadores(updatedJogadores);
    };

    const handleAddItem = (index) => {
        const updatedJogadores = [...jogadores];
        const selectedItem = { nome: updatedJogadores[index].selectedItem, valor: 10 }; // Exemplo de valor
        updatedJogadores[index].items.push({ ...selectedItem, quantidade: 1 });
        updatedJogadores[index].selectedItem = '';
        setJogadores(updatedJogadores);
    };

    const handleRemoveItem = (jogadorIndex, itemIndex) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[jogadorIndex].items.splice(itemIndex, 1);
        setJogadores(updatedJogadores);
    };

    const handleClosePedido = (index) => {
        const updatedJogadores = [...jogadores];
        updatedJogadores[index].isClosed = !updatedJogadores[index].isClosed;
        setJogadores(updatedJogadores);
    };

    return (
        <div>
            <div className="flex flex-wrap gap-4">
                {jogadores.map((jogador, index) => (
                    <section key={index} className={`w-[300px] h-auto rounded-lg bg-white ${jogador.isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
                        <header className="bg-primary w-full p-3 rounded-t-lg text-black font-normal">
                            <h3 className="text-lg font-semibold">{jogador.nome_jogador || 'Jogador'}</h3>
                        </header>
                        <div className="p-2">
                            <p><strong>Forma de Pagamento:</strong> {jogador.forma_pagamento || 'N/A'}</p>
                            <p><strong>Valor Total:</strong> {jogador.valor_total || '0'}</p>
                            <div className="inline-flex">
                                <button
                                    className="bg-white hover:bg-green-600 text-black py-1 px-2 rounded-l"
                                    onClick={() => handleAddJogador()}
                                >
                                    +
                                </button>
                                <button
                                    className="bg-black hover:bg-primary py-1 px-2 rounded-r text-white"
                                    onClick={() => handleRemoveJogador(index)}
                                >
                                    -
                                </button>
                            </div>
                        </div>
                        <div className="w-full h-auto p-1">
                            <div className="p-2 flex flex-col justify-center items-center gap-2">
                                <h4>Itens:</h4>
                                {jogador.items ? JSON.parse(jogador.items).map((item, itemIndex) => (
                                    <div key={itemIndex} className="p-2 flex flex-col justify-center items-center">
                                        <p>{item} - 1</p> {/* Ajuste conforme necessário */}
                                        <button
                                            className="bg-black hover:bg-red-500 py-1 px-2 rounded text-white"
                                            onClick={() => handleRemoveItem(index, itemIndex)}
                                            disabled={jogador.isClosed}
                                        >
                                            Remover Item
                                        </button>
                                    </div>
                                )) : <p>Nenhum item disponível</p>}
                            </div>
                        </div>
                        <div className="flex justify-center items-center mt-2">
                            <button
                                className="w-[180px] bg-gray-300 hover:bg-secondary text-gray-800 font-bold py-2 px-4 rounded-l"
                                onClick={() => handleClosePedido(index)}
                            >
                                {jogador.isClosed ? 'Fechado' : 'Fechar Pedido'}
                            </button>
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default Game;