import { useState, useEffect, useMemo } from 'react';
import productsData from '../data/products.json';
import { getStockImageForProduct } from '../lib/stockImages';

export interface Product {
  id: string;
  name: string;
  category: string;
  supplier: string;
  spec?: string;
  colours?: string[];
  desc: string;
  image?: string;
  fallbackImage?: string;
  features?: string[];
  applications?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Remote CSV / Excel datasource (optional — leave blank to use products.json)
// ─────────────────────────────────────────────────────────────────────────────
const SHEET_CSV_URL = '';

function deduplicateById(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products
    .map((p) => {
      return {
        spec: '',
        colours: [],
        features: [],
        applications: [],
        ...p
      };
    })
    .filter((p) => {
      const key = `${p.supplier || ''}:${p.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

import { SHOW_PRODUCTS } from '../config/features';

export function useProducts(initialProducts?: Product[]) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts && SHOW_PRODUCTS);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSupplier, setActiveSupplier] = useState('all');
  const [rawSearch, setRawSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetConnected, setSheetConnected] = useState(false);
  const [dataSource, setDataSource] = useState<'supabase' | 'local-json'>('local-json');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(rawSearch);
    }, 200);
    return () => clearTimeout(timer);
  }, [rawSearch]);

  useEffect(() => {
    if (!SHOW_PRODUCTS) {
      setLoading(false);
      return;
    }

    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      // 1. Try remote CSV sheet if URL set
      if (SHEET_CSV_URL) {
        try {
          const res = await fetch(SHEET_CSV_URL);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          // (CSV parsing omitted — using Excel data instead)
        } catch (err) {
          console.warn('Sheet fetch failed:', err);
        }
      }

      // Try fetching from live Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/alfs_products?order=id`, {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${supabaseAnonKey}`,
            },
          });
          if (res.ok) {
            const dbProducts = await res.json();
            if (Array.isArray(dbProducts) && dbProducts.length > 0) {
              const mapped = dbProducts.map((p: any) => ({
                ...p,
                desc: p.description || '',
              }));
              setProducts(deduplicateById(mapped));
              setDataSource('supabase');
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Supabase fetch failed:', err);
        }
      }

      // 2. Use bundled products.json (from Excel)
      const data = deduplicateById(productsData as Product[]);
      setProducts(data);
      setDataSource('local-json');
      setLoading(false);
    };

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).sort();
  }, [products]);

  const suppliers = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.supplier))).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesSupplier = activeSupplier === 'all' || product.supplier === activeSupplier;
      const matchesSearch =
        !q ||
        product.id.toLowerCase().includes(q) ||
        product.name.toLowerCase().includes(q) ||
        product.desc.toLowerCase().includes(q) ||
        (product.supplier || '').toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);
      return matchesCategory && matchesSupplier && matchesSearch;
    });
  }, [products, activeCategory, activeSupplier, searchQuery]);

  return {
    filteredProducts, products, loading, error,
    activeCategory, setActiveCategory,
    activeSupplier, setActiveSupplier,
    searchQuery: rawSearch, setSearchQuery: setRawSearch,
    categories, suppliers, sheetConnected, dataSource,
  };
}
