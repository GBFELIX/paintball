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
            if (event.queryStringParameters && event.queryStringParameters.config === 'true') {
                const [results] = await connection.query('SELECT * FROM bolinhas_config');
                return {
                    statusCode: 200,
                    body: JSON.stringify(results)
                };
            }
            
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
            const body = JSON.parse(event.body);
            
           
            if (body.config) {
                const { nome, quantidade } = body;
                const query = 'INSERT INTO bolinhas_config (nome, quantidade) VALUES (?, ?)';
                await connection.query(query, [nome, quantidade]);
                
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, message: 'Item de configuração adicionado com sucesso' })
                };
            }
            
           
            const { quantidade } = body;
            const [existing] = await connection.query('SELECT * FROM estoque WHERE nome = "Bolinha" LIMIT 1');
            
            if (existing.length > 0) {
                const query = 'UPDATE estoque SET quantidade = ? WHERE nome = "Bolinha"';
                await connection.query(query, [quantidade]);
            } else {
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

    if (event.httpMethod === 'DELETE') {
        try {
            const { id } = JSON.parse(event.body);
            const query = 'DELETE FROM bolinhas_config WHERE id = ?';
            await connection.query(query, [id]);
            
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Item de configuração removido com sucesso' })
            };
        } catch (err) {
            console.error('Erro ao remover item de configuração:', err);
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
    if (event.httpMethod === 'PATCH') {
        try {
            const { itemNome } = JSON.parse(event.body);
            
            const [config] = await connection.query('SELECT quantidade FROM bolinhas_config WHERE nome = ?', [itemNome]);
            
            if (config.length === 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Item não configurado para reduzir bolinhas' })
                };
            }
            
            const quantidadeAReduzir = config[0].quantidade;
            
            
            const [current] = await connection.query('SELECT quantidade FROM estoque WHERE nome = "Bolinha" LIMIT 1');
            
            if (current.length > 0) {
                const novaQuantidade = current[0].quantidade - quantidadeAReduzir;
                
                if (novaQuantidade >= 0) {
                    await connection.query('UPDATE estoque SET quantidade = ? WHERE nome = "Bolinha"', [novaQuantidade]);
                    
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ 
                            success: true, 
                            message: 'Quantidade de bolinhas reduzida com sucesso',
                            novaQuantidade 
                        })
                    };
                } else {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Quantidade insuficiente de bolinhas no estoque' })
                    };
                }
            }
            
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Item inválido ou quantidade não especificada' })
            };
        } catch (err) {
            console.error('Erro ao reduzir quantidade de bolinhas:', err);
            return {
                statusCode: 500,
                body: JSON.stringify('Erro ao reduzir quantidade de bolinhas')
            };
        }
    }

    return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método não permitido' })
    };
};