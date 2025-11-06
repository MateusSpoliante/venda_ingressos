import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MapPin, ShoppingCart, ArrowLeft, Check, Plus } from "lucide-react";
import { useCart } from "../../context/CartContext/CartContext";
import "./Evento.css";

function Evento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [ingressos, setIngressos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIngresso, setSelectedIngresso] = useState(null);
  const { addToCart, cartItems } = useCart();

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const resEvento = await fetch(
          `${import.meta.env.VITE_API_URL}/api/eventos`
        );
        const dataEvento = await resEvento.json();
        const ev = dataEvento.find((e) => e.id === parseInt(id));
        setEvento(ev);

        const resIngressos = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ingressos/${id}`
        );
        const dataIngressos = await resIngressos.json();
        setIngressos(Array.isArray(dataIngressos) ? dataIngressos : []);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDados();
  }, [id]);

  if (loading)
    return (
      <div className="loading-container">
        <div className="spinnerEvent"></div>
      </div>
    );

  if (!evento) return <p>Evento não encontrado.</p>;

  const handleAddToCart = () => {
    if (!selectedIngresso) return;
    const jaExiste = cartItems.some(
      (item) => item.ingresso_id === selectedIngresso.id
    );
    if (!jaExiste) {
      addToCart({
        ingresso_id: selectedIngresso.id,
        evento_id: evento.id,
        titulo: evento.titulo,
        tipo_ingresso: selectedIngresso.tipo_ingresso,
        preco: Number(selectedIngresso.preco),
        quantidade: 1,
      });
    }
  };

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

          <a href="/carrinho" className="cart-header-2">
            <ShoppingCart size={24} />
            {cartItems.length > 0 && (
              <span className="cart-count-2">{cartItems.length}</span>
            )}
          </a>
        </header>

        <div className="evento-container-2">
          <img
            src={evento.imagem || "/banner2.webp"}
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

            {/* Endereço completo */}
            <p
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                flexWrap: "wrap",
              }}
            >
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

            <h3 style={{ marginTop: "20px" }}>Ingressos disponíveis</h3>
            {ingressos.length === 0 ? (
              <p>Nenhum ingresso disponível.</p>
            ) : (
              <div className="ingressos-radio-group">
                {ingressos.map((ing) => {
                  const jaNoCarrinho = cartItems.some(
                    (item) => item.ingresso_id === ing.id
                  );
                  return (
                    <label
                      key={ing.id}
                      className={`ingresso-radio ${
                        jaNoCarrinho ? "disabled" : ""
                      } ${selectedIngresso?.id === ing.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="ingresso"
                        value={ing.id}
                        disabled={jaNoCarrinho}
                        onChange={() => setSelectedIngresso(ing)}
                        checked={selectedIngresso?.id === ing.id}
                      />
                      <span>
                        {ing.tipo_ingresso} - R${" "}
                        {Number(ing.preco).toFixed(2).replace(".", ",")}
                        {jaNoCarrinho && " (Já no carrinho)"}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <button
              className={`btn-comprar-2 ${
                selectedIngresso &&
                cartItems.some(
                  (item) => item.ingresso_id === selectedIngresso.id
                )
                  ? "added"
                  : ""
              }`}
              onClick={handleAddToCart}
              disabled={
                !selectedIngresso ||
                (selectedIngresso &&
                  cartItems.some(
                    (item) => item.ingresso_id === selectedIngresso.id
                  ))
              }
            >
              {selectedIngresso &&
              cartItems.some(
                (item) => item.ingresso_id === selectedIngresso.id
              ) ? (
                <>
                  <Check size={16} style={{ marginRight: "5px" }} />
                  Adicionado
                </>
              ) : (
                <>
                  <Plus size={16} style={{ marginRight: "5px" }} />
                  Adicionar ao carrinho
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Evento;
