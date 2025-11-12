import "./Pagamento.css";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../../context/CartContext/CartContext";
import { QrCode, CheckCircle2 } from "lucide-react";
import QRCode from "react-qr-code";

export default function Pagamento() {
  const navigate = useNavigate();
  const { total, cartItems, clearCart } = useCart();
  const [metodo, setMetodo] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [pagamentoConcluido, setPagamentoConcluido] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState("");

  const handleContinuar = () => {
    const codigoFakePix = `00020126360014BR.GOV.BCB.PIX0114+551199999999520400005303986540${total.toFixed(
      2
    )}5802BR5913Teste Comércio6009SAO PAULO62070503***6304ABCD`;

    setQrValue(codigoFakePix);
    setMostrarQR(true);
    setMensagemStatus("Aguardando pagamento...");

    // simula o pagamento após 3 segundos
    setTimeout(async () => {
      setMensagemStatus("Confirmando pagamento...");
      try {
        const itens = cartItems.map((item) => ({
          ingresso_id: item.ingresso_id || item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
        }));

        const token = localStorage.getItem("token");
        console.log("=== INICIANDO CRIAÇÃO DE PEDIDO ===");
        console.log("Token:", token);
        console.log("Itens enviados:", itens);

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ itens }),
        });

        console.log("Status da resposta:", res.status);

        const texto = await res.text();
        console.log("Resposta da API:", texto);

        if (!res.ok)
          throw new Error(`Erro ao registrar pedido: ${res.status} ${texto}`);

        setMensagemStatus("Pedido criado!");
        setPagamentoConcluido(true);
        clearCart();
      } catch (err) {
        console.error("=== ERRO AO CRIAR PEDIDO ===");
        console.error(err);
        setMensagemStatus("Erro ao criar pedido (ver console ou aba Network)");
      }
    }, 3000);
  };

  useEffect(() => {
    if (pagamentoConcluido) {
      const timer = setTimeout(() => {
        setMostrarQR(false);
        navigate("/meus-pedidos");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [pagamentoConcluido, navigate]);

  const handleVoltar = () => navigate("/carrinho");

  const fecharPopup = () => {
    setMostrarQR(false);
    setPagamentoConcluido(false);
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
            {!pagamentoConcluido ? (
              <>
                <h3>Escaneie o QR Code para pagar</h3>
                <QRCode value={qrValue} size={180} />
                <p>{mensagemStatus}</p>
                <button onClick={fecharPopup} className="fechar">
                  Fechar
                </button>
              </>
            ) : (
              <div className="sucesso-container">
                <CheckCircle2 className="icone-sucesso" size={90} />
                <h3>Pagamento confirmado!</h3>
                <p>Seu pedido foi registrado com sucesso.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
