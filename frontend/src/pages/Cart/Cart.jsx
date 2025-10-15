import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext/CartContext";

export default function Carrinho() {
  const { cartItems, removeFromCart } = useCart(); // ← adicionamos removeFromCart
  const navigate = useNavigate();

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.preco * item.quantidade,
    0
  );
  const desconto = subtotal * 0.1;
  const total = subtotal - desconto;

  function handleGoHome() {
    navigate("/home");
  }

  return (
    <div className="carrinho-container">
      <h2 className="titulo">
        <span className="icone-titulo">🎟️</span> Seus Ingressos
      </h2>

      <div className="lista-itens">
        {cartItems.length === 0 ? (
          <p className="carrinho-vazio">Seu carrinho está vazio.</p>
        ) : (
          cartItems.map((item) => (
            <div className="item" key={item.id}>
              <div className="item-info">
                <div className="icone" style={{ backgroundColor: item.cor }}>
                  🎫
                </div>
                <div className="detalhes">
                  <h3>{item.titulo}</h3>
                  <p>Qtd: {item.quantidade}</p>
                  <strong>
                    R$ {item.preco.toFixed(2).replace(".", ",")}
                  </strong>
                </div>
              </div>

              {/* Botão de Remover */}
              <button
                className="remover"
                onClick={() => removeFromCart(item.id)}
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>

      <div className="resumo">
        <h3>Resumo da compra</h3>
        <div className="linha">
          <span>Subtotal:</span>
          <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="linha">
          <span>Desconto (10%):</span>
          <span className="desconto">
            - R$ {desconto.toFixed(2).replace(".", ",")}
          </span>
        </div>
        <div className="linha total">
          <span>Total:</span>
          <span>R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      <div className="botoes">
        <button className="finalizar">Finalizar Compra</button>
        <button onClick={handleGoHome} className="limpar">
          Continuar Comprando
        </button>
      </div>
    </div>
  );
}
