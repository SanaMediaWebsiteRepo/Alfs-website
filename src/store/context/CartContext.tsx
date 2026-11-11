import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SAMPLE_PRODUCTS, SampleProduct } from '../data/sampleProducts';
import { DEMO_IS_CONTRACTOR } from '../../config/features';

export interface StoredCartLine {
  productId: string;
  size?: string;
  colour?: string;
  quantity: number;
}

export interface PopulatedCartLine {
  lineKey: string;
  productId: string;
  product: SampleProduct;
  size?: string;
  colour?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  regularTotal: number;
}

interface CartContextValue {
  lines: PopulatedCartLine[];
  totalItems: number;
  subtotal: number;
  totalSavings: number;
  isContractorPricing: boolean;
  isMiniCartOpen: boolean;
  addItem: (item: { productId: string; size?: string; colour?: string; quantity?: number }) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  removeItem: (lineKey: string) => void;
  clearCart: () => void;
  openMiniCart: () => void;
  closeMiniCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'alfs_store_cart_v1';

function getLineKey(productId: string, size = '', colour = ''): string {
  return `${productId}__${size}__${colour}`;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedLines, setStoredLines] = useState<StoredCartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedLines));
    } catch {}
  }, [storedLines]);

  const lines = useMemo<PopulatedCartLine[]>(() => {
    return storedLines.reduce<PopulatedCartLine[]>((acc, item) => {
      const product = SAMPLE_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) return acc;
      const unitPrice = DEMO_IS_CONTRACTOR ? product.contractorPriceNum : product.price;
      const lineTotal = unitPrice * item.quantity;
      const regularTotal = product.price * item.quantity;
      acc.push({
        lineKey: getLineKey(item.productId, item.size, item.colour),
        productId: item.productId,
        product,
        size: item.size,
        colour: item.colour,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
        regularTotal,
      });
      return acc;
    }, []);
  }, [storedLines]);

  const totalItems = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.lineTotal, 0), [lines]);
  const totalSavings = useMemo(() => {
    return lines.reduce((sum, l) => sum + Math.max(0, l.regularTotal - l.lineTotal), 0);
  }, [lines]);

  const addItem = ({ productId, size, colour, quantity = 1 }: { productId: string; size?: string; colour?: string; quantity?: number }) => {
    setStoredLines((prev) => {
      const key = getLineKey(productId, size, colour);
      const existingIdx = prev.findIndex((i) => getLineKey(i.productId, i.size, i.colour) === key);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + quantity };
        return next;
      }
      return [...prev, { productId, size, colour, quantity }];
    });
    setIsMiniCartOpen(true);
  };

  const updateQuantity = (lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(lineKey);
      return;
    }
    setStoredLines((prev) =>
      prev.map((i) => (getLineKey(i.productId, i.size, i.colour) === lineKey ? { ...i, quantity } : i))
    );
  };

  const removeItem = (lineKey: string) => {
    setStoredLines((prev) => prev.filter((i) => getLineKey(i.productId, i.size, i.colour) !== lineKey));
  };

  const clearCart = () => setStoredLines([]);

  return (
    <CartContext.Provider
      value={{
        lines,
        totalItems,
        subtotal,
        totalSavings,
        isContractorPricing: DEMO_IS_CONTRACTOR,
        isMiniCartOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        openMiniCart: () => setIsMiniCartOpen(true),
        closeMiniCart: () => setIsMiniCartOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
