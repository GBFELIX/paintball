import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
    const [gameData, setGameData] = useState({ dataJogo: '', horaJogo: '' });

    return (
        <GameContext.Provider value={{ gameData, setGameData }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGameContext = () => {
    return useContext(GameContext);
}; 