import { ArrowLeft } from "lucide-react";
import { useCart } from "../../context/CartContext/CartContext";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

export default function Carrinho() {
  const navigate = useNavigate();
  const {
    cartItems,
    addToCart,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    total,
  } = useCart();

  return (
    <div className="carrinho-container">
      <button
        className="voltar-btn"
        onClick={() => navigate("/home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontSize: "1rem",
          color: "#054062",
          marginBottom: "15px"
        }}
      >
        <ArrowLeft size={20} /> Voltar
      </button>

      <h2>🛒 Meu Carrinho</h2>

      {cartItems.length === 0 ? (
        <p>Seu carrinho está vazio</p>
      ) : (
        <>
          <ul className="carrinho-lista">
            {cartItems.map((item) => (
              <li key={item.id} className="carrinho-item">
                <img
                  src={item.imagem}
                  alt={item.nome}
                  className="carrinho-img"
                />
                <div className="carrinho-info">
                  <h3>{item.nome}</h3>
                  <p>Preço: R$ {item.preco.toFixed(2)}</p>
                  <div className="carrinho-controles">
                    <button onClick={() => decreaseQuantity(item.id)}>-</button>
                    <span>{item.quantidade}</span>
                    <button onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
                <button
                  className="remover-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <div className="carrinho-total">
            <h3>Total: R$ {total.toFixed(2)}</h3>
            <div className="carrinho-acoes">
              <button className="limpar-btn" onClick={clearCart}>
                🗑️ Limpar Carrinho
              </button>
              <button className="comprar-btn">💳 Finalizar Compra</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
