require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// Conexão com banco (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Rota de cadastro
app.post("/api/cadastro", async (req, res) => {
  const { nome, cpfCnpj, email, senha } = req.body;

  if (!nome || !cpfCnpj || !email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres" });
  }

  try {
    // Verifica se email já existe
    const { rows: emailExistente } = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email]
    );
    if (emailExistente.length > 0) {
      return res.status(400).json({ erro: "Email já cadastrado!" });
    }

    // Verifica se CPF/CNPJ já existe
    const { rows: cpfExistente } = await pool.query(
      "SELECT id FROM usuarios WHERE cpf_cnpj = $1",
      [cpfCnpj]
    );
    if (cpfExistente.length > 0) {
      return res.status(400).json({ erro: "CPF/CNPJ já cadastrado!" });
    }

    const hash = await bcrypt.hash(senha, 10);

    // Insere usuário com CPF/CNPJ
    await pool.query(
      "INSERT INTO usuarios (nome, cpf_cnpj, email, senha) VALUES ($1, $2, $3, $4)",
      [nome, cpfCnpj, email, hash]
    );

    res.json({ mensagem: "Usuário cadastrado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao cadastrar usuário" });
  }
});

// Rota de login
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: "Preencha email e senha" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );
    const usuario = rows[0];
    if (!usuario)
      return res.status(401).json({ erro: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ erro: "Senha inválida" });

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({
      mensagem: "Login realizado com sucesso",
      token,
      nome: usuario.nome,
      cpfCnpj: usuario.cpf_cnpj, // opcional, se quiser enviar também
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro no servidor" });
  }
});


// Rota para criar evento
app.post("/api/eventos", async (req, res) => {
  const { titulo, descricao, data_evento, local, categoria } = req.body;

  if (!titulo || !descricao || !data_evento || !local || !categoria) {
    return res.status(400).json({ erro: "Preencha todos os campos" });
  }

  try {
    await pool.query(
      "INSERT INTO eventos (titulo, descricao, data_evento, local, categoria) VALUES ($1, $2, $3, $4, $5)",
      [titulo, descricao, data_evento, local, categoria]
    );

    res.json({ mensagem: "Evento criado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar evento" });
  }
});



// Rota para listar eventos
app.get("/api/eventos", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, titulo, descricao, data_evento, local, categoria FROM eventos ORDER BY data_evento ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar eventos" });
  }
});


// Iniciando servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
