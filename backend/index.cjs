const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// Configuração da conexão MySQL
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "hostbd25", // ajuste para sua senha do MySQL
  database: "venda_ingressos",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Rota de login
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    const usuario = rows[0];
    if (!usuario) return res.status(401).json({ erro: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ erro: "Senha inválida" });

    const token = jwt.sign({ id: usuario.id }, "seusegredo", { expiresIn: "1h" });
    res.json({ mensagem: "Login realizado com sucesso", token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

// Rota de cadastro
app.post("/cadastro", async (req, res) => {
  const { email, senha } = req.body;
  try {
    // 1. Verifica se já existe usuário com esse email
    const [rows] = await pool.query("SELECT id FROM usuarios WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ erro: "Email já Cadastrado!" });
    }

    // 2. Se não existir, cadastra
    const hash = await bcrypt.hash(senha, 10);
    await pool.query("INSERT INTO usuarios (email, senha) VALUES (?, ?)", [email, hash]);

    res.json({ mensagem: "Usuário cadastrado com sucesso" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
