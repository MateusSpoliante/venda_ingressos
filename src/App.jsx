import { useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Login realizado com sucesso!\nEmail: ${email}\nSenha: ${senha}`);
  };

  return (
    <div className="login-container">
      <form className="login-box" onSubmit={handleSubmit}>
        <h2>LOGIN</h2>

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
      </form>
    </div>
  );
}

export default App;
