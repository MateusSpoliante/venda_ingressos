import { Link } from "react-router-dom";
import "./Cadastro.css";
import { ArrowLeft } from "lucide-react";

function Cadastro() {
  return (
    <div className="cad-container">
      <div className="logoDiv">
        <img src="/logo.png" alt="logo" />
        <div className="ticket-title">
          <h1>OPEN TICKET</h1>
        </div>
      </div>

      <div className="divisoria"></div>

      <form className="cad-box">
        <h2>Cadastro</h2>

        <div className="input-group-cad">
          {/* EMAIL */}
          <label>Email</label>
          <input type="email" placeholder="Digite seu email" required />

          {/* SENHA */}
          <label>Senha</label>
          <input type="password" placeholder="Digite sua senha" required />
        </div>
        <button type="submit" className="btn-cad">
          Cadastrar
        </button>
        <Link to="/" className="link-cad">
          <button className="btn-voltar">
            <ArrowLeft size={20}/> Já tenho uma conta
          </button>
        </Link>
      </form>
    </div>
  );
}

export default Cadastro;
