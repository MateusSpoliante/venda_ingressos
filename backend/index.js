import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sql from "./db.js"; // conexão postgres.js

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("⚠️ Defina JWT_SECRET no arquivo .env");
}

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Rota de cadastro
 */
app.post("/api/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ success: false, erro: "Preencha todos os campos!" });
  }

  try {
    // Verifica se já existe usuário com esse email
    const usuarios = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
    if (usuarios.length > 0) {
      return res.status(400).json({ success: false, erro: "Email já cadastrado!" });
    }

    // Criptografa senha
    const hash = await bcrypt.hash(senha, 10);

    // Insere usuário
    const [novoUsuario] = await sql`
      INSERT INTO usuarios (nome, email, senha)
      VALUES (${nome}, ${email}, ${hash})
      RETURNING id, nome, email
    `;

    res.status(201).json({
      success: true,
      mensagem: "Usuário cadastrado com sucesso",
      usuario: novoUsuario,
    });
  } catch (err) {
    console.error("❌ Erro no cadastro:", err);
    res.status(500).json({ success: false, erro: "Erro ao cadastrar usuário" });
  }
});

/**
 * Rota de login
 */
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ success: false, erro: "Preencha email e senha!" });
  }

  try {
    const usuarios = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    const usuario = usuarios[0];

    if (!usuario) {
      return res.status(401).json({ success: false, erro: "Usuário não encontrado" });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ success: false, erro: "Senha inválida" });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      mensagem: "Login realizado com sucesso",
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
  } catch (err) {
    console.error("❌ Erro no login:", err);
    res.status(500).json({ success: false, erro: "Erro no servidor" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
