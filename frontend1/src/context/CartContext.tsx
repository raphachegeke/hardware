import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("wt_cart") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("wt_cart", JSON.stringify(items)); }, [items]);

  const addItem = (item: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) => i.productId === item.productId ? { ...i, quantity: Math.min(i.quantity + qty, i.stock) } : i);
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeItem = (productId: string) => setItems((p) => p.filter((i) => i.productId !== productId));
  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) return removeItem(productId);
    setItems((p) => p.map((i) => i.productId === productId ? { ...i, quantity: Math.min(qty, i.stock) } : i));
  };
  const clearCart = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>{children}</CartContext.Provider>;
};
