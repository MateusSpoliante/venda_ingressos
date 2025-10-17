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

// Criar pedido
// Criar pedido (POST) ou buscar pedidos (GET)
app.route("/api/pedidos")
  .post(async (req, res) => {
    const { usuarioId, itens } = req.body;

    if (!usuarioId || !itens || itens.length === 0) {
      return res.status(400).json({ erro: "Dados incompletos" });
    }

    try {
      // 1️⃣ Pega o CPF do usuário
      const { rows: usuarioRows } = await pool.query(
        "SELECT cpf_cnpj FROM usuarios WHERE id = $1",
        [usuarioId]
      );
      if (!usuarioRows[0]) return res.status(404).json({ erro: "Usuário não encontrado" });
      const cpf = usuarioRows[0].cpf_cnpj;

      // 2️⃣ Verifica se o usuário já comprou algum ingresso do evento
      for (const item of itens) {
        const { rows: existente } = await pool.query(
          `SELECT pi.pedido_id
           FROM pedido_itens pi
           JOIN pedidos p ON pi.pedido_id = p.id
           JOIN tickets t ON pi.ticket_id = t.id
           JOIN usuarios u ON p.usuarioid = u.id
           WHERE u.cpf_cnpj = $1 AND t.eventoid = $2`,
          [cpf, item.eventoid] // precisa vir do frontend
        );
        if (existente.length > 0) {
          return res.status(400).json({ erro: `Você já comprou ingresso para o evento "${item.titulo}".` });
        }
      }

      // 3️⃣ Calcula valor total do pedido
      const total = itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

      // 4️⃣ Cria pedido
      const { rows } = await pool.query(
        "INSERT INTO pedidos (usuarioid, data_pedido, valor_total, status_pagamento) VALUES ($1, NOW(), $2, $3) RETURNING id, data_pedido, valor_total",
        [usuarioId, total, "pendente"] // status inicial
      );
      const pedidoId = rows[0].id;

      // 5️⃣ Cria itens do pedido
      for (const item of itens) {
        await pool.query(
          "INSERT INTO pedido_itens (pedido_id, ticket_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)",
          [pedidoId, item.ticket_id, item.quantidade, item.preco]
        );
      }

      res.json({ mensagem: "Pedido realizado com sucesso", pedido: rows[0] });

    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: "Erro ao criar pedido" });
    }
  })

  // Buscar pedidos do usuário
  .get(async (req, res) => {
    const { usuarioId } = req.query;
    if (!usuarioId) return res.status(400).json({ erro: "usuarioId faltando" });

    try {
      const { rows: pedidos } = await pool.query(
        "SELECT * FROM pedidos WHERE usuario_id = $1 ORDER BY data_pedido DESC",
        [usuarioId]
      );

      const pedidosComItens = [];
      for (const pedido of pedidos) {
        const { rows: itens } = await pool.query(
          `SELECT pi.id, pi.quantidade, pi.preco_unitario, e.titulo
           FROM pedido_itens pi
           JOIN eventos e ON pi.evento_id = e.id
           WHERE pi.pedido_id = $1`,
          [pedido.id]
        );
        pedidosComItens.push({ ...pedido, itens });
      }

      res.json(pedidosComItens);
    } catch (err) {
      console.error(err);
      res.status(500).json({ erro: "Erro ao buscar pedidos" });
    }
  });


// Iniciando servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
