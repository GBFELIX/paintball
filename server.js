const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const twilio = require('twilio');
require('dotenv').config();
const app = express();

app.use(cors({

}));

app.use(bodyParser.json());


const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL');
});
app.get('/test', (req, res) => {
  db.query('SELECT 1 + 1 as result', (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao testar conexão' });
    }
    res.json({ message: 'Conexão OK', result: results[0] });
  });
});
app.post('/jogador', (req, res) => {
  const { username, email } = req.body;
  const query = 'SELECT * FROM jogadores WHERE username = ? AND email = ?';

  db.query(query, [username, email], (err, results) => {
    if (err) {
      console.error('Erro ao buscar dados:', err);
      res.status(500).send('Erro ao buscar dados');
      return;
    }

    if (results.length > 0) {
      res.send({ success: true, message: 'Login realizado com sucesso!' });
    } else {
      res.send({ success: false, message: 'Usuário ou senha incorretos!' });
    }
  });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM administradores WHERE username = ? AND password = ?';

  try {
    const [results] = await db.promise().query(query, [username, password]);

    if (results.length > 0) {
      const user = results[0]; 
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
app.post('/addjogo', (req, res) => {
  const {data, hora } = req.body;
  const query = 'INSERT INTO jogos (data, hora) VALUES (?, ?)';

  db.query(query, [data, hora], (err, results) => {
    if (err) {
      console.error('Erro ao inserir dados:', err);
      res.status(500).send({ success: false, message: 'Erro ao adicionar jogo' });
      return;
    }

    res.send({ success: true, message: 'Jogo adicionado com sucesso' });
  });
});
app.get('/jogos', (req, res) => {
  const query = 'SELECT * FROM jogos';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar jogos:', err);
      res.status(500).send('Erro no servidor');
    } else {
      res.json(results);
    }
  });
});
app.post('/cadastro', (req, res) => {
  const { username, email, cpf, telefone, senha } = req.body;
  const query = 'INSERT INTO jogadores (username, email, cpf, telefone, senha) VALUES (?, ?, ?, ?, ?)';

  db.query(query, [username, email, cpf, telefone, senha], (error, results) => {
    if (error) {
      console.error('Erro ao inserir dados:', error);
      res.status(500).json({ success: false, message: 'Erro ao inserir dados' });
    } else {
      res.json({ success: true, message: 'Cadastro realizado com sucesso!' });
    }
  });
  //client.messages
  //  .create({
  //    body: `Olá, o cadastro de ${username} foi realizado com sucesso!`,
  //    from: 'whatsapp:+14155238886', // Esse é o número padrão do Twilio WhatsApp Sandbox
  //    to: `whatsapp:+21991944621` // Enviar para o número de telefone do jogador
  //  })
  //  .then(message => {
  //    console.log(`Mensagem enviada com sucesso: ${message.sid}`);
  //    res.json({ success: true });
  //  })
  //  .catch(error => {
  //    console.error('Erro ao enviar a mensagem:', error);
  //    res.json({ success: false, error: 'Erro ao enviar mensagem do WhatsApp' });
  //  });
});

app.post('/verifyuser', (req, res) => {
  const { username, email } = req.body;
  const query = 'SELECT * FROM jogadores WHERE username = ? AND email = ?';
  
  db.query(query, [username, email], (error, results) => {
    if (error) {
      return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
    if (results.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Usuário ou email incorretos.' });
    }
  });
});

app.post('/resetpassword', async (req, res) => {
  const { username, email, newPassword } = req.body;

  if (!username || !email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE jogadores SET senha = ? WHERE username = ? AND email = ?';
    const values = [hashedPassword, username, email];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Erro ao atualizar senha:', err);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      res.json({ success: true, message: 'Senha atualizada com sucesso.' });
    });
  } catch (error) {
    console.error('Erro na solicitação:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});
app.post('/verifyadm', (req, res) => {
  const { username, email } = req.body;
  const query = 'SELECT * FROM administradores WHERE username = ? AND email = ?';
  
  db.query(query, [username, email], (error, results) => {
    if (error) {
      return res.status(500).json({ success: false, message: 'Erro no servidor.' });
    }
    if (results.length > 0) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Usuário ou email incorretos.' });
    }
  });
});

app.post('/resetpasswordadm', async (req, res) => {
  const { username, email, newPassword } = req.body;

  if (!username || !email || !newPassword) {
    return res.status(400).json({ success: false, message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const query = 'UPDATE administradores SET password = ? WHERE username = ? AND email = ?';
    const values = [newPassword, username, email];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Erro ao atualizar senha:', err);
        return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      }

      res.json({ success: true, message: 'Senha atualizada com sucesso.' });
    });
  } catch (error) {
    console.error('Erro na solicitação:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
});
app.get('/estoque', (req, res) => {
  db.query('SELECT * FROM estoque', (err, results) => {
    if (err) {
      console.error('Erro ao buscar estoque:', err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

app.post('/estoque', (req, res) => {
  const { item, valor, quantidade } = req.body;
  const query = 'INSERT INTO estoque (nome, valor, quantidade) VALUES (?, ?, ?)';
  db.query(query, [item, valor, quantidade], (err, results) => {
    if (err) {
      console.error('Erro ao adicionar item ao estoque:', err);
      return res.status(500).send(err);
    }
    res.json({ id: results.insertId, item, valor, quantidade });
  });
});

app.delete('/estoque/:nome', (req, res) => {
  const { nome } = req.params;
  const query = 'DELETE FROM estoque WHERE nome = ?';
  db.query(query, [nome], (err, results) => {
    if (err) {
      console.error('Erro ao remover item do estoque:', err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
});
app.put('/estoque/:nome', (req, res) => {
  const nome = req.params.nome;
  const { quantidade, valor } = req.body;

  // Verifica se o item é o "marcador especial"
  if (nome === 'marcador especial' && quantidade !== undefined) {
    return res.status(400).send("A quantidade do 'marcador especial' não pode ser alterada.");
  }

  if (quantidade === undefined && valor === undefined) {
    return res.status(400).send("Nenhum valor para atualizar fornecido");
  }

  let query = 'UPDATE estoque SET ';
  const values = [];

  // Atualiza a quantidade se fornecida, exceto para o "marcador especial"
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

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Erro ao atualizar estoque:', err);
      return res.status(500).send('Erro ao atualizar estoque');
    }

    res.send({ success: true, message: 'Estoque atualizado com sucesso' });
  });
});
app.post('/jogo', (req, res) => {
  const { nome, numero } = req.body;
  const query = 'INSERT INTO jogo (nome, numero) VALUES (?, ?)';

  db.query(query, [nome, numero], (err, result) => {
    if (err) {
      console.error('Erro ao inserir jogador:', err);
      return res.status(500).send('Erro ao inserir jogador');
    }
    res.status(201).send('Jogador adicionado com sucesso');
  });
});
app.get('/estoque/:nome', (req, res) => {
  const nomeItem = req.params.nome;
  const query = 'SELECT * FROM estoque WHERE nome = ?';

  db.query(query, [nomeItem], (err, results) => {
    if (err) {
      console.error('Erro ao buscar item no estoque:', err);
      return res.status(500).send({ error: 'Erro interno do servidor' });
    }

    if (results.length === 0) {
      return res.status(404).send({ error: 'Item não encontrado' });
    }

    res.send(results[0]);
  });
});
app.post('/pedidos', (req, res) => {
  const { nomeJogador, items, formaPagamento, valorTotal,  dataPedido  } = req.body;  // Recebendo o valor total

  const queryPedido = 'INSERT INTO pedidos (nome_jogador, forma_pagamento, valor_total, data_pedido) VALUES (?, ?, ?, ?)';  // Incluindo o valor total
  db.query(queryPedido, [nomeJogador, formaPagamento, valorTotal, dataPedido], (err, result) => {
    if (err) {
      console.error('Erro ao cadastrar pedido:', err);
      res.status(500).send('Erro no servidor');
    } else {
      const pedidoId = result.insertId;

      // Mapeando quantidade de itens
      const itemCountMap = items.reduce((acc, item) => {
        acc[item.nome] = (acc[item.nome] || 0) + 1;
        return acc;
      }, {});

      const queryItens = 'INSERT INTO itens_pedidos (pedido_id, nome_item, quantidade, valor) VALUES ?';
      const values = Object.keys(itemCountMap).map(nomeItem => [
        pedidoId, 
        nomeItem, 
        itemCountMap[nomeItem],  // Quantidade correta
        items.find(item => item.nome === nomeItem).valor  // Valor do item
      ]);

      db.query(queryItens, [values], (err, result) => {
        if (err) {
          console.error('Erro ao cadastrar itens do pedido:', err);
          res.status(500).send('Erro no servidor');
        } else {
          res.send('Pedido cadastrado com sucesso');
        }
      });
    }
  });
});
app.get('/pedidos', (req, res) => {
  const data = req.query.data; 
  const query = 'SELECT * FROM pedidos WHERE DATE(data_pedido) = ?';

  db.query(query, [data], (err, results) => {
    if (err) {
      console.error('Erro ao buscar pedidos:', err);
      res.status(500).send('Erro no servidor');
    } else {
      res.json(results); 
    }
  });
});

app.get('/estoque/bolinhas', (req, res) => {
  const query = 'SELECT quantidade FROM estoque WHERE nome = "bolinhas"';
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.length === 0) {
      return res.status(404).json({ error: 'Bolinhas não encontradas no estoque' });
    }
    res.json({ quantidade: result[0].quantidade });
  });
});
app.post('/cadastrar', async (req, res) => {
  const { nome_equipe, jogadores } = req.body;

  if (!nome_equipe || !jogadores || jogadores.length === 0) {
    return res.status(400).send('Nome da equipe e jogadores são obrigatórios.');
  }

  // Inserir a equipe e obter o ID gerado
  const equipeSql = 'INSERT INTO equipes (nome_equipe) VALUES (?)';
  db.query(equipeSql, [nome_equipe], (error, results) => {
    if (error) {
      console.error('Erro ao inserir equipe:', error);
      return res.status(500).send('Erro ao cadastrar equipe.');
    }

    const teamId = results.insertId; // ID da equipe recém-criada

    let erroAoInserir = false;

    jogadores.forEach((jogador, index) => {
      const { nome, email, telefone } = jogador;
      const sql = 'INSERT INTO jogadores (username, email, telefone, team_id) VALUES (?, ?, ?, ?)';
      db.query(sql, [nome, email, telefone, teamId], (error) => {
        if (error) {
          console.error('Erro ao inserir jogador:', error);
          erroAoInserir = true;
        }

        // Após a última iteração, envie a resposta
        if (index === jogadores.length - 1) {
          if (erroAoInserir) {
            return res.status(500).send('Erro ao cadastrar jogadores.');
          } else {
            return res.status(200).send('Equipe e jogadores cadastrados com sucesso.');
          }
        }
      });
    });
  });
});
app.get('/equipes', (req, res) => {
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
  
  db.query(sql, (error, results) => {
    if (error) {
      console.error('Erro ao buscar equipes:', error);
      return res.status(500).send('Erro ao buscar equipes.');
    }
    res.json(results);
  });
});
app.get('/equipes/:team_id/jogadores', (req, res) => {
  const { team_id } = req.params;
  const sql = 'SELECT username AS nomeJogador, telefone AS contato FROM jogadores WHERE team_id = ?';

  db.query(sql, [team_id], (error, results) => {
    if (error) {
      console.error('Erro ao buscar jogadores:', error);
      return res.status(500).send('Erro ao buscar jogadores.');
    }
    res.json(results); 
  });
});
app.post('/financeiro', (req, res) => {
  const { dataJogo, totalJogadores, formasPagamento, totalAvulso, totalArrecadado } = req.body;

  const query = `
    INSERT INTO financeiro (data_jogo, total_jogadores, credito, debito, dinheiro, pix, avulso, total_arrecadado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query, 
    [
      dataJogo,
      totalJogadores,
      formasPagamento.credito,
      formasPagamento.debito,
      formasPagamento.dinheiro,
      formasPagamento.pix,
      totalAvulso,
      totalArrecadado
    ], 
    (err, result) => {
      if (err) {
        console.error('Erro ao inserir dados financeiros:', err);
        return res.status(500).send('Erro no servidor');
      }
      res.send('Dados financeiros inseridos com sucesso');
    }
  );
});
app.get('/financeiro', (req, res) => {
  const data = req.query.data; 
  const query = 'SELECT * FROM financeiro WHERE DATE(data_jogo) = ?';

  db.query(query, [data], (err, results) => {
    if (err) {
      console.error("Erro ao consultar dados financeiros:", err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
});
app.post('/descontos', (req, res) => {
  const { nome, valor } = req.body;
  const sql = 'INSERT INTO descontos (nome, valor) VALUES (?, ?)';
  
  db.query(sql, [nome, valor], (err, result) => {
    if (err) throw err;
    res.json({ message: 'Desconto adicionado com sucesso', id: result.insertId });
  });
});
app.get('/descontos', (req, res) => {
  db.query('SELECT * FROM descontos', (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

app.delete('/descontos/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM descontos WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Erro ao remover desconto do estoque:', err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
});


db.on('error', (err) => {
  console.error('Erro na conexão MySQL:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Tentando reconectar ao banco...');
    db.connect();
  }
});

const PORT = process.env.PORT ||  5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
