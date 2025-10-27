import "./Cart.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext/CartContext";

export default function Carrinho() {
  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  // Agrupar itens pelo ingresso_id
  const itensUnicos = Array.from(
    new Map(cartItems.map(item => [item.ingresso_id, item])).values()
  );

  const subtotal = itensUnicos.reduce(
    (acc, item) => acc + Number(item.preco) * (item.quantidade || 1),
    0
  );
  const total = subtotal;

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
            <div className="item" key={item.ingresso_id}>
              <div className="item-info">
                <div className="icone" style={{ backgroundColor: item.cor }}>
                  🎫
                </div>
                <div className="detalhes">
                  <h3>{item.titulo}</h3>
                  <strong>
                    R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                  </strong>
                  {item.quantidade > 1 && <span> x{item.quantidade}</span>}
                </div>
              </div>

              <button
                className="remover"
                onClick={() => removeFromCart(item.ingresso_id)}
              >
                Remover
              </button>
            </div>
          ))
        )}
      </div>

      <div className="resumo">
        <h3>Resumo da compra</h3>
        <div className="linha total">
          <span>Total:</span>
          <span>R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      <div className="botoes">
        <button
          className="finalizar"
          onClick={handleComprar}
          disabled={itensUnicos.length === 0}
        >
          Finalizar Compra
        </button>
        <button onClick={handleGoHome} className="limpar">
          Continuar Comprando
        </button>
      </div>
    </div>
  );
}
