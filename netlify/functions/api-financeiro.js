const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

exports.handler = async(event, context) => {
    const connection = await db;

    if (event.httpMethod === 'GET') {
        try {
            const params = new URLSearchParams(event.queryStringParameters);
            const data = params.get('data');
            const startDate = params.get('startDate');
            const endDate = params.get('endDate');

            if (startDate && endDate) {
                const query = 'SELECT * FROM financeiro WHERE DATE(data_jogo) BETWEEN ? AND ?';
                const [results] = await connection.query(query, [startDate, endDate]);

                return {
                    statusCode: 200,
                    body: JSON.stringify(results)
                };
            }

            if (!data) {
                const query = 'SELECT * FROM financeiro';
                const [results] = await connection.query(query);

                return {
                    statusCode: 200,
                    body: JSON.stringify(results)
                };
            }

            const query = 'SELECT * FROM financeiro WHERE DATE(data_jogo) = ?';
            const [results] = await connection.query(query, [data]);

            return {
                statusCode: 200,
                body: JSON.stringify(results)
            };
        } catch (err) {
            console.error("Erro ao consultar dados financeiros:", err);
            return {
                statusCode: 500,
                body: JSON.stringify(err)
            };
        }
    }

    if (event.httpMethod === 'POST') {
        try {
            const { dataJogo, horaJogo, totalJogadores, formasPagamento, totalArrecadado, totalDespesas, valortot } = JSON.parse(event.body);

            const query = `
        INSERT INTO financeiro (
          data_jogo, 
          hora_jogo,
          total_jogadores, 
          credito, 
          debito, 
          dinheiro, 
          pix, 
          deposito,
          total_arrecadado,
          despesas,
          valortot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

            await connection.query(query, [
                dataJogo,
                horaJogo,
                totalJogadores,
                formasPagamento.credito,
                formasPagamento.debito,
                formasPagamento.dinheiro,
                formasPagamento.pix,
                formasPagamento.deposito,
                totalArrecadado,
                totalDespesas,
                valortot
            ]);

            return {
                statusCode: 200,
                body: JSON.stringify('Dados financeiros inseridos com sucesso')
            };
        } catch (err) {
            console.error('Erro ao inserir dados financeiros:', err);
            return {
                statusCode: 500,
                body: JSON.stringify('Erro no servidor')
            };
        }
    }

    if (event.httpMethod === 'PUT') {
        try {
            const { id, dataJogo, horaJogo, totalJogadores, formasPagamento, totalArrecadado } = JSON.parse(event.body);

            const query = `
                UPDATE financeiro SET 
                    data_jogo = ?, 
                    hora_jogo = ?, 
                    total_jogadores = ?, 
                    credito = ?, 
                    debito = ?, 
                    dinheiro = ?, 
                    pix = ?, 
                    deposito = ?, 
                    total_arrecadado = ?
                WHERE id = ?
            `;

            await connection.query(query, [
                dataJogo,
                horaJogo,
                totalJogadores,
                formasPagamento.credito,
                formasPagamento.debito,
                formasPagamento.dinheiro,
                formasPagamento.pix,
                formasPagamento.deposito,
                totalArrecadado,
                id // ID do registro a ser atualizado
            ]);

            return {
                statusCode: 200,
                body: JSON.stringify('Dados financeiros atualizados com sucesso')
            };
        } catch (err) {
            console.error('Erro ao atualizar dados financeiros:', err);
            return {
                statusCode: 500,
                body: JSON.stringify('Erro no servidor')
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' })
    };
};