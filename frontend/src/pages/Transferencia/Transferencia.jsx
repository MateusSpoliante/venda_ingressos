import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import "./Transferencia.css";

function Transferencia() {
  const [transferencias, setTransferencias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransferencias = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/ingressos/transferencias/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTransferencias(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransferencias();
  }, []);

  if (loading) return <Loader2 className="spin" size={36} />;

  return (
    <div className="transferencia-container">
      <h2>Minhas Transferências</h2>
      {transferencias.length === 0 ? (
        <p className="transferencia-empty">Nenhuma transferência realizada.</p>
      ) : (
        <table className="transferencia-table">
          <thead>
            <tr>
              <th>ID do Pedido</th>
              <th>Ingresso</th>
              <th>Destinatário</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {transferencias.map((t) => (
              <tr key={t.id}>
                <td>{t.pedido_id}</td>
                <td>{t.ingresso_titulo}</td>
                <td>{t.destinatario}</td>
                <td>{new Date(t.data_transferencia).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Transferencia;
