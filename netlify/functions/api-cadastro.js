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
  // Verifica se o método é POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Método não permitido' })
    };
  }

  try {
    const { username, email, cpf, telefone, senha } = JSON.parse(event.body);
    const query = 'INSERT INTO jogadores (username, email, cpf, telefone, senha) VALUES (?, ?, ?, ?, ?)';

    const result = await db.promise().query(query, [username, email, cpf, telefone, senha]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Cadastro realizado com sucesso!'
      })
    };

  } catch (error) {
    console.error('Erro ao inserir dados:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Erro ao inserir dados'
      })
    };
  }
}; 