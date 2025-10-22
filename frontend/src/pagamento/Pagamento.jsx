import "./Pagamento.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../context/CartContext/CartContext";
import { CreditCard, QrCode, FileText } from "lucide-react"; // ícones bonitos

export default function Pagamento() {
  const navigate = useNavigate();
  const { total } = useCart();
  const [metodo, setMetodo] = useState(null);

  const handleContinuar = () => {
    if (metodo) {
      navigate(`/checkout?metodo=${metodo}`);
    }
  };

  function handleVoltar() {
    navigate("/carrinho");
  }

  return (
    <div className="pagamento-container">
      <h2 className="titulo">
        💳 Escolha a forma de pagamento
      </h2>

      <div className="resumo">
        <p>Total da compra:</p>
        <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
      </div>

      <div className="opcoes">
        <div
          className={`opcao ${metodo === "cartao" ? "selecionado" : ""}`}
          onClick={() => setMetodo("cartao")}
        >
          <CreditCard size={40} />
          <h3>Cartão de Crédito</h3>
          <p>Pague em até 12x com cartão de crédito</p>
        </div>

        <div
          className={`opcao ${metodo === "pix" ? "selecionado" : ""}`}
          onClick={() => setMetodo("pix")}
        >
          <QrCode size={40} />
          <h3>Pix</h3>
          <p>Pagamento instantâneo e sem taxas</p>
        </div>

        <div
          className={`opcao ${metodo === "boleto" ? "selecionado" : ""}`}
          onClick={() => setMetodo("boleto")}
        >
          <FileText size={40} />
          <h3>Boleto Bancário</h3>
          <p>Imprima e pague no banco ou lotérica</p>
        </div>
      </div>

      <div className="acoes">
        <button
          className={`continuar ${metodo ? "ativo" : ""}`}
          onClick={handleContinuar}
          disabled={!metodo}
        >
          Continuar
        </button>

        <button className="voltar" onClick={handleVoltar}>
          Voltar ao carrinho
        </button>
      </div>
    </div>
  );
}
