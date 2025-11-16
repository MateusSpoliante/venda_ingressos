import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import "./Vendas.css";

export default function VendasOrganizador() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleGoHome = () => navigate("/homeorg");

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/vendas/organizador`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

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

  // === AGRUPAMENTO CORRIGIDO ===
  const vendasPorEvento = vendas.reduce((acc, venda) => {
    const eventoId = venda.evento_id || "sem_id";

    if (!acc[eventoId]) {
      acc[eventoId] = {
        evento_titulo: venda.evento_titulo || "Evento sem título",
        evento_imagem: venda.evento_imagem || "/banner2.webp",
        total: 0,
        itensAgrupados: {},
      };
    }

    const qtd = Number(venda.quantidade) || 0;
    const preco = Number(venda.preco_unitario) || 0;

    const key = venda.tipo_ingresso || "Desconhecido";

    if (!acc[eventoId].itensAgrupados[key]) {
      acc[eventoId].itensAgrupados[key] = {
        tipo_ingresso: key,
        quantidade: 0,
        preco_unitario: preco,
      };
    }

    acc[eventoId].itensAgrupados[key].quantidade += qtd;
    acc[eventoId].total += qtd * preco;

    return acc;
  }, {});

  const totalGeral = Object.values(vendasPorEvento).reduce(
    (acc, evento) => acc + evento.total,
    0
  );

  // Função para formatar valores
  const formatar = (valor) =>
    Number(valor).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="venda-container">
      <div className="venda-header">
        <ArrowLeft
          size={28}
          className="venda-back-icon"
          onClick={handleGoHome}
        />
        <h1 className="venda-title">Minhas Vendas</h1>
      </div>

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
                    {Object.values(evento.itensAgrupados).map((item, idx) => (
                      <div key={idx} className="venda-item">
                        <p>
                          <strong>Tipo:</strong> {item.tipo_ingresso} -{" "}
                          <strong>Vendidos:</strong> {item.quantidade} -{" "}
                          <strong>Preço:</strong> R$
                          {formatar(item.preco_unitario)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="venda-total">
                    Total do evento: R$ {formatar(evento.total)}
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
            <strong>Total geral:</strong> R$ {formatar(totalGeral)}
          </p>
        </div>
      )}
    </div>
  );
}
