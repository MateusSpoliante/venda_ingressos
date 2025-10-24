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

  // Adiciona item ao carrinho
  function addToCart(item) {
    const itemExiste = cartItems.find(i => i.ingresso_id === item.ingresso_id);

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

  const total = cartItems.reduce((acc, i) => acc + Number(i.preco) * i.quantidade, 0);

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
