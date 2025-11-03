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
mercadopago.configurations.setAccessToken(process.env.MERCADO_PAGO_ACCESS_TOKEN);

// ==================== CONFIG SUPABASE ====================
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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

// Listener global de erros do pool
pool.on("error", (err) => {
  console.error("Erro no pool do banco:", err);
});

// ==================== FUNÇÃO AUXILIAR PARA UPLOAD DE IMAGEM ====================
async function uploadImagem(fileBuffer) {
  const webpBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();
  const nomeArquivo = `${Date.now()}.webp`;

  const { error } = await supabase.storage
    .from("eventos")
    .upload(`imagens/${nomeArquivo}`, webpBuffer, { contentType: "image/webp", upsert: false });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("eventos")
    .getPublicUrl(`imagens/${nomeArquivo}`);

  return publicUrlData.publicUrl;
}

// ==================== USUÁRIOS ====================
app.post("/api/cadastro", async (req, res) => {
  const { nome, cpfCnpj, email, senha } = req.body;
  if (!nome || !cpfCnpj || !email || !senha)
    return res.status(400).json({ erro: "Preencha todos os campos" });
  if (senha.length < 6)
    return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres" });

  try {
    const emailExistente = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (emailExistente.rowCount > 0) return res.status(400).json({ erro: "Email já cadastrado!" });

    const cpfExistente = await pool.query("SELECT id FROM usuarios WHERE cpf_cnpj = $1", [cpfCnpj]);
    if (cpfExistente.rowCount > 0) return res.status(400).json({ erro: "CPF/CNPJ já cadastrado!" });

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

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: "Preencha email e senha" });

  try {
    const { rows } = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    const usuario = rows[0];
    if (!usuario) return res.status(401).json({ erro: "Usuário não encontrado" });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ erro: "Senha inválida" });

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
app.post("/api/eventos", upload.single("imagem"), async (req, res) => {
  const { titulo, descricao, data_evento, local, categoria } = req.body;
  if (!titulo || !descricao || !data_evento || !local || !categoria)
    return res.status(400).json({ erro: "Preencha todos os campos" });

  try {
    let imagemUrl = null;
    if (req.file) imagemUrl = await uploadImagem(req.file.buffer);

    await pool.query(
      "INSERT INTO eventos (titulo, descricao, data_evento, local, categoria, imagem) VALUES ($1, $2, $3, $4, $5, $6)",
      [titulo, descricao, data_evento, local, categoria, imagemUrl]
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
      "SELECT id, titulo, descricao, data_evento, local, categoria, imagem FROM eventos ORDER BY data_evento ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar eventos:", err);
    res.status(500).json({ erro: "Erro ao buscar eventos" });
  }
});

app.put("/api/eventos/:id", upload.single("imagem"), async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, data_evento, local, categoria } = req.body;
  if (!titulo || !descricao || !data_evento || !local || !categoria)
    return res.status(400).json({ erro: "Preencha todos os campos" });

  try {
    const { rows } = await pool.query("SELECT imagem FROM eventos WHERE id = $1", [id]);
    const eventoAtual = rows[0];
    if (!eventoAtual) return res.status(404).json({ erro: "Evento não encontrado" });

    let imagemUrl = eventoAtual.imagem;
    if (req.file) imagemUrl = await uploadImagem(req.file.buffer);

    await pool.query(
      `UPDATE eventos
       SET titulo = $1, descricao = $2, data_evento = $3, local = $4, categoria = $5, imagem = $6
       WHERE id = $7`,
      [titulo, descricao, data_evento, local, categoria, imagemUrl, id]
    );

    res.json({ mensagem: "Evento atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar evento:", err);
    res.status(500).json({ erro: "Erro ao atualizar evento" });
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
