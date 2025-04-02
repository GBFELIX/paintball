const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

exports.handler = async(event, context) => {
    if (event.httpMethod === 'GET') {
        return handleGet(event);
    } else if (event.httpMethod === 'POST') {
        return handlePost(event);
    } else if (event.httpMethod === 'PUT') {
        return handleUpdateItem(event);
    } else if (event.httpMethod === 'DELETE') {
        return handleDeleteItem(event);
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método não permitido' })
    };
};

async function handleGet(event) {
    try {
        const params = new URLSearchParams(event.queryStringParameters);
        const data = params.get('data');
        const hora = params.get('hora');

        const query = 'SELECT * FROM pedidos WHERE DATE(data_pedido) = ? AND hora_pedido = ?';
        const [results] = await db.promise().query(query, [data, hora]);

        return {
            statusCode: 200,
            body: JSON.stringify(results)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao buscar pedidos' })
        };
    }
}

async function handlePost(event) {
    try {
        const { nomeJogador, items, formaPagamento, valorTotal, dataPedido, horaPedido } = JSON.parse(event.body);


        // Tenta converter os itens para JSON
        let itemsString;
        let formaPagamentoString;
        try {
            itemsString = JSON.stringify(items);
            formaPagamentoString = JSON.stringify(formaPagamento); // Converte o array de formas de pagamento para JSON
        } catch (error) {
            console.error('Erro ao converter items ou forma de pagamento para JSON:', error);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Dados de itens ou forma de pagamento inválidos' })
            };
        }

        // Inserir pedido no banco de dados
        const queryPedido = 'INSERT INTO pedidos (nome_jogador, items, forma_pagamento, valor_total, data_pedido, hora_pedido) VALUES (?, ?, ?, ?, ?, ?)';
        const [resultPedido] = await db.promise().query(queryPedido, [nomeJogador, itemsString, formaPagamentoString, valorTotal, dataPedido, horaPedido]);

        const pedidoId = resultPedido.insertId;

        // Mapear quantidade de itens
        const itemCountMap = items.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
        }, {});

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Pedido cadastrado com sucesso' })
        };
    } catch (error) {
        console.error('Erro ao cadastrar pedido:', error); // Log do erro
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao cadastrar pedido' })
        };
    }
}

async function handleUpdateItem(event) {
    try {
        const { nomeJogador, items, formaPagamento, valorTotal, dataPedido, horaPedido } = JSON.parse(event.body);
        console.log('Atualizando pedido:', { nomeJogador, items, formaPagamento, valorTotal, dataPedido, horaPedido });

        // Converte os arrays para JSON
        const itemsString = JSON.stringify(items);
        const formaPagamentoString = JSON.stringify(formaPagamento);

        // Atualiza o pedido com todas as informações
        const queryUpdatePedido = 'UPDATE pedidos SET nome_jogador = ?, items = ?, forma_pagamento = ?, valor_total = ?, data_pedido = ?, hora_pedido = ? WHERE nome_jogador = ? AND DATE(data_pedido) = ? AND hora_pedido = ?';
        await db.promise().query(queryUpdatePedido, [
            nomeJogador,
            itemsString,
            formaPagamentoString,
            valorTotal,
            dataPedido,
            horaPedido,
            nomeJogador,
            dataPedido,
            horaPedido
        ]);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Pedido atualizado com sucesso' })
        };
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao atualizar pedido', details: error.message })
        };
    }
}


async function handleDeleteItem(event) {
    try {
        const { pedidoId, itemIndex } = JSON.parse(event.body); // Recebe o ID do pedido e o índice do item a ser removido
        console.log('Removendo item do pedido:', { pedidoId, itemIndex });

        // Primeiro, busque o pedido para obter os itens
        const queryGetItems = 'SELECT * FROM pedidos WHERE id = ?';
        const [pedido] = await db.promise().query(queryGetItems, [pedidoId]);

        console.log('Resultado da consulta:', pedido);

        if (pedido.length === 0) {
            console.log('Pedido não encontrado');
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Pedido não encontrado' })
            };
        }


        const itemsArray = JSON.parse(pedido[0].items);
        console.log('Itens antes da remoção:', itemsArray);


        if (itemIndex < 0 || itemIndex >= itemsArray.length) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Índice do item inválido' })
            };
        }

        const itemToUpdate = itemsArray[itemIndex];
        itemToUpdate.qtd -= 1; 

     
        if (itemToUpdate.qtd <= 0) {
            itemsArray.splice(itemIndex, 1); 
        }

        
        const queryUpdateItems = 'UPDATE pedidos SET items = ? WHERE id = ?';
        await db.promise().query(queryUpdateItems, [JSON.stringify(itemsArray), pedidoId]);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Item removido com sucesso' })
        };
    } catch (error) {
        console.error('Erro ao remover item:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Erro ao remover item', details: error.message })
        };
    }
}