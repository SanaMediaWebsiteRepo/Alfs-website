import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SampleProduct } from '../data/sampleProducts';

export interface FilterState {
  minPrice: string;
  maxPrice: string;
  size: string;
  colour: string;
  sort: string;
}

export function useProductFilters(initialProducts: SampleProduct[]) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: FilterState = useMemo(() => ({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    size: searchParams.get('size') || '',
    colour: searchParams.get('colour') || '',
    sort: searchParams.get('sort') || 'name_asc',
  }), [searchParams]);

  const setFilter = (key: keyof FilterState, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) next.set('q', q);
    setSearchParams(next, { replace: true });
  };

  // Extract all unique sizes and colours from current product set
  const { allSizes, allColours } = useMemo(() => {
    const sizesSet = new Set<string>();
    const coloursSet = new Set<string>();
    initialProducts.forEach((p) => {
      p.sizes.forEach((s) => sizesSet.add(s));
      p.colours.forEach((c) => coloursSet.add(c));
    });
    return {
      allSizes: Array.from(sizesSet),
      allColours: Array.from(coloursSet),
    };
  }, [initialProducts]);

  // Filter & sort
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        if (filters.minPrice && p.price < Number(filters.minPrice)) return false;
        if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
        if (filters.size && !p.sizes.includes(filters.size)) return false;
        if (filters.colour && !p.colours.includes(filters.colour)) return false;
        return true;
      })
      .sort((a, b) => {
        if (filters.sort === 'price_asc') return a.price - b.price;
        if (filters.sort === 'price_desc') return b.price - a.price;
        return a.name.localeCompare(b.name);
      });
  }, [initialProducts, filters]);

  return {
    filters,
    setFilter,
    clearFilters,
    filteredProducts,
    allSizes,
    allColours,
  };
}
