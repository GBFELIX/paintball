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
        body: JSON.stringify(err)
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
        body: JSON.stringify(err)
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
        body: JSON.stringify(err)
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
          body: JSON.stringify("A quantidade do 'marcador especial' não pode ser alterada.")
        };
      }

      if (quantidade === undefined && valor === undefined) {
        return {
          statusCode: 400,
          body: JSON.stringify("Nenhum valor para atualizar fornecido")
        };
      }

      let query = 'UPDATE estoque SET ';
      const values = [];

      if (quantidade !== undefined) {
        query += 'quantidade = ? ';
        values.push(quantidade);
      }

      if (valor !== undefined) {
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
        body: JSON.stringify('Erro ao atualizar estoque')
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Método não permitido' })
  };
};