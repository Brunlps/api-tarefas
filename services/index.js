const { Pool } = require('pg');
require('dotenv').config()

/**
 * Executa uma query SQL utilizando variáveis de ambiente para conexão.
 * As variáveis padrão esperadas pelo pacote `pg` são:
 * - PGHOST
 * - PGUSER
 * - PGDATABASE
 * - PGPASSWORD
 * - PGPORT
 * 
 * @param {string} sql - A query SQL a ser executada.
 * @param {Array} [params] - Parâmetros opcionais para a query (para evitar SQL Injection).
 * @returns {Promise<Object>} O resultado da query.
 */
async function executarSQL(sql, params = []) {
    // O Pool gerencia a abertura e o fechamento das conexões automaticamente a partir das variáveis de ambient
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Necessário para conexões SSL com o Neon
        }
    });

    try {
        // 1. Abertura da conexão é feita automaticamente ao executar o query no pool (ou via client)
        const client = await pool.connect();

        try {
            // 2. Realizar a query
            const resultado = await client.query(sql, params);
            return resultado;
        } finally {
            // 3. Fechar a conexão devolvendo o cliente para o pool
            client.release();
        }
    } catch (erro) {
        console.error('Erro ao executar a query SQL:', erro);
        throw erro;
    } finally {
        // Encerra o pool de conexões (opcional, dependendo se a função for chamada repetidas vezes)
        await pool.end();
    }
}

module.exports = executarSQL;