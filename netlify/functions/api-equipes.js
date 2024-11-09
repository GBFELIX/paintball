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

  // GET /equipes/:team_id/jogadores
  if (event.httpMethod === 'GET' && event.path.includes('/jogadores')) {
    try {
      const team_id = event.path.split('/')[2];
      const sql = 'SELECT username AS nomeJogador, telefone AS contato FROM jogadores WHERE team_id = ?';
      
      const [results] = await connection.query(sql, [team_id]);
      
      return {
        statusCode: 200,
        body: JSON.stringify(results)
      };
    } catch (error) {
      console.error('Erro ao buscar jogadores:', error);
      return {
        statusCode: 500,
        body: JSON.stringify('Erro ao buscar jogadores.')
      };
    }
  }

  // GET /equipes
  if (event.httpMethod === 'GET') {
    try {
      const sql = `
        SELECT e.team_id AS equipe_id, e.nome_equipe AS nomeEquipe, 
               j.username AS nomeJogador, j.telefone AS contato
        FROM equipes e
        LEFT JOIN jogadores j ON e.team_id = j.team_id
        WHERE j.id = (
          SELECT MIN(id)
          FROM jogadores
          WHERE team_id = e.team_id
        )
      `;
      
      const [results] = await connection.query(sql);
      
      return {
        statusCode: 200,
        body: JSON.stringify(results)
      };
    } catch (error) {
      console.error('Erro ao buscar equipes:', error);
      return {
        statusCode: 500,
        body: JSON.stringify('Erro ao buscar equipes.')
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: 'Método não permitido' })
  };
}; 