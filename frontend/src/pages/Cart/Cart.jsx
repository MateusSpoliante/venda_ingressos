import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext/CartContext";

export default function Carrinho() {
  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Agrupar itens pelo mesmo id para não somar quantidade
  const itensUnicos = Array.from(
    new Map(cartItems.map(item => [item.id, item])).values()
  );

  const subtotal = itensUnicos.reduce(
    (acc, item) => acc + item.preco, // <- não multiplica pela quantidade
    0
  );
  const desconto = subtotal * 0.1;
  const total = subtotal - desconto;

  function handleGoHome() {
    navigate("/home");
  }
  function handleComprar() {
    navigate("/pagamento");
  }

  return (
    <div className="carrinho-container">
      <h2 className="titulo">
        <span className="icone-titulo">🎟️</span> Seus Ingressos
      </h2>

      <div className="lista-itens">
        {itensUnicos.length === 0 ? (
          <p className="carrinho-vazio">Seu carrinho está vazio.</p>
        ) : (
          itensUnicos.map((item) => (
            <div className="item" key={item.id}>
              <div className="item-info">
                <div className="icone" style={{ backgroundColor: item.cor }}>
                  🎫
                </div>
                <div className="detalhes">
                  <h3>{item.titulo}</h3>
                  <strong>
                    R$ {item.preco.toFixed(2).replace(".", ",")}
                  </strong>
                </div>
              </div>

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
        <button className="finalizar" onClick={handleComprar}>Finalizar Compra</button>
        <button onClick={handleGoHome} className="limpar">
          Continuar Comprando
        </button>
      </div>
    </div>
  );
}
