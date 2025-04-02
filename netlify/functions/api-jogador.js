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


  if (event.httpMethod === 'POST') {
    try {
      const { username, email } = JSON.parse(event.body);
      const query = 'SELECT * FROM jogadores WHERE username = ? AND email = ?';
      const [results] = await connection.query(query, [username, email]);

      if (results.length > 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: 'Login realizado com sucesso!' })
        };
      } else {
        return {
          statusCode: 200,
          body: JSON.stringify({ success: false, message: 'Usuário ou senha incorretos!' })
        };
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao buscar dados' })
      };
    }
  }


  if (event.httpMethod === 'GET') {
    const teamId = event.queryStringParameters.team_id; 
    if (!teamId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'team_id é necessário' })
      };
    }

    try {
      const query = 'SELECT * FROM jogadores WHERE team_id = ?'; 
      const [results] = await connection.query(query, [teamId]);

      return {
        statusCode: 200,
        body: JSON.stringify(results) 
      };
    } catch (err) {
      console.error('Erro ao buscar jogadores:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao buscar jogadores' })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Método não permitido' })
  };
};
