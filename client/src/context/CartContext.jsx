import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "smartsell_cart";

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price || 0),
    image: product.image || product.images?.[0]?.url || "",
    type: product.type || "seller_product",
    condition: product.condition || "new",
    stock: Number(product.stock || 1),
    location: product.location || "Sri Lanka",
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addToCart(product, quantity = 1) {
    const normalized = normalizeProduct(product);
    const safeQuantity = Math.max(1, Number(quantity || 1));

    setItems((current) => {
      const existing = current.find((item) => item.id === normalized.id);
      if (existing) {
        return current.map((item) =>
          item.id === normalized.id
            ? { ...item, quantity: Math.min((item.quantity || 1) + safeQuantity, normalized.stock || 99) }
            : item
        );
      }
      return [...current, { ...normalized, quantity: Math.min(safeQuantity, normalized.stock || 99) }];
    });
  }

  function updateQuantity(productId, quantity) {
    const safeQuantity = Math.max(1, Number(quantity || 1));
    setItems((current) =>
      current.map((item) =>
        item.id === productId ? { ...item, quantity: Math.min(safeQuantity, item.stock || 99) } : item
      )
    );
  }

  function removeFromCart(productId) {
    setItems((current) => current.filter((item) => item.id !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  const totals = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalAmount = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
    return { totalItems, totalAmount };
  }, [items]);

  const value = useMemo(
    () => ({ items, ...totals, addToCart, updateQuantity, removeFromCart, clearCart }),
    [items, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}
