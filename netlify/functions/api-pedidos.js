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

        // Validação dos dados recebidos
        if (!nomeJogador || !items || !formaPagamento || !valorTotal || !dataPedido || !horaPedido) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Todos os campos são obrigatórios' })
            };
        }

        // Tenta converter os itens para JSON
        let itemsString;
        try {
            itemsString = JSON.stringify(items);
        } catch (error) {
            console.error('Erro ao converter items para JSON:', error);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Dados de itens inválidos' })
            };
        }

        // Inserir pedido no banco de dados
        const queryPedido = 'INSERT INTO pedidos (nome_jogador, items, forma_pagamento, valor_total, data_pedido, hora_pedido) VALUES (?, ?, ?, ?, ?, ?)';
        const [resultPedido] = await db.promise().query(queryPedido, [nomeJogador, itemsString, formaPagamento, valorTotal, dataPedido, horaPedido]);

        const pedidoId = resultPedido.insertId;

        // Mapear quantidade de itens
        const itemCountMap = items.reduce((acc, item) => {
            acc[item.nome] = (acc[item.nome] || 0) + 1;
            return acc;
        }, {});

        // Inserir itens do pedido
        const queryItens = 'INSERT INTO itens_pedidos (pedido_id, nome_item, quantidade, valor) VALUES ?';
        const values = Object.keys(itemCountMap).map(nomeItem => [
            pedidoId,
            nomeItem,
            itemCountMap[nomeItem],
            items.find(item => item.nome === nomeItem).valor
        ]);

        await db.promise().query(queryItens, [values]);

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