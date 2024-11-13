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
    try {
      const data = event.queryStringParameters.data;
      
      const query = `
        SELECT 
          data_jogo,
          COUNT(DISTINCT id_jogador) as total_jogadores,
          SUM(CASE WHEN forma_pagamento = 'credito' THEN valor ELSE 0 END) as credito,
          SUM(CASE WHEN forma_pagamento = 'debito' THEN valor ELSE 0 END) as debito,
          SUM(CASE WHEN forma_pagamento = 'dinheiro' THEN valor ELSE 0 END) as dinheiro,
          SUM(CASE WHEN forma_pagamento = 'pix' THEN valor ELSE 0 END) as pix,
          SUM(CASE WHEN tipo = 'avulso' THEN valor ELSE 0 END) as avulso,
          SUM(valor) as total_arrecadado
        FROM pagamentos
        WHERE DATE(data_jogo) = ?
        GROUP BY data_jogo
      `;

      const [results] = await db.promise().query(query, [data]);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(results)
      };

    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Erro ao buscar dados financeiros' })
      };
    }
  }
}; 