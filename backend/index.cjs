require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mercadopago = require("mercadopago");
const multer = require("multer");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

// ==================== CONFIG MERCADO PAGO ====================
mercadopago.configurations.setAccessToken(
  process.env.MERCADO_PAGO_ACCESS_TOKEN
);

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
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ==================== CONEXÃO BANCO ====================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
pool.on("error", (err) => console.error("Erro no pool do banco:", err));

// ==================== UPLOAD IMAGEM SUPABASE ====================
async function uploadImagem(fileBuffer) {
  const webpBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
  const nomeArquivo = `${Date.now()}.webp`;

  const { error } = await supabase.storage
    .from("eventos")
    .upload(`imagens/${nomeArquivo}`, webpBuffer, {
      contentType: "image/webp",
    });
  if (error) throw error;

  const { data: publicData } = supabase.storage
    .from("eventos")
    .getPublicUrl(`imagens/${nomeArquivo}`);
  return publicData.publicUrl;
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
    return res.status(401).json({ erro: "Token inválido" });
  }
}

async function verificarOrganizador(req, res, next) {
  try {
    const { rows } = await pool.query(
      "SELECT organizador FROM usuarios WHERE id = $1",
      [req.usuarioId]
    );
    if (rows.length === 0 || rows[0].organizador !== "S") {
      return res.status(403).json({ erro: "Acesso restrito a organizadores" });
    }
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

// Públicos
app.get("/api/eventos", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, titulo, descricao, data_evento, local, categoria, imagem FROM eventos ORDER BY data_evento ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar eventos:", err);
    res.status(500).json({ erro: "Erro ao buscar eventos" });
  }
});

// Exclusivos de organizador
app.post(
  "/api/organizador/eventos",
  autenticarToken,
  verificarOrganizador,
  upload.single("imagem"),
  async (req, res) => {
    const { titulo, descricao, data_evento, local, categoria } = req.body;
    if (!titulo || !descricao || !data_evento || !local || !categoria)
      return res.status(400).json({ erro: "Preencha todos os campos" });

    try {
      let imagemUrl = null;
      if (req.file) imagemUrl = await uploadImagem(req.file.buffer);

      await pool.query(
        `INSERT INTO eventos (titulo, descricao, data_evento, local, categoria, imagem, organizador_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          titulo,
          descricao,
          data_evento,
          local,
          categoria,
          imagemUrl,
          req.usuarioId,
        ]
      );

      res.json({ mensagem: "Evento criado com sucesso" });
    } catch (err) {
      console.error("Erro ao criar evento:", err);
      res.status(500).json({ erro: "Erro ao criar evento" });
    }
  }
);

app.get(
  "/api/organizador/eventos",
  autenticarToken,
  verificarOrganizador,
  async (req, res) => {
    try {
      const { rows } = await pool.query(
        "SELECT * FROM eventos WHERE organizador_id = $1 ORDER BY data_evento ASC",
        [req.usuarioId]
      );
      res.json(rows);
    } catch (err) {
      console.error("Erro ao buscar eventos do organizador:", err);
      res.status(500).json({ erro: "Erro ao buscar eventos" });
    }
  }
);

// ==================== SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor rodando em http://localhost:${PORT}`)
);
