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
  if (event.httpMethod === 'GET') {
    // Verifica se é uma requisição para jogadores de uma equipe específica
    if (event.path.includes('/jogadores')) {
      return handleGetJogadores(event);
    }
    // Caso contrário, retorna todas as equipes
    return handleGetEquipes(event);
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ message: 'Método não permitido' })
  };
};

async function handleGetEquipes(event) {
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
    
    const [results] = await db.promise().query(sql);

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao buscar equipes' })
    };
  }
}

async function handleGetJogadores(event) {
  try {
    const team_id = event.path.split('/')[2];
    const sql = 'SELECT username AS nomeJogador, telefone AS contato FROM jogadores WHERE team_id = ?';
    
    const [results] = await db.promise().query(sql, [team_id]);

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro ao buscar jogadores' })
    };
  }
} 