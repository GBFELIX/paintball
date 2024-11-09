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
    
    const query = 'SELECT * FROM financeiro WHERE DATE(data_jogo) = ?';
    const [results] = await db.promise().query(query, [data]);

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao consultar dados financeiros' })
    };
  }
}

async function handlePost(event) {
  try {
    const { dataJogo, totalJogadores, formasPagamento, totalAvulso, totalArrecadado } = JSON.parse(event.body);

    const query = `
      INSERT INTO financeiro (
        data_jogo, 
        total_jogadores, 
        credito, 
        debito, 
        dinheiro, 
        pix, 
        avulso, 
        total_arrecadado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.promise().query(query, [
      dataJogo,
      totalJogadores,
      formasPagamento.credito,
      formasPagamento.debito,
      formasPagamento.dinheiro,
      formasPagamento.pix,
      totalAvulso,
      totalArrecadado
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Dados financeiros inseridos com sucesso' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao inserir dados financeiros' })
    };
  }
} 