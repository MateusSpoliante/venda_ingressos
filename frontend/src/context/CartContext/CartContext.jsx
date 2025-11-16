import { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Adiciona item ao carrinho com validação de limite e estoque
  function addToCart(item) {
    const itemExiste = cartItems.find(i => i.ingresso_id === item.ingresso_id);

    const quantidadeNoCarrinho = itemExiste ? itemExiste.quantidade : 0;
    const totalDesejado = quantidadeNoCarrinho + 1;

    // Valida limite por CPF
    if (item.limite_por_cpf && totalDesejado > item.limite_por_cpf) {
      alert(`Você atingiu o limite de ${item.limite_por_cpf} para este ingresso.`);
      return;
    }

    // Valida estoque disponível
    if (item.quantidade_disponivel !== undefined && totalDesejado > item.quantidade_disponivel) {
      alert("Não há ingressos suficientes disponíveis.");
      return;
    }

    if (itemExiste) {
      setCartItems(cartItems.map(i =>
        i.ingresso_id === item.ingresso_id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      ));
    } else {
      setCartItems([...cartItems, { ...item, quantidade: 1 }]);
    }
  }

  // Remove item do carrinho
  function removeFromCart(ingresso_id) {
    setCartItems(prev => prev.filter(i => i.ingresso_id !== ingresso_id));
  }

  // Diminui quantidade ou remove se chegar a 0
  function decreaseQuantity(ingresso_id) {
    setCartItems(prev =>
      prev
        .map(i =>
          i.ingresso_id === ingresso_id
            ? { ...i, quantidade: i.quantidade - 1 }
            : i
        )
        .filter(i => i.quantidade > 0)
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  const total = cartItems.reduce(
    (acc, i) => acc + Number(i.preco) * i.quantidade,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        decreaseQuantity,
        clearCart,
        total
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
