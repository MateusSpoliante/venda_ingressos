import { useState } from "react";
import "./style/Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    /* alert(`Login realizado com sucesso!\nEmail: ${email}\nSenha: ${senha}`); */
    onLogin();
  };

  return (
    <div className="login-container">
      <div className="logoDiv">
        <img src="/logo.png" alt="logo" />
        <div className="ticket-title">
          <h1>OPEN TICKET</h1>
        </div>
      </div>

      <div className="divisoria"></div>

      <form className="login-box" onSubmit={handleSubmit}>
        <h2>Login</h2>

        <div className="input-group">
          {/* EMAIL */}
          <label>Email</label>
          <input
            type="email"
            placeholder="Digite seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* SENHA */}
          <label>Senha</label>
          <input
            type="password"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-login">
          Entrar
        </button>
        <button type="submit" className="btn-cad"> 
          Cadastrar
        </button>
      </form>
    </div>
  );
}

export default Login;
