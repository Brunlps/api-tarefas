const express = require("express");
const executarSQL = require("./services");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));


app.use(express.json());

app.get("/", (req, res) => {
    res.send("Olá mundo");
});

// Busca o usuário
app.get("/usuarios", async (req, res) => {
    try {
        const query = await executarSQL("SELECT id, nome, email FROM usuarios;");
        return res.status(200).json(query.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            tipo: "error",
            mensagem: "Erro ao buscar usuários."
        });
    }
});


app.post("/usuarios", async (req, res) => {

    try {
        const { nome, email, senha } = req.body;
        // Validação de dados
        if (!nome || !email || !senha) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Nome, email e senha são obrigatórios."
            });
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ tipo: "warning", mensagem: "Email inválido." });
        }

        if (senha.length < 6) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "A senha deve ter pelo menos 6 caracteres."
            });
        }

        const emailExiste = await executarSQL(
            `SELECT * FROM usuarios 
            WHERE email = $1`, [email]);

        if (emailExiste.rowCount > 0) {
            return res.status(409).json({
                tipo: "warning",
                mensagem: "Email já cadastrado."
            });
        }

        const query = await executarSQL(
            `INSERT INTO usuarios(nome, email, senha) 
            VALUES ($1, $2, $3) 
            RETURNING id, nome, email;`,
            [nome, email, senha]);

        return res.status(201).json({
            tipo: "success",
            mensagem: "Usuário criado com sucesso.",
            usuario: query.rows[0]
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            tipo: "error",
            mensagem: "Erro ao criar o usuário."
        })
    }
});

app.put("/usuarios/:id", async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        const { id } = req.params;

        if (!nome || !email || !senha) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Nome, email e senha são obrigatórios."
            });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ tipo: "warning", mensagem: "Email inválido." });
        }
        if (senha.length < 6) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "A senha deve ter pelo menos 6 caracteres."
            });
        }

        const query = await executarSQL(
            `UPDATE usuarios
            SET nome=$1, email=$2, senha=$3
            WHERE id = $4
            RETURNING id, nome, email;`,
            [nome, email, senha, id]);

        if (query.rowCount === 0) {
            return res.status(404).json({
                tipo: "warning",
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json({
            tipo: "success",
            mensagem: "Usuário atualizado com sucesso.",
            usuario: query.rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            tipo: "error",
            mensagem: "Erro ao atualizar o usuário."
        });
    }
});


app.delete("/usuarios/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const query = await executarSQL(
            `DELETE FROM usuarios
            WHERE id = $1
            RETURNING id;`,
            [id]);

        if (query.rowCount === 0) {
            return res.status(404).json({
                tipo: "warning",
                mensagem: "Usuário não encontrado."
            });
        }

        return res.status(200).json({
            tipo: "success",
            mensagem: "Usuário deletado com sucesso."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            tipo: "error",
            mensagem: "Erro ao excluir o usuário."
        });
    }
});


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=LOGIN=-=-==-==-=-=-=-======-=-===-=


app.post("/login", async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Email e senha são obrigatórios."
            });
        }

        const query = await executarSQL(
            "SELECT * FROM usuarios WHERE email = $1;",
            [email]
        );

        const usuario = query.rows[0];

        if (!usuario || usuario.senha !== senha) {
            return res.status(401).json({
                tipo: "warning",
                mensagem: "Email ou senha inválidos."
            });
        }

        return res.status(200).json({
            tipo: "success",
            mensagem: "Login realizado com sucesso.",
            usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ tipo: "error", mensagem: "Erro ao fazer login." });
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
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Informe o usuario_id."
            });
        }

        const query = await executarSQL(
            "SELECT * FROM tarefas WHERE usuario_id = $1;",
            [usuario_id]
        );

        return res.status(200).json(query.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            tipo: "error",
            mensagem: "Erro ao buscar tarefas."
        });
    }
});

app.get("/tarefas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id } = req.query;

        if (!usuario_id) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Informe o usuario_id."
            });
        }

        const query = await executarSQL(
            "SELECT * FROM tarefas WHERE id = $1 AND usuario_id = $2;",
            [id, usuario_id]
        );

        if (query.rowCount === 0) {
            return res.status(404).json({
                tipo: "warning",
                mensagem: "Tarefa não encontrada."
            });
        }

        return res.status(200).json(query.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            tipo: "error",
            mensagem: "Erro ao buscar tarefa."
        });
    }
});

app.post("/tarefas", async (req, res) => {
    try {
        const { titulo, descricao, usuario_id } = req.body;

        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "O título é obrigatório."
            });
        }

        if (!usuario_id) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Informe o usuario_id."
            });
        }

        const query = await executarSQL(
            `INSERT INTO tarefas(titulo, descricao, usuario_id)
            VALUES ($1, $2, $3)
            RETURNING *;`,
            [titulo, descricao ?? "", usuario_id]
        );

        return res.status(201).json({
            tipo: "success",
            mensagem: "Tarefa criada com sucesso.",
            tarefa: query.rows[0]
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            tipo: "error",
            mensagem: "Erro ao criar tarefa."
        });
    }
});

app.put("/tarefas/:id", async (req, res) => {
    try {
        const { titulo, descricao, usuario_id } = req.body;
        const { id } = req.params;

        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "O título é obrigatório."
            });
        }

        if (!usuario_id) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Informe o usuario_id."
            });
        }

        const query = await executarSQL(
            `UPDATE tarefas 
            SET titulo=$1, descricao=$2
            WHERE id = $3 AND usuario_id = $4
            RETURNING *;`,
            [titulo, descricao ?? "", id, usuario_id]
        );

        if (query.rowCount === 0) {
            return res.status(404).json({
                tipo: "warning",
                mensagem: "Tarefa não encontrada.",
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
            tipo: "error",
            mensagem: "Erro ao atualizar tarefa."
        });
    }
});

app.delete("/tarefas/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario_id } = req.body;

        if (!usuario_id) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Informe o usuario_id."
            });
        }

        const query = await executarSQL(
            `DELETE FROM tarefas
             WHERE id = $1 AND usuario_id = $2
             RETURNING *;`,
            [id, usuario_id]
        );

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
            tipo: "error",
            mensagem: "Erro ao excluir tarefa."
        });
    }
});


// Se nenhuma rota for encontrada, aplicação bate nessa rota
app.use((req, res) => {
    res.status(404).send("Rota não encontrada");
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor on: http://localhost:${PORT}`);
    });
}

module.exports = app;