import { useEffect, useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Transferencia.css";

const API_URL = import.meta.env.VITE_API_URL || ""; // define a URL do backend

function Transferencia() {
  const [enviadas, setEnviadas] = useState([]);
  const [recebidas, setRecebidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("recebidas");
  const navigate = useNavigate();

  function handleGoHome() {
    navigate("/home");
  }

  useEffect(() => {
    const carregarTransferencias = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("token");

        const fetchJsonSafe = async (url) => {
          const res = await fetch(`${API_URL}${url}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch {
            console.warn("Resposta não JSON da rota:", url, text);
            return [];
          }
        };

        const [dadosRecebidas, dadosEnviadas] = await Promise.all([
          fetchJsonSafe("/api/ingressos/transferencias/recebidas"),
          fetchJsonSafe("/api/ingressos/transferencias/enviadas"),
        ]);

        setRecebidas(dadosRecebidas.data || dadosRecebidas || []);
        setEnviadas(dadosEnviadas.data || dadosEnviadas || []);
      } catch (err) {
        console.error("Erro ao buscar transferências:", err);
      } finally {
        setLoading(false);
      }
    };

    carregarTransferencias();
  }, []);

  const recusarTransferencia = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_URL}/api/ingressos/transferencias/recusar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ transferenciaId: id }),
        }
      );

      const data = await res.json();
      if (!res.ok) return alert(data.erro || "Erro ao recusar");

      alert("Transferência recusada");

      setRecebidas((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: "R", data_finalizacao: new Date() } : t
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Loader2 className="spin" size={36} />;

  const lista = abaAtiva === "recebidas" ? recebidas : enviadas;

  return (
    <div className="transferencia-container">
      <div className="transferencia-header">
        <ArrowLeft
          size={28}
          className="venda-back-icon2"
          onClick={handleGoHome}
        />
        <h2>Minhas Transferências</h2>
      </div>

      <div className="transferencia-tabs">
        <button
          className={abaAtiva === "recebidas" ? "ativa" : ""}
          onClick={() => setAbaAtiva("recebidas")}
        >
          Recebidas
        </button>
        <button
          className={abaAtiva === "enviadas" ? "ativa" : ""}
          onClick={() => setAbaAtiva("enviadas")}
        >
          Enviadas
        </button>
      </div>

      {lista.length === 0 ? (
        <p className="transferencia-empty">Nenhuma transferência {abaAtiva}.</p>
      ) : (
        <table className="transferencia-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ingresso</th>
              <th>Remetente</th>
              <th>Destinatário</th>
              <th>Data Criação</th>
              <th>Data Finalização</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {lista.map((t) => (
              <tr key={t.id}>
                <td data-label="ID">{t.id}</td>
                <td data-label="Ingresso">{t.ingresso_id}</td>
                <td data-label="Remetente">{t.nome_remetente}</td>
                <td data-label="Destinatário">{t.nome_destinatario}</td>
                <td data-label="Data Criação">
                  {t.data_criacao
                    ? new Date(t.data_criacao).toLocaleString()
                    : "-"}
                </td>
                <td data-label="Data Finalização">
                  {t.data_finalizacao
                    ? new Date(t.data_finalizacao).toLocaleString()
                    : "-"}
                </td>
                <td data-label="Valor">
                  {t.valor ? `R$ ${parseFloat(t.valor).toFixed(2)}` : "-"}
                </td>
                <td data-label="Status">
                  {abaAtiva === "recebidas" && t.status === "A" ? (
                    <div className="acoes-transferencia">
                      <button
                        className="btn-aceitar"
                        onClick={() => navigate(`/pag-transferencia/${t.id}`)}
                      >
                        Aceitar
                      </button>
                      <button
                        className="btn-recusar"
                        onClick={() => recusarTransferencia(t.id)}
                      >
                        Recusar
                      </button>
                    </div>
                  ) : t.status === "A" ? (
                    "Andamento"
                  ) : t.status === "C" ? (
                    "Concluída"
                  ) : t.status === "R" ? (
                    "Recusada"
                  ) : (
                    t.status
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Transferencia;
