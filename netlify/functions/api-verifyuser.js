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
      body: JSON.stringify({ message: 'Método não permitido' })
    };
  }

  try {
    const { username, email } = JSON.parse(event.body);
    const query = 'SELECT * FROM jogadores WHERE username = ? AND email = ?';
    
    const [results] = await db.promise().query(query, [username, email]);

    if (results.length > 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: 'Usuário ou email incorretos.'
        })
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Erro no servidor.'
      })
    };
  }
}; 