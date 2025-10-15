import { createContext, useState, useContext, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    // 🔹 Ao iniciar, tenta carregar o carrinho salvo no localStorage
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });

  // 🔹 Sempre que o carrinho muda, salva no localStorage
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Adiciona um item ao carrinho
  function addToCart(evento) {
    const itemExiste = cartItems.find(item => item.id === evento.id);

    if (itemExiste) {
      setCartItems(cartItems.map(item =>
        item.id === evento.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...evento, quantidade: 1 }]);
    }
  }

  // Remove um item completamente
function removeFromCart(id) {
  setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  localStorage.setItem(
    "cart",
    JSON.stringify(cartItems.filter((item) => item.id !== id))
  );
}


  // Diminui a quantidade (ou remove se chegar a 0)
  function decreaseQuantity(id) {
    setCartItems(cartItems
      .map(item =>
        item.id === id
          ? { ...item, quantidade: item.quantidade - 1 }
          : item
      )
      .filter(item => item.quantidade > 0)
    );
  }

  // Esvazia o carrinho
  function clearCart() {
    setCartItems([]);
    localStorage.removeItem("cartItems");
  }

  // Total do carrinho
  const total = cartItems.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

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
