import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Pedidos.css";
import { ArrowLeft } from "lucide-react";
import TransferirModal from "../../components/TransferirModal/TransferirModal.jsx";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado do modal
  const [modalAberto, setModalAberto] = useState(false);
  const [ingressoSelecionado, setIngressoSelecionado] = useState(null);

  const navigate = useNavigate();

  function handleGoHome() {
    navigate("/home");
  }

  function handleTransferir(item) {
    setIngressoSelecionado(item);
    setModalAberto(true);
  }

  function handleFecharModal() {
    setModalAberto(false);
    setIngressoSelecionado(null);
  }

  function handleTransferido(transferencia) {
    if (transferencia) {
      console.log("Transferência realizada:", transferencia);
      alert("Transferência realizada com sucesso!");

      // Atualiza o estado local para marcar o ingresso como transferido
      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) => ({
          ...pedido,
          itens: pedido.itens.map((i) =>
            i.ingresso_id === ingressoSelecionado.ingresso_id
              ? { ...i, status: "T" }
              : i
          ),
        }))
      );

      handleFecharModal();
    } else {
      alert("Erro: transferência não retornou dados.");
    }
  }

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/pedidos/meus`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPedidos(
          data.map((p) => ({
            ...p,
            itens: p.itens || [],
          }))
        );
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, []);

  if (loading)
    return <div className="pedidos-loading">Carregando seus ingressos...</div>;

  const pedidosPorData = pedidos.reduce((acc, pedido) => {
    const data = new Date(pedido.data_pedido).toLocaleDateString("pt-BR");
    if (!acc[data]) acc[data] = [];
    acc[data].push(pedido);
    return acc;
  }, {});

  return (
    <div className="pedidos-container">
      <div className="venda-header">
        <ArrowLeft
          size={28}
          className="venda-back-icon"
          onClick={handleGoHome}
          style={{ marginBottom: "-10px" }}
        />
        <h1 className="venda-title">Meus ingressos</h1>
      </div>

      {pedidos.length === 0 ? (
        <div className="pedidos-vazio">
          <p>Você ainda não comprou nenhum ingresso.</p>
        </div>
      ) : (
        Object.keys(pedidosPorData).map((data) => (
          <div key={data} className="pedidos-grupo">
            <h2 className="pedidos-data">{data}</h2>
            <div className="pedidos-lista">
              {pedidosPorData[data].map((pedido) =>
                pedido.itens.map((item, idx) => {
                  const precoFormatado = (item.preco_unitario || 0).toLocaleString(
                    "pt-BR",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  );

                  const isTransferido = item.status === "T";

                  return (
                    <div
                      key={idx}
                      className={`pedido-card ${isTransferido ? "transferido" : ""}`}
                    >
                      <div className="pedido-evento-info">
                        <img
                          src={item.evento_imagem || "/banner2.webp"}
                          alt={item.evento_titulo || "Evento"}
                          className="pedido-evento-img"
                        />
                        <div className="pedido-evento-detalhes">
                          <h3 className="evento-titulo">{item.evento_titulo}</h3>
                          <p className="tipo-ingresso">
                            Tipo: {item.tipo_ingresso || "Não informado"}
                          </p>
                          <p className="pedido-quantidade">
                            Quantidade: {item.quantidade || 0}
                          </p>
                          <p className="pedido-preco">Preço unitário: R$ {precoFormatado}</p>

                          {!isTransferido && (
                            <button
                              className="btn-transferir"
                              onClick={() => handleTransferir(item)}
                            >
                              Transferir Ingresso
                            </button>
                          )}
                        </div>

                        {isTransferido && (
                          <div className="transferido-overlay">Transferido</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))
      )}

      {modalAberto && ingressoSelecionado && (
        <TransferirModal
          ingresso={{
            ...ingressoSelecionado,
            preco: ingressoSelecionado.preco_unitario || 0,
          }}
          onClose={handleFecharModal}
          onTransferido={handleTransferido}
        />
      )}
    </div>
  );
}
