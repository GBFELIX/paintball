const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

exports.handler = async (event, context) => {
  const connection = await db;

  // GET /financeiro
  if (event.httpMethod === 'GET') {
    try {
      const params = new URLSearchParams(event.queryStringParameters);
      const data = params.get('data');
      
      const query = 'SELECT * FROM financeiro WHERE DATE(data_jogo) = ?';
      const [results] = await connection.query(query, [data]);

      return {
        statusCode: 200,
        body: JSON.stringify(results)
      };
    } catch (err) {
      console.error("Erro ao consultar dados financeiros:", err);
      return {
        statusCode: 500,
        body: JSON.stringify(err)
      };
    }
  }

  // POST /financeiro
  if (event.httpMethod === 'POST') {
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

      await connection.query(query, [
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
        body: JSON.stringify('Dados financeiros inseridos com sucesso')
      };
    } catch (err) {
      console.error('Erro ao inserir dados financeiros:', err);
      return {
        statusCode: 500,
        body: JSON.stringify('Erro no servidor')
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Método não permitido' })
  };
}; 