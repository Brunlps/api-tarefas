const express = require("express");
const executarSQL = require("./services");
const { query } = require("pg");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Olá mundo");
});

// Busca o usuário
app.get("/usuarios", async (req, res) => {
    try {
        const linhas = await executarSQL("SELECT * FROM usuarios;");
        res.json(linhas.rows);
    } catch (error) {
        res.json({
            mensagem: error.message
        })
    }
});

app.post("/usuarios", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        const emailExiste = await executarSQL(`SELECT * FROM ususarios WHERE email = '${email}'`)
        if (emailExiste.rowCount > 0) {
            res.json({
                tipo: "warning",
                mensagem: "Email já cadastro."
            });
            return;
        }
        const linhas = await executarSQL(
            `INSERT INTO usuarios(nome, email, senha) 
            VALUES ($1, $2, $3) 
            RETURNING *;`,
            [nome, email, senha]);

        // Verifica 
        if (query.rowCount > 0) {
            res.json({
                tipo: "seccess",
                mensagem: "Registro criado com sucesso."
            });
        } else {
            res.json({
                tipo: "waning",
                mensagem: "Fala ao criar registro."
            });
        };
        res.json(linhas.rows);
    } catch (error) {
        res.json({
            mensagem: error.message
        })
    }
});

app.put("/usuarios/:id", async (req, res) => {

    try {
        const { nome, email, senha } = req.body;

        const { id } = req.params;
        const query = await executarSQL(
            `UPDATE usuarios 
            SET nome=$1, email=$2, senha=$3 
            WHERE id = ${id} 
            RETURNING *;`,
            [nome, email, senha]);

        // Verifica 
        if (query.rowCount > 0) {
            res.json({
                tipo: "seccess",
                mensagem: "Registro atualizado com sucesso."
            });
        } else {
            res.json({
                tipo: "waning",
                mensagem: "Fala ao atualizar registro."
            });
        };
        res.json(query.rows);
    } catch (error) {
        res.json({
            mensagem: error.message
        })
    }
});

app.delete("/usuarios/:id", async (req, res) => {
        try {

        const { id } = req.params;

        const query = await executarSQL(
            `DELETE FROM usuarios 
            SET nome=$1, email=$2, senha=$3 
            WHERE id = ${id} 
            RETURNING *;`);

        // Verifica 
        if (query.rowCount > 0) {
            res.json({
                tipo: "seccess",
                mensagem: "Registro deletado com sucesso."
            });
        } else {
            res.json({
                tipo: "waning",
                mensagem: "Registro não encontrado."
            });
        };
        res.json(query.rows);
    } catch (error) {
        res.json({
            mensagem: error.message
        })
    }
});


// Sse nenhuma rota for encontrada, aplicação bate nessa rota
app.use((req, res) => {
    res.status(404).send("Rota não encontrada");
});

// Escutando as rotas, porta de entrada das rotas
app.listen(3000, () => {
    console.log("Servidor on: http://localhost:3000");
});