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
            const [results] = await connection.query('SELECT * FROM estoque WHERE nome = "Bolinha" LIMIT 1');
            return {
                statusCode: 200,
                body: JSON.stringify(results)
            };
        } catch (err) {
            console.error('Erro ao buscar bolinhas:', err);
            return {
                statusCode: 500,
                body: JSON.stringify(err)
            };
        }
    }

    if (event.httpMethod === 'POST') {
        try {
            const { quantidade } = JSON.parse(event.body);
            
            // First check if bolinhas entry exists
            const [existing] = await connection.query('SELECT * FROM estoque WHERE nome = "Bolinha" LIMIT 1');
            
            if (existing.length > 0) {
                // Update existing entry
                const query = 'UPDATE estoque SET quantidade = ? WHERE nome = "Bolinha"';
                await connection.query(query, [quantidade]);
            } else {
                // Create new entry
                const query = 'INSERT INTO estoque (nome, valor, quantidade, custo, tipo) VALUES (?, ?, ?, ?, ?)';
                await connection.query(query, ['Bolinha', 0, quantidade, 0, 'Bolinha']);
            }

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Quantidade de bolinhas atualizada com sucesso' })
            };
        } catch (err) {
            console.error('Erro ao adicionar bolinhas:', err);
            return {
                statusCode: 500,
                body: JSON.stringify(err)
            };
        }
    }

    if (event.httpMethod === 'PUT') {
        try {
            const { quantidade } = JSON.parse(event.body);
            const query = 'UPDATE estoque SET quantidade = ? WHERE nome = "Bolinha"';
            await connection.query(query, [quantidade]);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Quantidade de bolinhas atualizada com sucesso' })
            };
        } catch (err) {
            console.error('Erro ao atualizar quantidade de bolinhas:', err);
            return {
                statusCode: 500,
                body: JSON.stringify('Erro ao atualizar quantidade de bolinhas')
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' })
    };
};
