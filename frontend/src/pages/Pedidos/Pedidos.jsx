import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Pedidos.css";

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  function handleGoHome() {
    navigate("/home");
  }

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/pedidos/meus`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Pedidos recebidos:", data);

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
      <h1 className="pedidos-title">Meus Ingressos</h1>

      {pedidos.length === 0 ? (
        <div className="pedidos-vazio">
          <p>Você ainda não comprou nenhum ingresso.</p>
        </div>
      ) : (
        Object.keys(pedidosPorData).map((data) => (
          <div key={data} className="pedidos-grupo">
            <h2 className="pedidos-data">{data}</h2>
            <div className="pedidos-lista">
              {pedidosPorData[data].map((pedido) => (
                <div key={pedido.pedido_id} className="pedido-card">
                  {pedido.itens.map((item, idx) => (
                    <div key={idx} className="pedido-item">
                      <div className="pedido-evento-info">
                        <img
                          src={item.evento_imagem || "/placeholder.jpg"}
                          alt={item.evento_titulo || "Evento"}
                          className="pedido-evento-img"
                        />
                        <div className="pedido-evento-detalhes">
                          <h3 className="evento-titulo">
                            {item.evento_titulo || "Evento sem título"}
                          </h3>
                          <p className="tipo-ingresso">
                            Tipo do Ingresso:{" "}
                            {item.tipo_ingresso || "Não informado"}
                          </p>
                          <p className="pedido-quantidade">
                            Quantidade: {item.quantidade || 0}
                          </p>
                          <p className="pedido-preco">
                            Preço unitário: R${" "}
                            {item.preco_unitario?.toFixed(2) || "0,00"}
                          </p>
                          {item.preco_total && (
                            <p className="pedido-total">
                              Total: R${" "}
                              {(item.preco_total || 0).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="pedidos-voltar">
        <button onClick={handleGoHome} className="voltar-home">
          Voltar para a Home
        </button>
      </div>
    </div>
  );
}
