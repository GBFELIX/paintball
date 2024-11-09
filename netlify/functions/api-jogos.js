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
    const query = 'SELECT * FROM jogos';
    const [results] = await db.promise().query(query);

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao buscar jogos' })
    };
  }
}

async function handlePost(event) {
  try {
    const { data, hora } = JSON.parse(event.body);
    const query = 'INSERT INTO jogos (data, hora) VALUES (?, ?)';
    
    await db.promise().query(query, [data, hora]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Jogo adicionado com sucesso'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Erro ao adicionar jogo'
      })
    };
  }
} 