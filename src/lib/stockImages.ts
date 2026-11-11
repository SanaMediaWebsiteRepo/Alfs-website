/**
 * Utility for mapping products to high-quality, relevant Unsplash stock images.
 * Uses deterministic hashing based on the product ID to ensure consistency and variety.
 */

// Simple string hash function to deterministically map product IDs to dynamic indices of our image pools.
export function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Fine-tuned image pools representing specific categories or keywords.
const IMAGE_POOLS = {
  denim: [
    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80', // Denim jacket close up
    'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80', // Premium denim jeans
    'https://images.unsplash.com/photo-1582418702059-97ebafb35d09?auto=format&fit=crop&w=600&q=80', // Indigo denim fabric
  ],
  boots: [
    'https://images.unsplash.com/photo-1549474840-3a55479273c5?auto=format&fit=crop&w=600&q=80', // Classic leather safety boot
    'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=600&q=80', // Black Chelsea work boots
    'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=600&q=80', // Rugged combat safety boots
  ],
  sneakers: [
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80', // High quality canvas sneaker
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=600&q=80', // Sporty active runners
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', // Red athletic sneaker
  ],
  respirator: [
    'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=600&q=80', // Worker in custom respirators
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', // Safety double cartridge respirator mask
  ],
  goggles: [
    'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=600&q=80', // Clear protective industrial goggles
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80', // Professional protective wrap-around lenses
  ],
  gloves: [
    'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?auto=format&fit=crop&w=600&q=80', // Split cowhide leather heavy duty glove
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80', // Sturdy hand protection yellow/black gloves
  ],
  hardhat: [
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80', // Yellow safety hard hat on a table
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80', // Construction site worker in hard hat
  ],
  firstaid: [
    'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=600&q=80', // Complete First Aid container box
  ],
  earwear: [
    'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=600&q=80', // Red professional noise cancelling earmuffs
  ],
  chef: [
    'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=600&q=80', // Chef preparing meal with professional white uniform
    'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=600&q=80', // Culinary expert apron / kitchen worker
  ],
  headwear: [
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80', // Classical clean baseball cap
    'https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?auto=format&fit=crop&w=600&q=80', // Warm black winter beanie
    'https://images.unsplash.com/photo-1575424909138-46b05e5919ec?auto=format&fit=crop&w=600&q=80', // Streetwear cotton bucket hat
  ],
  tshirts: [
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80', // Clean plain athletic crew neck shirt
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80', // Black minimalistic combed t-shirt
  ],
  golfers: [
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80', // High-end collared polo t-shirt
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80', // Neatly folded blue golf shirt
  ],
  jackets: [
    'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80', // Durable insulated black outdoor technical jacket
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80', // Lightweight sport windbreaker
    'https://images.unsplash.com/photo-1508445822-a6e5a8bd016c2?auto=format&fit=crop&w=600&q=80', // Heavy duty insulated worker jacket
  ],
  hivis: [
    'https://images.unsplash.com/photo-1508847154043-be12a3253a24?auto=format&fit=crop&w=600&q=80', // Fluorescent safety yellow neon belt
    'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80', // Logistics worker wearing yellow reflector vest
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80', // Bright orange reflective engineering vest
  ],
  contrasuits: [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80', // Technicians in dark blue protective conti suits
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80', // Worker in heavy cotton workwear suit
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80', // Heavy twill construction site jacket and trousers
  ],
  jumpsuits: [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80', // Engineer wearing industrial overalls/boiler suit
  ],
  security: [
    'https://images.unsplash.com/photo-1453227588063-bb302b62f50b?auto=format&fit=crop&w=600&q=80', // Tactical patrol gear / security officer uniform
  ],
  safety_sys: [
    'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80', // Industrial safety harnesses and rope lines
  ]
};

/**
 * Returns a magnificent, contextually relevant Unsplash image based on names, descriptions and categories.
 */
export function getStockImageForProduct(id: string, name: string, category: string, desc: string = ''): string {
  const cleanId = id.toLowerCase();
  const cleanName = name.toLowerCase();
  const cleanDesc = desc.toLowerCase();
  const cleanCategory = category.toLowerCase();

  const hash = hashCode(id);

  // Helper to pick deterministic image from a specific pool
  const pickFromPool = (pool: string[]): string => {
    return pool[hash % pool.length];
  };

  // 1. Keyword Overrides inside Name or Description
  if (cleanName.includes('denim') || cleanDesc.includes('denim') || cleanName.includes('jean')) {
    return pickFromPool(IMAGE_POOLS.denim);
  }
  if (cleanName.includes('chelsea') || cleanName.includes('boot') || cleanDesc.includes('combat')) {
    return pickFromPool(IMAGE_POOLS.boots);
  }
  if (cleanName.includes('shoe') || cleanName.includes('sneaker') || cleanName.includes('canvas')) {
    if (cleanName.includes('sneaker') || cleanName.includes('canvas')) {
      return pickFromPool(IMAGE_POOLS.sneakers);
    }
    return pickFromPool(IMAGE_POOLS.boots);
  }
  if (cleanName.includes('respirator') || cleanName.includes('mask') || cleanName.includes('ffp')) {
    return pickFromPool(IMAGE_POOLS.respirator);
  }
  if (cleanName.includes('goggle') || cleanName.includes('glasses') || cleanName.includes('lens')) {
    return pickFromPool(IMAGE_POOLS.goggles);
  }
  if (cleanName.includes('earplug') || cleanName.includes('ear muff') || cleanName.includes('earmuff') || cleanName.includes('noise')) {
    return pickFromPool(IMAGE_POOLS.earwear);
  }
  if (cleanName.includes('glove') || cleanName.includes('chromes') || cleanName.includes('leather gloves')) {
    return pickFromPool(IMAGE_POOLS.gloves);
  }
  if (cleanName.includes('hard hat') || cleanName.includes('helmet') || cleanName.includes('head protection')) {
    return pickFromPool(IMAGE_POOLS.hardhat);
  }
  if (cleanName.includes('first aid') || cleanName.includes('aid kit')) {
    return pickFromPool(IMAGE_POOLS.firstaid);
  }
  if (cleanName.includes('chef') || cleanName.includes('beanie chef') || cleanName.includes('apron')) {
    return pickFromPool(IMAGE_POOLS.chef);
  }
  if (cleanName.includes('beanie') || cleanName.includes('scarf') || cleanName.includes('h-al')) {
    if (cleanName.includes('beanie')) {
      return pickFromPool(IMAGE_POOLS.headwear);
    }
    return pickFromPool(IMAGE_POOLS.headwear);
  }
  if (cleanName.includes('lanyard') || cleanName.includes('belt')) {
    if (cleanName.includes('belt')) {
      return pickFromPool(IMAGE_POOLS.hivis);
    }
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'; // Clean lanyard aesthetic ribbon
  }
  if (cleanName.includes('backpack') || cleanName.includes('bag')) {
    return pickFromPool(IMAGE_POOLS.headwear);
  }
  if (cleanName.includes('golf') || cleanName.includes('golfer') || cleanName.includes('polo')) {
    return pickFromPool(IMAGE_POOLS.golfers);
  }
  if (cleanName.includes('t-shirt') || cleanName.includes('tee') || cleanName.includes('shirt')) {
    if (cleanName.includes('jacket') || cleanName.includes('vest')) {
      // Proceed to jackets/hivis
    } else {
      return pickFromPool(IMAGE_POOLS.tshirts);
    }
  }
  if (cleanName.includes('jacket') || cleanName.includes('windbreaker') || cleanName.includes('bodywarmer') || cleanName.includes('coat')) {
    if (cleanCategory === 'hivis') {
      return pickFromPool(IMAGE_POOLS.hivis);
    }
    return pickFromPool(IMAGE_POOLS.jackets);
  }

  // 2. Fallbacks based purely on CATEGORY
  switch (cleanCategory) {
    case 'conti':
      return pickFromPool(IMAGE_POOLS.contrasuits);
    case 'boiler':
      return pickFromPool(IMAGE_POOLS.jumpsuits);
    case 'hivis':
      return pickFromPool(IMAGE_POOLS.hivis);
    case 'ppe':
      return pickFromPool(IMAGE_POOLS.gloves);
    case 'footwear':
      return pickFromPool(IMAGE_POOLS.boots);
    case 'hospitality':
      return pickFromPool(IMAGE_POOLS.chef);
    case 'headwear':
      return pickFromPool(IMAGE_POOLS.headwear);
    case 'leisure':
    case 'leisurewear':
      return pickFromPool(IMAGE_POOLS.golfers);
    case 'security':
      return pickFromPool(IMAGE_POOLS.security);
    case 'safety':
      return pickFromPool(IMAGE_POOLS.safety_sys);
    default:
      // Absolutely global fallback using a pleasant premium texture
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
  }
}
