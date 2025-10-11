import { useCart } from "../../context/CartContext/CartContext";
import "./Cart.css";

export default function Carrinho() {
  const { cartItems, addToCart, decreaseQuantity, removeFromCart, clearCart, total } = useCart();

  return (
    <div className="carrinho-container">
      <h2>🛒 Meu Carrinho</h2>

      {cartItems.length === 0 ? (
        <p>Seu carrinho está vazio </p>
      ) : (
        <>
          <ul className="carrinho-lista">
            {cartItems.map((item) => (
              <li key={item.id} className="carrinho-item">
                <img src={item.imagem} alt={item.nome} className="carrinho-img" />
                <div className="carrinho-info">
                  <h3>{item.nome}</h3>
                  <p>Preço: R$ {item.preco.toFixed(2)}</p>
                  <div className="carrinho-controles">
                    <button onClick={() => decreaseQuantity(item.id)}>-</button>
                    <span>{item.quantidade}</span>
                    <button onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
                <button className="remover-btn" onClick={() => removeFromCart(item.id)}>
                  Remover
                </button>
              </li>
            ))}
          </ul>

          <div className="carrinho-total">
            <h3>Total: R$ {total.toFixed(2)}</h3>
            <div className="carrinho-acoes">
              <button className="limpar-btn" onClick={clearCart}>🗑️ Limpar Carrinho</button>
              <button className="comprar-btn">💳 Finalizar Compra</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
