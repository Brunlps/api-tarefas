const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../index.js');

async function createServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  return { server, port };
}

test('usuário consegue fazer login com email e senha sem token', async () => {
  const { server, port } = await createServer();

  try {
    const email = `teste-${Date.now()}@mail.com`;
    const senha = '123456';

    const cadastroResp = await fetch(`http://localhost:${port}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Teste Login', email, senha })
    });

    const cadastro = await cadastroResp.json();
    assert.equal(cadastroResp.status, 201, JSON.stringify(cadastro));

    const loginResp = await fetch(`http://localhost:${port}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const login = await loginResp.json();

    assert.equal(loginResp.status, 200, JSON.stringify(login));
    assert.equal(login.usuario.email, email);
    assert.equal(login.token, undefined);
  } finally {
    await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});
