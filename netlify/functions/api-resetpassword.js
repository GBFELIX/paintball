const mysql = require('mysql2');
const bcrypt = require('bcrypt');
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
    const { username, email, newPassword } = JSON.parse(event.body);

    if (!username || !email || !newPassword) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'Todos os campos são obrigatórios.'
        })
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE jogadores SET senha = ? WHERE username = ? AND email = ?';
    
    const [result] = await db.promise().query(query, [hashedPassword, username, email]);

    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: 'Usuário não encontrado.'
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Senha atualizada com sucesso.'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Erro interno do servidor.'
      })
    };
  }
}; 