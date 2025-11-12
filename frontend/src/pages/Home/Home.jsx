import "./Home.css";
import {
  Search,
  Drama,
  Music,
  Smile,
  Star,
  Activity,
  Guitar,
  TentTree,
  Mic,
  Church,
  CalendarCheck2,
  ShoppingCart,
  MapPin,
  MessageCircleMore,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext/CartContext";
import UserMenu from "../../components/UserMenu/UserMenu";

function Home() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loadingEventos, setLoadingEventos] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos");
  const [busca, setBusca] = useState("");

  const { cartItems } = useCart();
  const nome = localStorage.getItem("nome");

  const iconStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/eventos`
        );
        const data = await response.json();
        // Garantir que seja sempre array
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

  // Proteger filter caso eventos não seja array
  const eventosFiltrados = (eventos || [])
    .filter((e) =>
      categoriaAtiva === "Todos" ? true : e.categoria === categoriaAtiva
    )
    .filter((e) => e.titulo.toLowerCase().includes(busca.toLowerCase()));

  const categorias = [
    { nome: "Todos", icon: <CalendarCheck2 size={16} /> },
    { nome: "Teatro", icon: <Drama size={16} /> },
    { nome: "Musical", icon: <Music size={16} /> },
    { nome: "Stand up", icon: <Smile size={16} /> },
    { nome: "Infantil", icon: <Star size={16} /> },
    { nome: "Dança", icon: <Activity size={16} /> },
    { nome: "Shows", icon: <Guitar size={16} /> },
    { nome: "Circo", icon: <TentTree size={16} /> },
    { nome: "Palestras", icon: <Mic size={16} /> },
    { nome: "Religioso", icon: <Church size={16} /> },
  ];

  const categoriasTextos = {
    Todos: {
      titulo: "Todos os Eventos",
      subtitulo: "Listagem de ingressos de diversas categorias",
    },
    Teatro: {
      titulo: "Teatros",
      subtitulo: "Peças incríveis para você assistir",
    },
    Musical: {
      titulo: "Musicais",
      subtitulo: "Shows e apresentações musicais",
    },
    "Stand up": {
      titulo: "Stand-up Comedy",
      subtitulo: "Ria com os melhores comediantes",
    },
    Infantil: { titulo: "Infantil", subtitulo: "Eventos para a criançada" },
    Dança: { titulo: "Dança", subtitulo: "Espetáculos de dança e balé" },
    Shows: { titulo: "Shows", subtitulo: "Grandes apresentações ao vivo" },
    Circo: {
      titulo: "Circo",
      subtitulo: "Diversão e entretenimento para toda a família",
    },
    Palestras: { titulo: "Palestras", subtitulo: "Aprenda com especialistas" },
    Religioso: {
      titulo: "Eventos Religiosos",
      subtitulo: "Celebrações e encontros espirituais",
    },
  };

  const formatarData = (dataString) => {
    const meses = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
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
          <a href="/home">
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
              <>
                <a href="/carrinho" className="cart-header" style={iconStyle}>
                  <ShoppingCart size={20} />
                  {cartItems.length > 0 && (
                    <span className="cart-count">{cartItems.length}</span>
                  )}
                </a>
                <UserMenu />
              </>
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

          {loadingEventos ? (
            <p>Carregando eventos...</p>
          ) : eventosFiltrados.length === 0 ? (
            <p>Nenhum evento encontrado nesta categoria.</p>
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
                      src={evento.imagem || "/banner2.webp"} // usa a imagem do evento ou fallback
                      alt={evento.titulo}
                    />
                    <span className="categoria-tag">{evento.categoria}</span>
                  </div>

                  <div className="evento-info">
                    <h3>{evento.titulo}</h3>
                    {/* <span className="evento-desc">{evento.descricao}</span> */}
                    <span className="evento-data">
                      {formatarData(evento.data_evento)}
                    </span>
                    <div className="evento-local">
                      <MapPin size={14} style={{ marginTop: "-1.2px" }} />{" "}
                      {`${evento.cidade || "-"}, ${evento.estado || "-"}`}
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

export default Home;
