import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { 
  Phone, 
  Mail, 
  ChevronRight, 
  HardHat, 
  ShieldCheck, 
  Zap, 
  MapPin, 
  CheckCircle2, 
  Menu, 
  X,
  Footprints,
  ShieldAlert,
  Upload,
  Download,
  Database,
  Factory,
  Shirt,
  Tent,
  BadgeCheck,
  Star,
  Grid,
  Facebook,
  Save,
  Search,
  ArrowLeft,
  FileText,
  Home,
  ShoppingCart,
  RefreshCw,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { dbClient } from './lib/dbClient';
import { supabase } from './lib/supabase';
import CatalogueSection from './components/CatalogueSection';
import LoadingOverlay from './components/LoadingOverlay';
import CartPanel, { CartItem } from './components/CartPanel';
import productsData from './data/products.json';
import BottomSheet from './components/BottomSheet';
import { NewsletterSignup } from './components/NewsletterSignup';

import LabourLanding from './pages/LabourLanding';
import LabourAuth from './pages/LabourAuth';
import LabourProfileSetup from './pages/LabourProfileSetup';
import LabourDashboard from './pages/LabourDashboard';
import LabourAdmin from './pages/LabourAdmin';
import LabourResetPassword from './pages/LabourResetPassword';
import TermsPage from './pages/TermsPage';
import LabourQuickJoin from './pages/LabourQuickJoin';
import { trackEvent } from './lib/analytics';
import { SHOW_LABOUR, SHOW_PRODUCTS } from './config/features';
import StoreLayout from './store/StoreLayout';
import StoreHome from './store/StoreHome';
import CategoryPage from './store/CategoryPage';
import SearchPage from './store/SearchPage';
import ProductPage from './store/ProductPage';
import CartPage from './store/CartPage';
import CheckoutPage from './store/CheckoutPage';

// --- Supabase Config ---
// SQL Setup for Supabase:
/*
  CREATE TABLE alfs_products (
    id TEXT PRIMARY KEY,
    name TEXT,
    category TEXT,
    spec TEXT,
    colours TEXT[],
    description TEXT,
    image TEXT,
    features TEXT[],
    applications TEXT[]
  );

  CREATE TABLE alfs_resellers (
    id TEXT PRIMARY KEY,
    name TEXT,
    logo TEXT,
    show_name BOOLEAN DEFAULT false
  );

  CREATE TABLE alfs_site_config (
    id TEXT PRIMARY KEY,
    value TEXT
  );
*/
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const sb = async (path: string, method = 'GET', body?: object) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in settings or env vars.');
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'resolution=merge-duplicates' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return method === 'GET' ? res.json() : res;
};

// --- Types ---
function deduplicateById(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products
    .map((p) => ({
      spec: '',
      colours: [],
      features: [],
      applications: [],
      ...p,
      image: undefined,
      fallbackImage: undefined
    }))
    .filter((p) => {
      const key = `${p.supplier || ''}:${p.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

interface Product {
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

interface Reseller {
  id: string;
  name: string;
  logo?: string;
  showName?: boolean;
}

const CATEGORIES = [
  { id: 'all', name: 'All Products' },
  { id: 'conti', name: 'Conti Suits' },
  { id: 'boiler', name: 'Boiler & Protective' },
  { id: 'hivis', name: 'Hi-Vis Wear' },
  { id: 'ppe', name: 'Industrial PPE' },
  { id: 'footwear', name: 'Footwear' },
  { id: 'hospitality', name: 'Hospitality' },
  { id: 'safety', name: 'Safety Systems' },
  { id: 'security', name: 'Security' },
  { id: 'leisure', name: 'Leisurewear' },
  { id: 'headwear', name: 'Headwear' },
  { id: 'corporate', name: 'Shirts & Tops' },
];

const DEFAULT_RESELLERS: Reseller[] = [
  { id: 'def-1', name: 'Dromex', showName: false },
  { id: 'def-2', name: 'Bova', showName: false },
  { id: 'def-3', name: 'Jonsson Workwear', showName: false },
  { id: 'def-4', name: 'Rebel Safety Gear', showName: false },
  { id: 'def-5', name: 'Salty', showName: false }
];

export function GeneralSupplyPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>(DEFAULT_RESELLERS);
  const [activeCategory, setActiveCategory] = useState('all');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [cycleWordIndex, setCycleWordIndex] = useState(0);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFlipbookOpen, setIsFlipbookOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const [activeSection, setActiveSection] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSelectedProduct, setSearchSelectedProduct] = useState<Product | null>(null);
  const [isSearchBottomSheetOpen, setIsSearchBottomSheetOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  const filteredSearchProducts = searchQuery.trim() === ''
    ? []
    : products.filter(p =>
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.supplier && p.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.desc && p.desc.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Custom scroll listener to track the active section for bottom navigation bar and desktop nav
  useEffect(() => {
    const sectionIds = ['home', 'solutions', 'catalogue', 'about', 'contact'];

    const handleScroll = () => {
      let current = 'home';
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listener for closing full-screen search overlay on Escape press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    if (searchOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  const handleAddToCart = (product: Product, quantity = 1, colour?: string) => {
    setCartItems((prev) => {
      const key = product.id + (colour || '');
      const existing = prev.find((i) => i.id + (i.colour || '') === key);
      if (existing) {
        return prev.map((i) =>
          i.id + (i.colour || '') === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          spec: product.spec || '',
          category: product.category,
          image: product.image,
          fallbackImage: product.fallbackImage,
          colour,
          quantity,
        },
      ];
    });
  };

  const totalCartItems = cartItems.reduce((s, i) => s + i.quantity, 0);
  
  const cycleWords = SHOW_LABOUR 
    ? ['MINING', 'CONSTRUCTION', 'HOSPITALITY', 'LABOUR', 'GENERAL DEALERS']
    : ['MINING', 'CONSTRUCTION', 'HOSPITALITY', 'SAFETY & PPE', 'GENERAL DEALERS'];
  const contactFormRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{id: string, active: boolean}>({id: '', active: false});
  const [uploadError, setUploadError] = useState<{ id: string; message: string } | null>(null);
  const [quoteCategory, setQuoteCategory] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const handleAdminLogin = async () => {
    if (loginLoading) return;
    if (!loginEmail || !loginPassword) {
      setLoginError('Email and password are required.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        setLoginError('Invalid email or password.');
        setLoginLoading(false);
        return;
      }
      const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || 'admin@alfslimited.com')
        .split(',')
        .map((e: string) => e.trim().toLowerCase());
      const userEmail = data.user?.email?.toLowerCase() || '';
      if (!ADMIN_EMAILS.includes(userEmail)) {
        setLoginError('This account does not have admin access.');
        await supabase.auth.signOut();
        setLoginLoading(false);
        return;
      }
      setAdminMode(true);
      setShowPinInput(false);
      setLoginPassword('');
      setLoginError('');
    } catch (err: any) {
      setLoginError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoginLoading(false);
    }
  };
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [ppeIndex, setPpeIndex] = useState(0);
  const { scrollY } = useScroll();
  const heroTranslateY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroScale = useTransform(scrollY, [0, 500], [1, 1.05]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const waLink = (msg: string) => `https://wa.me/260962334797?text=${encodeURIComponent(msg)}`;
  const trackWhatsApp = (location: string) => trackEvent('whatsapp_click', { location });

  const handleWhatsAppChat = (message: string) => {
    trackWhatsApp('catalogue');
    window.open(waLink(message), '_blank');
  };

  // Scroll and Cycle logic
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const interval = setInterval(() => {
      setCycleWordIndex((prev) => (prev + 1) % cycleWords.length);
    }, 2500);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [cycleWords.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPpeIndex(prev => (prev + 1) % 3);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Persistence logic
  useEffect(() => {
    const load = async () => {
      try {
        const [dbProducts, dbResellers, dbConfig] = await Promise.all([
          SHOW_PRODUCTS ? sb('alfs_products?order=id') : Promise.resolve([]),
          sb('alfs_resellers?order=id'),
          sb('alfs_site_config').catch(() => [])
        ]);
        
        if (SHOW_PRODUCTS) {
          if (dbProducts && dbProducts.length > 0) {
            const mapped = dbProducts.map((p: any) => ({ 
              ...p, 
              desc: p.description || '',
              colours: p.colours || [], 
              features: p.features || [], 
              applications: p.applications || [] 
            }));
            setProducts(deduplicateById(mapped));
          } else {
            setProducts(deduplicateById(productsData as Product[]));
          }
        }
        
        if (dbResellers && dbResellers.length > 0) {
          setResellers(dbResellers.map((r: any) => ({
            ...r,
            showName: r.show_name ?? r.showName ?? false
          })));
        } else {
          setResellers(DEFAULT_RESELLERS);
        }

        const logoConf = dbConfig?.find((c: any) => c.id === 'site_logo');
        if (logoConf) setSiteLogo(logoConf.value);

        localStorage.removeItem('alfs_data');

      } catch (err: any) {
        const isFetchError = err?.message?.toLowerCase().includes('failed to fetch') || String(err).toLowerCase().includes('failed to fetch');
        if (isFetchError) {
          console.warn('Supabase connectivity warning:', err);
        } else {
          console.error('Supabase error:', err);
        }
        console.warn('Supabase load failed, falling back to local storage:', err);
        if (SHOW_PRODUCTS) {
          setProducts(deduplicateById(productsData as Product[]));
        }
        const saved = localStorage.getItem('alfs_data');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.resellers && parsed.resellers.length > 0) {
              setResellers(parsed.resellers);
            } else {
              setResellers(DEFAULT_RESELLERS);
            }
            if (parsed.siteLogo) setSiteLogo(parsed.siteLogo);
          } catch (e) {
            setResellers(DEFAULT_RESELLERS);
          }
        } else {
          setResellers(DEFAULT_RESELLERS);
        }
      }
    };
    load();
  }, []);

  // Ensure products are available when adminMode is active
  useEffect(() => {
    if (adminMode && products.length === 0) {
      sb('alfs_products?order=id')
        .then((dbProducts: any[]) => {
          if (dbProducts && dbProducts.length > 0) {
            const mapped = dbProducts.map((p: any) => ({
              ...p,
              desc: p.description || '',
              colours: p.colours || [],
              features: p.features || [],
              applications: p.applications || []
            }));
            setProducts(deduplicateById(mapped));
          } else {
            setProducts(deduplicateById(productsData as Product[]));
          }
        })
        .catch(() => {
          setProducts(deduplicateById(productsData as Product[]));
        });
    }
  }, [adminMode, products.length]);

  useEffect(() => {
    localStorage.setItem('alfs_data', JSON.stringify({ resellers, siteLogo }));
  }, [resellers, siteLogo]);

  useEffect(() => {
    if (siteLogo) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = siteLogo;
    }
  }, [siteLogo]);

  const scrollToQuote = (category: string) => {
    setQuoteCategory(category);
    contactFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData as any).toString(),
    })
      .then(() => {
        setFormSubmitted(true);
        setTimeout(() => setFormSubmitted(false), 5000);
        form.reset();
      })
      .catch((error) => console.error(error));
  };

  const saveProductField = async (id: string, field: string, value: any) => {
    try {
      const payload = (field === 'desc' || field === 'description') ? { description: value } : { [field]: value };
      await sb(`alfs_products?id=eq.${encodeURIComponent(id)}`, 'PATCH', payload);
    } catch (err: any) {
      console.error(`Failed to save ${field} for product ${id}:`, err);
      alert(`Failed to save changes for this product: ${err.message || 'Unknown error'}`);
    }
  };

  const handleImageUpload = async (id: string, file: File) => {
    setUploadError(null);
    setUploadProgress({ id, active: true });
    try {
      if (file.size > 2 * 1024 * 1024) {
        setUploadError({ id, message: 'Image must be under 2MB.' });
        setUploadProgress({ id: '', active: false });
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        setUploadError({ id, message: 'Only JPG, PNG, and WEBP images are allowed.' });
        setUploadProgress({ id: '', active: false });
        return;
      }
      const ext = file.name.split('.').pop();
      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const path = `${safeId}-${Date.now()}.${ext}`;
      const { error: uploadErrorDetails } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (uploadErrorDetails) throw uploadErrorDetails;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, image: data.publicUrl } : p));
      await saveProductField(id, 'image', data.publicUrl);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError({ id, message: 'Image upload failed: ' + (err.message || 'Unknown error') });
    } finally {
      setUploadProgress({ id: '', active: false });
    }
  };

  const handleBackup = () => {
    const data = JSON.stringify({ products, resellers }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alfs_site_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const imported = JSON.parse(re.target?.result as string);
          if (imported.products) setProducts(imported.products);
          if (imported.resellers) setResellers(imported.resellers);
          alert('Data restored successfully!');
        } catch (err) {
          alert('Invalid backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveToSupabase = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      alert('Supabase credentials not found. If you have deployed to Netlify, you must add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Site Settings > Environment Variables.');
      return;
    }
    setSaveStatus('saving');
    try {
      if (products.length === 0) {
        alert('Product list appears empty — refusing to save to avoid wiping the catalogue. Please reload the page and try again.');
        setSaveStatus('idle');
        return;
      }
      // Upsert products
      const productsToSave = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        spec: p.spec || '',
        colours: p.colours || [],
        description: p.desc || '',
        image: p.image || '',
        features: p.features || [],
        applications: p.applications || [],
      }));
      await sb('alfs_products?on_conflict=id', 'POST', productsToSave);
      // Upsert resellers
      if (resellers.length > 0) {
        const resellersToSave = resellers.map(r => ({
          id: r.id,
          name: r.name || '',
          logo: r.logo || '',
          show_name: r.showName ?? true,
        }));
        await sb('alfs_resellers?on_conflict=id', 'POST', resellersToSave);
      }
      // Upsert site config
      if (siteLogo) {
        await sb('alfs_site_config?on_conflict=id', 'POST', [{ id: 'site_logo', value: siteLogo }]).catch(() => {
          console.warn('Config table missing in Supabase, logo saved locally only.');
        });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleSyncFullCatalogue = async () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      alert('Supabase credentials not found. If you have deployed to Netlify, you must add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Site Settings > Environment Variables.');
      return;
    }
    setSyncStatus('syncing');
    setSyncProgress({ current: 0, total: productsData.length });
    try {
      const mapped = productsData.map((item: any) => ({
        id: item.id,
        name: item.name || '',
        category: item.category || '',
        spec: item.spec || '',
        colours: item.colours || [],
        description: item.desc || '',
        image: item.image || '',
        features: item.features || [],
        applications: item.applications || []
      }));

      const batchSize = 100;
      let syncedCount = 0;

      for (let i = 0; i < mapped.length; i += batchSize) {
        const batch = mapped.slice(i, i + batchSize);
        try {
          await sb('alfs_products?on_conflict=id', 'POST', batch);
          syncedCount += batch.length;
          setSyncProgress({ current: syncedCount, total: mapped.length });
        } catch (error) {
          console.error(`Failed to sync batch starting at index ${i}:`, error);
        }
      }

      setSyncStatus('completed');
      setTimeout(() => setSyncStatus('idle'), 5000);
    } catch (e) {
      console.error('Catalogue sync failed:', e);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  const ppeItems = [
    {
      label: 'SAFETY VEST',
      sublabel: 'EN ISO 20471 Class II',
      image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=600&auto=format&fit=crop',
    },
    {
      label: 'HARD HAT',
      sublabel: 'SABS / EN 397 Certified',
      image: 'https://images.unsplash.com/photo-1578874691223-64558a3ca096?q=80&w=600&auto=format&fit=crop',
    },
    {
      label: 'SAFETY GLASSES',
      sublabel: 'EN 166 Impact Rated',
      image: 'https://images.unsplash.com/photo-1614680376739-414d95ff43df?q=80&w=600&auto=format&fit=crop',
    },
  ];

  return (
    <div className="font-dm text-alfs-black bg-white selection:bg-alfs-red/10 pb-16 md:pb-0">
      {/* --- TOP BAR --- */}
      <div className="hidden md:flex bg-alfs-blue text-white/60 py-2.5 px-10 justify-between items-center text-[10px] font-bold uppercase tracking-widest border-b border-white/5">
        <div className="flex gap-8">
          <a 
            href="tel:0962334797" 
            onClick={() => trackEvent('call_click', { location: 'header' })}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Phone size={12} className="text-alfs-red" /> 0962334797
          </a>
          <a href="mailto:admin@alfslimited.com" className="flex items-center gap-2 hover:text-white transition-colors">
            <Mail size={12} className="text-alfs-red" /> admin@alfslimited.com
          </a>
        </div>
        <div className="flex gap-6 items-center">
          <span className="flex items-center gap-1.5"><MapPin size={12} className="text-alfs-red" /> Lusaka Hub</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="flex items-center gap-1.5"><MapPin size={12} className="text-alfs-red" /> Chingola Office</span>
          {scrolled && (
            <>
              <span className="w-1 h-1 rounded-full bg-white/20 hidden lg:block" />
              <button 
                onClick={() => setShowPinInput(true)}
                className="hidden lg:flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Grid size={10} className="text-alfs-red" />
                <span>Admin</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- NAVBAR --- */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'glass-effect shadow-premium border-b-alfs-red/20' : 'bg-white border-b-transparent'}`}>
        <div className={`w-full px-4 md:px-10 flex justify-between items-center transition-all duration-500 ${scrolled ? 'h-20 md:h-22' : 'h-28 md:h-32'}`}>
          <a href="#" className="flex items-center gap-2 sm:gap-4">
            <div className="flex flex-col">
              <span className={`font-black tracking-[-0.05em] text-alfs-black leading-none uppercase transition-all duration-500 ${scrolled ? 'text-base sm:text-lg md:text-xl' : 'text-lg sm:text-xl md:text-2xl'}`}>ALFS<span className="font-light text-alfs-red">LIMITED</span></span>
              <span className={`font-bold uppercase tracking-[0.25em] sm:tracking-[0.4em] text-alfs-text transition-all duration-500 ${scrolled ? 'text-[7px] sm:text-[8px] md:text-[9px]' : 'text-[8px] sm:text-[9px] md:text-[11px]'}`}>Zambia's Premier General Supply Partner</span>
            </div>
            {siteLogo && (
              <div className={`${scrolled ? 'h-18 md:h-24' : 'h-[84px] md:h-36'} w-px bg-alfs-grey mx-2 sm:mx-3 hidden sm:block transition-all duration-500`} />
            )}
            {siteLogo && (
              <img 
                src={siteLogo} 
                alt="Site Logo" 
                className={`${scrolled ? 'h-18 md:h-24' : 'h-[84px] md:h-36'} w-auto object-contain transition-all duration-500`} 
              />
            )}
          </a>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center flex-1 ml-8">
            <ul className="flex gap-2 mx-auto">
              {['Home', 'Solutions', ...(SHOW_PRODUCTS ? ['Catalogue'] : []), 'About', 'Contact'].map((link) => {
                const isActive = activeSection === link.toLowerCase();
                return (
                  <li key={link}>
                    <a 
                      href={`#${link.toLowerCase()}`} 
                      className={`px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative group ${
                        isActive ? 'text-alfs-red' : 'text-alfs-black/60 hover:text-alfs-red'
                      }`}
                    >
                      {link}
                      <span className={`absolute bottom-0 left-4 right-4 h-0.5 bg-alfs-red transition-transform origin-left duration-300 ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`} />
                    </a>
                  </li>
                );
              })}
              {SHOW_LABOUR && (
                <li>
                  <Link
                    to="/labour"
                    onClick={() => trackEvent('labour_cta_click', { location: 'home' })}
                    className="px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative group text-alfs-black/60 hover:text-alfs-red"
                  >
                    Labour Force
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-alfs-red transition-transform origin-left duration-300 scale-x-0 group-hover:scale-x-100" />
                  </Link>
                </li>
              )}
            </ul>
            {SHOW_PRODUCTS && (
              <a 
                href="#contact" 
                className="bg-alfs-black text-white px-7 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-alfs-red transition-all shadow-sm hover:shadow-glow-red hover:-translate-y-0.5 active:scale-95"
              >
                Get a Quote
              </a>
            )}
          </div>

          {/* Mobile Toggle */}
          <button className="lg:hidden text-alfs-black p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-alfs-grey overflow-hidden"
            >
              <ul className="flex flex-col py-2">
                {['Home', 'Solutions', ...(SHOW_PRODUCTS ? ['Catalogue'] : []), 'About', 'Contact'].map((link) => {
                  const isActive = activeSection === link.toLowerCase();
                  return (
                    <li key={link}>
                      <a 
                        href={`#${link.toLowerCase()}`} 
                        className={`block px-8 py-3.5 text-xs font-bold uppercase tracking-widest border-b border-alfs-grey ${
                          isActive ? 'text-alfs-red bg-alfs-grey/30' : 'text-alfs-black hover:bg-alfs-grey'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link}
                      </a>
                    </li>
                  );
                })}
                {SHOW_LABOUR && (
                  <li>
                    <Link 
                      to="/labour" 
                      className="block px-8 py-3.5 text-xs font-bold uppercase tracking-widest border-b border-alfs-grey text-alfs-black hover:bg-alfs-grey"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        trackEvent('labour_cta_click', { location: 'home' });
                      }}
                    >
                      Labour Force
                    </Link>
                  </li>
                )}
                {SHOW_PRODUCTS && (
                  <li className="px-6 py-2">
                    <a 
                      href="#contact" 
                      className="block py-3.5 text-xs font-black uppercase tracking-[0.15em] bg-alfs-red text-white text-center rounded-xl hover:bg-alfs-red-hover transition-colors shadow-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Request Quote
                    </a>
                  </li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="home" className="relative bg-alfs-blue min-h-[52vh] md:min-h-screen flex items-center overflow-hidden hero-mask">
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0 z-0 bg-alfs-blue" 
        >
          {/* Subtle pattern or gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-alfs-blue/40" />
          <div className="absolute inset-0 diagonal-pattern opacity-10" />
        </motion.div>
        
        <div className="container mx-auto px-6 md:px-10 relative z-10 py-10 md:py-20">
              <motion.div 
                style={{ y: heroTranslateY }}
                className="flex flex-col items-center text-center max-w-5xl mx-auto"
              >
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-full"
                >
                  <a href="#about" className="inline-flex items-center bg-white/5 border border-white/10 px-4 py-2 mb-4 md:mb-10 group hover:border-alfs-red/50 transition-colors cursor-pointer justify-center">
                    <span className="text-alfs-red text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em]">Zambia's Professional Standard</span>
                    <ChevronRight size={14} className="text-alfs-red ml-2 group-hover:translate-x-1 transition-transform" />
                  </a>
                  
                  <h1 className="text-[clamp(1.75rem,8vw,120px)] font-bebas text-white leading-[0.9] tracking-tight mb-8" style={{ fontSize: 'clamp(1.8rem, 8vw, 120px)' }}>
                    BUILT FOR<br />
                    <span className="text-alfs-red underline decoration-1 decoration-white/20 underline-offset-8">SITE.</span>
                  </h1>

                  <div className="min-h-[48px] md:h-20 mb-6 md:mb-16 flex items-center justify-center">
                    <p className="text-[clamp(1rem,4.5vw,2.25rem)] text-white/50 font-medium tracking-wide flex flex-col md:flex-row items-center gap-2 md:gap-4">
                      <span>SPECIALIZED SOLUTIONS FOR</span>
                      <AnimatePresence mode="wait">
                        <motion.span 
                          key={cycleWords[cycleWordIndex]}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.4 }}
                          className="text-white border-b-2 border-alfs-red whitespace-nowrap px-1"
                        >
                          {cycleWords[cycleWordIndex]}
                        </motion.span>
                      </AnimatePresence>
                    </p>
                  </div>

                  <div className={`flex flex-row gap-3 sm:gap-4 justify-center items-center w-full ${SHOW_LABOUR ? 'max-w-xl' : 'max-w-xs sm:max-w-sm'} mx-auto`}>
                    {SHOW_PRODUCTS ? (
                      <a 
                        href="#catalogue" 
                        className="flex-1 bg-alfs-red text-white py-4 md:py-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] hover:bg-alfs-red-hover transition-all shadow-lg hover:shadow-glow-red hover:-translate-y-1 active:scale-[0.98] text-center"
                      >
                        Explore Catalogue
                      </a>
                    ) : (
                      <a 
                        href="#catalogue" 
                        className="flex-1 bg-alfs-red text-white py-4 md:py-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] hover:bg-alfs-red-hover transition-all shadow-lg hover:shadow-glow-red hover:-translate-y-1 active:scale-[0.98] text-center"
                      >
                        Online Store
                      </a>
                    )}
                    {SHOW_LABOUR && (
                      <Link 
                        to="/labour"
                        onClick={() => trackEvent('labour_cta_click', { location: 'home' })}
                        className="flex-1 bg-alfs-red text-white py-4 md:py-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] hover:bg-alfs-red-hover transition-all shadow-lg hover:shadow-glow-red hover:-translate-y-1 active:scale-[0.98] text-center flex items-center justify-center"
                      >
                        Labour Force
                      </Link>
                    )}
                  </div>
                </motion.div>
              </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white border-b border-alfs-grey">
        <div className="container mx-auto px-6 md:px-10">
          <div className="flex flex-col gap-16">
            {resellers.length > 0 && (
              <div className="flex flex-col items-center w-full">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-alfs-text mb-10 text-center">Proud Resellers of</span>
                <div className="flex md:flex-wrap items-center md:justify-center overflow-x-auto scrollbar-hide gap-8 md:gap-20 transition-all duration-700 w-full px-4 md:px-0 pb-4 md:pb-0 snap-x snap-mandatory">
                  {resellers.map((r) => (
                    <div key={r.id} className="flex-shrink-0 w-[55vw] md:w-auto snap-center flex flex-col items-center group">
                      {r.logo ? (
                        <div className="h-16 md:h-24 flex items-center justify-center">
                          <img 
                            src={r.logo} 
                            alt={r.name} 
                            className="h-full object-contain mb-2 transition-all" 
                            onError={(e) => {
                              // If image fails to load, hide the image and show a stylish text fallback
                              const img = e.currentTarget;
                              img.style.display = 'none';
                              const parent = img.parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.text-fallback');
                                if (fallback) {
                                  fallback.classList.remove('hidden');
                                  fallback.classList.add('flex');
                                }
                              }
                            }}
                          />
                          <div className="text-fallback hidden border-2 border-alfs-black/20 px-4 py-2 items-center justify-center bg-alfs-grey group-hover:bg-alfs-black group-hover:text-white group-hover:border-alfs-black transition-all">
                            <span className="text-lg md:text-xl font-bebas text-alfs-black group-hover:text-white tracking-widest uppercase">{r.name}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-alfs-black/20 px-5 py-2.5 flex items-center justify-center bg-alfs-grey hover:bg-alfs-black hover:text-white hover:border-alfs-black transition-all">
                          <span className="text-lg md:text-xl font-bebas text-alfs-black hover:text-white tracking-widest uppercase">{r.name}</span>
                        </div>
                      )}
                      {r.showName && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-alfs-text mt-2 opacity-50">
                          {r.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-alfs-text mb-10">Quality & Certification Standards</span>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
                {[
                  { name: 'SABS QUALITY', tag: 'CERTIFIED STANDARD' },
                  { name: 'EN CERTIFIED', tag: 'INTERNATIONAL GLOBAL' },
                  { name: 'ZAMBIAN PRIDE', tag: 'LOCAL EXCELLENCE' }
                ].map((p, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="border border-slate-300 rounded-2xl px-5 py-3 md:px-6 md:py-4 flex flex-col items-center justify-center min-w-[140px] md:min-w-[160px] hover:bg-alfs-black hover:text-white hover:border-alfs-black transition-all cursor-default group shadow-xs">
                      <span className="text-xl md:text-2xl font-bebas leading-none mb-1">{p.name}</span>
                      <span className="text-[7px] font-black tracking-[0.3em] opacity-40 group-hover:opacity-60">{p.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-10 md:py-16 bg-alfs-black text-white relative border-y border-white/5">
        <div className="container mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { value: '3', label: 'Core Service Divisions' },
              { value: '8', label: 'Industries Served' },
              { value: '100%', label: 'SABS Quality Standard' },
              { value: '24/7', label: 'Zambian Client Care' },
            ].map((stat, i) => (
              <div 
                key={i} 
                className="bg-zinc-900/90 rounded-2xl border border-white/10 p-5 md:p-8 flex flex-col items-center justify-center text-center transition-all hover:border-alfs-red/40 hover:-translate-y-1 shadow-sm"
              >
                <span className="text-3xl md:text-5xl font-bebas text-alfs-red mb-2">{stat.value}</span>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white/60">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SOLUTIONS SECTION --- */}
      <section id="solutions" className="py-10 md:py-32 bg-white">
        <div className="container mx-auto px-6 md:px-10">
          <div className="mb-8 md:mb-24 flex flex-col items-center text-center max-w-4xl mx-auto">
            <span className="text-alfs-blue text-[11px] font-black uppercase tracking-[0.5em] mb-6 block bg-alfs-blue/5 px-4 py-1.5 rounded-full">Core Specializations</span>
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bebas text-alfs-black mb-6 md:mb-8 leading-tight">TAILORED INDUSTRY PROTECTION</h2>
            <div className="w-24 h-1.5 bg-alfs-blue mb-10" />
            <p className="text-alfs-text text-lg font-medium leading-relaxed">
              Zambia's premier partner for PPE, workwear, industrial accessories, and construction solutions. 
              We serve every sector that builds, protects, and powers our nation.
            </p>
          </div>

          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible scrollbar-hide gap-6 px-4 md:px-0 snap-x snap-mandatory pt-4 pb-6 -my-4">
            {[
              { 
                title: 'CONTI SUITS & WORKWEAR', 
                desc: 'Premium cotton and polycotton options. Acid resistant tech for industrial protection.', 
                icon: (
                  <img 
                    src="https://lottie.host/e9ffa673-a5bc-4391-bd38-5dbe41f6d61e/8DLUGEDT3Y.png"
                    alt="conti suit"
                    className="w-8 h-8 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(90%) saturate(3000%) hue-rotate(338deg) brightness(90%) contrast(110%)' }}
                    loading="lazy"
                  />
                ), 
                category: 'conti' 
              },
              { 
                title: 'HI-VIS & PROTECTION', 
                desc: 'EN 20471 Class II certified. Visibility solutions for every time of day.', 
                icon: (
                  <img 
                    src="https://lottie.host/9fcb4de1-b9ea-4b14-ad79-b2197ddf8b4a/r5vD6AcUCn.png"
                    alt="danger"
                    className="w-8 h-8 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(90%) saturate(3000%) hue-rotate(338deg) brightness(90%) contrast(110%)' }}
                    loading="lazy"
                  />
                ), 
                category: 'hivis' 
              },
              { 
                title: 'INDUSTRIAL PPE', 
                desc: 'SABS approved safety eyewear, respiratory masks and fall arrest systems.', 
                icon: (
                  <img 
                    src="https://lottie.host/1b545a64-9eac-4934-ba73-81911f60ee77/VWR9CdaObo.png"
                    alt="industrial ppe"
                    className="w-8 h-8 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(90%) saturate(3000%) hue-rotate(338deg) brightness(90%) contrast(110%)' }}
                    loading="lazy"
                  />
                ), 
                category: 'ppe' 
              },
              { 
                title: 'CERTIFIED FOOTWEAR', 
                desc: 'CE EN ISO 20345 compliant boots. Steel-toe gumboots for hazardous environments.', 
                icon: (
                  <img 
                    src="https://lottie.host/80f4103a-a290-45a6-90eb-e99e9a6853da/gspbtUwacu.png"
                    alt="safety boot"
                    className="w-8 h-8 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(90%) saturate(3000%) hue-rotate(338deg) brightness(90%) contrast(110%)' }}
                    loading="lazy"
                  />
                ), 
                category: 'footwear' 
              },
              { 
                title: 'SERVICE UNIFORMS', 
                desc: 'Sophisticated hospitality and housekeeping apparel built for durability.', 
                icon: (
                  <img 
                    src="https://lottie.host/3c95d656-fab9-412e-9a44-5d6141fe5e62/rArbNmB2Zk.png"
                    alt="service uniform"
                    className="w-8 h-8 object-contain"
                    style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(90%) saturate(3000%) hue-rotate(338deg) brightness(90%) contrast(110%)' }}
                    loading="lazy"
                  />
                ), 
                category: 'hospitality' 
              },
              { 
                title: 'UTILITY LEISURE', 
                desc: 'The Ranger Range: bush shirts and utility cargos for rugged outdoor use.', 
                icon: <Tent size={32} />, 
                category: 'leisure' 
              },
            ].map((card, i) => {
              const isExpanded = !!expandedCards[card.title];
              return (
                <motion.div
                  key={card.title}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  onClick={() => {
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                    if (isMobile) {
                      setExpandedCards(prev => ({ ...prev, [card.title]: !prev[card.title] }));
                    } else {
                      setActiveCategory(card.category);
                      document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="group p-6 md:p-10 bg-alfs-grey hover:bg-white rounded-3xl border border-slate-200/80 hover:border-alfs-blue/50 transition-all duration-300 shadow-sm hover:shadow-card-hover relative overflow-hidden cursor-pointer flex-shrink-0 w-[80vw] md:w-auto snap-center"
                  style={{
                    boxShadow: 'inset 0 0 0 1px rgba(33,48,91,0)',
                    transition: 'all 0.5s ease, box-shadow 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1.5px rgba(33,48,91,0.6), 0 20px 60px rgba(33,48,91,0.12), 0 4px 20px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 0 0 1px rgba(33,48,91,0)';
                  }}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-alfs-blue/5 [clip-path:polygon(100%_0,0_0,100%_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col md:flex-col">
                    <div className="flex items-center justify-between w-full md:block">
                      <div className="flex items-center gap-4 md:block md:gap-0">
                        <div 
                          className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center relative md:mb-10"
                          style={{
                            background: 'linear-gradient(135deg, rgba(33,48,91,0.12) 0%, rgba(33,48,91,0.06) 100%)',
                            boxShadow: '0 0 0 1px rgba(33,48,91,0.3), 0 4px 20px rgba(33,48,91,0.1)',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <div className="text-alfs-blue group-hover:scale-110 transition-transform origin-center animate-none">
                            {card.icon}
                          </div>
                        </div>
                        <h3 className="font-bebas text-2xl md:text-3xl text-alfs-black tracking-wide group-hover:text-alfs-blue transition-colors">
                          {card.title}
                        </h3>
                      </div>
                      <div className="md:hidden">
                        <ChevronRight 
                          size={18} 
                          className={`text-alfs-black/40 transform transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} 
                        />
                      </div>
                    </div>

                    <div className={`mt-4 md:mt-0 ${isExpanded ? 'block' : 'hidden md:block'}`}>
                      <p className="text-alfs-text text-sm font-medium leading-loose mb-6 md:mb-8 md:mt-0 mt-2">
                        {card.desc}
                      </p>
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCategory(card.category);
                          document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-alfs-black/30 group-hover:text-alfs-blue transition-colors"
                      >
                        <span>Explore Specs</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- FEATURE SPLASH SECTION --- */}
      <section className="relative py-14 md:py-48 flex items-center justify-center overflow-hidden bg-white">
        
        <div className="container mx-auto px-6 md:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="max-w-5xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
              <div className="flex-1 text-center md:text-left">
                <span className="text-alfs-red text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Our Core Identity</span>
                <h2 className="text-5xl md:text-8xl font-bebas text-alfs-black mb-8 leading-[0.9]">THE POWER OF PROFESSIONALISM</h2>
                <div className="w-20 h-2 bg-alfs-red mb-8 mx-auto md:mx-0" />
                <p className="text-alfs-text text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                  Engineering the future of Zambian Industrial Safety requires more than just products; it demands a relentless commitment to professional excellence and technical integrity.
                </p>
              </div>
              <div className="hidden lg:flex flex-col gap-4 text-alfs-black">
                <div className="rounded-2xl border-l-4 border-alfs-red border border-slate-200/80 pl-6 pr-8 py-3 bg-slate-50/70 shadow-xs">
                  <span className="block text-4xl font-bebas">100%</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quality Inspected</span>
                </div>
                <div className="rounded-2xl border-l-4 border-alfs-red border border-slate-200/80 pl-6 pr-8 py-3 bg-slate-50/70 shadow-xs">
                  <span className="block text-4xl font-bebas">SABS</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Certified Standard</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- CATALOGUE / ONLINE STORE SECTION --- */}
      {SHOW_PRODUCTS ? (
        <CatalogueSection
          onWhatsAppChat={handleWhatsAppChat}
          externalCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
        />
      ) : (
        <section id="catalogue" className="py-20 md:py-32 bg-[#1B2A4A] text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] via-[#E42321] to-[#1B2A4A]" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-alfs-red/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-alfs-blue/40 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto px-6 md:px-10 relative z-10 text-center max-w-3xl">
            <span className="text-alfs-red text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mb-4 inline-block bg-white/5 border border-white/10 px-4 py-1.5">
              General Supply & Procurement
            </span>
            <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bebas tracking-tight text-white uppercase leading-none mb-6">
              ONLINE STORE <span className="text-alfs-red">COMING SOON</span>
            </h2>
            <div className="w-16 h-1 bg-alfs-red mx-auto mb-6" />
            <p className="text-white/80 text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto mb-10">
              Clients and contractors will soon be able to shop our complete product range online and sign up for exclusive contractor pricing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <a
                href={waLink("Hello ALFS! I would like to enquire about your products and contractor pricing.")}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackWhatsApp('store_coming_soon')}
                className="w-full sm:w-auto flex-1 bg-alfs-red hover:bg-alfs-red-hover text-white py-4 px-8 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-md hover:shadow-glow-red hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3"
              >
                <MessageCircle size={18} />
                <span>WhatsApp Enquiry</span>
              </a>
              <a
                href="mailto:admin@alfslimited.com?subject=Product%20Enquiry%20%26%20Contractor%20Pricing&body=Hello%20ALFS%20Team%2C%0A%0AI%20would%20like%20to%20enquire%20about%20your%20product%20catalogue%20and%20contractor%20pricing.%0A%0AThank%20you."
                className="w-full sm:w-auto flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-4 px-8 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3"
              >
                <Mail size={18} className="text-alfs-red" />
                <span>Email Enquiry</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* --- INDUSTRIES SECTION --- */}
      <section className="py-10 md:py-32 bg-white border-y border-alfs-grey">
        <div className="container mx-auto px-6 md:px-10 text-center">
          <div className="mb-12 md:mb-16">
            <span className="text-alfs-red text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Our Impact</span>
            <h2 className="text-[clamp(2.5rem,5vw,3.75rem)] font-bebas text-alfs-black">INDUSTRIES WE SERVE</h2>
          </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
          {[
            { 
              icon: (
                <img 
                  src="https://lottie.host/43a54c00-e3ab-49ce-9527-09f455bd3810/gOGnTFARxc.png"
                  alt="pickaxe"
                  className="w-10 h-10 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                  loading="lazy"
                />
              ), 
              title: 'Mining & Extractive' 
            },
            { icon: <HardHat size={32} />, title: 'Construction & Civil' },
            { icon: <ShieldCheck size={32} />, title: 'Corporate & Commercial' },
            { icon: <Zap size={32} />, title: 'Oil, Gas & Energy' },
            { icon: <Database size={32} />, title: 'Manufacturing' },
            { icon: <Tent size={32} />, title: 'Agriculture' },
            { icon: <Shirt size={32} />, title: 'Hospitality' },
            { icon: <BadgeCheck size={32} />, title: 'Government' },
          ].map((industry, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05 }}
          className="flex flex-col items-center group cursor-default"
        >
          <div
            className="w-16 h-16 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-all duration-300 mb-4 rotate-45 relative"
            style={{
              background: 'linear-gradient(135deg, #e42321 0%, #21305b 100%)',
              boxShadow: '0 0 0 2px rgba(228,35,33,0.15), 0 4px 20px rgba(33,48,91,0.3)',
            }}
          >
            {/* Gradient border ring */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'transparent',
                outline: '2px solid transparent',
                boxShadow: '0 0 0 3px rgba(33,48,91,0.8), 0 0 20px rgba(33,48,91,0.5), 0 0 40px rgba(33,48,91,0.2)',
              }}
            />
            <div className="-rotate-45 group-hover:scale-110 transition-transform duration-300">{industry.icon}</div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-alfs-black text-center">{industry.title}</span>
        </motion.div>
      ))}
    </div>
        </div>
      </section>

      {/* --- WHY CHOOSE US SECION --- */}
      <section className="py-10 md:py-32 bg-alfs-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-alfs-red to-transparent opacity-50" />
        <div className="container mx-auto px-6 md:px-10 relative z-10 text-center md:text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: <ShieldCheck />, title: 'SABS CERTIFIED', desc: 'SABS and international safety certifications for all gear.' },
              { icon: <HardHat />, title: 'EXPERT LABOUR', desc: 'Progressive procurement for local and international projects.' },
              { icon: <Zap />, title: 'FAST TURNAROUND', desc: 'Efficient delivery and order processing across Zambia.' },
              { icon: <MapPin />, title: 'LOCAL HUBS', desc: 'Strategically located in Lusaka and Chingola for fast service.' },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-500 scale-110"
                  style={{
                    background: 'radial-gradient(circle at 40% 40%, rgba(228,35,33,0.2) 0%, rgba(255,255,255,0.03) 70%)',
                    boxShadow: '0 0 0 1px rgba(228,35,33,0.25), 0 0 20px rgba(228,35,33,0.1)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1.5px rgba(228,35,33,0.9), 0 0 35px rgba(228,35,33,0.5), 0 0 60px rgba(228,35,33,0.15)';
                    (e.currentTarget as HTMLElement).style.background = 'radial-gradient(circle at 40% 40%, rgba(228,35,33,0.35) 0%, rgba(255,255,255,0.03) 70%)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px rgba(228,35,33,0.25), 0 0 20px rgba(228,35,33,0.1)';
                    (e.currentTarget as HTMLElement).style.background = 'radial-gradient(circle at 40% 40%, rgba(228,35,33,0.2) 0%, rgba(255,255,255,0.03) 70%)';
                  }}
                >
                  <div className="text-alfs-red scale-125">{item.icon}</div>
                </div>
                <h3 className="font-bebas text-3xl text-white mb-4 tracking-wider">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed px-4">{item.desc}</p>
                <div className="w-8 h-1 bg-alfs-red mx-auto mt-6 opacity-40 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- ABOUT SECTION --- */}
      <section id="about" className="py-10 md:py-32 bg-alfs-grey relative overflow-hidden">
        <div className="absolute inset-0 diagonal-pattern opacity-10 pointer-events-none" />
        <div className="container mx-auto px-6 md:px-10 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-24 items-start">
            <div className="lg:w-1/2">
              <span className="text-alfs-red text-[10px] font-black px-4 py-2 bg-alfs-black text-white inline-block uppercase tracking-[0.3em] mb-10">Corporate Profile</span>
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-bebas text-alfs-black mb-10 leading-none">PROFESSIONAL SUPPLY PARTNER</h2>
              
              <div className="space-y-12 text-alfs-text text-base font-medium leading-relaxed mb-12">
                <div>
                  <h3 className="font-bebas text-3xl text-alfs-black mb-4 uppercase tracking-wide">WHO WE ARE</h3>
                  <p>
                    Achilles Labour-Force Services Limited (ALFS) is a duly registered, progressive general supply company headquartered in Lusaka, Zambia. We are a one-stop procurement and supply partner for organisations operating across Zambia's most demanding industries — from the depths of the mining sector to the heights of commercial construction and corporate enterprise.
                  </p>
                  <p className="mt-4">
                    Founded on a commitment to bridging the gap between world-class products and the Zambian market, we combine our labour-force expertise with a rapidly expanding supply division to offer clients a comprehensive, reliable, and quality-assured service offering under one roof.
                  </p>
                </div>

                <div className="border-l-4 border-alfs-red pl-8">
                  <h3 className="font-bebas text-3xl text-alfs-black mb-4 uppercase tracking-wide">OUR VISION</h3>
                  <p className="italic text-lg text-alfs-black/80">
                    "To be Zambia's number one general supplier — the trusted name for PPE, workwear, industrial accessories, construction solutions, and labour-force services across every sector that builds, protects, and powers our nation."
                  </p>
                </div>

                <div>
                  <h3 className="font-bebas text-3xl text-alfs-black mb-4 uppercase tracking-wide">OUR MISSION</h3>
                  <p>
                    To deliver consistent quality, unmatched reliability, and exceptional value to every client we serve — upholding the highest standards of integrity, safety, and customer satisfaction in all that we do.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                {[
                  'Painting', 'Skimming', 'Roofing', 'Waterproofing', 
                   'Project Management', 'General Construction', 'Consultancy Services'
                ].map((service) => (
                  <div key={service} className="flex items-center gap-4 py-4 border-b border-black/5 hover:border-alfs-red/30 transition-colors">
                    <div className="w-2 h-2 bg-alfs-red rotate-45" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-alfs-black">{service}</span>
                  </div>
                ))}
              </div>

                <div className="bg-white p-8 border-l-4 border-black shadow-sm">
                  <h4 className="font-bebas text-2xl mb-4 text-alfs-red">OUR COMMITMENTS</h4>
                  <ul className="text-xs space-y-4 text-alfs-text font-bold uppercase tracking-wide">
                    <li><span className="text-alfs-black block mb-1">Quality Assurance</span> Every product we supply is sourced from reputable, certified manufacturers to ensure client confidence.</li>
                    <li><span className="text-alfs-black block mb-1">Safety First</span> We promote a culture of zero compromise on workplace safety for all employees and supply partners.</li>
                    <li><span className="text-alfs-black block mb-1">Environmental Responsibility</span> ALFS complies with all national environmental protection requirements and minimises our footprint.</li>
                    <li><span className="text-alfs-black block mb-1">Statutory Compliance</span> We ensure full compliance with all relevant Zambian regulatory and statutory requirements.</li>
                    <li><span className="text-alfs-black block mb-1">Community & CSR</span> We actively promote youth empowerment, women's advancement, and community development.</li>
                  </ul>
                </div>
            </div>

            <div className="lg:w-1/2 grid grid-cols-1 gap-8 w-full mt-12 lg:mt-0">
              {[
                { title: 'SCALABLE PROCUREMENT', desc: 'Mobilizing hundreds of skilled workers for heavy industry projects.' },
                { title: 'PAN-AFRICAN REACH', desc: 'Supporting construction flows across Zambia and regional neighbors.' },
                { title: 'RIGOROUS QUALITY CONTROL', desc: 'Every service is monitored to ensure efficiency and safety compliance.' },
                { title: 'UNWAVERING INTEGRITY', desc: 'Standing on our core principle: "Excellence through Transparency."' }
              ].map((box, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group hover:bg-alfs-black"
                >
                  <h3 className="font-bebas text-3xl text-alfs-black mb-3 tracking-wide group-hover:text-white transition-colors">{box.title}</h3>
                  <p className="text-alfs-text text-sm font-medium leading-relaxed group-hover:text-white/60 transition-colors">{box.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- CONTACT & LOCATIONS SECTION --- */}
      <section id="contact" ref={contactFormRef} className="py-10 md:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-alfs-grey" />
        <div className="container mx-auto px-6 md:px-10 relative z-10">
          {SHOW_PRODUCTS ? (
            <>
              <div className="text-center mb-12 md:mb-16">
                <span className="text-alfs-red text-[10px] font-black px-4 py-1.5 bg-black text-white inline-block uppercase tracking-[0.2em] mb-4 rounded-full shadow-xs">Ready to work?</span>
                <h2 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black tracking-tighter text-alfs-black uppercase italic leading-none">GET A QUOTE</h2>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-16 items-start">
                <div className="flex-grow w-full max-w-4xl">
                  <form 
                    onSubmit={handleSubmit} 
                    data-netlify="true"
                    name="quote-request"
                    method="POST"
                    className="space-y-8 bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
                  >
                    <input type="hidden" name="form-name" value="quote-request" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Full Name *</label>
                        <input required name="fullName" type="text" className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-semibold rounded-xl focus:bg-white focus:border-alfs-red focus:ring-4 focus:ring-red-500/10 outline-none transition-all shadow-xs placeholder:text-slate-400" placeholder="John Banda" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Company</label>
                        <input name="company" type="text" className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-semibold rounded-xl focus:bg-white focus:border-alfs-red focus:ring-4 focus:ring-red-500/10 outline-none transition-all shadow-xs placeholder:text-slate-400" placeholder="Your Construction Ltd" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Email Address *</label>
                        <input required name="email" type="email" className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-semibold rounded-xl focus:bg-white focus:border-alfs-red focus:ring-4 focus:ring-red-500/10 outline-none transition-all shadow-xs placeholder:text-slate-400" placeholder="you@company.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Phone Number</label>
                        <input name="phone" type="tel" className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-semibold rounded-xl focus:bg-white focus:border-alfs-red focus:ring-4 focus:ring-red-500/10 outline-none transition-all shadow-xs placeholder:text-slate-400" placeholder="+260..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Product Interest</label>
                        <select 
                          name="category"
                          value={quoteCategory} 
                          onChange={(e) => setQuoteCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-semibold rounded-xl focus:bg-white focus:border-alfs-red focus:ring-4 focus:ring-red-500/10 outline-none transition-all shadow-xs appearance-none"
                        >
                          <option value="">Select Category...</option>
                          {CATEGORIES.map(c => c.id !== 'all' && <option key={c.id} value={c.id}>{c.name}</option>)}
                          {SHOW_LABOUR && <option value="labour">Labour Supply Only</option>}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Estimated Quantity</label>
                        <input name="quantity" type="text" className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-semibold rounded-xl focus:bg-white focus:border-alfs-red focus:ring-4 focus:ring-red-500/10 outline-none transition-all shadow-xs placeholder:text-slate-400" placeholder="e.g. 50 units" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]">Additional Details</label>
                      <textarea name="details" className="w-full bg-slate-50 border border-slate-200 p-4 text-xs font-semibold rounded-xl focus:bg-white focus:border-alfs-red focus:ring-4 focus:ring-red-500/10 outline-none transition-all shadow-xs h-40 resize-none placeholder:text-slate-400" placeholder="Requirements..." />
                    </div>

                    <div className="pt-4">
                      <button type="submit" className="w-full bg-alfs-black text-white py-4.5 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-alfs-red transition-all shadow-md hover:shadow-glow-red hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer">
                        Submit Request
                      </button>
                      {formSubmitted && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-bold text-center rounded-xl">
                          ✅ Thank you! Your request has been sent. We'll contact you within 24 hours.
                        </motion.div>
                      )}
                    </div>
                  </form>
                </div>

                <div className="w-full lg:w-[400px] shrink-0 space-y-8">
                  <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200/90 shadow-card overflow-hidden hover:shadow-card-hover transition-all">
                    <h4 className="text-3xl font-black mb-6 tracking-tighter uppercase italic">LOCATION: LUSAKA</h4>
                    <div className="space-y-5">
                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-xl bg-alfs-red flex items-center justify-center text-white shrink-0 shadow-xs"><MapPin size={15} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-slate-700">Sunshare Tower, Floor 9, Plot 15585, Olympia, Katima Mulilo Rd</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-xl bg-alfs-black flex items-center justify-center text-white shrink-0 shadow-xs"><Phone size={15} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">0962334797</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-xl bg-alfs-red flex items-center justify-center text-white shrink-0 shadow-xs"><Mail size={15} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-alfs-red text-wrap">admin@alfslimited.com</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200/90 shadow-card overflow-hidden hover:shadow-card-hover transition-all">
                    <h4 className="text-3xl font-black mb-6 tracking-tighter uppercase italic">LOCATION: CHINGOLA</h4>
                    <div className="space-y-5">
                      <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-xl bg-alfs-red flex items-center justify-center text-white shrink-0 shadow-xs"><MapPin size={15} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-slate-700">Libonji Creations, Off Kitwe Road,<br/>Opposite Mt Meru Filling Station</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="w-8 h-8 rounded-xl bg-alfs-black flex items-center justify-center text-white shrink-0 shadow-xs"><Phone size={15} /></div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700">0962334797</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="text-center mb-12 md:mb-16">
                <span className="text-alfs-red text-[10px] font-black px-3 py-1 bg-black text-white inline-block uppercase tracking-[0.2em] mb-4">ALFS LIMITED</span>
                <h2 className="text-[clamp(2.5rem,8vw,5.5rem)] font-black tracking-tighter text-alfs-black uppercase italic leading-none">OUR LOCATIONS</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200/90 shadow-card overflow-hidden hover:shadow-card-hover transition-all">
                  <h4 className="text-3xl font-black mb-8 tracking-tighter uppercase italic">LOCATION: LUSAKA</h4>
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-xl bg-alfs-red flex items-center justify-center text-white shrink-0 shadow-xs"><MapPin size={16} /></div>
                      <span className="text-xs font-bold uppercase tracking-widest leading-relaxed text-slate-700">Sunshare Tower, Floor 9, Plot 15585, Olympia, Katima Mulilo Rd</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="w-8 h-8 rounded-xl bg-alfs-black flex items-center justify-center text-white shrink-0 shadow-xs"><Phone size={16} /></div>
                      <a href="tel:0962334797" className="text-xs font-bold uppercase tracking-widest text-slate-800 hover:text-alfs-red transition-colors">0962334797</a>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="w-8 h-8 rounded-xl bg-alfs-red flex items-center justify-center text-white shrink-0 shadow-xs"><Mail size={16} /></div>
                      <a href="mailto:admin@alfslimited.com" className="text-xs font-bold uppercase tracking-widest text-alfs-red hover:underline">admin@alfslimited.com</a>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200/90 shadow-card overflow-hidden hover:shadow-card-hover transition-all">
                  <h4 className="text-3xl font-black mb-8 tracking-tighter uppercase italic">LOCATION: CHINGOLA</h4>
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-xl bg-alfs-red flex items-center justify-center text-white shrink-0 shadow-xs"><MapPin size={16} /></div>
                      <span className="text-xs font-bold uppercase tracking-widest leading-relaxed text-slate-700">Libonji Creations, Off Kitwe Road,<br/>Opposite Mt Meru Filling Station</span>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="w-8 h-8 rounded-xl bg-alfs-black flex items-center justify-center text-white shrink-0 shadow-xs"><Phone size={16} /></div>
                      <a href="tel:0962334797" className="text-xs font-bold uppercase tracking-widest text-slate-800 hover:text-alfs-red transition-colors">0962334797</a>
                    </div>
                    <div className="flex gap-4 items-center">
                      <div className="w-8 h-8 rounded-xl bg-alfs-red flex items-center justify-center text-white shrink-0 shadow-xs"><Mail size={16} /></div>
                      <a href="mailto:admin@alfslimited.com" className="text-xs font-bold uppercase tracking-widest text-alfs-red hover:underline">admin@alfslimited.com</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- ADMIN MODAL --- */}
      <AnimatePresence>
        {adminMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setAdminMode(false)} />
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-6xl h-full max-h-[80vh] relative z-10 flex flex-col shadow-2xl p-8 md:p-12 overflow-hidden border-t-8 border-alfs-red"
            >
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-5xl font-bebas text-alfs-black leading-none uppercase">ALFS ADMIN PANEL</h2>
                  <p className="text-[10px] font-black text-alfs-red uppercase tracking-widest mt-2">Manage Catalogue & Site Assets</p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setProducts([{ 
                      id: `NEW-${Date.now()}`, 
                      name: 'New Product', 
                      category: 'conti', 
                      supplier: 'AMROD',
                      spec: 'Product Specification', 
                      colours: ['#000'], 
                      desc: 'Description here' 
                    }, ...products])}
                    className="bg-alfs-red text-white px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-alfs-black transition-all"
                  >
                    + Add New Product
                  </button>
                  <button onClick={() => setAdminMode(false)} className="bg-alfs-black text-white p-4 hover:bg-alfs-red transition-all">
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-grow overflow-y-auto pr-4 mb-12 space-y-12">
                <div>
                  <h3 className="text-xl font-bold mb-6 text-alfs-black border-b-2 border-alfs-red pb-2 inline-block uppercase tracking-widest">Products Management</h3>
                  
                  <div className="mb-6 relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-alfs-black/30" />
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Search by product name or ID..."
                      className="w-full bg-white border border-black/10 pl-11 pr-4 py-3.5 text-sm font-bold outline-none focus:border-alfs-red transition-all"
                    />
                    {productSearchQuery && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-alfs-black/40 uppercase">
                        {filteredProducts.length} found
                      </span>
                    )}
                  </div>

                  {productSearchQuery === '' ? (
                    <p className="text-sm text-alfs-black/40 italic py-12 text-center">
                      Search above by product name or ID to begin editing. ({products.length} total products)
                    </p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-sm text-alfs-black/40 italic py-8 text-center">No products match "{productSearchQuery}"</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProducts.map((p) => (
                          <div key={p.id} className="p-6 bg-alfs-grey border border-black/5 flex flex-col group relative">
                            <button 
                              onClick={() => setProducts(products.filter(item => item.id !== p.id))}
                              className="absolute top-4 right-4 text-alfs-red opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-white/50"
                            >
                              <X size={16} />
                            </button>
                            
                            <div className="space-y-4 mb-6">
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Product Name</label>
                                <input 
                                  type="text" 
                                  value={p.name} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, name: val } : item));
                                    clearTimeout((window as any)[`saveTimer_${p.id}_name`]);
                                    (window as any)[`saveTimer_${p.id}_name`] = setTimeout(() => saveProductField(p.id, 'name', val), 600);
                                  }}
                                  className="w-full bg-white border border-black/10 p-3 text-[11px] font-bold outline-none focus:border-alfs-red transition-all"
                                />
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Slug / ID</label>
                                  <input 
                                    type="text" 
                                    value={p.id} 
                                    onChange={(e) => setProducts(prev => prev.map(item => item.id === p.id ? { ...item, id: e.target.value } : item))}
                                    className="w-full bg-white border border-black/10 p-3 text-[10px] font-bold outline-none focus:border-alfs-red transition-all"
                                  />
                                </div>
                                <div>
                                   <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Supplier</label>
                                   <input 
                                     type="text" 
                                     value={p.supplier || ''} 
                                     onChange={(e) => {
                                       const val = e.target.value;
                                       setProducts(prev => prev.map(item => item.id === p.id ? { ...item, supplier: val } : item));
                                       clearTimeout((window as any)[`saveTimer_${p.id}_supplier`]);
                                       (window as any)[`saveTimer_${p.id}_supplier`] = setTimeout(() => saveProductField(p.id, 'supplier', val), 600);
                                     }}
                                     className="w-full bg-white border border-black/10 p-3 text-[10px] font-bold outline-none focus:border-alfs-red transition-all"
                                   />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Category</label>
                                  <select 
                                    value={p.category}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, category: val } : item));
                                      saveProductField(p.id, 'category', val);
                                    }}
                                    className="w-full bg-white border border-black/10 p-3 text-[10px] font-bold outline-none focus:border-alfs-red transition-all"
                                  >
                                    {CATEGORIES.map(c => c.id !== 'all' && <option key={c.id} value={c.id}>{c.name}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                            
                            <div className="relative h-48 bg-white mb-6 overflow-hidden border border-black/5 group-inner">
                              <img 
                                src={p.image || "https://images.unsplash.com/photo-1590402444811-bfee29d10203?q=80&w=2070&auto=format&fit=crop"} 
                                className="w-full h-full object-cover opacity-80" 
                                alt="Preview"
                              />
                              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload size={24} className={uploadProgress.id === p.id && uploadProgress.active ? 'animate-bounce' : ''} />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleImageUpload(p.id, e.target.files[0])}
                                />
                              </label>
                            </div>
                            {uploadError?.id === p.id && (
                              <p className="text-[10px] font-bold text-red-600 mt-1 mb-4">{uploadError.message}</p>
                            )}

                            <div className="space-y-4">
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Image URL / Data String</label>
                                <input 
                                  type="text" 
                                  value={p.image || ''} 
                                  placeholder="Type path like /image.jpg or upload"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, image: val } : item));
                                    clearTimeout((window as any)[`saveTimer_${p.id}_image`]);
                                    (window as any)[`saveTimer_${p.id}_image`] = setTimeout(() => saveProductField(p.id, 'image', val), 600);
                                  }}
                                  className="w-full bg-white border border-black/10 p-3 text-[10px] font-bold outline-none focus:border-alfs-red transition-all"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Technical Specs</label>
                                <input 
                                  type="text" 
                                  value={p.spec} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, spec: val } : item));
                                    clearTimeout((window as any)[`saveTimer_${p.id}_spec`]);
                                    (window as any)[`saveTimer_${p.id}_spec`] = setTimeout(() => saveProductField(p.id, 'spec', val), 600);
                                  }}
                                  className="w-full bg-white border border-black/10 p-3 text-[10px] font-bold outline-none focus:border-alfs-red transition-all"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Available Colours (Comma Separated Hex Codes)</label>
                                <input 
                                  type="text" 
                                  value={p.colours.join(', ')} 
                                  onChange={(e) => {
                                    const cols = e.target.value.split(',').map(c => c.trim()).filter(c => c.startsWith('#'));
                                    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, colours: cols } : item));
                                    clearTimeout((window as any)[`saveTimer_${p.id}_colours`]);
                                    (window as any)[`saveTimer_${p.id}_colours`] = setTimeout(() => saveProductField(p.id, 'colours', cols), 600);
                                  }}
                                  className="w-full bg-white border border-black/10 p-3 text-[10px] font-bold outline-none focus:border-alfs-red transition-all"
                                  placeholder="#000, #fff, #ff0000"
                                />
                                <div className="flex gap-2 mt-2">
                                  {p.colours.map((c, i) => (
                                    <div key={i} className="w-4 h-4 rounded-full border" style={{ background: c }} />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Full Description</label>
                                <textarea 
                                  value={p.desc} 
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setProducts(prev => prev.map(item => item.id === p.id ? { ...item, desc: val } : item));
                                    clearTimeout((window as any)[`saveTimer_${p.id}_description`]);
                                    (window as any)[`saveTimer_${p.id}_description`] = setTimeout(() => saveProductField(p.id, 'description', val), 600);
                                  }}
                                  className="w-full bg-white border border-black/10 p-3 text-[10px] font-bold outline-none focus:border-alfs-red transition-all h-24 resize-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-6 text-alfs-black border-b-2 border-alfs-red pb-2 inline-block uppercase tracking-widest">Site Identity</h3>
                  <div className="p-8 bg-alfs-grey border border-black/5 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-full md:w-1/3">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-alfs-text mb-4 block">Main Site Logo (Beside ALFS)</label>
                      <div className="relative h-40 bg-white border-2 border-dashed border-black/10 flex items-center justify-center group overflow-hidden">
                        {siteLogo ? (
                          <img src={siteLogo} className="max-h-full p-4 object-contain" alt="Site Logo" />
                        ) : (
                          <div className="text-center">
                            <Upload size={32} className="mx-auto text-black/20 mb-2" />
                            <span className="text-[9px] font-bold text-alfs-text uppercase tracking-widest">Upload Logo</span>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-black uppercase tracking-widest">
                          Change Logo
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (re) => {
                                  const dataUrl = re.target?.result as string;
                                  setSiteLogo(dataUrl);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex-grow space-y-4">
                      <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Logo URL (External / Data String)</label>
                        <input 
                          type="text" 
                          value={siteLogo} 
                          onChange={(e) => setSiteLogo(e.target.value)}
                          placeholder="Paste URL or upload"
                          className="w-full bg-white border border-black/10 p-4 text-[11px] font-bold outline-none focus:border-alfs-red transition-all"
                        />
                      </div>
                      <button 
                        onClick={() => setSiteLogo('')}
                        className="text-[9px] font-black uppercase tracking-widest text-alfs-red hover:underline"
                      >
                        Remove Logo
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-alfs-black border-b-2 border-alfs-red pb-2 inline-block uppercase tracking-widest">Resellers Management</h3>
                    <button 
                      onClick={() => setResellers([...resellers, { id: Date.now().toString(), name: 'New Reseller' }])}
                      className="bg-alfs-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-alfs-red transition-all"
                    >
                      + Add Reseller
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resellers.map((r) => (
                      <div key={r.id} className="p-6 bg-alfs-grey border border-black/5 flex flex-col group">
                        <div className="flex justify-between items-center mb-4">
                          <input 
                            type="text" 
                            value={r.name} 
                            onChange={(e) => setResellers(prev => prev.map(item => item.id === r.id ? { ...item, name: e.target.value } : item))}
                            className="bg-transparent border-b border-black/20 font-bebas text-xl text-alfs-black w-full outline-none focus:border-alfs-red"
                          />
                          <button 
                            onClick={() => setResellers(prev => prev.filter(item => item.id !== r.id))}
                            className="text-alfs-red opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        
                        <div className="relative h-24 bg-white mb-4 overflow-hidden border border-black/5 group-hover:border-alfs-red/30 transition-all flex items-center justify-center">
                          {r.logo ? (
                            <img src={r.logo} className="max-h-full object-contain p-2" alt="Logo Preview" />
                          ) : (
                            <span className="text-[10px] font-bold text-alfs-black/20 uppercase">No Logo</span>
                          )}
                          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload size={16} />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (re) => {
                                    const dataUrl = re.target?.result as string;
                                    setResellers(prev => prev.map(item => item.id === r.id ? { ...item, logo: dataUrl } : item));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-alfs-black/40 block mb-1">Logo URL / Data String</label>
                          <input 
                            type="text" 
                            value={r.logo || ''} 
                            placeholder="Logo path or upload"
                            onChange={(e) => setResellers(prev => prev.map(item => item.id === r.id ? { ...item, logo: e.target.value } : item))}
                            className="w-full bg-white border border-black/10 p-3 text-[10px] font-bold outline-none focus:border-alfs-red transition-all"
                          />
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            id={`showName-${r.id}`}
                            checked={r.showName || false} 
                            onChange={(e) => setResellers(prev => prev.map(item => item.id === r.id ? { ...item, showName: e.target.checked } : item))}
                            className="accent-alfs-red"
                          />
                          <label htmlFor={`showName-${r.id}`} className="text-[9px] font-black uppercase tracking-widest text-alfs-black">Show Name Under Logo</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-black/10 flex flex-wrap gap-4 items-center mt-4">
                <button
                  onClick={handleSaveToSupabase}
                  disabled={saveStatus === 'saving'}
                  className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                    saveStatus === 'saved' ? 'bg-green-600 text-white' : 
                    saveStatus === 'error' ? 'bg-red-600 text-white' : 
                    'bg-alfs-red text-white hover:bg-alfs-black'
                  }`}
                >
                  {saveStatus === 'saving' ? (
                    <><Save size={16} className="animate-spin" /> Saving...</>
                  ) : saveStatus === 'saved' ? (
                    <><CheckCircle2 size={16} /> Data Synced!</>
                  ) : saveStatus === 'error' ? (
                    '⚠ Config Error'
                  ) : (
                    <><Save size={16} /> Save to Supabase (Live)</>
                  )}
                </button>
                <button
                  onClick={handleSyncFullCatalogue}
                  disabled={syncStatus === 'syncing'}
                  className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                    syncStatus === 'syncing' ? 'bg-amber-600 text-white' :
                    syncStatus === 'completed' ? 'bg-green-600 text-white' :
                    syncStatus === 'error' ? 'bg-red-600 text-white' :
                    'bg-amber-500 text-alfs-black hover:bg-alfs-black hover:text-white'
                  }`}
                >
                  {syncStatus === 'syncing' ? (
                    <><RefreshCw size={16} className="animate-spin" /> Synced {syncProgress.current} / {syncProgress.total}</>
                  ) : syncStatus === 'completed' ? (
                    <><CheckCircle2 size={16} /> Sync Complete!</>
                  ) : syncStatus === 'error' ? (
                    '⚠ Sync Error'
                  ) : (
                    <><Database size={16} /> Sync Full Catalogue to Supabase</>
                  )}
                </button>
                <button 
                  onClick={handleBackup}
                  className="bg-alfs-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-zinc-700 transition-all"
                >
                  <Download size={16} /> Backup .json
                </button>
                <label className="bg-white border-2 border-alfs-black text-alfs-black px-8 py-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-alfs-black hover:text-white transition-all cursor-pointer">
                  <Database size={16} /> Restore
                  <input type="file" className="hidden" accept=".json" onChange={handleRestore} />
                </label>
                <div className="ml-auto text-[9px] text-alfs-text font-bold italic py-4">
                  * Local Storage Sync Active
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADMIN AUTH MODAL --- */}
      <AnimatePresence>
        {showPinInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowPinInput(false); setLoginEmail(''); setLoginPassword(''); setLoginError(''); }} />
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative z-10 bg-white border-t-8 border-alfs-blue p-10 w-full max-w-sm shadow-2xl"
            >
              <h3 className="font-bebas text-3xl text-alfs-black mb-2">Admin Access</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-alfs-text mb-6">Log in with admin account</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-alfs-text mb-1">Email Address</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setLoginError(''); }}
                    placeholder="admin@alfslimited.com"
                    className="w-full border-2 border-black/10 p-3 text-sm font-semibold outline-none focus:border-alfs-blue transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-alfs-text mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        await handleAdminLogin();
                      }
                    }}
                    placeholder="••••••••"
                    className="w-full border-2 border-black/10 p-3 text-sm font-semibold outline-none focus:border-alfs-blue transition-all"
                  />
                </div>
              </div>

              {loginError && (
                <p className="text-[#C0392B] text-[10px] font-black uppercase tracking-widest mb-4 text-center">
                  {loginError}
                </p>
              )}

              <button
                type="button"
                onClick={handleAdminLogin}
                disabled={loginLoading}
                className="w-full bg-alfs-black text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-alfs-red disabled:bg-zinc-400 disabled:cursor-not-allowed transition-all"
              >
                {loginLoading ? 'Logging in...' : 'Log In'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      <footer className="bg-alfs-blue text-white py-16 border-t border-white/5 relative">
        <div className="container mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 items-start text-center md:text-left">
            {/* Column 1: Identity */}
            <div className="flex flex-col items-center md:items-start font-sans">
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-black tracking-tighter text-white uppercase italic">ALFS<span className="font-light text-alfs-red not-italic">LIMITED</span></span>
                {siteLogo && (
                  <>
                    <div className="h-8 w-px bg-white/20" />
                    <img src={siteLogo} alt="Logo" className="h-10 w-auto object-contain" />
                  </>
                )}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 leading-relaxed max-w-xs">
                Built for site. Zambian engineering excellence in every thread and tool.
              </p>
            </div>

            {/* Column 2: Quick Contact */}
            <div className="flex flex-col items-center md:items-start font-sans">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-6">Direct Access</h4>
              <div className="flex gap-4 md:gap-6">
                <a 
                  href="https://facebook.com/alfslimited" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-alfs-red transition-all group"
                >
                  <Facebook size={20} className="md:w-6 md:h-6 text-white/40 group-hover:text-white transition-colors" />
                </a>
                <a 
                  href={waLink("Hello ALFS! I'm reaching out from your website.")} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => trackWhatsApp('footer')}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-green-500 transition-all group"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 fill-white/40 group-hover:fill-white transition-colors">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412 0 6.556-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.29-4.171c1.589.943 3.337 1.441 5.128 1.441 5.44 0 9.865-4.427 9.865-9.867 0-2.639-1.027-5.122-2.892-6.988-1.865-1.866-4.35-2.893-6.98-2.893-5.442 0-9.867 4.426-9.867 9.866 0 1.914.543 3.774 1.574 5.405l-.117.186-1.008 3.682 3.773-.99.191-.113zm11.393-5.787c-.314-.157-1.859-.918-2.146-1.022-.288-.105-.497-.157-.706.157-.209.314-.811 1.022-1.007 1.232-.196.21-.393.236-.706.079-.314-.157-1.328-.49-2.53-1.562-.936-.836-1.567-1.868-1.751-2.182-.184-.314-.02-.485.137-.641.141-.14.314-.367.471-.55.157-.184.209-.314.314-.524.105-.21.052-.393-.026-.55-.079-.157-.706-1.704-.968-2.333-.255-.612-.516-.529-.706-.539-.184-.01-.393-.01-.602-.01s-.55.079-.838.393c-.288.314-1.1 1.074-1.1 2.619s1.126 3.039 1.284 3.249c.157.21 2.215 3.383 5.366 4.743.75.324 1.335.518 1.792.662.753.239 1.439.205 1.981.125.604-.089 1.859-.76 2.121-1.467.261-.706.261-1.31.184-1.441-.079-.131-.288-.209-.603-.366z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 3: Newsletter Sign-up */}
            <div className="flex flex-col items-center md:items-start w-full">
              <NewsletterSignup sb={sb} />
            </div>

            {/* Column 4: Legal & Admin */}
            <div className="flex flex-col items-center md:items-end">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 mb-8">Corporate</h4>
              <div className="flex flex-col items-center md:items-end gap-3 text-[9px] font-bold uppercase tracking-widest text-white/40">
                <span>Privacy & Cookies</span>
                {SHOW_LABOUR ? (
                  <Link 
                    to="/labour/terms"
                    onClick={() => trackEvent('pdf_download', { document: 'terms' })}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Terms of Service
                  </Link>
                ) : (
                  <span>Terms of Service</span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/30">
            <button 
              onClick={() => setShowPinInput(true)}
              className="hover:text-white transition-all cursor-pointer flex items-center gap-3"
            >
              <Grid size={14} className="text-white/30" /> 
              <span>© {new Date().getFullYear()} ALFS LIMITED. All Rights Reserved.</span>
            </button>
            <span className="text-[10px] font-semibold tracking-wider text-white/50 normal-case">
              Designed &amp; Created by <span className="text-white font-bold tracking-wide">Mupenda Chama</span>
            </span>
            <span className="flex items-center gap-2 px-6 py-4 md:p-0">
              <BadgeCheck size={14} className="text-green-500" /> Authorized Zambia Supplier
            </span>
          </div>
        </div>
      </footer>



      {/* Cart panel */}
      {SHOW_PRODUCTS && (
        <CartPanel
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cartItems}
          onUpdateQty={(key, qty) =>
            setCartItems((prev) => prev.map((i) => (i.id + (i.colour || '') === key ? { ...i, quantity: qty } : i)))
          }
          onRemove={(key) => setCartItems((prev) => prev.filter((i) => i.id + (i.colour || '') !== key))}
          onClear={() => setCartItems([])}
        />
      )}

      {/* Persistent Bottom Navigation Bar - Mobile ONLY */}
      <div className="fixed bottom-0 inset-x-0 z-[150] bg-white border-t border-alfs-grey flex items-center justify-around px-2 py-2 safe-area-inset-bottom md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <button
          onClick={() => {
            const el = document.getElementById('home');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
            activeSection === 'home' ? 'text-alfs-red font-bold' : 'text-alfs-text'
          }`}
        >
          <Home size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
        </button>

        {SHOW_PRODUCTS && (
          <button
            onClick={() => {
              const el = document.getElementById('catalogue');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
              activeSection === 'catalogue' ? 'text-alfs-red font-bold' : 'text-alfs-text'
            }`}
          >
            <Grid size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Products</span>
          </button>
        )}

        {SHOW_PRODUCTS && (
          <button
            onClick={() => {
              const el = document.getElementById('contact');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
              activeSection === 'contact' ? 'text-alfs-red font-bold' : 'text-alfs-text'
            }`}
          >
            <FileText size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Quote</span>
          </button>
        )}

        <a
          href="https://wa.me/260962334797"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsApp('footer')}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-alfs-text transition-all hover:text-green-600"
        >
          <Phone size={20} />
          <span className="text-[9px] font-bold uppercase tracking-wider">WhatsApp</span>
        </a>

        {!SHOW_PRODUCTS && (
          <a
            href="tel:0962334797"
            onClick={() => trackEvent('call_click', { location: 'mobile_nav' })}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-alfs-text transition-all hover:text-alfs-blue"
          >
            <Phone size={20} />
            <span className="text-[9px] font-bold uppercase tracking-wider">Call</span>
          </a>
        )}

        {SHOW_PRODUCTS && (
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-alfs-text transition-all hover:text-alfs-red relative"
          >
            <ShoppingCart size={20} />
            {totalCartItems > 0 && (
              <span className="absolute -top-1 right-2 bg-alfs-red text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                {totalCartItems}
              </span>
            )}
            <span className="text-[9px] font-bold uppercase tracking-wider">Cart</span>
          </button>
        )}
      </div>

      {/* Vertical Section Progress Indicator - Mobile ONLY */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-[130] md:hidden flex flex-col gap-2 bg-alfs-black/20 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg">
        {['home', 'solutions', ...(SHOW_PRODUCTS ? ['catalogue'] : []), 'about', 'contact'].map((sectionId) => (
          <button
            key={sectionId}
            onClick={() => {
              const el = document.getElementById(sectionId);
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              activeSection === sectionId ? 'bg-alfs-red scale-125' : 'bg-alfs-grey opacity-60'
            }`}
            title={sectionId}
            aria-label={`Scroll to ${sectionId}`}
          />
        ))}
      </div>

      {/* Floating Circular Search Button - Mobile ONLY */}
      {SHOW_PRODUCTS && (
        <div className="fixed bottom-20 right-4 z-[140] md:hidden">
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchOpen(true);
            }}
            className="w-12 h-12 rounded-full bg-alfs-red text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          >
            <Search size={20} />
          </button>
        </div>
      )}

      {/* Full-screen Search Overlay */}
      <AnimatePresence>
        {SHOW_PRODUCTS && searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[160] bg-white flex flex-col"
          >
            {/* Header / Search bar input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-alfs-grey sticky top-0 bg-white z-10">
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 rounded-full text-alfs-black hover:bg-alfs-grey transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <input
                type="text"
                autoFocus
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow text-lg font-medium outline-none px-2 py-1 border-b border-transparent focus:border-alfs-red"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-full text-alfs-text hover:text-alfs-red transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Scrollable results list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-alfs-grey/30">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-10">
                  <p className="text-xs font-bold uppercase tracking-widest text-alfs-text/40">Type to search ZAMBIA'S Standard Workwear</p>
                </div>
              ) : filteredSearchProducts.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs font-bold uppercase tracking-widest text-alfs-text/45">No matching products found</p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-alfs-text mb-3">
                    Search Results ({filteredSearchProducts.length})
                  </p>
                  {filteredSearchProducts.map((p) => {
                    const catName = CATEGORIES.find(c => c.id === p.category)?.name || p.category;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSearchSelectedProduct(p);
                          setIsSearchBottomSheetOpen(true);
                          setSearchOpen(false); // Close full-screen search
                        }}
                        className="p-4 bg-white border border-black/5 rounded shadow-sm hover:border-alfs-red/30 cursor-pointer flex items-center justify-between gap-4 transition-all hover:translate-x-1"
                      >
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 object-cover rounded border border-alfs-grey"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-alfs-black rounded flex items-center justify-center">
                              <span className="text-xl font-bebas text-alfs-red">{p.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-alfs-black leading-tight">{p.name}</h4>
                            <p className="text-[10px] font-mono text-alfs-text/40 mt-0.5">{p.id}</p>
                            <p className="text-[9px] text-alfs-text font-medium mt-0.5 line-clamp-1">{p.spec}</p>
                          </div>
                        </div>

                        <span className="bg-alfs-black/5 text-alfs-black px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-sm flex-shrink-0">
                          {catName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search bottom sheet */}
      {SHOW_PRODUCTS && (
        <BottomSheet
          product={searchSelectedProduct}
          isOpen={isSearchBottomSheetOpen}
          onClose={() => setIsSearchBottomSheetOpen(false)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Flipbook Modal Overlay */}
      <AnimatePresence>
        {isFlipbookOpen && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-0 md:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFlipbookOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full md:max-w-[900px] md:h-[90vh] md:max-h-[90vh] bg-alfs-black flex flex-col overflow-hidden shadow-2xl border-0 md:border md:border-white/10"
            >
              {/* Close Button top-right */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setIsFlipbookOpen(false)}
                  className="bg-black/60 text-white hover:bg-black/90 hover:text-alfs-red transition-all p-2 rounded-full border border-white/20 flex items-center justify-center outline-none cursor-pointer"
                  aria-label="Close flipbook"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Iframe Content */}
              <div className="flex-1 w-full bg-[#1b1c20]">
                <iframe
                  src="https://heyzine.com/flip-book/c7c36aaeca.html"
                  className="w-full h-full border-none"
                  title="Altitude Workwear Catalogue"
                  allowFullScreen
                />
              </div>

              {/* Floating Action Bar at the Bottom */}
              <div className="w-full bg-alfs-black border-t border-white/15 p-4 shrink-0">
                <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <a
                    href="https://wa.me/260962334797?text=Hi%20ALFS!%20I%20am%20browsing%20your%20Altitude%20Workwear%20catalogue%20and%20would%20like%20to%20request%20a%20quote.%20Please%20assist."
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsApp('altitude_workwear')}
                    className="bg-alfs-red text-white py-3 px-2 text-center font-bold text-[9px] sm:text-[11px] md:text-xs uppercase tracking-tight sm:tracking-wider hover:bg-alfs-red-hover transition-colors shadow-lg"
                  >
                    Request Quote via WhatsApp
                  </a>
                  <a
                    href="mailto:admin@alfslimited.com?subject=Catalogue%20Quote%20Request&body=Hi%20ALFS%2C%20I%20am%20browsing%20your%20Altitude%20Workwear%20catalogue%20and%20would%20like%20to%20request%20a%20quote."
                    className="bg-alfs-red text-white py-3 px-2 text-center font-bold text-[9px] sm:text-[11px] md:text-xs uppercase tracking-tight sm:tracking-wider hover:bg-alfs-red-hover transition-colors shadow-lg"
                  >
                    Request Quote via Email
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminProtectedRoute({ children }: { children: any }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      try {
        const { data: { user } } = await dbClient.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        const adminEmailRaw = import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || 'admin@alfslimited.com';
        const ADMIN_EMAILS = adminEmailRaw
          .split(',')
          .map((e: string) => e.trim().toLowerCase());

        const email = user.email ? user.email.toLowerCase() : '';
        if (ADMIN_EMAILS.includes(email)) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin route:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex flex-col justify-center items-center">
        <div className="animate-spin text-[#1B2A4A] h-8 w-8 border-4 border-current border-t-transparent rounded-full" />
        <span className="mt-4 text-xs font-black uppercase tracking-widest text-[#1B2A4A]">Verifying Admin Authorization...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={SHOW_LABOUR ? "/labour" : "/"} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<GeneralSupplyPage />} />
        <Route path="/store" element={<StoreLayout />}>
          <Route index element={<StoreHome />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="product/:id" element={<ProductPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="*" element={<Navigate to="/store" replace />} />
        </Route>
        <Route path="/cart" element={<Navigate to="/store/cart" replace />} />
        {SHOW_LABOUR ? (
          <>
            <Route path="/labour" element={<LabourLanding />} />
            <Route path="/labour/auth" element={<LabourAuth />} />
            <Route path="/labour/terms" element={<TermsPage />} />
            <Route path="/labour/join" element={<LabourQuickJoin />} />
            <Route path="/labour/profile-setup" element={<LabourProfileSetup />} />
            <Route path="/labour/dashboard" element={<LabourDashboard />} />
            <Route path="/labour/reset-password" element={<LabourResetPassword />} />
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <LabourAdmin />
              </AdminProtectedRoute>
            } />
          </>
        ) : (
          <>
            <Route path="/labour" element={<Navigate to="/" replace />} />
            <Route path="/labour/*" element={<Navigate to="/" replace />} />
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="/terms" element={<Navigate to="/" replace />} />
          </>
        )}
        {!SHOW_PRODUCTS && (
          <>
            <Route path="/catalogue" element={<Navigate to="/" replace />} />
            <Route path="/catalogue/*" element={<Navigate to="/" replace />} />
            <Route path="/category/*" element={<Navigate to="/" replace />} />
            <Route path="/product/*" element={<Navigate to="/" replace />} />
            <Route path="/products/*" element={<Navigate to="/" replace />} />
            <Route path="/cart" element={<Navigate to="/" replace />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
