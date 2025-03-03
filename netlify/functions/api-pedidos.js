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
    } else if (event.httpMethod === 'DELETE') {
        return handleDelete(event);
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

        // Inserir itens do pedido
        //const queryItens = 'INSERT INTO itens_pedidos (pedido_id, nome_item, quantidade, valor) VALUES ?';
        //const values = Object.keys(itemCountMap).map(nomeItem => [
        //    pedidoId,
        //    nomeItem,
        //    itemCountMap[nomeItem],
        //    items.find(item => item.nome === nomeItem).valor
        //]);

        //await db.promise().query(queryItens, [values]);

        // Retornar sucesso após todas as operações
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

async function handleDelete(event) {
    try {
        const { pedidoId, itemIndex } = JSON.parse(event.body);
        console.log('Removendo item:', { pedidoId, itemIndex });

        // Log para verificar o pedidoId
        console.log('Pedido ID recebido:', pedidoId);

        // Primeiro, busque o pedido para obter os itens
        const queryGetItems = 'SELECT pedidos WHERE id = ?';
        const [pedido] = await db.promise().query(queryGetItems, [pedidoId]);

        console.log('Resultado da consulta:', pedido); // Adicione este log

        if (pedido.length === 0) {
            console.log('Pedido não encontrado');
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Pedido não encontrado' })
            };
        }

        // Converte a string JSON em um array
        const itemsArray = JSON.parse(pedido[0].items);
        console.log('Itens antes da remoção:', itemsArray);

        // Verifica se o índice é válido
        if (itemIndex < 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Índice do item inválido' })
            };
        }

        // Remove o item do array
        const updatedItems = itemsArray.filter((_, index) => index !== itemIndex);
        console.log('Itens atualizados:', JSON.stringify(updatedItems));

        // Atualiza a coluna items com a nova lista
        const queryUpdateItems = 'UPDATE pedidos SET items = ? WHERE id = ?';
        await db.promise().query(queryUpdateItems, [JSON.stringify(updatedItems), pedidoId]);

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