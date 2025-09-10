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

  async function handleLogin(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    try {
      const resposta = await fetch("https://openticket.onrender/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Erro ao fazer login");
        return;
      }

      // Salva o token se quiser autenticação persistente
      // localStorage.setItem("token", dados.token);

      setSucesso(
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
        >
          <UserCheck /> Login realizado com sucesso!
        </span>
      );

      // Redireciona após pequeno delay (opcional)
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErro("Erro de conexão com o servidor");
    }
  }

  function irParaCadastro() {
    navigate("/cadastro");
  }

  return (
    <div className="login-container">
      <div className="logoDiv">
        <img src="/logo.png" alt="logo" />
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
          />
          <label>Senha</label>
          <input
            type="password"
            placeholder="Digite sua senha"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        {/* Exibe mensagens */}
        {erro && <div style={{ color: "red", marginTop: "8px" }}>{erro}</div>}
        {sucesso && (
          <div style={{ color: "green", marginTop: "8px" }}>{sucesso}</div>
        )}

        <button type="submit" className="btn-login">
          Entrar
        </button>
        <button
          type="button"
          className="btn-cad-login"
          onClick={irParaCadastro}
        >
          Criar Conta <UserRoundPlus size={20} />
        </button>
      </form>
    </div>
  );
}

export default Login;
