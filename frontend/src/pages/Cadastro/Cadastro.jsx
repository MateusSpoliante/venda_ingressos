  import { useState } from "react";
  import { useNavigate } from "react-router-dom";
  import "./Cadastro.css";
  import { ArrowLeft } from "lucide-react";

  function Cadastro() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    const handleCadastro = async (e) => {
      e.preventDefault();
      setErro("");
      setSucesso("");

      try {
        const resposta = await fetch("http://localhost:3000/api/cadastro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });

        const data = await resposta.json();

        if (!resposta.ok) {
          setErro(data.erro || "Erro ao cadastrar");
        } else {
          setSucesso(data.mensagem);
          setTimeout(() => navigate("/"), 1500);
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
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={20} /> Já tenho uma conta
          </button>
        </form>
      </div>
    );
  }

  export default Cadastro;
