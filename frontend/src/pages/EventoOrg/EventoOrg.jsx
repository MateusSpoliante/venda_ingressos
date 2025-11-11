import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MapPin, ArrowLeft, Pencil, Plus, X } from "lucide-react";
import CreateTicketForm from "../../components/CreateTicketForm/CreateTicketForm.jsx";
import "./EventoOrg.css";

function EventoOrg() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [ingressos, setIngressos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);

  const categorias = [
    "Teatro",
    "Musical",
    "Stand up",
    "Infantil",
    "Dança",
    "Shows",
    "Circo",
    "Palestras",
    "Religioso",
  ];

  const fetchDados = async () => {
    try {
      setLoading(true);
      const [resEvento, resIngressos] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/eventos/${id}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/ingressos/${id}`),
      ]);

      if (!resEvento.ok) throw new Error("Erro ao buscar evento");
      const dataEvento = await resEvento.json();
      setEvento(dataEvento);
      setForm(dataEvento);

      const dataIngressos = await resIngressos.json();
      setIngressos(Array.isArray(dataIngressos) ? dataIngressos : []);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDados();
  }, [id]);

  const handleSalvarAlteracoes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/organizador/eventos/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      if (!res.ok) throw new Error("Erro ao atualizar evento");
      alert("Evento atualizado com sucesso!");
      fetchDados(); // Atualiza sem recarregar a página
      setEditando(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar alterações");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIngressoCriado = () => {
    fetchDados(); // atualiza lista de ingressos automaticamente
    setMostrarForm(false);
  };

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinnerEvent"></div>
      </div>
    );

  if (!evento) return <p>Evento não encontrado.</p>;

  return (
    <div className="evento-page-2">
      <div className="container-2">
        <header className="header-2">
          <button
            className="back-btn-2"
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <ArrowLeft size={20} /> Voltar
          </button>

          <button
            className="edit-btn"
            onClick={() => setEditando(!editando)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#054062",
              fontSize: "15px",
            }}
          >
            <Pencil size={18} /> {editando ? "Cancelar" : "Editar"}
          </button>
        </header>

        <div className="evento-container-2">
          <img
            src={evento.imagem || "/banner2.webp"}
            alt={evento.titulo}
            className="evento-imagem-2"
          />

          <div className="evento-detalhes-2">
            {editando ? (
              <>
                <input
                  type="text"
                  name="titulo"
                  value={form.titulo || ""}
                  onChange={handleChange}
                  placeholder="Título do evento"
                />
                <textarea
                  name="descricao"
                  value={form.descricao || ""}
                  onChange={handleChange}
                  placeholder="Descrição"
                />
                <input
                  type="datetime-local"
                  name="data_evento"
                  value={form.data_evento?.slice(0, 16) || ""}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="local"
                  value={form.local || ""}
                  onChange={handleChange}
                  placeholder="Local"
                />

                <select
                  name="categoria"
                  value={form.categoria || "Teatro"}
                  onChange={handleChange}
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <button className="btn-salvar" onClick={handleSalvarAlteracoes}>
                  Salvar alterações
                </button>
              </>
            ) : (
              <>
                <h1>{evento.titulo}</h1>
                <p>{evento.descricao}</p>
                <p>
                  <strong>Data:</strong>{" "}
                  {new Date(evento.data_evento).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p>
                  <strong>Horário:</strong>{" "}
                  {new Date(evento.data_evento).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                <p style={{ display: "flex", alignItems: "center" }}>
                  <MapPin size={14} /> {evento.local || "-"}
                </p>
                <p>
                  <strong>Categoria:</strong> {evento.categoria || "-"}
                </p>
              </>
            )}

            {!editando && (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "25px",
                  }}
                >
                  <h3>Ingressos disponíveis</h3>
                  <button
                    className="btn-add-ingresso"
                    onClick={() => setMostrarForm(true)}
                  >
                    <Plus size={18} /> Adicionar Ingresso
                  </button>
                </div>

                {ingressos.length === 0 ? (
                  <p>Nenhum ingresso cadastrado.</p>
                ) : (
                  <div className="ingressos-radio-group">
                    {ingressos.map((ing) => (
                      <div key={ing.id} className="ingresso-radio">
                        <span>
                          {ing.tipo_ingresso} — R$
                          {Number(ing.preco).toFixed(2).replace(".", ",")} (
                          {ing.quantidade} disponíveis)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DO FORM DE INGRESSO */}
      {mostrarForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setMostrarForm(false)}>
              <X size={20} />
            </button>
            <CreateTicketForm
              eventoId={id}
              onClose={handleIngressoCriado}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default EventoOrg;
