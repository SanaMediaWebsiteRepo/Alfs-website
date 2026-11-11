import React from 'react';
import { SAMPLE_PRODUCTS, SampleProduct } from '../data/sampleProducts';
import { ProductCard } from '../ProductCard';

interface RelatedProductsProps {
  currentProductId: string;
  categorySlug: string;
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProductId,
  categorySlug,
}) => {
  const related = SAMPLE_PRODUCTS.filter(
    (p) => p.categorySlug === categorySlug && p.id !== currentProductId
  ).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-[#1a2e4a] tracking-tight">
            Related Products
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            More industrial protection from the same category
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {related.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </section>
  );
};
