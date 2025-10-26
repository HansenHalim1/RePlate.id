"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  totalQty: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "replate.cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add: CartContextType["add"] = (item, qty = 1) => {
    setItems(prev => {
      const found = prev.find(i => i.id === item.id);
      if (found) {
        return prev.map(i => (i.id === item.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { ...item, qty }];
    });
  };

  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const setQty = (id: string, qty: number) =>
    setItems(prev => prev.map(i => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  const clear = () => setItems([]);

  const { totalQty, totalPrice } = useMemo(() => {
    const tq = items.reduce((s, i) => s + i.qty, 0);
    const tp = items.reduce((s, i) => s + i.qty * i.price, 0);
    return { totalQty: tq, totalPrice: tp };
  }, [items]);

  return (
    <CartContext.Provider
      value={{ items, add, remove, setQty, clear, totalQty, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
