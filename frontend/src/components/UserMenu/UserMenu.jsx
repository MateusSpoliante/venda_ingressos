import { LogOut, Loader2, UserCircle2, TicketCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserMenu.css";

function UserMenu() {
  const navigate = useNavigate();
  const nome = localStorage.getItem("nome");
  const [menuAberto, setMenuAberto] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("nome");
      navigate("/login");
    }, 1500);
  };

  return (
    <div className="user-menu" style={{ position: "relative" }}>
      <button
        className="user-info"
        onClick={() => setMenuAberto((prev) => !prev)}
        style={{ cursor: "pointer", gap: "6px" }}
      >
        Olá, {nome} <UserCircle2 size={36} />
      </button>

      {menuAberto && (
        <div
          className="user-dropdown"
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: "6px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => navigate("/meus-pedidos")}
            className="logout"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              width: "100%",
              justifyContent: "flex-start",
              padding: "8px 14px",
            }}
          >
            <TicketCheck size={16} /> Meus Pedidos
          </button>

          <button
            onClick={handleLogout}
            className="logout"
            disabled={loggingOut}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              width: "100%",
              justifyContent: "flex-start",
              padding: "8px 14px",
            }}
          >
            {loggingOut ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <>
                <LogOut size={14} /> Sair
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
