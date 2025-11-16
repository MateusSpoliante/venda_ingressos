require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");
const { setupSwagger } = require("./swaggerConfig.js");

// ==================== CONFIG SUPABASE ====================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==================== CONFIG EXPRESS ====================
const app = express();
app.use(cors());
app.use(express.json());
setupSwagger(app);

// ==================== UPLOAD (memória) ====================
const upload = multer({ storage: multer.memoryStorage() });

// ==================== CONEXÃO BANCO ====================
// Ajustes para pool mais resiliente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Erro no pool do banco:", err);
  // tenta reconectar caso seja encerramento do DB
  if (
    err.code === "57P01" ||
    (err.message && err.message.includes("db_termination"))
  ) {
    console.warn("Tentando reconectar ao banco...");
    setTimeout(async () => {
      try {
        const client = await pool.connect();
        console.log("Reconexão bem-sucedida com o banco de dados!");
        client.release();
      } catch (error) {
        console.error("Falha ao reconectar ao banco:", error?.message || error);
      }
    }, 5000);
  }
});

// ==================== FUNÇÃO UPLOAD IMAGEM SUPABASE ====================
async function uploadImagem(fileBuffer) {
  const webpBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
  const nomeArquivo = `${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from("eventos")
    .upload(`imagens/${nomeArquivo}`, webpBuffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // getPublicUrl é síncrono na maioria das versões do supabase-js
  const { data } = supabase.storage
    .from("eventos")
    .getPublicUrl(`imagens/${nomeArquivo}`);
  return data?.publicUrl || null;
}

// ==================== MIDDLEWARES ====================
function autenticarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ erro: "Token ausente" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch (err) {
    console.error("Erro ao validar token:", err?.message || err);
    return res.status(401).json({ erro: "Token inválido" });
  }
}

async function verificarOrganizador(req, res, next) {
  try {
    const { rows } = await pool.query(
      "SELECT organizador FROM usuarios WHERE id = $1",
      [req.usuarioId]
    );
    if (rows.length === 0 || rows[0].organizador !== "S")
      return res.status(403).json({ erro: "Acesso restrito a organizadores" });
    next();
  } catch (err) {
    console.error("Erro ao verificar organizador:", err);
    res.status(500).json({ erro: "Erro interno na verificação" });
  }
}

// ==================== USUÁRIOS ====================
app.post("/api/cadastro", async (req, res) => {
  const { nome, cpfCnpj, email, senha, organizador = "N" } = req.body;
  if (!nome || !cpfCnpj || !email || !senha)
    return res.status(400).json({ erro: "Preencha todos os campos" });
  if (senha.length < 6)
    return res
      .status(400)
      .json({ erro: "A senha deve ter pelo menos 6 caracteres" });

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
      "INSERT INTO usuarios (nome, cpf_cnpj, email, senha, organizador) VALUES ($1, $2, $3, $4, $5)",
      [nome, cpfCnpj, email, hash, organizador]
    );
    res.json({ mensagem: "Usuário cadastrado com sucesso" });
  } catch (err) {
    console.error("Erro ao cadastrar:", err);
    res.status(500).json({ erro: "Erro interno ao cadastrar usuário" });
  }
});

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
    if (!senhaValida) return res.status(401).json({ erro: "Senha inválida" });

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });
    res.json({
      mensagem: "Login realizado com sucesso",
      token,
      nome: usuario.nome,
      cpfCnpj: usuario.cpf_cnpj,
      organizador: usuario.organizador,
    });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ erro: "Erro interno no servidor" });
  }
});

// ==================== EVENTOS ====================
app.get("/api/eventos", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        e.id, e.titulo, e.descricao, e.data_evento, e.categoria, e.estado, e.cidade, e.local, e.imagem,
        u.nome AS organizador_nome
      FROM eventos e
      JOIN usuarios u ON e.organizador_id = u.id
      ORDER BY e.data_evento ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar eventos:", err);
    res.status(500).json({ erro: "Erro ao buscar eventos" });
  }
});

app.get(
  "/api/organizador/eventos",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, titulo, descricao, data_evento, categoria, estado, cidade, local, imagem
       FROM eventos WHERE organizador_id = $1 ORDER BY data_evento ASC`,
        [req.usuarioId]
      );
      res.json(rows);
    } catch (err) {
      console.error("Erro ao buscar eventos do organizador:", err);
      res.status(500).json({ erro: "Erro ao buscar eventos" });
    }
  }
);

app.post(
  "/api/organizador/eventos",
  autenticarToken,
  verificarOrganizador,
  upload.single("imagem"),
  async (req, res) => {
    const { titulo, descricao, data_evento, categoria, estado, cidade, local } =
      req.body;
    if (
      !titulo ||
      !descricao ||
      !data_evento ||
      !categoria ||
      !estado ||
      !cidade ||
      !local
    )
      return res
        .status(400)
        .json({ erro: "Preencha todos os campos obrigatórios" });

    try {
      let imagemUrl = null;
      if (req.file) imagemUrl = await uploadImagem(req.file.buffer);

      await pool.query(
        `INSERT INTO eventos (titulo, descricao, data_evento, categoria, estado, cidade, local, imagem, organizador_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          titulo,
          descricao,
          data_evento,
          categoria,
          estado,
          cidade,
          local,
          imagemUrl,
          req.usuarioId,
        ]
      );

      res.json({ mensagem: "Evento criado com sucesso" });
    } catch (err) {
      console.error("Erro ao criar evento:", err);
      res.status(500).json({ erro: "Erro interno ao criar evento" });
    }
  }
);

app.put(
  "/api/organizador/eventos/:id",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, data_evento, categoria, local } = req.body;
    if (!titulo || !descricao || !data_evento || !categoria || !local)
      return res
        .status(400)
        .json({ erro: "Preencha todos os campos obrigatórios" });

    try {
      const { rowCount } = await pool.query(
        `UPDATE eventos SET titulo = $1, descricao = $2, data_evento = $3, categoria = $4, local = $5
       WHERE id = $6 AND organizador_id = $7`,
        [titulo, descricao, data_evento, categoria, local, id, req.usuarioId]
      );
      if (rowCount === 0)
        return res
          .status(404)
          .json({ erro: "Evento não encontrado ou sem permissão" });
      res.json({ mensagem: "Evento atualizado com sucesso" });
    } catch (err) {
      console.error("Erro ao atualizar evento:", err);
      res.status(500).json({ erro: "Erro ao atualizar evento" });
    }
  }
);

app.get("/api/eventos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT e.id, e.titulo, e.descricao, e.data_evento, e.categoria, e.estado, e.cidade, e.local, e.imagem,
              u.nome AS organizador_nome
       FROM eventos e JOIN usuarios u ON e.organizador_id = u.id WHERE e.id = $1`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ erro: "Evento não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar evento:", err);
    res.status(500).json({ erro: "Erro interno ao buscar evento" });
  }
});

app.delete(
  "/api/organizador/eventos/:id",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    const { id } = req.params;
    try {
      const { rowCount } = await pool.query(
        "DELETE FROM eventos WHERE id = $1 AND organizador_id = $2",
        [id, req.usuarioId]
      );
      if (rowCount === 0)
        return res
          .status(404)
          .json({ erro: "Evento não encontrado ou sem permissão" });
      res.json({ mensagem: "Evento excluído com sucesso" });
    } catch (err) {
      console.error("Erro ao excluir evento:", err);
      res.status(500).json({ erro: "Erro ao excluir evento" });
    }
  }
);

// ==================== INGRESSOS ====================
app.get("/api/ingressos/:eventoId", autenticarToken, async (req, res) => {
  const { eventoId } = req.params;
  const usuarioId = req.usuarioId;

  try {
    const { rows } = await pool.query(
      `SELECT 
         i.id,
         i.evento_id,
         i.tipo_ingresso,
         i.preco,
         i.quantidade,
         i.limite_por_cpf,
         COALESCE(SUM(pi.quantidade), 0) AS quantidade_comprada_pelo_cpf
       FROM ingressos i
       LEFT JOIN pedido_itens pi
         ON i.id = pi.ingresso_id
       LEFT JOIN pedidos p
         ON pi.pedido_id = p.id AND p.usuario_id = $2
       WHERE i.evento_id = $1
       GROUP BY i.id`,
      [eventoId, usuarioId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar ingressos:", err);
    res.status(500).json({ erro: "Erro ao buscar ingressos" });
  }
});

app.post(
  "/api/organizador/ingressos",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    const { evento_id, tipo_ingresso, preco, quantidade, limite_por_cpf } =
      req.body;

    if (!evento_id || !tipo_ingresso || !preco || !quantidade)
      return res
        .status(400)
        .json({ erro: "Preencha todos os campos obrigatórios" });

    try {
      await pool.query(
        `INSERT INTO ingressos (evento_id, tipo_ingresso, preco, quantidade, limite_por_cpf) 
         VALUES ($1, $2, $3, $4, $5)`,
        [evento_id, tipo_ingresso, preco, quantidade, limite_por_cpf || 0]
      );

      res.json({ mensagem: "Ingresso criado com sucesso" });
    } catch (err) {
      console.error("Erro ao criar ingresso:", err);
      res.status(500).json({ erro: "Erro ao criar ingresso" });
    }
  }
);

// ==================== BUSCA LOCAIS (OpenStreetMap) ====================
// Nota: se seu Node for < 18, instale `node-fetch` e importe aqui.
// Ex.: npm install node-fetch
app.post("/buscar-locais", async (req, res) => {
  const { texto } = req.body;
  try {
    if (typeof fetch === "undefined") {
      throw new Error(
        "fetch não disponível no runtime. Use Node 18+ ou instale node-fetch."
      );
    }
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        texto
      )}`,
      {
        headers: { "User-Agent": "venda-ingressos/1.0 (seu-email@dominio)" },
      }
    );
    const data = await response.json();
    const nomes = data
      .map((item) => item.display_name?.split(",")[0]?.trim())
      .filter(Boolean);
    res.json({ locais: nomes });
  } catch (error) {
    console.error("Erro ao buscar locais:", error);
    res.status(500).json({ erro: "Erro ao buscar locais" });
  }
});

// ==================== PEDIDOS ====================
// ==================== PEDIDOS ====================
app.post("/api/pedidos", autenticarToken, async (req, res) => {
  const { itens } = req.body;
  if (!Array.isArray(itens) || itens.length === 0)
    return res.status(400).json({ erro: "Lista de itens inválida" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verifica limite por ingresso e calcula valor total
    let valor_total = 0;

    for (const item of itens) {
      // Busca ingresso e limite
      const ingressoRes = await client.query(
        "SELECT quantidade, limite_por_cpf FROM ingressos WHERE id = $1",
        [item.ingresso_id]
      );
      if (ingressoRes.rows.length === 0)
        throw new Error(`Ingresso ID ${item.ingresso_id} não encontrado`);

      const ingresso = ingressoRes.rows[0];

      // Quantidade disponível
      if (ingresso.quantidade < item.quantidade)
        throw new Error(`Ingressos insuficientes para ID ${item.ingresso_id}`);

      // Verifica total comprado + atual
      const { rows: totalComprado } = await client.query(
        `SELECT COALESCE(SUM(pi.quantidade),0) AS total
         FROM pedido_itens pi
         JOIN pedidos p ON pi.pedido_id = p.id
         WHERE pi.ingresso_id = $1 AND p.usuario_id = $2`,
        [item.ingresso_id, req.usuarioId]
      );
      const jaComprado = parseInt(totalComprado[0].total, 10);

      if (
        ingresso.limite_por_cpf &&
        jaComprado + item.quantidade > ingresso.limite_por_cpf
      ) {
        throw new Error(
          `Você atingiu o limite de ${ingresso.limite_por_cpf} para este ingresso (já comprou ${jaComprado})`
        );
      }

      valor_total += item.quantidade * item.preco_unitario;
    }

    // Cria pedido
    const pedidoRes = await client.query(
      `INSERT INTO pedidos (usuario_id, data_pedido, status_pagamento, valor_total)
       VALUES ($1, NOW(), 'pendente', $2) RETURNING id`,
      [req.usuarioId, valor_total]
    );
    const pedidoId = pedidoRes.rows[0].id;

    // Insere itens e atualiza estoque
    for (const item of itens) {
      await client.query(
        `INSERT INTO pedido_itens (pedido_id, ingresso_id, quantidade, preco_unitario)
         VALUES ($1, $2, $3, $4)`,
        [pedidoId, item.ingresso_id, item.quantidade, item.preco_unitario]
      );

      await client.query(
        `UPDATE ingressos SET quantidade = quantidade - $1 WHERE id = $2`,
        [item.quantidade, item.ingresso_id]
      );
    }

    await client.query("COMMIT");
    res.json({ mensagem: "Pedido criado com sucesso", pedido_id: pedidoId });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ erro: err.message || "Erro ao criar pedido" });
  } finally {
    client.release();
  }
});

app.get("/api/pedidos/meus", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        p.id AS pedido_id,
        p.data_pedido,
        p.status_pagamento,
        p.valor_total,
        json_agg(
          json_build_object(
            'ingresso_id', pi.ingresso_id,
            'quantidade', pi.quantidade,
            'preco_unitario', pi.preco_unitario,
            'tipo_ingresso', i.tipo_ingresso,
            'evento_id', e.id,
            'evento_titulo', e.titulo,
            'evento_imagem', e.imagem
          )
        ) AS itens
      FROM pedidos p
      JOIN pedido_itens pi ON p.id = pi.pedido_id
      JOIN ingressos i ON i.id = pi.ingresso_id
      JOIN eventos e ON e.id = i.evento_id
      WHERE p.usuario_id = $1
      GROUP BY p.id
      ORDER BY p.data_pedido DESC`,
      [req.usuarioId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar pedidos:", err);
    res.status(500).json({ erro: "Erro ao buscar pedidos" });
  }
});

app.put("/api/pedidos/:id/status", autenticarToken, async (req, res) => {
  const { id } = req.params;
  const { status_pagamento } = req.body;
  if (!["pendente", "pago"].includes(status_pagamento))
    return res
      .status(400)
      .json({ erro: "Status inválido (use pendente ou pago)" });

  try {
    const { rowCount } = await pool.query(
      `UPDATE pedidos SET status_pagamento = $1 WHERE id = $2 AND usuario_id = $3`,
      [status_pagamento, id, req.usuarioId]
    );
    if (rowCount === 0)
      return res
        .status(404)
        .json({ erro: "Pedido não encontrado ou sem permissão" });
    res.json({ mensagem: "Status atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar status do pedido:", err);
    res.status(500).json({ erro: "Erro ao atualizar status do pedido" });
  }
});

app.get(
  "/api/organizador/pedidos",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT p.id, u.nome AS usuario_nome, p.data_pedido, p.status_pagamento, p.valor_total
       FROM pedidos p JOIN usuarios u ON p.usuario_id = u.id
       ORDER BY p.data_pedido DESC`
      );
      res.json(rows);
    } catch (err) {
      console.error("Erro ao buscar pedidos (organizador):", err);
      res.status(500).json({ erro: "Erro ao buscar pedidos" });
    }
  }
);

app.get("/api/vendas/organizador", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT 
  e.id AS evento_id,
  e.titulo AS evento_titulo,
  e.imagem AS evento_imagem,
  i.id AS ingresso_id,
  i.tipo_ingresso,
  pi.quantidade,
  pi.preco_unitario,
  p.id AS pedido_id,
  p.usuario_id,
  p.data_pedido,
  p.status_pagamento,
  p.valor_total
FROM pedidos p
JOIN pedido_itens pi ON p.id = pi.pedido_id
JOIN ingressos i ON pi.ingresso_id = i.id
JOIN eventos e ON i.evento_id = e.id
WHERE e.organizador_id = $1
ORDER BY e.titulo ASC;

      `,
      [req.usuarioId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar vendas do organizador:", err);
    res.status(500).json({ erro: "Erro ao buscar vendas do organizador" });
  }
});

// ==================== SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
