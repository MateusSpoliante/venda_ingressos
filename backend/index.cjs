require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

// ==================== CONFIG SUPABASE ====================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==================== CONFIG EXPRESS ====================
const app = express();
app.use(cors());
app.use(express.json());

// ==================== UPLOAD (memória) ====================
const upload = multer({ storage: multer.memoryStorage() });

// ==================== CONEXÃO BANCO ====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on("error", (err) => {
  console.error("Erro no pool do banco:", err);
  if (err.code === "57P01" || err.message.includes("db_termination")) {
    console.warn("Tentando reconectar ao banco...");
    setTimeout(() => pool.connect().catch(() => {}), 5000);
  }
});

// ==================== FUNÇÃO UPLOAD IMAGEM SUPABASE ====================
async function uploadImagem(fileBuffer) {
  const webpBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
  const nomeArquivo = `${Date.now()}.webp`;

  const { error } = await supabase.storage
    .from("eventos")
    .upload(`imagens/${nomeArquivo}`, webpBuffer, {
      contentType: "image/webp",
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from("eventos")
    .getPublicUrl(`imagens/${nomeArquivo}`);
  return data.publicUrl;
}

// ==================== MIDDLEWARES ====================
function autenticarToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ erro: "Token ausente" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuarioId = decoded.id;
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido" });
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

// Listar todos os eventos (público)
app.get("/api/eventos", async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        e.id,
        e.titulo,
        e.descricao,
        e.data_evento,
        e.categoria,
        e.estado,
        e.cidade,
        e.local,
        e.imagem,
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

// Listar eventos do organizador logado
app.get(
  "/api/organizador/eventos",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT 
          id, titulo, descricao, data_evento, categoria, estado, cidade, local, imagem
         FROM eventos 
         WHERE organizador_id = $1 
         ORDER BY data_evento ASC`,
        [req.usuarioId]
      );
      res.json(rows);
    } catch (err) {
      console.error("Erro ao buscar eventos do organizador:", err);
      res.status(500).json({ erro: "Erro ao buscar eventos" });
    }
  }
);

// Criar evento (somente organizador)
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
    ) {
      return res
        .status(400)
        .json({ erro: "Preencha todos os campos obrigatórios" });
    }

    try {
      let imagemUrl = null;
      if (req.file) imagemUrl = await uploadImagem(req.file.buffer);

      await pool.query(
        `INSERT INTO eventos 
        (titulo, descricao, data_evento, categoria, estado, cidade, local, imagem, organizador_id)
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

// Atualizar evento (somente do próprio organizador)
app.put(
  "/api/organizador/eventos/:id",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    const { id } = req.params;
    const { titulo, descricao, data_evento, categoria, local } = req.body;

    if (!titulo || !descricao || !data_evento || !categoria || !local) {
      return res
        .status(400)
        .json({ erro: "Preencha todos os campos obrigatórios" });
    }

    try {
      const { rowCount } = await pool.query(
        `UPDATE eventos 
         SET titulo = $1, descricao = $2, data_evento = $3, categoria = $4, local = $5 
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

// Buscar evento por ID (público ou organizador)
app.get("/api/eventos/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT 
        e.id,
        e.titulo,
        e.descricao,
        e.data_evento,
        e.categoria,
        e.estado,
        e.cidade,
        e.local,
        e.imagem,
        u.nome AS organizador_nome
       FROM eventos e
       JOIN usuarios u ON e.organizador_id = u.id
       WHERE e.id = $1`,
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

// Excluir evento (somente do próprio organizador)
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

// Listar ingressos de um evento
app.get("/api/ingressos/:eventoId", async (req, res) => {
  const { eventoId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT id, evento_id, tipo_ingresso, preco, quantidade 
       FROM ingressos 
       WHERE evento_id = $1`,
      [eventoId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar ingressos:", err);
    res.status(500).json({ erro: "Erro ao buscar ingressos" });
  }
});

// Criar ingressos para um evento (organizador)
app.post(
  "/api/organizador/ingressos",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    const { evento_id, tipo_ingresso, preco, quantidade } = req.body;

    if (!evento_id || !tipo_ingresso || !preco || !quantidade)
      return res
        .status(400)
        .json({ erro: "Preencha todos os campos obrigatórios" });

    try {
      await pool.query(
        `INSERT INTO ingressos (evento_id, tipo_ingresso, preco, quantidade)
         VALUES ($1, $2, $3, $4)`,
        [evento_id, tipo_ingresso, preco, quantidade]
      );

      res.json({ mensagem: "Ingresso criado com sucesso" });
    } catch (err) {
      console.error("Erro ao criar ingresso:", err);
      res.status(500).json({ erro: "Erro ao criar ingresso" });
    }
  }
);

app.get("/api/ingressos/:eventoId", async (req, res) => {
  const { eventoId } = req.params;

  try {
    const { rows } = await pool.query(
      "SELECT id, evento_id, tipo_ingresso, preco, quantidade FROM ingressos WHERE evento_id = $1",
      [eventoId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar ingressos:", err);
    res.status(500).json({ erro: "Erro ao buscar ingressos" });
  }
});

// ==================== BUSCA LOCAIS (OpenStreetMap) ====================
app.post("/buscar-locais", async (req, res) => {
  const { texto } = req.body;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        texto
      )}`
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

// ==================== SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
