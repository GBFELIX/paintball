const mysql = require('mysql2');
require('dotenv').config();

// Função para criar conexão
function createConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  }).promise();
}

exports.handler = async (event, context) => {
  // Adicionar headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Tratamento para preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Criar nova conexão para cada requisição
  const db = createConnection();
  
  try {
    let response;
    
    switch (event.httpMethod) {
      case 'GET':
        response = await handleGet(event, db);
        break;
      case 'POST':
        response = await handlePost(event, db);
        break;
      case 'PUT':
        response = await handlePut(event, db);
        break;
      case 'DELETE':
        response = await handleDelete(event, db);
        break;
      default:
        response = {
          statusCode: 405,
          body: JSON.stringify({ message: 'Método não permitido' })
        };
    }

    // Adicionar headers CORS à resposta
    response.headers = headers;
    
    // Fechar conexão
    await db.end();
    
    return response;
  } catch (error) {
    // Fechar conexão em caso de erro
    await db.end();
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};

async function handleGet(event, db) {
  try {
    const nomeItem = event.path.split('/').pop();
    if (nomeItem !== 'estoque') {
      const query = 'SELECT * FROM estoque WHERE nome = ?';
      const [results] = await db.query(query, [nomeItem]);
      
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

    const [results] = await db.query('SELECT * FROM estoque');
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

async function handlePost(event, db) {
  try {
    const { item, valor, quantidade } = JSON.parse(event.body);
    const query = 'INSERT INTO estoque (nome, valor, quantidade) VALUES (?, ?, ?)';
    const [result] = await db.query(query, [item, valor, quantidade]);

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

async function handlePut(event, db) {
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

    await db.query(query, values);

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

async function handleDelete(event, db) {
  try {
    const nome = event.path.split('/').pop();
    const query = 'DELETE FROM estoque WHERE nome = ?';
    const [result] = await db.query(query, [nome]);

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