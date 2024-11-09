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
  // Tratamento para diferentes métodos HTTP
  switch (event.httpMethod) {
    case 'GET':
      return handleGet(event);
    case 'POST':
      return handlePost(event);
    case 'PUT':
      return handlePut(event);
    case 'DELETE':
      return handleDelete(event);
    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método não permitido' })
      };
  }
};

async function handleGet(event) {
  try {
    // Se houver um parâmetro nome na URL
    const nomeItem = event.path.split('/').pop();
    if (nomeItem !== 'estoque') {
      const query = 'SELECT * FROM estoque WHERE nome = ?';
      const [results] = await db.promise().query(query, [nomeItem]);
      
      if (results.length === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Item não encontrado' })
        };
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify(results[0])
      };
    }

    // Caso contrário, retorna todo o estoque
    const [results] = await db.promise().query('SELECT * FROM estoque');
    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao buscar estoque' })
    };
  }
}

async function handlePost(event) {
  try {
    const { item, valor, quantidade } = JSON.parse(event.body);
    const query = 'INSERT INTO estoque (nome, valor, quantidade) VALUES (?, ?, ?)';
    const [result] = await db.promise().query(query, [item, valor, quantidade]);

    return {
      statusCode: 201,
      body: JSON.stringify({
        id: result.insertId,
        item,
        valor,
        quantidade
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao adicionar item ao estoque' })
    };
  }
}

async function handlePut(event) {
  try {
    const nome = event.path.split('/').pop();
    const { quantidade, valor } = JSON.parse(event.body);

    if (nome === 'marcador especial' && quantidade !== undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "A quantidade do 'marcador especial' não pode ser alterada." })
      };
    }

    let query = 'UPDATE estoque SET ';
    const values = [];

    if (quantidade !== undefined) {
      query += 'quantidade = ? ';
      values.push(quantidade);
    }

    if (valor !== undefined) {
      if (values.length > 0) query += ', ';
      query += 'valor = ? ';
      values.push(valor);
    }

    query += 'WHERE nome = ?';
    values.push(nome);

    await db.promise().query(query, values);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Estoque atualizado com sucesso'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao atualizar estoque' })
    };
  }
}

async function handleDelete(event) {
  try {
    const nome = event.path.split('/').pop();
    const query = 'DELETE FROM estoque WHERE nome = ?';
    const [result] = await db.promise().query(query, [nome]);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao remover item do estoque' })
    };
  }
}