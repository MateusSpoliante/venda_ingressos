import "./Home.css";
import {
  Search,
  User,
  Drama,
  Music,
  Smile,
  Star,
  Activity,
  Guitar,
  TentTree,
  Mic,
  Church,
  MessageCircle,
  CalendarCheck2,
  LogOut,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false); // estado de loading

  const handleLogout = () => {
    setLoggingOut(true); // ativa a rodinha
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("nome");
      navigate("/login");
    }, 1500); // delay de 1,5s
  };

  const nome = localStorage.getItem("nome");

  // estilo base para alinhar ícone e texto
  const iconStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  };

  return (
    <div className="body-home">
      <div className="container">
        {/* HEADER */}
        <header className="header">
          <a href="/">
            <div className="logoDiv">
              <img src="logo.png" alt="logo" className="logo" />
              <h1>OPEN TICKET</h1>
            </div>
          </a>

          <div className="search-bar">
            <input type="text" placeholder="Buscar evento" />
            <button className="search-btn" style={iconStyle}>
              <Search size={18} />
            </button>
          </div>

          <div className="header-actions">
            {nome && (
              <>
                <span className="user-info" style={iconStyle}>
                  <User size={16} /> Olá, {nome}
                </span>
                <button
                  className="logout"
                  onClick={handleLogout}
                  style={iconStyle}
                  disabled={loggingOut} // desabilita enquanto está saindo
                >
                  {loggingOut ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <>
                      <LogOut size={16} /> Sair
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </header>

        {/* NAV */}
        <nav className="nav">
          <button className="active" style={iconStyle}>
            <CalendarCheck2 size={16} /> Todos Eventos
          </button>
          <button style={iconStyle}>
            <Drama size={16} /> Teatro
          </button>
          <button style={iconStyle}>
            <Music size={16} /> Musical
          </button>
          <button style={iconStyle}>
            <Smile size={16} /> Stand up
          </button>
          <button style={iconStyle}>
            <Star size={16} /> Infantil
          </button>
          <button style={iconStyle}>
            <Activity size={16} /> Dança
          </button>
          <button style={iconStyle}>
            <Guitar size={16} /> Shows
          </button>
          <button style={iconStyle}>
            <TentTree size={16} /> Circo
          </button>
          <button style={iconStyle}>
            <Mic size={16} /> Palestras
          </button>
          <button style={iconStyle}>
            <Church size={16} /> Religioso
          </button>
        </nav>

        {/* BANNER */}
        <section className="banner">
          <div className="banner-content">
            <h1>Ciclo de Estudos | UniCV</h1>
            <button className="buy-btn" style={iconStyle}>
              Comprar Ingressos
            </button>
          </div>
        </section>

        {/* FLOATING BUTTONS */}
        <div className="floating-buttons">
          <button className="whatsapp" style={iconStyle}>
            <MessageCircle size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
