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
      fetchDados();
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
    fetchDados();
    setMostrarForm(false);
  };

  if (loading)
    return (
      <div className="eventoOrg-loading">
        <div className="eventoOrg-spinner"></div>
      </div>
    );

  if (!evento) return <p>Evento não encontrado.</p>;

  return (
    <div className="eventoOrg-page">
      <div className="eventoOrg-container">
        <header className="eventoOrg-header">
          <button className="eventoOrg-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} /> Voltar
          </button>

          <button
            className="eventoOrg-edit-btn"
            onClick={() => setEditando(!editando)}
          >
            <Pencil size={18} /> {editando ? "Cancelar" : "Editar"}
          </button>
        </header>

        <div className="eventoOrg-card">
          <img
            src={evento.imagem || "/banner2.webp"}
            alt={evento.titulo}
            className="eventoOrg-img"
          />

          <div className="eventoOrg-detalhes">
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

                <button
                  className="eventoOrg-btn-salvar"
                  onClick={handleSalvarAlteracoes}
                >
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
                    month: "short"
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
                  <MapPin size={14} />
                  <span>
                    {evento.endereco && <>{evento.endereco}</>}
                    {evento.cidade && evento.estado && (
                      <>
                        {evento.endereco ? " - " : ""}
                        {evento.cidade}, {evento.estado}
                      </>
                    )}
                  </span>
                </p>
                <p>
                  <strong>Local:</strong> {evento.local || "-"}
                </p>
              </>
            )}

            {!editando && (
              <>
                <div className="eventoOrg-ingresso-header">
                  <h3>Ingressos disponíveis</h3>
                  <button
                    className="eventoOrg-btn-add-ingresso"
                    onClick={() => setMostrarForm(true)}
                  >
                    <Plus size={18} /> Adicionar Ingresso
                  </button>
                </div>

                {ingressos.length === 0 ? (
                  <p>Nenhum ingresso cadastrado.</p>
                ) : (
                  <div className="eventoOrg-ingresso-lista">
                    {ingressos.map((ing) => (
                      <div key={ing.id} className="eventoOrg-ingresso-item">
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

      {mostrarForm && (
        <div className="eventoOrg-modal-overlay">
          <div className="eventoOrg-modal-content">
            <button
              className="eventoOrg-close-btn"
              onClick={() => setMostrarForm(false)}
            >
              <X size={20} />
            </button>
            <CreateTicketForm eventoId={id} onClose={handleIngressoCriado} />
          </div>
        </div>
      )}
    </div>
  );
}

export default EventoOrg;
