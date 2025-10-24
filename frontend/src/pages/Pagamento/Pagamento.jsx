import "./Pagamento.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "../../context/CartContext/CartContext";
import { QrCode } from "lucide-react";
import QRCode from "react-qr-code"; // npm install react-qr-code

export default function Pagamento() {
  const navigate = useNavigate();
  const { total } = useCart();
  const [metodo, setMetodo] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(false);

  const handleContinuar = () => {
    if (metodo === "pix") {
      setMostrarQR(true);
    }
  };

  function handleVoltar() {
    navigate("/carrinho");
  }

  const fecharPopup = () => {
    setMostrarQR(false);
  };

  return (
    <div className="pagamento-container">
      <h2 className="titulo">💳 Escolha a forma de pagamento</h2>

      <div className="resumo">
        <p>Total da compra:</p>
        <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
      </div>

      <div className="opcoes">
        <div
          className={`opcao ${metodo === "pix" ? "selecionado" : ""}`}
          onClick={() => setMetodo("pix")}
        >
          <QrCode size={40} />
          <h3>Pix</h3>
          <p>Pagamento instantâneo e sem taxas</p>
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

      {mostrarQR && (
        <div className="popup-overlay" onClick={fecharPopup}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <h3>Escaneie o QR Code para pagar</h3>
            <QRCode
              value={`Pagamento de R$ ${total.toFixed(2)}`}
              size={180}
            />
            <p>Após o pagamento, seu pedido será confirmado automaticamente.</p>
            <button onClick={fecharPopup} className="fechar">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
