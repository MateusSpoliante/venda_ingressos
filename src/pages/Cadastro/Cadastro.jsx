import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Cadastro.css";
import { ArrowLeft } from "lucide-react";

function Cadastro() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  // Função que chama o backend para cadastrar
  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const res = await fetch("http://localhost:3000/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.erro || "Erro ao cadastrar");
      } else {
        alert(data.mensagem);
        navigate("/"); // redireciona para login após cadastro
      }
    } catch (err) {
      console.log(err);
      setErro("Erro ao conectar com o servidor");
    }
  };

  return (
    <div className="cad-container">

      <form className="cad-box" onSubmit={handleCadastro}>
        <h2>Cadastro</h2>

        <div className="input-group-cad">
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

        {erro && <p style={{ color: "red" }}>{erro}</p>}

        <button type="submit" className="btn-cad">
          Cadastrar
        </button>

        <Link to="/" className="link-cad">
          <button type="button" className="btn-voltar">
            <ArrowLeft size={20}/> Já tenho uma conta
          </button>
        </Link>
      </form>
    </div>
  );
}

export default Cadastro;
