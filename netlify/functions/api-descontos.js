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
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  switch (event.httpMethod) {
    case 'GET':
      return handleGet();
    case 'POST':
      return handlePost(event);
    case 'DELETE':
      return handleDelete(event);
    case 'PUT':
      return handlePut(event);
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
    
    const descontosFormatados = results.reduce((acc, desconto) => {
      acc[desconto.nome] = desconto.valor;
      return acc;
    }, {});

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(descontosFormatados)
    };
  } catch (error) {
    console.error('Erro ao buscar descontos:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
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
    console.log(`Tentando remover desconto com ID: ${id}`);
    const query = 'DELETE FROM descontos WHERE nome = ?';
    
    const [result] = await db.promise().query(query, [id]);
    console.log(`Resultado da remoção: ${JSON.stringify(result)}`);

    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Desconto não encontrado' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Desconto removido com sucesso' })
    };
  } catch (error) {
    console.error('Erro ao remover desconto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao remover desconto' })
    };
  }
}

async function handlePut(event) {
  try {
    const id = event.path.split('/').pop();
    const { valor } = JSON.parse(event.body);
    console.log(`Tentando atualizar desconto com ID: ${id} para o valor: ${valor}`);
    const query = 'UPDATE descontos SET valor = ? WHERE nome = ?';
    
    const [result] = await db.promise().query(query, [valor, id]);
    console.log(`Resultado da atualização: ${JSON.stringify(result)}`);

    if (result.affectedRows === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Desconto não encontrado' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Desconto atualizado com sucesso' })
    };
  } catch (error) {
    console.error('Erro ao atualizar desconto:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao atualizar desconto' })
    };
  }
} 