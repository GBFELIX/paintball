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

  // GET /estoque
  if (event.httpMethod === 'GET') {
    try {
      const [results] = await connection.query('SELECT * FROM estoque');
      return {
        statusCode: 200,
        body: JSON.stringify(results)
      };
    } catch (err) {
      console.error('Erro ao buscar estoque:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao buscar estoque', details: err.message })
      };
    }
  }

  // GET /estoque/:nome
  if (event.httpMethod === 'GET' && event.path.includes('/estoque/')) {
    try {
      const nome = event.path.split('/').pop();
      console.log(`Buscando item: ${nome}`);
      const query = 'SELECT * FROM estoque WHERE nome = ?';
      const [results] = await connection.query(query, [nome]);

      console.log(`Resultados da busca:`, results);

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
    } catch (err) {
      console.error('Erro ao buscar item do estoque:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao buscar item do estoque', details: err.message })
      };
    }
  }

  // POST /estoque
  if (event.httpMethod === 'POST') {
    try {
      const { item, valor, quantidade } = JSON.parse(event.body);
      const query = 'INSERT INTO estoque (nome, valor, quantidade) VALUES (?, ?, ?)';
      const [results] = await connection.query(query, [item, valor, quantidade]);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ id: results.insertId, item, valor, quantidade })
      };
    } catch (err) {
      console.error('Erro ao adicionar item ao estoque:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao adicionar item ao estoque', details: err.message })
      };
    }
  }

  // DELETE /estoque/:nome
  if (event.httpMethod === 'DELETE') {
    try {
      const nome = event.path.split('/').pop();
      const query = 'DELETE FROM estoque WHERE nome = ?';
      const [results] = await connection.query(query, [nome]);
      
      return {
        statusCode: 200,
        body: JSON.stringify(results)
      };
    } catch (err) {
      console.error('Erro ao remover item do estoque:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao remover item do estoque', details: err.message })
      };
    }
  }

  // PUT /estoque/:nome
  if (event.httpMethod === 'PUT') {
    try {
      const nome = event.path.split('/').pop();
      const { quantidade, valor } = JSON.parse(event.body);

      if (nome === 'marcador especial' && quantidade !== undefined) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `A quantidade do 'marcador especial' não pode ser alterada.` })
        };
      }

      if (quantidade === undefined && valor === undefined) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Nenhum valor para atualizar fornecido' })
        };
      }

      let query = 'UPDATE estoque SET ';
      const values = [];

      if (quantidade !== undefined) {
        if (typeof quantidade !== 'number' || quantidade < 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Quantidade deve ser um número não negativo' })
          };
        }
        query += 'quantidade = ? ';
        values.push(quantidade);
      }

      if (valor !== undefined) {
        if (typeof valor !== 'number' || valor < 0) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Valor deve ser um número não negativo' })
          };
        }
        if (values.length > 0) {
          query += ', ';
        }
        query += 'valor = ? ';
        values.push(valor);
      }

      query += 'WHERE nome = ?';
      values.push(nome);

      await connection.query(query, values);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Estoque atualizado com sucesso' })
      };
    } catch (err) {
      console.error('Erro ao atualizar estoque:', err);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Erro ao atualizar estoque', details: err.message })
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Método não permitido' })
  };
};