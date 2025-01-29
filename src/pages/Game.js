import React, { useState } from 'react';

export default function Game({ dadosPedido, onClose, onUpdate }) {
    const [jogadores, setJogadores] = useState(dadosPedido); // Inicializa com os dados do pedido

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
        onUpdate(updatedJogadores); // Chama a função de callback para atualizar os jogadores
    };

    return (
        <div className="modal">
            <button 
                onClick={onClose} 
                className="bg-gray-500 hover:bg-black text-white py-2 px-4 rounded-lg mb-4"
            >
                Fechar
            </button>
            <div className="flex flex-wrap gap-4">
                {jogadores.map((jogador, index) => (
                    <section key={index} className={`w-[300px] h-auto rounded-lg bg-white ${jogador.isClosed ? 'opacity-50 pointer-events-none' : ''}`}>
                        <header className="bg-primary w-full p-3 rounded-t-lg text-black font-normal">
                            <h3 className="text-lg font-semibold">{jogador.nome || 'Jogador'}</h3>
                        </header>
                        <div className="p-2">
                            <input
                                type="text"
                                className="text-center w-10 rounded-sm px-2 py-1"
                                placeholder="N°"
                                value={jogador.numero}
                                onChange={(e) => handleNumeroChange(index, e)}
                                disabled={jogador.isClosed}
                            />
                            <input
                                type="text"
                                className="text-center w-44 rounded-sm px-2 py-1"
                                placeholder="Cliente"
                                value={jogador.nome}
                                onChange={(e) => handleNomeChange(index, e)}
                                disabled={jogador.isClosed}
                            />
                            <div className="inline-flex">
                                <button
                                    className="bg-white hover:bg-green-600 text-black py-1 px-2 rounded-l"
                                    onClick={handleAddJogador}
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
                                <select
                                    className="w-full border border-slate-400 rounded px-2 p-1 text-center"
                                    value={jogador.selectedItem || ''}
                                    onChange={(e) => {
                                        const updatedJogadores = [...jogadores];
                                        updatedJogadores[index].selectedItem = e.target.value;
                                        setJogadores(updatedJogadores);
                                    }}
                                    disabled={jogador.isClosed}
                                >
                                    <option value="">Selecione o item</option>
                                    {/* Exemplo de itens, substitua pelo seu estoque */}
                                    <option value="Item 1">Item 1</option>
                                    <option value="Item 2">Item 2</option>
                                </select>
                                <button
                                    className="bg-black hover:bg-primary py-1 px-2 rounded text-white"
                                    onClick={() => handleAddItem(index)}
                                    disabled={jogador.isClosed}
                                >
                                    Adicionar Item
                                </button>
                            </div>
                            {jogador.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="p-2 flex flex-col justify-center items-center">
                                    <p>{item.nome} - {item.quantidade || 1}</p>
                                    <button
                                        className="bg-black hover:bg-red-500 py-1 px-2 rounded text-white"
                                        onClick={() => handleRemoveItem(index, itemIndex)}
                                        disabled={jogador.isClosed}
                                    >
                                        Remover Item
                                    </button>
                                </div>
                            ))}
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
}