import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MapPin, Plus, ShoppingCart, ArrowLeft } from "lucide-react";
import { useCart } from "../../context/CartContext/CartContext";
import "./evento.css";

function Evento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/eventos`);
        const data = await res.json();
        const ev = data.find((e) => e.id === parseInt(id));
        setEvento(ev);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvento();
  }, [id]);

  const handleAddToCart = () => {
    addToCart({
      id: evento.id,
      titulo: evento.titulo,
      preco: 120, // ajustar se tiver preço no backend
      quantidade: 1,
    });
  };

  const handleBuyToCart = () => {
    addToCart({
      id: evento.id,
      titulo: evento.titulo,
      preco: 120,
      quantidade: 1,
    });
    navigate("/carrinho");
  };

  if (loading)
  return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );
  if (!evento) return <p>Evento não encontrado.</p>;

  return (
    <div className="evento-page-2">
      <div className="container-2">
        {/* HEADER simplificado */}
        <header className="header-2">
          <button
            className="back-btn-2"
            onClick={() => navigate(-1)}
            style={{ display: "flex", alignItems: "center", gap: "5px" }}
          >
            <ArrowLeft size={20} /> Voltar
          </button>

          <a href="/carrinho" className="cart-header-2">
            <ShoppingCart size={24} />
            {cartItems.length > 0 && (
              <span className="cart-count-2">{cartItems.length}</span>
            )}
          </a>
        </header>

        {/* CONTEÚDO DO EVENTO */}
        <div className="evento-container-2">
          <img
            src="/banner2.webp"
            alt={evento.titulo}
            className="evento-imagem-2"
          />

          <div className="evento-detalhes-2">
            <h1>{evento.titulo}</h1>
            <p>{evento.descricao}</p>

            <p>
              <strong>Data:</strong>{" "}
              {new Date(evento.data_evento).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </p>
            <p>
              <strong>Horário:</strong>{" "}
              {new Date(evento.data_evento).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              <MapPin size={16} /> {evento.local}
            </p>

            <p>
              <strong>Preço:</strong> R$ 120,00
            </p>

            <button className="btn-comprar-2" onClick={handleAddToCart}>
              <Plus size={16} style={{ marginRight: "5px" }} />
              Adicionar ao carrinho
            </button>
            <button className="btn-comprar-2" onClick={handleBuyToCart}>
              Comprar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Evento;
