import "./Home.css";
import {
  Search,
  User,
  UserPlus,
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
  Loader2,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // "login" | "cadastro" | null

  const handleNavigate = (path, type) => {
    setLoading(type);
    setTimeout(() => {
      navigate(path);
      setLoading(null);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("nome");
    navigate("/login");
  };

  const nome = localStorage.getItem("nome");

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
            <button className="search-btn">
              <Search size={18} />
            </button>
          </div>
          <div className="header-actions">
            {nome ? (
              <>
                <span className="user-info">
                  <User size={16} /> Olá, {nome}
                </span>
                <button className="logout" onClick={handleLogout}>
                  <LogOut size={16} /> Sair
                </button>
              </>
            ) : (
              <>
                <button
                  className="login"
                  onClick={() => handleNavigate("/login", "login")}
                  disabled={loading === "login"}
                >
                  {loading === "login" ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <>
                      <User size={16} /> Acessar conta
                    </>
                  )}
                </button>

                <button
                  className="register"
                  onClick={() => handleNavigate("/cadastro", "cadastro")}
                  disabled={loading === "cadastro"}
                >
                  {loading === "cadastro" ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <>
                      <UserPlus size={16} /> Cadastre-se
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </header>

        {/* NAV */}
        <nav className="nav">
          <button className="active">
            <CalendarCheck2 size={16} /> Todos Eventos
          </button>
          <button>
            <Drama size={16} /> Teatro
          </button>
          <button>
            <Music size={16} /> Musical
          </button>
          <button>
            <Smile size={16} /> Stand up
          </button>
          <button>
            <Star size={16} /> Infantil
          </button>
          <button>
            <Activity size={16} /> Dança
          </button>
          <button>
            <Guitar size={16} /> Shows
          </button>
          <button>
            <TentTree size={16} /> Circo
          </button>
          <button>
            <Mic size={16} /> Palestras
          </button>
          <button>
            <Church size={16} /> Religioso
          </button>
        </nav>

        {/* BANNER */}
        <section className="banner">
          <div className="banner-content">
            <h1>Ciclo de Estudos | UniCV</h1>
            <button className="buy-btn">Comprar Ingressos</button>
          </div>
        </section>

        {/* FLOATING BUTTONS */}
        <div className="floating-buttons">
          <button className="whatsapp">
            <MessageCircle size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
