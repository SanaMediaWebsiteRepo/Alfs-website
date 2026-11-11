import React from 'react';
import { AnnouncementBar } from './AnnouncementBar';
import { StoreHeader } from './StoreHeader';
import { HeroPromo } from './HeroPromo';
import { CategoryTiles } from './CategoryTiles';
import { ProductRow } from './ProductRow';
import { ContractorBanner } from './ContractorBanner';
import { BrandStrip } from './BrandStrip';
import { FeatureBanners } from './FeatureBanners';
import { StoreFooter } from './StoreFooter';

export const StoreHome: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col selection:bg-[#C0392B]/10 selection:text-[#C0392B]">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1">
        <HeroPromo />
        <CategoryTiles />
        <ProductRow />
        <ContractorBanner />
        <BrandStrip />
        <FeatureBanners />
      </main>

      <StoreFooter />
    </div>
  );
};

export default StoreHome;
