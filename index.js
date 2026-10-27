const express = require("express");
const executarSQL = require("./services");
const app = express();

app.get("/", (req, res) => {
    res.send("Olá mundo");
});

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

app.post("/usuarios", (req, res) => {
    res.send(`criar usuario`);
});

app.put("/usuarios", (req, res) => {
    res.send(`edita o usuario`);
});

app.delete("/usuarios", (req, res) => {
    res.send(`deleta o usuario`);
});



app.use((req, res) => {
    res.status(404).send("Rota não encontrada");
});

app.listen(3000, () => {
    console.log("Servidor on: http://localhost:3000");
});