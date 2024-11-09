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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  const { username, password } = JSON.parse(event.body);

  const query = 'SELECT * FROM administradores WHERE username = ? AND password = ?';
  
  try {
    const [results] = await db.promise().query(query, [username, password]);

    if (results.length > 0) {
      const user = results[0];
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Login realizado com sucesso!',
          role: user.role
        })
      };
    } else {
      return {
        statusCode: 400,
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
};