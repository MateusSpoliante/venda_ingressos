import "./PagTransferencia.css";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { QrCode, CheckCircle2 } from "lucide-react";
import QRCode from "react-qr-code";

export default function PagTransferencia() {
  const navigate = useNavigate();
  const { id } = useParams(); // id da transferência
  const [transferencia, setTransferencia] = useState(null);
  const [mostrarQR, setMostrarQR] = useState(false);
  const [qrValue, setQrValue] = useState("");
  const [pagamentoConcluido, setPagamentoConcluido] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState("");

  // Busca a transferência pelo ID
  useEffect(() => {
    if (!id) return;

    const carregarTransferencia = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ingressos/transferencias/${id}`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          }
        );

        const data = await res.json();
        if (res.ok && data.transferencia) {
          setTransferencia(data.transferencia);
        } else {
          console.warn("Não foi possível obter a transferência.", data);
        }
      } catch (err) {
        console.error("Erro ao carregar transferência:", err);
      }
    };

    carregarTransferencia();
  }, [id]);

  const handleContinuar = () => {
    if (!transferencia) return;

    const valorTransferencia = parseFloat(transferencia.valor);
    if (valorTransferencia <= 0) {
      setMensagemStatus("Valor inválido para transferência.");
      return;
    }

    const codigoFakePix = `00020126360014BR.GOV.BCB.PIX0114+551199999999520400005303986540${valorTransferencia.toFixed(
      2
    )}5802BR5913TRANSFERENCIA6009SAO PAULO62070503***6304ABCD`;

    setQrValue(codigoFakePix);
    setMostrarQR(true);
    setMensagemStatus("Aguardando pagamento...");

    // Simula confirmação de pagamento e chama API de aceitar
    setTimeout(async () => {
      setMensagemStatus("Confirmando pagamento...");

      try {
        const token = localStorage.getItem("token");

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ingressos/transferencias/aceitar`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify({ transferenciaId: Number(id) }),
          }
        );

        const data = await res.json();

        if (!res.ok) throw new Error(data.erro || "Erro ao aceitar transferência");

        setMensagemStatus("Transferência concluída com sucesso!");
        setPagamentoConcluido(true);
      } catch (err) {
        console.error("ERRO AO ACEITAR TRANSFERÊNCIA:", err);
        setMensagemStatus("Erro ao concluir transferência.");
      }
    }, 2500);
  };

  useEffect(() => {
    if (pagamentoConcluido) {
      const timer = setTimeout(() => {
        setMostrarQR(false);
        navigate("/minhas-transferencias");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [pagamentoConcluido, navigate]);

  const handleVoltar = () => navigate(-1);
  const fecharPopup = () => {
    setMostrarQR(false);
    setPagamentoConcluido(false);
  };

  if (!transferencia) return <p>Carregando transferência...</p>;

  return (
    <div className="pagamento-container">
      <h2 className="titulo">Transferência de Ingresso</h2>

      <div className="resumo">
        <p>Valor da transferência:</p>
        <strong>
          R$ {parseFloat(transferencia.valor).toFixed(2).replace(".", ",")}
        </strong>
      </div>

      <div className="opcoes">
        <div className="opcao selecionado">
          <QrCode size={40} />
          <h3>Pix</h3>
          <p>Transferência instantânea</p>
        </div>
      </div>

      <div className="acoes">
        <button className="continuar ativo" onClick={handleContinuar}>
          Continuar
        </button>
        <button className="voltar" onClick={handleVoltar}>
          Voltar
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
                <p>{mensagemStatus}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
