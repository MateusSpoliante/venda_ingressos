import "./HomeOrg.css";
import {
  Search,
  User,
  PlusCircle,
  CalendarCheck2,
  LogOut,
  Loader2,
  MapPin,
  MessageCircleMore,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CreateEvent from "../../components/CreateEventForm/CreateEvent.jsx";

function HomeOrg() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState("Meus Eventos");
  const [busca, setBusca] = useState("");

  const nome = localStorage.getItem("nome");

  const iconStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("nome");
      localStorage.removeItem("organizador");
      navigate("/login");
    }, 1500);
  };

  useEffect(() => {
    const fetchEventos = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/organizador/eventos`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        setEventos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao buscar eventos:", error);
        setEventos([]);
      } finally {
        setLoadingEventos(false);
      }
    };
    fetchEventos();
  }, []);

  // Filtragem segura com optional chaining
  const eventosFiltrados = (eventos || []).filter((evento) =>
    evento.titulo?.toLowerCase().includes(busca?.toLowerCase() || "")
  );

  const categorias = [
    { nome: "Meus Eventos", icon: <CalendarCheck2 size={16} /> },
    { nome: "Criar Evento", icon: <PlusCircle size={16} /> },
  ];

  const categoriasTextos = {
    "Meus Eventos": {
      titulo: "Meus Eventos",
      subtitulo: "Gerencie seus eventos publicados",
    },
    "Criar Evento": {
      titulo: "Criar Novo Evento",
      subtitulo: "Adicione um novo evento à plataforma",
    },
  };

  const formatarData = (dataString) => {
    const meses = [
      "Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",
    ];
    const data = new Date(dataString);
    const dia = data.getDate();
    const mes = meses[data.getMonth()];
    const horas = data.getHours().toString().padStart(2, "0");
    const minutos = data.getMinutes().toString().padStart(2, "0");
    return `${dia} de ${mes} às ${horas}:${minutos}`;
  };

  return (
    <div className="body-home">
      <div className="container">
        <header className="header">
          <a href="/homeOrg">
            <div className="logoDiv">
              <img src="logo.webp" alt="logo" className="logo" />
              <h1>OPEN TICKET</h1>
            </div>
          </a>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Buscar evento"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button className="search-btn" style={iconStyle}>
              <Search size={18} />
            </button>
          </div>

          <div className="header-actions">
            {nome && (
              <span className="user-info" style={iconStyle}>
                <User size={16} /> Olá, {nome}
                <button
                  className="logout"
                  onClick={handleLogout}
                  style={{ ...iconStyle, marginLeft: "10px" }}
                  disabled={loggingOut}
                >
                  {loggingOut ? <Loader2 size={16} className="spin" /> : (
                    <>
                      <LogOut size={16} /> Sair
                    </>
                  )}
                </button>
              </span>
            )}
          </div>
        </header>

        <nav className="nav">
          {categorias.map((cat) => (
            <button
              key={cat.nome}
              className={categoriaAtiva === cat.nome ? "active" : ""}
              style={iconStyle}
              onClick={() => setCategoriaAtiva(cat.nome)}
            >
              {cat.icon} {cat.nome}
            </button>
          ))}
        </nav>

        <section className="eventos-section">
          <h2>{categoriasTextos[categoriaAtiva]?.titulo || "Eventos"}</h2>
          <p>{categoriasTextos[categoriaAtiva]?.subtitulo || ""}</p>

          {categoriaAtiva === "Criar Evento" ? (
            <CreateEvent
              onEventoCriado={(novoEvento) => {
                // Garante que todos os campos tenham valor
                setEventos([
                  ...eventos,
                  {
                    id: novoEvento.id,
                    titulo: novoEvento.titulo || "Sem título",
                    descricao: novoEvento.descricao || "",
                    data_evento: novoEvento.data_evento || new Date().toISOString(),
                    local: novoEvento.local || "",
                    categoria: novoEvento.categoria || "Outro",
                    imagem: novoEvento.imagem || null,
                  },
                ]);
                setCategoriaAtiva("Meus Eventos"); // volta para "Meus Eventos" após criar
              }}
            />
          ) : loadingEventos ? (
            <p>Carregando eventos...</p>
          ) : eventosFiltrados.length === 0 ? (
            <p>Nenhum evento encontrado.</p>
          ) : (
            <div className="eventos-grid">
              {eventosFiltrados.map((evento) => (
                <div
                  key={evento.id}
                  className="evento-card"
                  onClick={() => navigate(`/evento/${evento.id}`)}
                >
                  <div className="evento-imagem">
                    <img
                      src={evento.imagem || "/banner2.webp"}
                      alt={evento.titulo || "Evento"}
                    />
                    <span className="categoria-tag">{evento.categoria}</span>
                  </div>

                  <div className="evento-info">
                    <h3>{evento.titulo || "Sem título"}</h3>
                    <span className="evento-data">{formatarData(evento.data_evento)}</span>
                    <div className="evento-local">
                      <MapPin size={14} /> {evento.local || "-"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="floating-buttons">
          <a
            href="https://wa.me/5544984315023?text=Olá,%20vim%20do%20site%20da%20OpenTicket,%20gostaria%20de%20mais%20informações!"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <button className="whatsapp" style={iconStyle}>
              <MessageCircleMore size={22} />
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default HomeOrg;
