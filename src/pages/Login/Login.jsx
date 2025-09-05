import { Link } from "react-router-dom";
import "./Login.css";
import { UserRoundPlus } from "lucide-react";

function Login() {
  return (
    <div className="login-container">
      <div className="logoDiv">
        <img src="/logo.png" alt="logo" />
        <div className="ticket-title">
          <h1>OPEN TICKET</h1>
        </div>
      </div>

      <div className="divisoria"></div>

      <form className="login-box">
        <h2>Login</h2>

        <div className="input-group">
          {/* EMAIL */}
          <label>Email</label>
          <input type="email" placeholder="Digite seu email" required />

          {/* SENHA */}
          <label>Senha</label>
          <input type="password" placeholder="Digite sua senha" required />
        </div>
        <button type="submit" className="btn-login">
          Entrar
        </button>
        <Link to="/cadastro" className="link-cad">
          <button type="button" className="btn-cad-login">
            Criar Conta <UserRoundPlus size={20}/>
          </button>
        </Link>
      </form>
    </div>
  );
}

export default Login;
