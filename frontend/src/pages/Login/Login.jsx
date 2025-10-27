import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { UserCheck, UserRoundPlus } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLoading(true);

    try {
      const resposta = await fetch(
        `${import.meta.env.VITE_API_URL}/api/login`, // Vite
        // `${process.env.REACT_APP_API_URL}/api/login`, // CRA
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Erro ao fazer login");
        setLoading(false);
        return;
      }

      // salva token e nome no localStorage
      localStorage.setItem("token", dados.token);
      localStorage.setItem("nome", dados.nome);

      setSucesso(
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <UserCheck /> Login realizado com sucesso!
        </span>
      );

      setTimeout(() => {
        navigate("/home"); // vai direto pra Home protegida
      }, 1500);
    } catch (err) {
      console.error(err);
      setErro("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="body-login">
      <div className="login-container">
        <div className="logoDiv">
          <img src="/logo.webp" alt="logo" />
          <div className="ticket-title">
            <h1>OPEN TICKET</h1>
          </div>
        </div>
        <div className="divisoria"></div>

        <form className="login-box" onSubmit={handleLogin}>
          <h2>Login</h2>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Digite seu email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={loading}
            />
          </div>

          {erro && <div style={{ color: "red", marginTop: "8px" }}>{erro}</div>}
          {sucesso && (
            <div style={{ color: "green", marginTop: "8px" }}>{sucesso}</div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? <span className="spinner"></span> : "Entrar"}
          </button>

          <button
            type="button"
            className="btn-cad-login"
            onClick={() => navigate("/cadastro")}
            disabled={loading}
          >
            Criar Conta <UserRoundPlus size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
