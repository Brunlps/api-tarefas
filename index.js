const express = require("express");
const executarSQL = require("./services");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Olá mundo");
});

// Busca o usuário
app.get("/usuarios", async (req, res) => {
    try {
        const query = await executarSQL("SELECT * FROM usuarios;");
        res.json(query.rows);
    } catch (error) {
        res.json({
            mensagem: error.message
        })
    }
});

app.post("/usuarios", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;

        const emailExiste = await executarSQL(
            `SELECT * FROM usuarios 
            WHERE email = '${email}'`)

        if (emailExiste.rowCount > 0) {
            res.json({
                tipo: "warning",
                mensagem: "Email já cadastro."
            });
            return;
        }
        const query = await executarSQL(
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
        res.json(query.rows);
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


//-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=TAREFAS=-=-==-==-=-=-=-======-=-===-=--=-
// app.get("/tarefas", (req, res) => {
//     res.send(`SELECT * FROM tarefas 
//         WHERE usuario_id = 5;`)
// });

// Busca o tarefas
app.get("/tarefas", async (req, res) => {
    try {
        const query = await executarSQL("SELECT * FROM tarefas;");
        res.json(query.rows);
    } catch (error) {
        res.json({
            mensagem: error.message
        })
    }
});

app.post("/tarefas", async (req, res) => {
    try {
        const { titulo, descricao, usuario_id } = req.body;

        const query = await executarSQL(
            `INSERT INTO tarefas(titulo, descricao, usuario_id) 
            VALUES ($1, $2, $3) 
            RETURNING *;`,
            [titulo, descricao, usuario_id]);

        // Verifica 
        if (query.rowCount > 0) {
            return res.status(400).json({
                tipo: "seccess",
                mensagem: "Tarefa criada com sucesso."
            });
        }
        return resstatus(201).json({
            tipo: "waning",
            mensagem: "Falha ao criar tarefa.",
            tarefa: query.rows[0]
        });

        res.json(query.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: error.message
        })
    }
});

app.put("/tarefas/:id", async (req, res) => {

    try {
        const { titulo, descricao } = req.body;

        const { id } = req.params;
        const query = await executarSQL(
            `UPDATE tarefas 
            SET titulo=$1, descricao=$2
            WHERE id = $3
            RETURNING *;`,
            [titulo, descricao, id]);

        // Verifica 
        if (query.rowCount === 0) {
            return res.status(404).json({
                tipo: "waning",
                mensagem: "Falha ao criar tarefa.",
            });
        }
        return res.status(200).json({
            tipo: "success",
            mensagem: "Tarefa atualizada com sucesso.",
            tarefa: query.rows[0]
        });


    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao atualizar tarefa."
        });
    };
});

app.delete("/tarefas/:id", async (req, res) => {
    try {

        const { id } = req.params;

        const query = await executarSQL(
            `DELETE FROM tarefas
             WHERE id = $1
             RETURNING *;`,
            [id]
        );


        // Verifica 
        if (query.rowCount === 0) {
            return res.status(404).json({
                tipo: "warning",
                mensagem: "Tarefa não encontrada."
            });
        }

        return res.status(200).json({
            tipo: "success",
            mensagem: "Tarefa deletada com sucesso.",
            tarefa: query.rows[0]
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            mensagem: "Erro ao excluir tarefa."
        });
    }
});


// Se nenhuma rota for encontrada, aplicação bate nessa rota
app.use((req, res) => {
    res.status(404).send("Rota não encontrada");
});

// Escutando as rotas, porta de entrada das rotas
app.listen(3000, () => {
    console.log("Servidor on: http://localhost:3000");
});