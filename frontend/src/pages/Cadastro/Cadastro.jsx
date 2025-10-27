import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cadastro.css";
import { ArrowLeft } from "lucide-react";

function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("cpf");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const valorLimpo = cpfCnpj.replace(/\D/g, "");
    if (tipo === "cpf" && valorLimpo.length !== 11) {
      setErro("CPF deve ter 11 dígitos");
      return;
    }
    if (tipo === "cnpj" && valorLimpo.length !== 14) {
      setErro("CNPJ deve ter 14 dígitos");
      return;
    }

    try {
      const resposta = await fetch(
        `${import.meta.env.VITE_API_URL}/api/cadastro`, // Vite
        // `${process.env.REACT_APP_API_URL}/api/cadastro`, // CRA
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, cpfCnpj: valorLimpo, email, senha }),
        }
      );

      const data = await resposta.json();

      if (!resposta.ok) {
        setErro(data.erro || "Erro ao cadastrar");
      } else {
        setSucesso(data.mensagem);
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch {
      setErro("Erro ao conectar com o servidor");
    }
  };

  return (
    <body className="body-cad">
      <div className="cad-container">
        <form className="cad-box" onSubmit={handleCadastro}>
          <h2>Cadastro</h2>

          <div className="input-group-cad">
            <label>Nome</label>
            <input
              type="text"
              placeholder="Digite seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />

            <div className="cpf_cnpj_group">
              <label style={{ marginRight: "8px" }}>CPF/CNPJ:</label>
              <div className="radioGroup">
                <input
                  type="radio"
                  name="tipoUser"
                  id="cpf"
                  checked={tipo === "cpf"}
                  onChange={() => {
                    setTipo("cpf");
                    setCpfCnpj("");
                  }}
                />
                <label htmlFor="cpf">CPF</label>

                <input
                  type="radio"
                  name="tipoUser"
                  id="cnpj"
                  checked={tipo === "cnpj"}
                  onChange={() => {
                    setTipo("cnpj");
                    setCpfCnpj("");
                  }}
                />
                <label htmlFor="cnpj">CNPJ</label>
              </div>
            </div>

            <input
              type="text"
              placeholder={
                tipo === "cpf"
                  ? "Digite seu CPF (11 dígitos)"
                  : "Digite seu CNPJ (14 dígitos)"
              }
              value={cpfCnpj}
              onChange={(e) => setCpfCnpj(e.target.value)}
              required
            />

            <label>Email</label>
            <input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && <div style={{ color: "red", marginTop: "8px" }}>{erro}</div>}
          {sucesso && (
            <div style={{ color: "green", marginTop: "8px" }}>{sucesso}</div>
          )}

          <button type="submit" className="btn-cad">
            Cadastrar
          </button>

          <button
            type="button"
            className="btn-voltar"
            onClick={() => navigate("/login")}
          >
            <ArrowLeft size={20} /> Já tenho uma conta
          </button>
        </form>
      </div>
    </body>
  );
}

export default Cadastro;
