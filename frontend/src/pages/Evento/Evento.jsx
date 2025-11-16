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
        const token = localStorage.getItem("token"); // token do login

        // busca evento
        const resEvento = await fetch(`${import.meta.env.VITE_API_URL}/api/eventos/${id}`);
        const dataEvento = await resEvento.json();
        setEvento(dataEvento);

        // busca ingressos autenticado
        const resIngressos = await fetch(`${import.meta.env.VITE_API_URL}/api/ingressos/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataIngressos = await resIngressos.json();

        const ingressosFormatados = Array.isArray(dataIngressos) ? dataIngressos : [];

        // seleciona ingresso comprado automaticamente se existir
        const comprado = ingressosFormatados.find((i) => i.ja_comprado);
        if (comprado) setSelectedIngresso(comprado);

        setIngressos(ingressosFormatados);
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDados();
  }, [id]);

  if (loading) return <div className="loading-container"><div className="spinnerEvent"></div></div>;
  if (!evento) return <p>Evento não encontrado.</p>;

  const handleAddToCart = () => {
    if (!selectedIngresso) return;

    const quantidadeNoCarrinho = cartItems
      .filter((item) => item.ingresso_id === selectedIngresso.id)
      .reduce((sum, item) => sum + item.quantidade, 0);

    if (selectedIngresso.limite_por_cpf && quantidadeNoCarrinho >= selectedIngresso.limite_por_cpf) {
      alert("Você atingiu o limite por CPF para este ingresso");
      return;
    }

    const jaExiste = cartItems.some((item) => item.ingresso_id === selectedIngresso.id);
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
          <button className="back-btn-2" onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <ArrowLeft size={20} /> Voltar
          </button>
          <a href="/carrinho" className="cart-header-2">
            <ShoppingCart size={24} />
            {cartItems.length > 0 && <span className="cart-count-2">{cartItems.length}</span>}
          </a>
        </header>

        <div className="evento-container-2">
          <img src={evento.imagem || "/banner2.webp"} alt={evento.titulo} className="evento-imagem-2" />

          <div className="evento-detalhes-2">
            <h1>{evento.titulo}</h1>
            <p>{evento.descricao}</p>

            <p><strong>Data:</strong> {new Date(evento.data_evento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
            <p><strong>Horário:</strong> {new Date(evento.data_evento).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>

            <p style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
              <MapPin size={14} />
              <span>
                {evento.endereco && <>{evento.endereco}</>}
                {evento.cidade && evento.estado && (
                  <>{evento.endereco ? " - " : ""}{evento.cidade}, {evento.estado}</>
                )}
              </span>
            </p>

            <p><strong>Local:</strong> {evento.local || "-"}</p>

            <h3 style={{ marginTop: "20px" }}>Ingressos disponíveis</h3>
            {ingressos.length === 0 ? (
              <p>Nenhum ingresso disponível.</p>
            ) : (
              <div className="ingressos-radio-group">
                {ingressos.map((ing) => {
                  const jaNoCarrinho = cartItems.some((item) => item.ingresso_id === ing.id);
                  const esgotado = ing.quantidade === 0;
                  const limiteAtingido = ing.limite_por_cpf &&
                    (ing.quantidade_comprada_pelo_cpf || 0) +
                      cartItems.filter(i => i.ingresso_id === ing.id).reduce((sum, item) => sum + item.quantidade, 0) >=
                    ing.limite_por_cpf;
                  const jaComprado = ing.ja_comprado;

                  const disabled = jaNoCarrinho || esgotado || limiteAtingido || jaComprado;
                  const riscado = esgotado || limiteAtingido || jaComprado;

                  return (
                    <label
                      key={ing.id}
                      className={`ingresso-radio ${riscado ? "esgotado" : ""} ${disabled ? "disabled" : ""} ${selectedIngresso?.id === ing.id ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="ingresso"
                        value={ing.id}
                        disabled={disabled}
                        onChange={() => setSelectedIngresso(ing)}
                        checked={selectedIngresso?.id === ing.id || jaComprado}
                      />
                      <span className="ingresso-texto">
                        {ing.tipo_ingresso} - R$ {Number(ing.preco).toFixed(2).replace(".", ",")}
                        {ing.limite_por_cpf ? ` | Limite por CPF: ${ing.limite_por_cpf}` : ""}
                        {jaNoCarrinho && " (Já no carrinho)"}
                        {jaComprado && " (Comprado)"}
                      </span>
                      {esgotado && <span className="badge-esgotado">ESGOTADO</span>}
                      {limiteAtingido && <span className="badge-esgotado">Limite por CPF atingido</span>}
                      {jaComprado && <span className="badge-esgotado">Comprado</span>}
                    </label>
                  );
                })}
              </div>
            )}

            <button
              className={`btn-comprar-2 ${selectedIngresso && cartItems.some(item => item.ingresso_id === selectedIngresso.id) ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={!selectedIngresso || cartItems.some(item => item.ingresso_id === selectedIngresso.id) ||
                (selectedIngresso?.limite_por_cpf &&
                  cartItems.filter(i => i.ingresso_id === selectedIngresso.id).reduce((sum, item) => sum + item.quantidade, 0) >= selectedIngresso.limite_por_cpf)
              }
            >
              {selectedIngresso && cartItems.some(item => item.ingresso_id === selectedIngresso.id) ? (
                <>
                  <Check size={16} style={{ marginRight: "5px" }} /> Adicionado
                </>
              ) : (
                <>
                  <Plus size={16} style={{ marginRight: "5px" }} /> Adicionar ao carrinho
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
