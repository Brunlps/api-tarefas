const express = require("express");
const executarSQL = require("./services");
const cors = require("cors")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken");


const app = express();

app.use(cors(
    {
        origin: "http://localhost:5173"
    }
));

app.use(express.json());

// MIDDLEWARE: É uma função bloquadora, onde ela analisa, 
// execulta alguma lógica, cabe a a ela se ela vai deixar a 
// requisição passar ou se ela vai bloquear a mesma.
function autenticar(req, res, next) {
    const header = req.headers.authorization;   // "Bearer <token>"
    const token = header && header.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            tipo: "warning",
            mensagem: "Token não informado."
        });
    }

    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET);   // { id: ... }
        next();
    } catch {
        return res.status(401).json({
            tipo: "warning",
            mensagem: "Token inválido ou expirado."
        });
    }
}
// =-=====-==-=-=-=-==-=-=-=-=-=-====--=-=-=-=-=-==-==-=-=-====--=-=-=-=-=-=
app.get("/", (req, res) => {
    res.send("Olá mundo");
});

// Busca o usuário
app.get("/usuarios", autenticar, async (req, res) => {
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

        const hash = await bcrypt.hash(senha, 10)
        const query = await executarSQL(
            `INSERT INTO usuarios(nome, email, senha) 
            VALUES ($1, $2, $3) 
            RETURNING id, nome, email;`,
            [nome, email, hash]);

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

app.put("/usuarios/:id", autenticar, async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        const { id } = req.params;

        // o id do token precisa ser o mesmo da conta que está sendo alterada
        if (Number(id) !== req.usuario.id) {
            return res.status(403).json({
                tipo: "warning",
                mensagem: "Você só pode alterar a sua própria conta."
            });
        }

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

        const hash = await bcrypt.hash(senha, 10);
        const query = await executarSQL(
            `UPDATE usuarios
            SET nome=$1, email=$2, senha=$3
            WHERE id = $4
            RETURNING id, nome, email;`,
            [nome, email, hash, id]);

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


app.delete("/usuarios/:id", autenticar, async (req, res) => {
    try {
        const { id } = req.params;

        if (Number(id) !== req.usuario.id) {
            return res.status(403).json({
                tipo: "warning",
                mensagem: "Você só pode excluir a sua própria conta."
            });
        }

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
            "SELECT * FROM usuarios WHERE email = $1;", [email]);

        const usuario = query.rows[0];

        // a mesma mensagem para os dois casos, para não revelar quais e-mails existem
        if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
            return res.status(401).json({
                tipo: "warning",
                mensagem: "Email ou senha inválidos."
            });
        }

        const token = jwt.sign(
            { id: usuario.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" });

        return res.status(200).json({
            tipo: "success",
            token,
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
app.get("/tarefas", autenticar, async (req, res) => {
    try {
        const { usuario_id } = req.query;   // chamada: /tarefas?usuario_id=5

        if (!usuario_id) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "Informe o usuario_id."
            });
        }

        const query = await executarSQL(
            "SELECT * FROM tarefas WHERE usuario_id = $1;",
            [req.usuario.id]);

        return res.status(200).json(query.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            tipo: "error",
            mensagem: "Erro ao buscar tarefas."
        });
    }
});

// Busca uma tarefa pelo id (GET /tarefas/24).
// Filtra também pelo dono (req.usuario.id): se a tarefa existir mas for de
// outro usuário, devolve 404 como se não existisse, sem revelar que ela existe.
app.get("/tarefas/:id", autenticar, async (req, res) => {
    try {
        const { id } = req.params;

        const query = await executarSQL(
            "SELECT * FROM tarefas WHERE id = $1 AND usuario_id = $2;",
            [id, req.usuario.id]);

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

app.post("/tarefas", autenticar, async (req, res) => {
    try {
        const { titulo, descricao } = req.body;

        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "O título é obrigatório."
            });
        }

        const query = await executarSQL(
            `INSERT INTO tarefas(titulo, descricao, usuario_id)
            VALUES ($1, $2, $3)
            RETURNING *;`,
            [titulo, descricao, req.usuario.id]);

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


// "autenticar" exige o token: sem ele, req.usuario não existe e a rota
// não saberia de quem é a tarefa. Com ele, só usuário logado edita tarefas.
app.put("/tarefas/:id", autenticar, async (req, res) => {

    try {
        const { titulo, descricao } = req.body;

        const { id } = req.params;

        // Validação: sem título, o UPDATE apagaria o título da tarefa.
        // Responder 400 antes de ir ao banco evita gravar dado inválido.
        if (!titulo || !titulo.trim()) {
            return res.status(400).json({
                tipo: "warning",
                mensagem: "O título é obrigatório."
            });
        }

        const query = await executarSQL(
            `UPDATE tarefas 
            SET titulo=$1, descricao=$2
            WHERE id = $3 AND usuario_id = $4
            RETURNING *;`,
            // O SQL tem 4 placeholders ($1 a $4), então precisa de 4 valores.
            // Antes passava só 3 e o Postgres dava erro 500 ("no parameter $4").
            // O $4 é o dono da tarefa, vindo do token (não do corpo da requisição):
            // assim, a tarefa de outro usuário não é encontrada e devolve 404.
            // "descricao ?? ''" evita enviar NULL quando a descrição não vem.
            [titulo, descricao ?? "", id, req.usuario.id]);

        // Verifica 
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
            tipo: "error", // o frontend lê "tipo"; sem ele o erro vinha fora do padrão
            mensagem: "Erro ao atualizar tarefa."
        });
    };
});

// Mesmo motivo do PUT: precisa do token para saber quem está apagando.
// Sem "autenticar", qualquer pessoa apagaria a tarefa de qualquer usuário.
app.delete("/tarefas/:id", autenticar, async (req, res) => {
    try {

        const { id } = req.params;

        const query = await executarSQL(
            `DELETE FROM tarefas
             WHERE id = $1 AND usuario_id = $2
             RETURNING *;`,
            // O SQL usa $1 (id) e $2 (dono), então precisa dos dois valores.
            // Antes passava só [id] e dava erro 500. Filtrar pelo dono faz a
            // tarefa de outro usuário devolver 404 e continuar no banco.
            [id, req.usuario.id]
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
            tipo: "error", // mantém o padrão de resposta das demais rotas
            mensagem: "Erro ao excluir tarefa."
        });
    }
});


// Se nenhuma rota for encontrada, aplicação bate nessa rota
app.use((req, res) => {
    res.status(404).send("Rota não encontrada");
});

// Escutando as rotas, porta de entrada das rotas
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor on: http://localhost:${PORT}`);
});