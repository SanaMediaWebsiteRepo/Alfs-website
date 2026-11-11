import { formatKwacha } from '../lib/format';

export interface SampleProduct {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  price: number;
  contractorPriceNum: number;
  normalPrice: string;
  contractorPrice: string;
  leadTime: string;
  description: string;
  features: string[];
  sizes: string[];
  colours: string[];
  placeholderImages: string[];
  iconName: 'footwear' | 'workwear' | 'head' | 'hand' | 'hivis' | 'eye';
}

export interface CategoryInfo {
  id: string;
  slug: string;
  name: string;
  iconName: 'footwear' | 'workwear' | 'head' | 'hand' | 'hivis' | 'eye';
}

export const SAMPLE_CATEGORIES: CategoryInfo[] = [
  { id: 'safety-footwear', slug: 'safety-footwear', name: 'Safety Footwear', iconName: 'footwear' },
  { id: 'workwear', slug: 'workwear', name: 'Workwear', iconName: 'workwear' },
  { id: 'head-protection', slug: 'head-protection', name: 'Head Protection', iconName: 'head' },
  { id: 'hand-protection', slug: 'hand-protection', name: 'Hand Protection', iconName: 'hand' },
  { id: 'high-visibility', slug: 'high-visibility', name: 'High-Visibility', iconName: 'hivis' },
  { id: 'eye-ear-protection', slug: 'eye-ear-protection', name: 'Eye & Ear Protection', iconName: 'eye' },
];

function createProduct(
  id: string,
  name: string,
  category: string,
  categorySlug: string,
  price: number,
  iconName: SampleProduct['iconName'],
  desc: string,
  features: string[],
  sizes: string[] = [],
  colours: string[] = []
): SampleProduct {
  const contractorPriceNum = Math.round(price * 0.85);
  return {
    id,
    name,
    category,
    categorySlug,
    price,
    contractorPriceNum,
    normalPrice: formatKwacha(price),
    contractorPrice: formatKwacha(contractorPriceNum),
    leadTime: '2-3 days',
    description: desc,
    features,
    sizes,
    colours,
    placeholderImages: [`${name} - Front Angle`, `${name} - Side Profile`, `${name} - Detail Close-Up`],
    iconName,
  };
}

export const SAMPLE_PRODUCTS: SampleProduct[] = [
  // Safety Footwear
  createProduct('prod-001', 'Enduro Chelsea S1P Safety Boot', 'Safety Footwear', 'safety-footwear', 1450, 'footwear',
    'Engineered pull-on leather boot built for mining and industrial job sites. Features a dual-density PU sole and SABS-certified steel toe.',
    ['Steel toe cap rated to 200 Joules', 'Anti-static and oil-resistant dual PU sole', 'Elastic side gussets for quick release'],
    ['UK 5', 'UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'], ['Black', 'Dark Brown']),
  createProduct('prod-002', 'Titan Pro S3 Steel Toe Work Boot', 'Safety Footwear', 'safety-footwear', 1680, 'footwear',
    'Heavy-duty lace-up boot equipped with water-resistant leather and anti-penetration steel midsole. Designed for tough construction ground conditions.',
    ['Puncture-resistant steel midsole plate', 'Padded collar and tongue for all-day comfort', 'Heat-resistant outsole up to 130°C'],
    ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'], ['Black', 'Tan']),
  createProduct('prod-003', 'HydroFlex Heavy-Duty PVC Gumboot', 'Safety Footwear', 'safety-footwear', 520, 'footwear',
    'Industrial grade waterproof gumboot built for wet excavation, agriculture, and wash bays. SABS certified with deep cleated traction tread.',
    ['100% waterproof virgin PVC formulation', 'Reinforced shin and ankle protection ribs', 'Acid and solvent resistant compound'],
    ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'], ['Black / Red', 'White / Grey']),
  createProduct('prod-004', 'Vanguard Metatarsal Guard Site Boot', 'Safety Footwear', 'safety-footwear', 1950, 'footwear',
    'Specialist metatarsal safety boot designed for foundry and heavy crushing operations. Delivers comprehensive impact protection across the entire bridge.',
    ['Integrated XRD impact metatarsal guard', 'Full grain heat-treated water-resistant leather', 'Nitrile rubber sole heat rated to 300°C'],
    ['UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11'], ['Black']),

  // Workwear
  createProduct('prod-005', 'Standard 100% Cotton J54 Acid Conti Suit', 'Workwear', 'workwear', 850, 'workwear',
    'Heavy-weight 100% cotton conti suit treated with acid and chemical repellence. Dual-stitched stress points ensure maximum durability under site duty.',
    ['Triple-needle stitching on seams and crotch', 'Concealed metal zip jacket with chest pocket', 'Deep front pockets and ruler compartment'],
    ['32', '34', '36', '38', '40', '42', '44', '46', '48'], ['Navy', 'Royal Blue', 'Emerald Green']),
  createProduct('prod-006', 'DuoTone Polycotton Site Contractor Suit', 'Workwear', 'workwear', 720, 'workwear',
    'Versatile 65/35 polycotton two-piece contractor workwear suit. Lightweight, easy to wash, and reinforced for general engineering teams.',
    ['High-tensile polycotton twill fabric', 'Reinforced bar-tacking on all pocket corners', 'Elasticated back waistband for ergonomic flex'],
    ['32', '34', '36', '38', '40', '42', '44', '46'], ['Navy', 'Grey', 'Black']),
  createProduct('prod-007', 'Heavy-Duty Canvas Cargo Work Trouser', 'Workwear', 'workwear', 640, 'workwear',
    'Rugged ripstop utility trousers with articulated knees and multiple holster tool loops. Ideal for electricians, plumbers, and maintenance crews.',
    ['Multi-compartment cargo utility pockets', 'Cordura reinforced knee pad pouches', 'Wide heavy belt loops and double rear yoke'],
    ['30', '32', '34', '36', '38', '40', '42'], ['Khaki', 'Charcoal', 'Navy']),
  createProduct('prod-008', 'Flame-Retardant Mining Boiler Suit', 'Workwear', 'workwear', 1350, 'workwear',
    'Full one-piece protective coverall treated for flame retardancy and thermal flash protection. Essential safety gear for smelting and refinery crews.',
    ['EN ISO 11612 certified flame resistance', 'Two-way brass safety zip with protective flap', 'Reflective arm and leg tape for high site visibility'],
    ['34', '36', '38', '40', '42', '44', '46'], ['Orange', 'Navy', 'Red']),

  // Head Protection
  createProduct('prod-009', 'AeroVent Vented Safety Hard Hat', 'Head Protection', 'head-protection', 360, 'head',
    'Lightweight polypropylene safety helmet featuring crown ventilation channels for warm Zambian climates. EN 397 approved for site construction.',
    ['Adjustable 6-point pin-lock suspension harness', 'Integrated sweatband and rain gutter rim', 'Compatible with earmuff and visor slot accessories'],
    ['Universal'], ['White', 'Yellow', 'Blue', 'Red']),
  createProduct('prod-010', 'Apex Ratchet Mining Safety Helmet', 'Head Protection', 'head-protection', 440, 'head',
    'Heavy-duty industrial safety helmet with wheel ratchet suspension for instant micro-adjustment. Certified electrical insulation up to 1000V.',
    ['Smooth wheel ratchet dial for secure fit', 'High-density ABS shell with side impact ribbing', 'Lamp bracket attachment slot for underground work'],
    ['Universal'], ['White', 'Yellow', 'Orange']),
  createProduct('prod-011', 'ProShield Full Face Clear Visor & Browguard', 'Head Protection', 'head-protection', 490, 'head',
    'Industrial browguard and high-impact polycarbonate visor assembly. Protects technicians against chemical splashes, grinding sparks, and flying debris.',
    ['Optical Class 1 high-clarity curved polycarbonate', 'Flip-up ratchet headband with padded forehead cushion', 'Impact resistant according to EN 166 standards'],
    ['Universal'], ['Clear']),
  createProduct('prod-012', 'SiteGuard Forestry Mesh Face Shield Unit', 'Head Protection', 'head-protection', 580, 'head',
    'Combined head and face protection system equipped with steel wire mesh visor and ear defenders. Tailored for clearing, landscaping, and quarry sites.',
    ['Heavy-gauge steel wire mesh prevents fogging', 'Integrated 28dB SNR clip-on ear defenders', 'Wide peripheral field with sun peak rim'],
    ['Universal'], ['Yellow / Black']),

  // Hand Protection
  createProduct('prod-013', 'SureGrip Heavy Chemical Nitrile Gauntlet', 'Hand Protection', 'hand-protection', 140, 'hand',
    'Flock-lined green nitrile glove engineered for handling hydrocarbons, oils, and harsh acids. Diamond texture provides exceptional wet and oily grip.',
    ['33cm gauntlet forearm splash coverage', 'Cotton flock lining absorbs interior hand sweat', 'EN 388 mechanical and EN 374 chemical certified'],
    ['Size 8 (M)', 'Size 9 (L)', 'Size 10 (XL)'], ['Green']),
  createProduct('prod-014', 'Kevlar Pro Level 5 Cut-Resistant Gloves', 'Hand Protection', 'hand-protection', 260, 'hand',
    'Seamless HPPE and Kevlar knit glove with micro-foam nitrile palm coating. Delivers maximum cut protection without compromising tactile dexterity.',
    ['EN 388 Level 5 / Cut Level D resistance', 'Breathable back of hand keeps workers cool', 'Elasticated wrist prevents ingress of debris'],
    ['Size 8 (M)', 'Size 9 (L)', 'Size 10 (XL)'], ['Grey / Black']),
  createProduct('prod-015', 'ThermoWeld Split Leather Welding Gauntlet', 'Hand Protection', 'hand-protection', 180, 'hand',
    'Heavy cow split leather welding glove lined with fire-resistant cotton fleece. Shields hands and forearms against molten spatter and radiant heat.',
    ['Full 35cm length with reinforced thumb welt', 'Kevlar heat-resistant stitched seams throughout', 'Thermal protection certified up to 250°C contact'],
    ['One Size'], ['Red', 'Brown']),
  createProduct('prod-016', 'RiggerGuard Chrome Leather Heavy Glove', 'Hand Protection', 'hand-protection', 110, 'hand',
    'Classic industrial rigger glove with reinforced leather palm and knuckle protection band. Economical and rugged for rigging and warehouse duty.',
    ['Split chrome leather palm, thumb, and fingertips', 'Cotton fabric back with rubberized safety cuff', 'Ideal for daily scaffolding and cable handling'],
    ['One Size'], ['Multi-Colour']),

  // High-Visibility
  createProduct('prod-017', 'Class 2 Zip-Front Reflective Safety Vest', 'High-Visibility', 'high-visibility', 190, 'hivis',
    'Durable polyester safety waistcoat with heavy-duty front zip and transparent ID card pocket. Features 50mm silver retroreflective bands.',
    ['EN ISO 20471 Class 2 compliant reflectivity', 'Clear plastic ID pouch and chest pen pockets', 'Zipped closure prevents accidental snagging on site'],
    ['M', 'L', 'XL', '2XL', '3XL'], ['Hi-Vis Yellow', 'Hi-Vis Orange']),
  createProduct('prod-018', 'All-Weather Waterproof High-Vis Parka', 'High-Visibility', 'high-visibility', 1200, 'hivis',
    'Heavyweight two-tone waterproof winter jacket with quilted thermal lining and concealed hood. Keeps operators dry and clearly visible in rain.',
    ['300D Oxford PU-coated waterproof outer shell', 'Double band reflective tape on torso and sleeves', 'Internal phone pocket and storm flap closure'],
    ['M', 'L', 'XL', '2XL', '3XL'], ['Yellow / Navy', 'Orange / Navy']),
  createProduct('prod-019', 'Two-Tone High-Vis Workwear Conti Suit', 'High-Visibility', 'high-visibility', 890, 'hivis',
    'Industrial two-piece conti suit combining reflective bands with dirt-concealing contrast navy panels. Designed for traffic and roadside construction.',
    ['50mm SABS-approved glass bead reflective tape', 'Navy lower sections hide grease and oil marks', 'Triple stitched stress seams on seat and inner legs'],
    ['34', '36', '38', '40', '42', '44', '46'], ['Yellow / Navy', 'Orange / Navy']),
  createProduct('prod-020', 'High-Vis Lightweight Mesh Traffic Waistcoat', 'High-Visibility', 'high-visibility', 135, 'hivis',
    'Ultra-breathable airflow mesh vest designed for hot summer shifts and road marshals. Features Velcro front closure for instant tear-away safety.',
    ['Open-weave polyester mesh for ventilation', 'Quick-release hook-and-loop front fastening', 'Compliant with day and night roadside standards'],
    ['Universal', 'Over-Jacket XL'], ['Fluorescent Yellow', 'Fluorescent Orange']),

  // Eye & Ear Protection
  createProduct('prod-021', 'OptiShield Anti-Scratch Safety Spectacles', 'Eye & Ear Protection', 'eye-ear-protection', 210, 'eye',
    'Wrap-around single-lens safety glasses with anti-scratch and anti-fog coatings. Provides 99.9% UV protection for indoor and outdoor works.',
    ['Optical Class 1 distortion-free polycarbonate', 'Soft rubber temple tips and flexible nose bridge', 'Side shield curvature for lateral eye protection'],
    ['Universal'], ['Clear', 'Smoke Tint', 'Amber']),
  createProduct('prod-022', 'OptiSeal Indirect Vent Chemical Splash Goggles', 'Eye & Ear Protection', 'eye-ear-protection', 280, 'eye',
    'Soft vinyl body chemical goggles with indirect liquid-deflecting baffle vents. Fits comfortably over standard prescription eyeglasses.',
    ['Indirect venting prevents liquid and mist ingress', 'Wide elasticated adjustable neoprene headband', 'Conforms to EN 166 1B liquid droplet standards'],
    ['Universal'], ['Clear']),
  createProduct('prod-023', 'AcoustiMax 35dB SNR Heavy Ear Defenders', 'Eye & Ear Protection', 'eye-ear-protection', 650, 'eye',
    'Premium double-casing hearing defenders providing maximum acoustic attenuation for high-noise areas like crushing and power generation plants.',
    ['SNR 35dB certified for extreme decibel zones', 'Padded stainless steel sprung headband wire', 'Liquid/foam filled wide sealing cushions'],
    ['Universal'], ['Black / Red']),
  createProduct('prod-024', 'SoftFoam Disposable Uncorded Earplugs (200pk)', 'Eye & Ear Protection', 'eye-ear-protection', 340, 'eye',
    'Dispenser box of slow-recovery polyurethane foam earplugs. Self-adjusting taper ensures gentle expansion and comfortable seal in ear canal.',
    ['SNR 37dB high attenuation protection rating', 'Hypoallergenic smooth soil-resistant skin', 'Individually bagged pairs for hygienic distribution'],
    ['One Size'], ['Hi-Vis Orange']),
];
