const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

exports.handler = async (event, context) => {
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
    
    const query = 'SELECT * FROM pedidos WHERE DATE(data_pedido) = ?';
    const [results] = await db.promise().query(query, [data]);

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
    const { nomeJogador, items, formaPagamento, valorTotal, dataPedido } = JSON.parse(event.body);

    // Inserir pedido
    const queryPedido = 'INSERT INTO pedidos (nome_jogador, forma_pagamento, valor_total, data_pedido) VALUES (?, ?, ?, ?)';
    const [resultPedido] = await db.promise().query(queryPedido, [nomeJogador, formaPagamento, valorTotal, dataPedido]);
    
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

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Pedido cadastrado com sucesso' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao cadastrar pedido' })
    };
  }
} 