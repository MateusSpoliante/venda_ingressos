import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Vendas.css";

export default function VendasOrganizador() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleGoHome = () => navigate("/home");

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("Token não encontrado no localStorage");
          return;
        }

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/vendas/organizador`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Vendas recebidas:", data);
        setVendas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar vendas:", err);
        setVendas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVendas();
  }, []);

  if (loading)
    return <div className="venda-loading">Carregando suas vendas...</div>;

  // Agrupar vendas por evento
  const vendasPorEvento = vendas.reduce((acc, venda) => {
    const eventoId = venda.evento_id || "sem_id";
    if (!acc[eventoId]) {
      acc[eventoId] = {
        evento_titulo: venda.evento_titulo || "Evento sem título",
        evento_imagem: venda.evento_imagem || "/placeholder.jpg",
        total: 0,
        itens: [],
      };
    }

    const qtd = Number(venda.quantidade) || 0;
    const preco = Number(venda.preco_unitario) || 0;
    const subtotal = qtd * preco;
    acc[eventoId].total += subtotal;
    acc[eventoId].itens.push(venda);

    return acc;
  }, {});

  const totalGeral = Object.values(vendasPorEvento).reduce(
    (acc, evento) => acc + evento.total,
    0
  );

  return (
    <div className="venda-container">
      <h1 className="venda-title">Minhas Vendas</h1>

      {vendas.length === 0 ? (
        <div className="venda-vazio">
          <p>Você não possui vendas registradas.</p>
        </div>
      ) : (
        <div className="venda-lista">
          {Object.entries(vendasPorEvento).map(([id, evento]) => (
            <div key={id} className="venda-card">
              <div className="venda-evento-info">
                <img
                  src={evento.evento_imagem}
                  alt={evento.evento_titulo}
                  className="venda-evento-img"
                />
                <div className="venda-evento-detalhes">
                  <h3>{evento.evento_titulo}</h3>
                  <div className="venda-itens">
                    {evento.itens.map((item, idx) => (
                      <div key={idx} className="venda-item">
                        <p>
                          <strong>Tipo:</strong> {item.tipo_ingresso || "—"} |{" "}
                          <strong>Vendidos:</strong> {item.quantidade || 0} |{" "}
                          <strong>Preço:</strong> R${" "}
                          {Number(item.preco_unitario || 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="venda-total">
                    Total do evento: R${" "}
                    {Number(evento.total || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {vendas.length > 0 && (
        <div className="venda-resumo">
          <p className="venda-resumo-total">
            <strong>Total geral:</strong> R$ {Number(totalGeral).toFixed(2)}
          </p>
        </div>
      )}

      <div className="venda-voltar">
        <button onClick={handleGoHome} className="venda-voltar-btn">
          Voltar para a Home
        </button>
      </div>
    </div>
  );
}
