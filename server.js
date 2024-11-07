const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const app = express();

app.use(cors());
app.use(bodyParser.json());

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = { supabase };

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  idleTimeoutMillis: 10000,
});
pool.connect()
  .then(client => {
    console.log('Conectado ao banco de dados PostgreSQL');
    client.release();
  })
  .catch(err => console.error('Erro de conexão com o PostgreSQL:', err));

app.get('/', (req, res) => {
  res.send('Backend está funcionando!');
});

app.post('/jogador', async (req, res) => {
  const { username, email } = req.body;
  const query = 'SELECT * FROM jogadores WHERE username = $1 AND email = $2';

  try {
    const result = await pool.query(query, [username, email]);
    if (result.rows.length > 0) {
      res.send({ success: true, message: 'Login realizado com sucesso!' });
    } else {
      res.send({ success: false, message: 'Usuário ou senha incorretos!' });
    }
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    res.status(500).send('Erro ao buscar dados');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM administradores WHERE username = $1 AND password = $2';

  try {
    const result = await pool.query(query, [username, password]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.send({
        success: true,
        message: 'Login realizado com sucesso!',
        role: user.role
      });
    } else {
      res.send({ success: false, message: 'Usuário ou senha incorretos!' });
    }
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    res.status(500).send('Erro ao buscar dados');
  }
});

app.post('/addjogo', async (req, res) => {
  const { data, hora } = req.body;
  const query = 'INSERT INTO jogos (data, hora) VALUES ($1, $2)';

  try {
    await pool.query(query, [data, hora]);
    res.send({ success: true, message: 'Jogo adicionado com sucesso' });
  } catch (err) {
    console.error('Erro ao inserir dados:', err);
    res.status(500).send({ success: false, message: 'Erro ao adicionar jogo' });
  }
});

app.get('/jogos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jogos');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar jogos:', err);
    res.status(500).send('Erro no servidor');
  }
});

app.post('/cadastro', async (req, res) => {
  const { username, email, cpf, telefone, senha } = req.body;
  const query = 'INSERT INTO jogadores (username, email, cpf, telefone, senha) VALUES ($1, $2, $3, $4, $5)';

  try {
    await pool.query(query, [username, email, cpf, telefone, senha]);
    res.json({ success: true, message: 'Cadastro realizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao inserir dados:', err);
    res.status(500).json({ success: false, message: 'Erro ao inserir dados' });
  }
});

app.post('/verifyuser', async (req, res) => {
  const { username, email } = req.body;
  const query = 'SELECT * FROM jogadores WHERE username = $1 AND email = $2';
  
  try {
    const result = await pool.query(query, [username, email]);
    if (result.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Usuário ou email incorretos.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro no servidor.' });
  }
});

app.post('/resetpassword', async (req, res) => {
  const { username, email, newPassword } = req.body;

  if (!username || !email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE jogadores SET senha = $1 WHERE username = $2 AND email = $3';
    const result = await pool.query(query, [hashedPassword, username, email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    res.json({ success: true, message: 'Senha atualizada com sucesso.' });
  } catch (err) {
    console.error('Erro na solicitação:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});

app.post('/verifyadm', async (req, res) => {
  const { username, email } = req.body;
  const query = 'SELECT * FROM administradores WHERE username = $1 AND email = $2';
  
  try {
    const result = await pool.query(query, [username, email]);
    if (result.rows.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Usuário ou email incorretos.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro no servidor.' });
  }
});

app.post('/resetpasswordadm', async (req, res) => {
  const { username, email, newPassword } = req.body;

  if (!username || !email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const query = 'UPDATE administradores SET password = $1 WHERE username = $2 AND email = $3';
    const result = await pool.query(query, [newPassword, username, email]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    res.json({ success: true, message: 'Senha atualizada com sucesso.' });
  } catch (err) {
    console.error('Erro na solicitação:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});

app.get('/estoque', async (req, res) => { 
  try {
    const result = await pool.query('SELECT * FROM estoque');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar estoque:', err);
    res.status(500).send(err);
  }
});

app.post('/estoque', async (req, res) => {
  const { item, valor, quantidade } = req.body;
  const query = 'INSERT INTO estoque (nome, valor, quantidade) VALUES ($1, $2, $3) RETURNING id';
  
  try {
    const result = await pool.query(query, [item, valor, quantidade]);
    res.json({ 
      id: result.rows[0].id, 
      item, 
      valor, 
      quantidade 
    });
  } catch (err) {
    console.error('Erro ao adicionar item ao estoque:', err);
    res.status(500).send(err);
  }
});

app.delete('/estoque/:nome', async (req, res) => {
  const { nome } = req.params;
  const query = 'DELETE FROM estoque WHERE nome = $1';
  
  try {
    const result = await pool.query(query, [nome]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao remover item do estoque:', err);
    res.status(500).send(err);
  }
});

app.put('/estoque/:nome', async (req, res) => {
  const nome = req.params.nome;
  const { quantidade, valor } = req.body;

  if (nome === 'marcador especial' && quantidade !== undefined) {
    return res.status(400).send("A quantidade do 'marcador especial' não pode ser alterada.");
  }

  if (quantidade === undefined && valor === undefined) {
    return res.status(400).send("Nenhum valor para atualizar fornecido");
  }

  let query = 'UPDATE estoque SET ';
  const values = [];
  let paramCount = 1;

  if (quantidade !== undefined) {
    query += 'quantidade = $' + paramCount++;
    values.push(quantidade);
  }

  if (valor !== undefined) {
    if (values.length > 0) query += ', ';
    query += 'valor = $' + paramCount++;
    values.push(valor);
  }

  query += ' WHERE nome = $' + paramCount;
  values.push(nome);

  try {
    await pool.query(query, values);
    res.send({ success: true, message: 'Estoque atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar estoque:', err);
    res.status(500).send('Erro ao atualizar estoque');
  }
});

app.post('/jogo', async (req, res) => {
  const { nome, numero } = req.body;
  const query = 'INSERT INTO jogo (nome, numero) VALUES ($1, $2)';

  try {
    await pool.query(query, [nome, numero]);
    res.status(201).send('Jogador adicionado com sucesso');
  } catch (err) {
    console.error('Erro ao inserir jogador:', err);
    res.status(500).send('Erro ao inserir jogador');
  }
});

app.get('/estoque/:nome', async (req, res) => {
  const nomeItem = req.params.nome;
  const query = 'SELECT * FROM estoque WHERE nome = $1';

  try {
    const result = await pool.query(query, [nomeItem]);
    if (result.rows.length === 0) {
      return res.status(404).send({ error: 'Item não encontrado' });
    }
    res.send(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar item no estoque:', err);
    res.status(500).send({ error: 'Erro interno do servidor' });
  }
});

app.post('/pedidos', async (req, res) => {
  const { nomeJogador, items, formaPagamento, valorTotal, dataPedido } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const queryPedido = 'INSERT INTO pedidos (nome_jogador, forma_pagamento, valor_total, data_pedido) VALUES ($1, $2, $3, $4) RETURNING id';
      const pedidoResult = await client.query(queryPedido, [nomeJogador, formaPagamento, valorTotal, dataPedido]);
      const pedidoId = pedidoResult.rows[0].id;

      const itemCountMap = items.reduce((acc, item) => {
        acc[item.nome] = (acc[item.nome] || 0) + 1;
        return acc;
      }, {});

      for (const nomeItem of Object.keys(itemCountMap)) {
        const item = items.find(i => i.nome === nomeItem);
        await client.query(
          'INSERT INTO itens_pedidos (pedido_id, nome_item, quantidade, valor) VALUES ($1, $2, $3, $4)',
          [pedidoId, nomeItem, itemCountMap[nomeItem], item.valor]
        );
      }

      await client.query('COMMIT');
      res.send('Pedido cadastrado com sucesso');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao cadastrar pedido:', err);
    res.status(500).send('Erro no servidor');
  }
});

app.get('/pedidos', async (req, res) => {
  const data = req.query.data;
  const query = 'SELECT * FROM pedidos WHERE DATE(data_pedido) = $1';

  try {
    const result = await pool.query(query, [data]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).send('Erro no servidor');
  }
});

app.get('/estoque/bolinhas', async (req, res) => {
  const query = 'SELECT quantidade FROM estoque WHERE nome = $1';
  
  try {
    const result = await pool.query(query, ['bolinhas']);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bolinhas não encontradas no estoque' });
    }
    res.json({ quantidade: result.rows[0].quantidade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/cadastrar', async (req, res) => {
  const { nome_equipe, jogadores } = req.body;

  if (!nome_equipe || !jogadores || jogadores.length === 0) {
    return res.status(400).send('Nome da equipe e jogadores são obrigatórios.');
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const equipeSql = 'INSERT INTO equipes (nome_equipe) VALUES ($1) RETURNING team_id';
      const equipeResult = await client.query(equipeSql, [nome_equipe]);
      const teamId = equipeResult.rows[0].team_id;

      for (const jogador of jogadores) {
        const { nome, email, telefone } = jogador;
        await client.query(
          'INSERT INTO jogadores (username, email, telefone, team_id) VALUES ($1, $2, $3, $4)',
          [nome, email, telefone, teamId]
        );
      }

      await client.query('COMMIT');
      res.status(200).send('Equipe e jogadores cadastrados com sucesso.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao cadastrar equipe:', err);
    res.status(500).send('Erro ao cadastrar equipe.');
  }
});

app.get('/equipes', async (req, res) => {
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
  
  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar equipes:', err);
    res.status(500).send('Erro ao buscar equipes.');
  }
});

app.get('/equipes/:team_id/jogadores', async (req, res) => {
  const { team_id } = req.params;
  const sql = 'SELECT username AS nomeJogador, telefone AS contato FROM jogadores WHERE team_id = $1';

  try {
    const result = await pool.query(sql, [team_id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar jogadores:', err);
    res.status(500).send('Erro ao buscar jogadores.');
  }
});

app.post('/financeiro', async (req, res) => {
  const { dataJogo, totalJogadores, formasPagamento, totalAvulso, totalArrecadado } = req.body;

  const query = `
    INSERT INTO financeiro (data_jogo, total_jogadores, credito, debito, dinheiro, pix, avulso, total_arrecadado)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `;

  try {
    await pool.query(query, [
      dataJogo,
      totalJogadores,
      formasPagamento.credito,
      formasPagamento.debito,
      formasPagamento.dinheiro,
      formasPagamento.pix,
      totalAvulso,
      totalArrecadado
    ]);
    res.send('Dados financeiros inseridos com sucesso');
  } catch (err) {
    console.error('Erro ao inserir dados financeiros:', err);
    res.status(500).send('Erro no servidor');
  }
});

app.get('/financeiro', async (req, res) => {
  const data = req.query.data;
  const query = 'SELECT * FROM financeiro WHERE DATE(data_jogo) = $1';

  try {
    const result = await pool.query(query, [data]);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao consultar dados financeiros:", err);
    res.status(500).send(err);
  }
});

app.post('/descontos', async (req, res) => {
  const { nome, valor } = req.body;
  const sql = 'INSERT INTO descontos (nome, valor) VALUES ($1, $2) RETURNING id';
  
  try {
    const result = await pool.query(sql, [nome, valor]);
    res.json({ message: 'Desconto adicionado com sucesso', id: result.rows[0].id });
  } catch (err) {
    throw err;
  }
});

app.get('/descontos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM descontos');
    res.json(result.rows);
  } catch (err) {
    throw err;
  }
});

app.delete('/descontos/:id', async (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM descontos WHERE id = $1';
  
  try {
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao remover desconto do estoque:', err);
    res.status(500).send(err);
  }
});

const PORT = process.env.PORT_APP || 5000;

app.listen(PORT, (err) => {
  if (err) {
    console.error('Erro ao iniciar o servidor:', err);
    return;
  }
  console.log(`Servidor rodando na porta ${PORT}`);
});
