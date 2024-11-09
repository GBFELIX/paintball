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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    const connection = await db;
    const { nome_equipe, jogadores } = JSON.parse(event.body);

    // Validação dos dados
    if (!nome_equipe || !jogadores || jogadores.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify('Nome da equipe e jogadores são obrigatórios.')
      };
    }

    // Inserir a equipe
    const equipeSql = 'INSERT INTO equipes (nome_equipe) VALUES (?)';
    const [equipeResult] = await connection.query(equipeSql, [nome_equipe]);
    const teamId = equipeResult.insertId;

    // Inserir jogadores
    const jogadoresSql = 'INSERT INTO jogadores (username, email, telefone, team_id) VALUES (?, ?, ?, ?)';
    
    try {
      for (const jogador of jogadores) {
        const { nome, email, telefone } = jogador;
        await connection.query(jogadoresSql, [nome, email, telefone, teamId]);
      }

      return {
        statusCode: 200,
        body: JSON.stringify('Equipe e jogadores cadastrados com sucesso.')
      };
    } catch (error) {
      console.error('Erro ao inserir jogador:', error);
      return {
        statusCode: 500,
        body: JSON.stringify('Erro ao cadastrar jogadores.')
      };
    }

  } catch (error) {
    console.error('Erro ao inserir equipe:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Erro ao cadastrar equipe.')
    };
  }
}; 