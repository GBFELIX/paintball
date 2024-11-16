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
  switch (event.httpMethod) {
    case 'GET':
      return handleGet();
    case 'POST':
      return handlePost(event);
    case 'DELETE':
      return handleDelete(event);
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método não permitido' })
      };
  }
};

async function handleGet() {
  try {
    const [results] = await db.promise().query('SELECT * FROM descontos');
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao buscar descontos' })
    };
  }
}

async function handlePost(event) {
  try {
    const { nome, valor } = JSON.parse(event.body);
    const query = 'INSERT INTO descontos (nome, valor) VALUES (?, ?)';
    
    const [result] = await db.promise().query(query, [nome, valor]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Desconto adicionado com sucesso',
        id: result.insertId
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao adicionar desconto' })
    };
  }
}

async function handleDelete(event) {
  try {
    const id = event.path.split('/').pop();
    const query = 'DELETE FROM descontos WHERE id = ?';
    
    await db.promise().query(query, [id]);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Desconto removido com sucesso' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao remover desconto' })
    };
  }
} 