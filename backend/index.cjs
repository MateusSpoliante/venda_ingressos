require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mercadopago = require("mercadopago");

// ==================== CONFIG MERCADO PAGO (SDK v1) ====================
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

// ==================== CONFIG EXPRESS ====================
const app = express();
app.use(cors());
app.use(express.json());

// ==================== CONEXÃO BANCO (SUPABASE) ====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ==================== USUÁRIOS ====================
// Cadastro
app.post("/api/cadastro", async (req, res) => {
  const { nome, cpfCnpj, email, senha } = req.body;
  if (!nome || !cpfCnpj || !email || !senha)
    return res.status(400).json({ erro: "Preencha todos os campos" });
  if (senha.length < 6)
    return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres" });

  try {
    const emailExistente = await pool.query(
      "SELECT id FROM usuarios WHERE email = $1",
      [email]
    );
    if (emailExistente.rowCount > 0)
      return res.status(400).json({ erro: "Email já cadastrado!" });

    const cpfExistente = await pool.query(
      "SELECT id FROM usuarios WHERE cpf_cnpj = $1",
      [cpfCnpj]
    );
    if (cpfExistente.rowCount > 0)
      return res.status(400).json({ erro: "CPF/CNPJ já cadastrado!" });

    const hash = await bcrypt.hash(senha, 10);

    await pool.query(
      "INSERT INTO usuarios (nome, cpf_cnpj, email, senha) VALUES ($1, $2, $3, $4)",
      [nome, cpfCnpj, email, hash]
    );

    res.json({ mensagem: "Usuário cadastrado com sucesso" });
  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    res.status(500).json({ erro: "Erro interno ao cadastrar usuário" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha)
    return res.status(400).json({ erro: "Preencha email e senha" });

  try {
    const { rows } = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );
    const usuario = rows[0];
    if (!usuario)
      return res.status(401).json({ erro: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida)
      return res.status(401).json({ erro: "Senha inválida" });

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      mensagem: "Login realizado com sucesso",
      token,
      nome: usuario.nome,
      cpfCnpj: usuario.cpf_cnpj,
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// ==================== EVENTOS ====================
app.post("/api/eventos", async (req, res) => {
  const { titulo, descricao, data_evento, local, categoria } = req.body;
  if (!titulo || !descricao || !data_evento || !local || !categoria)
    return res.status(400).json({ erro: "Preencha todos os campos" });

  try {
    await pool.query(
      "INSERT INTO eventos (titulo, descricao, data_evento, local, categoria) VALUES ($1, $2, $3, $4, $5)",
      [titulo, descricao, data_evento, local, categoria]
    );
    res.json({ mensagem: "Evento criado com sucesso" });
  } catch (err) {
    console.error("Erro ao criar evento:", err);
    res.status(500).json({ erro: "Erro ao criar evento" });
  }
});

app.get("/api/eventos", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, titulo, descricao, data_evento, local, categoria FROM eventos ORDER BY data_evento ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar eventos:", err);
    res.status(500).json({ erro: "Erro ao buscar eventos" });
  }
});

// ==================== INGRESSOS ====================
app.post("/api/ingressos", async (req, res) => {
  const { evento_id, tipo_ingresso, preco, quantidade } = req.body;
  if (!evento_id || !tipo_ingresso || !preco || !quantidade)
    return res.status(400).json({ erro: "Preencha todos os campos" });

  try {
    await pool.query(
      "INSERT INTO ingressos (evento_id, tipo_ingresso, preco, quantidade) VALUES ($1, $2, $3, $4)",
      [evento_id, tipo_ingresso, preco, quantidade]
    );
    res.json({ mensagem: "Ingresso cadastrado com sucesso" });
  } catch (err) {
    console.error("Erro ao cadastrar ingresso:", err);
    res.status(500).json({ erro: "Erro ao cadastrar ingresso" });
  }
});

app.get("/api/ingressos/:eventoId", async (req, res) => {
  const { eventoId } = req.params;
  try {
    const { rows } = await pool.query(
      "SELECT id, tipo_ingresso, preco, quantidade FROM ingressos WHERE evento_id = $1",
      [eventoId]
    );
    res.json(rows || []);
  } catch (err) {
    console.error("Erro ao buscar ingressos:", err);
    res.status(500).json({ erro: "Erro ao buscar ingressos" });
  }
});

// ==================== PEDIDOS ====================
app.post("/api/pedidos", async (req, res) => {
  const { usuarioId, itens } = req.body;
  if (!usuarioId || !itens?.length)
    return res.status(400).json({ erro: "Dados incompletos" });

  try {
    const usuarioRes = await pool.query(
      "SELECT cpf_cnpj FROM usuarios WHERE id = $1",
      [usuarioId]
    );
    const usuario = usuarioRes.rows[0];
    if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });

    for (const item of itens) {
      const existente = await pool.query(
        `SELECT 1 FROM pedido_itens pi
         JOIN pedidos p ON p.id = pi.pedido_id
         JOIN ingressos i ON i.id = pi.ingresso_id
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE u.cpf_cnpj = $1 AND i.evento_id = $2`,
        [usuario.cpf_cnpj, item.evento_id]
      );
      if (existente.rowCount > 0)
        return res.status(400).json({ erro: "Você já comprou ingresso para este evento." });
    }

    const total = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0);
    const novoPedido = await pool.query(
      "INSERT INTO pedidos (usuario_id, data_pedido, valor_total, status_pagamento) VALUES ($1, NOW(), $2, $3) RETURNING id, data_pedido, valor_total",
      [usuarioId, total, "pendente"]
    );

    const pedidoId = novoPedido.rows[0].id;
    for (const item of itens) {
      await pool.query(
        "INSERT INTO pedido_itens (pedido_id, ingresso_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
        [pedidoId, item.ingresso_id, item.quantidade, item.preco]
      );
    }

    res.json({ mensagem: "Pedido realizado com sucesso", pedido: novoPedido.rows[0] });
  } catch (err) {
    console.error("Erro ao criar pedido:", err);
    res.status(500).json({ erro: "Erro interno ao criar pedido" });
  }
});

// ==================== PIX ====================
app.post("/api/pix", async (req, res) => {
  const { pedidoId, valor } = req.body;
  if (!pedidoId || !valor)
    return res.status(400).json({ erro: "Pedido ou valor inválido" });

  try {
    const paymentData = {
      transaction_amount: Number(valor),
      description: `Pedido #${pedidoId}`,
      payment_method_id: "pix",
      payer: { email: "cliente@email.com" },
    };

    // Cria pagamento PIX usando SDK v1
    const payment = await mercadopago.payment.create(paymentData);

    const qrCode = payment.response.point_of_interaction.transaction_data.qr_code;
    const qrCodeBase64 = payment.response.point_of_interaction.transaction_data.qr_code_base64;

    res.json({ qrCode, qrCodeBase64 });
  } catch (err) {
    console.error("Erro ao gerar PIX:", err);
    res.status(500).json({ erro: "Erro ao gerar PIX" });
  }
});

// ==================== SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
