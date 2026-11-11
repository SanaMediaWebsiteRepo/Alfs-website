import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { dbClient, isSandboxActive, isSupabasePropertiesLoaded, deactivateSandbox, WorkerRequest, AlfsReport } from '../lib/dbClient';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Building2, 
  ShieldCheck, 
  Search, 
  Trash2, 
  CheckCircle, 
  XOctagon, 
  LogOut, 
  Loader2, 
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  MessageSquare,
  User,
  X,
  ExternalLink,
  HardHat,
  ArrowLeft,
  Download,
  ChevronDown,
  ChevronUp,
  Plus,
  Upload,
  MapPin,
  Flag
} from 'lucide-react';
import SupabaseErrorPrompt from '../components/SupabaseErrorPrompt';

const PROVINCES = ["Central", "Copperbelt", "Eastern", "Luapula", "Lusaka", "Muchinga", "Northern", "North-Western", "Southern", "Western"];

interface Seeker {
  id: string;
  full_name: string;
  trade: string;
  region: string;
  availability: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
  photo_url?: string;
  nrc?: string;
  nrc_photo_url?: string;
  experience_summary?: string;
  certifications?: string[];
  certificate_urls?: any[];
  previous_jobs?: { company: string; role: string; duration: string }[];
  terms_accepted_at?: string;
  terms_version?: string;
  id_verified?: boolean;
  updated_at?: string;
  napsa_number?: string;
  availability_status?: 'available' | 'placed' | 'not_looking';
}

interface Employer {
  id: string;
  company_name: string;
  field_of_work: string;
  region: string;
  contact_person: string;
  phone: string;
  email?: string;
  status: string;
  created_at: string;
  logo_url?: string;
  pacra_certificate_url?: string;
  terms_accepted_at?: string;
  terms_version?: string;
  updated_at?: string;
  tpin?: string;
}

const loadImageAsDataURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      const maxDim = 300;
      let width = img.width;
      let height = img.height;
      
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
};

const PPE_REQUIREMENTS: Record<string, string[]> = {
  welder: ['Welding helmet with auto-darkening visor', 'Leather welding apron', 'Insulated welding gloves', 'Steel-toe safety boots', 'Respirator mask', 'Flame-resistant overalls'],
  electrician: ['Insulated rubber gloves', 'Hard hat', 'Steel-toe safety boots', 'Voltage tester / arc-rated clothing', 'Safety goggles', 'Non-conductive tool belt'],
  driver: ['Hi-visibility vest', 'Steel-toe safety boots', 'Work gloves', 'First aid kit (vehicle)', 'Reflective triangle / warning signage'],
  'security guard': ['Standard issue uniform', 'Torch/flashlight', 'Whistle', 'Sturdy patrol boots', 'Reflective jacket (night shifts)'],
  'general labourer': ['Hard hat', 'Hi-visibility vest', 'Work gloves', 'Steel-toe safety boots', 'Dust mask'],
};
const DEFAULT_PPE = ['Hard hat', 'Hi-visibility vest', 'Work gloves', 'Steel-toe safety boots', 'Safety goggles'];

const getPPEForTrade = (trade: string): string[] => {
  const key = trade.trim().toLowerCase();
  return PPE_REQUIREMENTS[key] || DEFAULT_PPE;
};

const isOlderThan90Days = (dateStr: string): boolean => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    if (diffTime <= 0) return false;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 90;
  } catch (e) {
    return false;
  }
};

const LastUpdatedIndicator = ({ updatedAt, createdAt }: { updatedAt?: string; createdAt: string }) => {
  const displayDate = updatedAt || createdAt;
  if (!displayDate) return null;
  const formattedDate = new Date(displayDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const isStale = isOlderThan90Days(displayDate);

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
      <span className="text-[10px] text-slate-500">Last updated: {formattedDate}</span>
      {isStale && (
        <span className="text-orange-600 bg-orange-50 border border-orange-200 uppercase font-black text-[9px] px-1 rounded-sm">
          Inactive / Stale
        </span>
      )}
    </div>
  );
};

export default function LabourAdmin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showConfigPrompt, setShowConfigPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'seekers' | 'employers' | 'requests' | 'subscribers' | 'reports'>('seekers');
  const [certFilter, setCertFilter] = useState<string>('all');
  const [tradeFilter, setTradeFilter] = useState<string>('all');
  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [createWorkerName, setCreateWorkerName] = useState('');
  const [createWorkerEmail, setCreateWorkerEmail] = useState('');
  const [createWorkerTrade, setCreateWorkerTrade] = useState('');
  const [createWorkerRegion, setCreateWorkerRegion] = useState('Lusaka');
  const [createWorkerLoading, setCreateWorkerLoading] = useState(false);
  const [createWorkerError, setCreateWorkerError] = useState('');
  const [createWorkerSuccess, setCreateWorkerSuccess] = useState('');

  const [reports, setReports] = useState<AlfsReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Directory lists
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [requests, setRequests] = useState<WorkerRequest[]>([]);
  const [requestMonthFilter, setRequestMonthFilter] = useState<string>('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requestDirectionFilter, setRequestDirectionFilter] = useState<'all' | 'worker_to_employer' | 'employer_to_worker'>('all');
  const [requestSearch, setRequestSearch] = useState('');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualEmailError, setManualEmailError] = useState('');
  const [manualEmailSuccess, setManualEmailSuccess] = useState('');
  const [csvImportResult, setCsvImportResult] = useState<{ imported: number; existed: number; invalid: number; error?: string } | null>(null);

  // Search
  const [search, setSearch] = useState('');
  
  // UI States
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: 'info' });
  const [previewItem, setPreviewItem] = useState<{ type: 'seeker' | 'employer'; data: Seeker | Employer } | null>(null);

  // Profile Edit States inside Admin Panel
  const [adminIsEditing, setAdminIsEditing] = useState(false);
  const [adminEditName, setAdminEditName] = useState('');
  const [adminEditPhone, setAdminEditPhone] = useState('');
  const [adminEditNrc, setAdminEditNrc] = useState('');
  const [adminEditNapsa, setAdminEditNapsa] = useState('');
  const [adminEditContact, setAdminEditContact] = useState('');
  const [adminEditTpin, setAdminEditTpin] = useState('');
  const [adminEditPacraUrl, setAdminEditPacraUrl] = useState('');
  const [pacraUploading, setPacraUploading] = useState(false);
  const [adminEditFieldOfWork, setAdminEditFieldOfWork] = useState('');
  const [adminEditTrade, setAdminEditTrade] = useState('');
  const [adminEditRegion, setAdminEditRegion] = useState('');
  const [adminEditAvailability, setAdminEditAvailability] = useState('');
  const [adminEditAvailabilityStatus, setAdminEditAvailabilityStatus] = useState<'available' | 'placed' | 'not_looking'>('available');
  const [adminNotes, setAdminNotes] = useState('');

  // Validation Error States
  const [adminNameError, setAdminNameError] = useState('');
  const [adminPhoneError, setAdminPhoneError] = useState('');
  const [adminNrcError, setAdminNrcError] = useState('');
  const [adminNapsaError, setAdminNapsaError] = useState('');
  const [adminContactError, setAdminContactError] = useState('');
  const [adminTpinError, setAdminTpinError] = useState('');

  // Validation functions
  const validateAdminName = (val: string): boolean => {
    const isSeeker = previewItem?.type === 'seeker';
    const error = val.trim().length >= 2 && /[a-zA-Z]/.test(val) ? '' : (isSeeker ? 'Please enter a valid full name.' : 'Please enter a valid company name.');
    setAdminNameError(error);
    return !error;
  };

  const validateAdminPhone = (val: string): boolean => {
    const cleaned = val.replace(/\s+/g, '');
    const error = /^(0\d{9}|\+260\d{9})$/.test(cleaned) ? '' : 'Please enter a valid Zambian phone number (e.g. 0961234567 or +260961234567).';
    setAdminPhoneError(error);
    return !error;
  };

  const validateAdminNrc = (val: string): boolean => {
    const error = !val || /^\d{6}\/\d{2}\/\d{1}$/.test(val) ? '' : 'Please enter a valid NRC number in the format 123456/11/1.';
    setAdminNrcError(error);
    return !error;
  };

  const validateAdminNapsa = (val: string): boolean => {
    const error = !val || /^\d{5,15}$/.test(val) ? '' : 'NAPSA number should contain only digits.';
    setAdminNapsaError(error);
    return !error;
  };

  const validateAdminContact = (val: string): boolean => {
    const error = val.trim().length >= 2 && /[a-zA-Z]/.test(val) ? '' : 'Please enter a valid contact person name.';
    setAdminContactError(error);
    return !error;
  };

  const validateAdminTpin = (val: string): boolean => {
    const error = !val || /^\d{10}$/.test(val) ? '' : 'TPIN must be exactly 10 digits.';
    setAdminTpinError(error);
    return !error;
  };

  // Clear errors and states when previewItem changes or is closed
  useEffect(() => {
    setAdminIsEditing(false);
    setAdminNameError('');
    setAdminPhoneError('');
    setAdminNrcError('');
    setAdminNapsaError('');
    setAdminContactError('');
    setAdminTpinError('');
    if (previewItem) {
      setAdminNotes(previewItem.data.admin_notes || '');
      if (previewItem.type === 'seeker') {
        const s = previewItem.data as Seeker;
        setAdminEditName(s.full_name || '');
        setAdminEditPhone(s.phone || '');
        setAdminEditNrc(s.nrc || '');
        setAdminEditNapsa(s.napsa_number || '');
        setAdminEditContact('');
        setAdminEditTpin('');
        setAdminEditPacraUrl('');
        setAdminEditTrade(s.trade || '');
        setAdminEditRegion(s.region || '');
        setAdminEditAvailability(s.availability || '');
        setAdminEditAvailabilityStatus(s.availability_status || 'available');
      } else {
        const emp = previewItem.data as Employer;
        setAdminEditName(emp.company_name || '');
        setAdminEditPhone(emp.phone || '');
        setAdminEditNrc('');
        setAdminEditNapsa('');
        setAdminEditContact(emp.contact_person || '');
        setAdminEditTpin(emp.tpin || '');
        setAdminEditPacraUrl(emp.pacra_certificate_url || '');
        setAdminEditFieldOfWork(emp.field_of_work || '');
        setAdminEditRegion(emp.region || '');
      }
    } else {
      setAdminNotes('');
    }
  }, [previewItem]);

  const handleAutoSaveAdminNotes = async (newValue: string) => {
    if (!previewItem) return;
    const id = previewItem.data.id;
    try {
      if (previewItem.type === 'seeker') {
        setSeekers(prev => prev.map(s => s.id === id ? { ...s, admin_notes: newValue } : s));
        setPreviewItem(prev => prev && prev.data.id === id ? {
          type: 'seeker',
          data: { ...prev.data, admin_notes: newValue } as Seeker
        } : prev);
        await dbClient.updateSeeker(id, { admin_notes: newValue });
      } else {
        setEmployers(prev => prev.map(emp => emp.id === id ? { ...emp, admin_notes: newValue } : emp));
        setPreviewItem(prev => prev && prev.data.id === id ? {
          type: 'employer',
          data: { ...prev.data, admin_notes: newValue } as Employer
        } : prev);
        await dbClient.updateEmployer(id, { admin_notes: newValue });
      }
    } catch (err) {
      console.error('Error auto-saving admin notes:', err);
    }
  };

  // Config Emails (handles both VITE_ADMIN_EMAILS and VITE_ADMIN_EMAIL)
  const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || 'admin@alfslimited.com')
    .split(',')
    .map((e: string) => e.trim().toLowerCase());

  // Helper to find most common trade among seekers
  const getMostCommonTrade = () => {
    if (seekers.length === 0) return 'N/A';
    const counts: { [key: string]: number } = {};
    seekers.forEach(s => {
      const trade = s.trade?.trim().toLowerCase();
      if (trade) {
        counts[trade] = (counts[trade] || 0) + 1;
      }
    });
    let maxCount = 0;
    let commonTrade = 'None';
    Object.entries(counts).forEach(([trade, val]) => {
      if (val > maxCount) {
        maxCount = val;
        commonTrade = trade;
      }
    });
    return commonTrade;
  };

  // Helper to find most common region
  const getMostCommonRegion = () => {
    if (seekers.length === 0 && employers.length === 0) return 'N/A';
    const counts: { [key: string]: number } = {};
    seekers.forEach(s => {
      const region = s.region?.toLowerCase().trim();
      if (region) {
        counts[region] = (counts[region] || 0) + 1;
      }
    });
    employers.forEach(e => {
      const region = e.region?.toLowerCase().trim();
      if (region) {
        counts[region] = (counts[region] || 0) + 1;
      }
    });
    let maxCount = 0;
    let commonRegion = 'None';
    Object.entries(counts).forEach(([region, val]) => {
      if (val > maxCount) {
        maxCount = val;
        commonRegion = region;
      }
    });

    // capitalize first letters
    return commonRegion.replace(/\b\w/g, c => c.toUpperCase());
  };

  useEffect(() => {
    // If Supabase is unconfigured and sandbox is off, show configuration guide
    if (!isSupabasePropertiesLoaded() && !isSandboxActive()) {
      setShowConfigPrompt(true);
      setLoading(false);
      return;
    }

    async function checkAdmin() {
      try {
        const { data, error: userError } = await dbClient.getUser();
        if (userError) {
          const errMsg = String(userError.message || userError).toLowerCase();
          if (errMsg.includes('failed to fetch') || errMsg.includes('networkerror') || errMsg.includes('unreachable') || errMsg.includes('load failed')) {
            setShowConfigPrompt(true);
            setLoading(false);
            return;
          }
        }
        const user = data?.user;
        if (!user) {
          navigate('/labour/auth?mode=login');
          return;
        }

        const userEmail = user.email ? user.email.toLowerCase() : '';
        if (!ADMIN_EMAILS.includes(userEmail)) {
          // Gated access - send back
          navigate('/labour/dashboard');
          return;
        }

        setUser(user);
        await Promise.all([loadSeekers(), loadEmployers(), loadSubscribers(), loadReports()]);
        const { data: requestsData } = await dbClient.getRequests();
        if (requestsData) setRequests(requestsData);
      } catch (err: any) {
        if (err.message?.toLowerCase().includes('failed to fetch')) {
          console.warn('Network / fetch error (handled):', err);
          setShowConfigPrompt(true);
        } else {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const seekersChannel = supabase
      .channel('admin-seekers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alfs_labour_seekers' }, () => {
        loadSeekers();
      })
      .subscribe();

    const employersChannel = supabase
      .channel('admin-employers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alfs_labour_employers' }, () => {
        loadEmployers();
      })
      .subscribe();

    const requestsChannel = supabase
      .channel('admin-requests-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alfs_labour_requests' }, async () => {
        const { data: requestsData } = await dbClient.getRequests();
        if (requestsData) setRequests(requestsData);
      })
      .subscribe();

    const subscribersChannel = supabase
      .channel('admin-subscribers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alfs_newsletter_subscribers' }, () => {
        loadSubscribers();
      })
      .subscribe();

    const reportsChannel = supabase
      .channel('admin-reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alfs_reports' }, () => {
        loadReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(seekersChannel);
      supabase.removeChannel(employersChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(subscribersChannel);
      supabase.removeChannel(reportsChannel);
    };
  }, [user]);

  useEffect(() => {
    if (requests.length > 0 && expandedMonths.size === 0) {
      const months = requests.map(r => {
        const date = new Date(r.created_at);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      });
      const uniqueMonthsSorted = Array.from(new Set(months)).sort((a: string, b: string) => b.localeCompare(a));
      if (uniqueMonthsSorted.length > 0) {
        setExpandedMonths(new Set([uniqueMonthsSorted[0]]));
      }
    }
  }, [requests]);

  const loadSeekers = async () => {
    const { data } = await dbClient.getSeekers({ orderDescByDate: true });
    if (data) setSeekers(data);
  };

  const loadEmployers = async () => {
    const { data } = await dbClient.getEmployers({ orderDescByDate: true });
    if (data) setEmployers(data);
  };

  const loadSubscribers = async () => {
    setSubscribersLoading(true);
    try {
      const { data, error } = await supabase
        .from('alfs_newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) {
        // Fallback to local storage if table doesn't exist
        const local = localStorage.getItem('alfs_local_newsletter_subscribers');
        if (local) {
          setSubscribers(JSON.parse(local));
        } else {
          setSubscribers([]);
        }
        return;
      }

      if (data) {
        setSubscribers(data);
        localStorage.setItem('alfs_local_newsletter_subscribers', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error loading subscribers:', err);
      const local = localStorage.getItem('alfs_local_newsletter_subscribers');
      if (local) {
        setSubscribers(JSON.parse(local));
      }
    } finally {
      setSubscribersLoading(false);
    }
  };

  const loadReports = async () => {
    setReportsLoading(true);
    try {
      const { data } = await dbClient.getReports();
      if (data) setReports(data);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleAcknowledgeReport = async (reportId: string) => {
    setActionLoading(true);
    setFeedback({ text: '', type: 'info' });
    try {
      const { error } = await dbClient.acknowledgeReport(reportId);
      if (error) throw error;
      setFeedback({ text: 'Report status marked as reviewed successfully.', type: 'success' });
      await loadReports();
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to acknowledge report.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWorker = async () => {
    if (!createWorkerName || !createWorkerEmail || !createWorkerTrade || !createWorkerRegion) {
      setCreateWorkerError('Please fill in all fields.');
      return;
    }
    setCreateWorkerLoading(true);
    setCreateWorkerError('');
    setCreateWorkerSuccess('');
    try {
      const { data, error } = await supabase.functions.invoke('create-worker-account', {
        body: {
          fullName: createWorkerName,
          email: createWorkerEmail,
          trade: createWorkerTrade,
          region: createWorkerRegion,
        }
      });
      if (error || data?.error) {
        setCreateWorkerError(error?.message || data?.error || 'Failed to create worker account.');
      } else {
        setCreateWorkerSuccess(`Account created successfully. An invite email has been sent to ${createWorkerEmail}.`);
        setCreateWorkerName('');
        setCreateWorkerEmail('');
        setCreateWorkerTrade('');
        setCreateWorkerRegion('Lusaka');
      }
    } catch (err: any) {
      setCreateWorkerError(err.message || 'Unexpected error.');
    } finally {
      setCreateWorkerLoading(false);
    }
  };

  const handleAdminSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewItem) return;

    setActionLoading(true);
    setFeedback({ text: '', type: 'info' });

    // Enforce format validation rules before saving
    const isNameValid = validateAdminName(adminEditName);
    const isPhoneValid = validateAdminPhone(adminEditPhone);
    const isNrcValid = previewItem.type === 'seeker' ? validateAdminNrc(adminEditNrc) : true;
    const isNapsaValid = previewItem.type === 'seeker' ? validateAdminNapsa(adminEditNapsa) : true;
    const isContactValid = previewItem.type === 'employer' ? validateAdminContact(adminEditContact) : true;
    const isTpinValid = previewItem.type === 'employer' ? validateAdminTpin(adminEditTpin) : true;

    if (!isNameValid || !isPhoneValid || !isNrcValid || !isNapsaValid || !isContactValid || !isTpinValid) {
      setActionLoading(false);
      setFeedback({ text: 'Please resolve errors before saving.', type: 'error' });
      return;
    }

    try {
      if (previewItem.type === 'seeker') {
        const { error } = await dbClient.updateSeeker(previewItem.data.id, {
          full_name: adminEditName,
          phone: adminEditPhone,
          nrc: adminEditNrc,
          napsa_number: adminEditNapsa,
          trade: adminEditTrade.toLowerCase(),
          region: adminEditRegion,
          availability: adminEditAvailability,
          availability_status: adminEditAvailabilityStatus,
        });
        if (error) throw error;
        setFeedback({ text: 'Worker profile updated successfully.', type: 'success' });
        await loadSeekers();
        // Update the active previewItem modal state to stay up to date
        setPreviewItem({
          type: 'seeker',
          data: {
            ...previewItem.data,
            full_name: adminEditName,
            phone: adminEditPhone,
            nrc: adminEditNrc,
            napsa_number: adminEditNapsa,
            trade: adminEditTrade.toLowerCase(),
            region: adminEditRegion,
            availability: adminEditAvailability,
            availability_status: adminEditAvailabilityStatus,
          } as Seeker
        });
      } else {
        const { error } = await dbClient.updateEmployer(previewItem.data.id, {
          company_name: adminEditName,
          phone: adminEditPhone,
          contact_person: adminEditContact,
          tpin: adminEditTpin,
          pacra_certificate_url: adminEditPacraUrl,
          field_of_work: adminEditFieldOfWork,
          region: adminEditRegion,
        });
        if (error) throw error;
        setFeedback({ text: 'Employer profile updated successfully.', type: 'success' });
        await loadEmployers();
        setPreviewItem({
          type: 'employer',
          data: {
            ...previewItem.data,
            company_name: adminEditName,
            phone: adminEditPhone,
            contact_person: adminEditContact,
            tpin: adminEditTpin,
            pacra_certificate_url: adminEditPacraUrl,
            field_of_work: adminEditFieldOfWork,
            region: adminEditRegion,
          } as Employer
        });
      }
      setAdminIsEditing(false);
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to save updates.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (table: 'seekers' | 'employers', id: string, currentStatus: string) => {
    setActionLoading(true);
    setFeedback({ text: '', type: 'info' });
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    try {
      let error;
      if (table === 'seekers') {
        const result = await dbClient.updateSeeker(id, { status: newStatus });
        error = result.error;
      } else {
        const result = await dbClient.updateEmployer(id, { status: newStatus });
        error = result.error;
      }

      if (error) throw error;

      setFeedback({ text: `Updated status to ${newStatus}.`, type: 'success' });
      
      if (table === 'seekers') {
        await loadSeekers();
      } else {
        await loadEmployers();
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('failed to fetch')) {
        setShowConfigPrompt(true);
      }
      setFeedback({ text: err.message || 'Failed to update user status.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProfile = async (table: 'seekers' | 'employers', id: string) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this directory row? This cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    setFeedback({ text: '', type: 'info' });

    try {
      if (table === 'seekers') {
        const { error } = await dbClient.deleteSeeker(id);
        if (error) throw error;
        await dbClient.deleteUserAccount(id);
      } else {
        const { error } = await dbClient.deleteEmployer(id);
        if (error) throw error;
        await dbClient.deleteUserAccount(id);
      }

      setFeedback({ text: 'Listing has been deleted successfully.', type: 'success' });

      if (table === 'seekers') {
        await loadSeekers();
      } else {
        await loadEmployers();
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('failed to fetch')) {
        setShowConfigPrompt(true);
      }
      setFeedback({ text: err.message || 'Failed to delete row.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const { error } = await dbClient.updateRequestStatus(id, status);
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      setFeedback({ text: `Request ${status} successfully.`, type: 'success' });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Error updating request.', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGeneratePPEChecklist = async (request: WorkerRequest) => {
    // Load logos
    let alfsLogoData: string | null = null;
    let employerLogoData: string | null = null;
    try {
      const { data: logoConfig } = await supabase.from('alfs_site_config').select('value').eq('id', 'site_logo').single();
      if (logoConfig?.value) {
        if (logoConfig.value.startsWith('data:')) {
          try {
            alfsLogoData = await loadImageAsDataURL(logoConfig.value);
          } catch {
            alfsLogoData = logoConfig.value;
          }
        } else {
          alfsLogoData = await loadImageAsDataURL(logoConfig.value);
        }
      }
    } catch { /* fall back to text-only letterhead if this fails */ }

    const employerLogoUrl = employers.find(e => e.company_name === request.company_name)?.logo_url;
    if (employerLogoUrl) {
      try {
        employerLogoData = await loadImageAsDataURL(employerLogoUrl);
      } catch { /* fall back to text-only company name if this fails */ }
    }

    try {
      const trade = seekers.find(s => s.id === request.worker_id)?.trade || 'General Labour';
      const ppeList = getPPEForTrade(trade);

      const doc = new jsPDF();

      // Conditional Offset based on ALFS Logo presence
      const offset = alfsLogoData ? 22 : 0;
      if (alfsLogoData) {
        doc.addImage(alfsLogoData, 'JPEG', 85, 8, 40, 23);
      }

      // Letterhead Block
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("ALFS — ACHILLES LABOUR-FORCE SERVICES", 105, 14 + offset, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Labour Force Intermediary Services • Lusaka, Zambia", 105, 20 + offset, { align: 'center' });
      doc.setTextColor(0);

      doc.setLineWidth(0.2);
      doc.setDrawColor(192, 57, 43); // ALFS red
      doc.line(20, 24 + offset, 190, 24 + offset);
      doc.setDrawColor(0, 0, 0); // Reset

      // Date Issued
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120);
      doc.text(`Date Issued: ${new Date().toLocaleDateString()}`, 190, 28 + offset, { align: 'right' });
      doc.setTextColor(0, 0, 0); // Reset

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(192, 57, 43); // ALFS red
      doc.text("PPE REQUIREMENTS CHECKLIST", 105, 34 + offset, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset

      // Spacing and divider
      doc.setLineWidth(0.5);
      doc.setDrawColor(192, 57, 43); // ALFS red
      doc.line(20, 40 + offset, 190, 40 + offset);
      doc.setDrawColor(0, 0, 0); // Reset

      let y = 50 + offset;

      // Section for Employer
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 42, 74); // ALFS navy
      doc.text("FOR EMPLOYER", 20, y);
      doc.setTextColor(0, 0, 0); // Reset
      y += 6;

      if (employerLogoData) {
        doc.addImage(employerLogoData, 'JPEG', 20, y, 20, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Company Name:", 45, y + 3);
        doc.setFont("helvetica", "normal");
        doc.text(request.company_name, 80, y + 3);

        doc.setFont("helvetica", "bold");
        doc.text("Contact Person:", 45, y + 10);
        doc.setFont("helvetica", "normal");
        doc.text(request.contact_person, 80, y + 10);

        doc.setFont("helvetica", "bold");
        doc.text("Contact Phone:", 45, y + 17);
        doc.setFont("helvetica", "normal");
        const empPhone = request.phone || employers.find(e => e.company_name === request.company_name)?.phone || 'N/A';
        doc.text(empPhone, 80, y + 17);

        y += 24;
      } else {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Company Name:", 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(request.company_name, 60, y);
        y += 7;

        doc.setFont("helvetica", "bold");
        doc.text("Contact Person:", 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(request.contact_person, 60, y);
        y += 7;

        doc.setFont("helvetica", "bold");
        doc.text("Contact Phone:", 25, y);
        doc.setFont("helvetica", "normal");
        const empPhone = request.phone || employers.find(e => e.company_name === request.company_name)?.phone || 'N/A';
        doc.text(empPhone, 60, y);
        y += 10;
      }

      // Section for Employee
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 42, 74); // ALFS navy
      doc.text("FOR EMPLOYEE", 20, y);
      doc.setTextColor(0, 0, 0); // Reset
      y += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Name:", 25, y);
      doc.setFont("helvetica", "normal");
      doc.text(request.seeker_name || 'N/A', 60, y);
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Primary Trade:", 25, y);
      doc.setFont("helvetica", "normal");
      doc.text(trade, 60, y);
      y += 10;

      // Section for PPE Checklist
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(27, 42, 74); // ALFS navy
      doc.text("REQUIRED PPE FOR THIS ROLE", 20, y);
      doc.setTextColor(0, 0, 0); // Reset
      y += 6;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      ppeList.forEach(item => {
        doc.text(`[  ]  ${item}`, 25, y);
        doc.setFont("helvetica", "oblique");
        doc.setTextColor(150);
        doc.text(`Size: ___________`, 140, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        y += 7;
      });

      y += 10;

      // Closing Note
      const disclaimer = "This checklist is provided by ALFS as a guideline based on the employee's trade. Procurement and provision of PPE remains the responsibility of the employer in accordance with workplace safety regulations.";
      const splitText = doc.splitTextToSize(disclaimer, 170);
      doc.setFont("helvetica", "oblique");
      doc.setFontSize(9);
      doc.text(splitText, 20, y);
      y += (splitText.length * 5) + 6;

      // ALFS Contact
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(27, 42, 74); // ALFS navy
      doc.text("For questions regarding this checklist, contact ALFS: admin@alfslimited.com • +260 96 233 479", 20, y);
      doc.setTextColor(0, 0, 0); // Reset

      const filename = `PPE_Checklist_${(request.seeker_name || 'Employee').replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(filename);

      setFeedback({ text: `PPE checklist generated successfully for ${request.seeker_name || 'Employee'}.`, type: 'success' });
    } catch (err: any) {
      setFeedback({ text: err.message || 'Failed to generate PPE Checklist.', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await dbClient.signOut();
    navigate('/labour');
  };

  // Searching logic
  const certOptions = Array.from(new Set(seekers.flatMap(s => s.certifications || []))).sort();
  const tradeOptions = Array.from(new Set(seekers.map(s => s.trade).filter(Boolean))).sort();

  const filteredSeekers = seekers.filter(s => {
    const matchesSearch = s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.trade.toLowerCase().includes(search.toLowerCase()) ||
      s.region.toLowerCase().includes(search.toLowerCase());
    const matchesCert = certFilter === 'all' || (s.certifications || []).includes(certFilter);
    const matchesTrade = tradeFilter === 'all' || s.trade === tradeFilter;
    return matchesSearch && matchesCert && matchesTrade;
  });

  const filteredEmployers = employers.filter(emp => 
    emp.company_name.toLowerCase().includes(search.toLowerCase()) || 
    emp.field_of_work.toLowerCase().includes(search.toLowerCase()) ||
    emp.region.toLowerCase().includes(search.toLowerCase())
  );

  const handleDisableSandbox = () => {
    deactivateSandbox();
    window.location.reload();
  };

  if (showConfigPrompt && !isSandboxActive()) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-center py-10">
        <SupabaseErrorPrompt 
          customMessage="Accessing the master administrative management panel requires live Supabase API configurations. Please verify your variables or choose Sandbox Mode below to evaluate the features."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-[#C41E3A] mb-4" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B2A4A]">Verifying Admin Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] pb-24 relative">
      {/* Sandbox Mode Ribbon */}
      {isSandboxActive() && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-1.5 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] flex justify-center items-center gap-4 shadow-sm z-50 animate-fade-in">
          <span>RUNNING IN MEMORY SANDBOX MODE (OFFLINE DEMO)</span>
          <button 
            onClick={handleDisableSandbox}
            className="bg-black/20 hover:bg-black/40 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase transition-colors rounded"
          >
            Exit Sandbox & Retry Real URL
          </button>
        </div>
      )}
      {/* Top Navbar */}
      <nav className={`bg-[#1B2A4A] text-white py-4 px-4 md:px-12 flex justify-between items-center border-b border-white/10 ${isSandboxActive() ? 'mt-8' : ''}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white uppercase tracking-wide mr-2 cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <span className="h-4 w-px bg-white/20" />
          <Link to="/labour" className="text-sm font-bold tracking-wider text-white hover:text-white/95 uppercase hover:underline decoration-[#C41E3A] underline-offset-4">
            ALFS LABOUR HUB
          </Link>
          <span className="h-4 w-px bg-white/20" />
          <span className="text-[10px] font-black tracking-wider bg-[#C41E3A] text-white px-2.5 py-0.5 rounded uppercase">
            ADMIN WORKSPACE
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Admin Level Secure
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white bg-white/5 border border-white/10 hover:bg-[#C41E3A] hover:border-[#C41E3A] px-4 py-2 rounded transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 sm:py-10">
        
        {/* Statistics Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Seekers</span>
              <span className="text-3xl font-extrabold tracking-tight text-[#1B2A4A]">{seekers.length}</span>
            </div>
            <div className="p-3 bg-slate-50 text-slate-400 rounded-lg shrink-0">
              <Users size={20} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Employers</span>
              <span className="text-3xl font-extrabold tracking-tight text-[#1B2A4A]">{employers.length}</span>
            </div>
            <div className="p-3 bg-slate-50 text-slate-400 rounded-lg shrink-0">
              <Building2 size={20} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Most Common Trade</span>
              <span className="text-base sm:text-lg font-bold text-[#C41E3A] truncate block uppercase" title={getMostCommonTrade()}>
                {getMostCommonTrade()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 text-[#C41E3A] rounded-lg shrink-0">
              <HardHat size={20} />
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all hover:shadow-md flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Most Common Region</span>
              <span className="text-base sm:text-lg font-bold text-[#1B2A4A] truncate block uppercase" title={getMostCommonRegion()}>
                {getMostCommonRegion()}
              </span>
            </div>
            <div className="p-3 bg-slate-50 text-slate-500 rounded-lg shrink-0">
              <MapPin size={20} />
            </div>
          </div>
        </div>

        {/* ADMIN WORKSPACE CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
          
          {/* Header tabs toggle */}
          <div className="bg-slate-50/70 border-b border-slate-200 p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl w-max max-w-full">
              <button
                onClick={() => setActiveTab('seekers')}
                className={`py-2 px-4 rounded-lg font-medium text-xs sm:text-sm tracking-normal flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'seekers' 
                    ? 'bg-[#1B2A4A] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users size={16} className="shrink-0" />
                <span className="whitespace-nowrap">Manage Employees</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'seekers' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {seekers.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('employers')}
                className={`py-2 px-4 rounded-lg font-medium text-xs sm:text-sm tracking-normal flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'employers' 
                    ? 'bg-[#1B2A4A] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Building2 size={16} className="shrink-0" />
                <span className="whitespace-nowrap">Manage Recruiters</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'employers' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {employers.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-2 px-4 rounded-lg font-medium text-xs sm:text-sm tracking-normal flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'requests' 
                    ? 'bg-[#1B2A4A] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <MessageSquare size={16} className="shrink-0" />
                <span className="whitespace-nowrap">Requests</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'requests' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('subscribers')}
                className={`py-2 px-4 rounded-lg font-medium text-xs sm:text-sm tracking-normal flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'subscribers' 
                    ? 'bg-[#1B2A4A] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Mail size={16} className="shrink-0" />
                <span className="whitespace-nowrap">Subscribers</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'subscribers' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {subscribers.length}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('reports');
                  loadReports();
                }}
                className={`py-2 px-4 rounded-lg font-medium text-xs sm:text-sm tracking-normal flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'reports' 
                    ? 'bg-[#1B2A4A] text-white shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Flag size={16} className="shrink-0 text-red-400" />
                <span className="whitespace-nowrap">Flagged Reports</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500 font-extrabold text-red-600 bg-red-50 border border-red-100'}`}>
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              </button>
            </div>

            <div className="relative w-full lg:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition-all min-h-[40px]"
              />
            </div>
          </div>

          {feedback.text && (
            <div className={`p-4 text-sm font-semibold flex items-center gap-2 border-b ${
              feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-[#C41E3A]'
            }`}>
              <AlertCircle size={16} />
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Directory Listings Management */}
          <div className="w-full">
            {activeTab === 'seekers' && (
              <>
                {/* Certification & Trade Filters */}
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  <select
                    value={tradeFilter}
                    onChange={e => setTradeFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition-all"
                  >
                    <option value="all">All Trades</option>
                    {tradeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={certFilter}
                    onChange={e => setCertFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 focus:border-[#1B2A4A] transition-all"
                  >
                    <option value="all">All Certifications</option>
                    {certOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {(certFilter !== 'all' || tradeFilter !== 'all') && (
                    <button
                      onClick={() => { setCertFilter('all'); setTradeFilter('all'); }}
                      className="text-xs text-[#C0392B] border border-[#C0392B]/30 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors font-medium"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Create Worker Button */}
                <div className="px-4 pb-3">
                  <button
                    onClick={() => { setShowCreateWorker(true); setCreateWorkerError(''); setCreateWorkerSuccess(''); }}
                    className="flex items-center gap-2 bg-[#1B2A4A] text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#243c5c] transition-colors"
                  >
                    <span>+ Create Worker Account</span>
                  </button>
                </div>

                {/* Create Worker Modal */}
                {showCreateWorker && (
                  <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-lg text-[#1B2A4A] tracking-tight">Create Worker Account</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Worker will receive an invite email to set their password.</p>
                        </div>
                        <button onClick={() => setShowCreateWorker(false)} className="text-gray-400 hover:text-gray-700 transition-colors">✕</button>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div>
                          <label className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-600 mb-1.5 block">Full Name</label>
                          <input
                            type="text"
                            value={createWorkerName}
                            onChange={e => setCreateWorkerName(e.target.value)}
                            placeholder="e.g. John Banda"
                            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/20 focus:border-[#1a2e4a] transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-600 mb-1.5 block">Email Address</label>
                          <input
                            type="email"
                            value={createWorkerEmail}
                            onChange={e => setCreateWorkerEmail(e.target.value)}
                            placeholder="e.g. john@email.com"
                            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/20 focus:border-[#1a2e4a] transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-600 mb-1.5 block">Trade / Role</label>
                          <input
                            type="text"
                            value={createWorkerTrade}
                            onChange={e => setCreateWorkerTrade(e.target.value)}
                            placeholder="e.g. Structural Welder"
                            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/20 focus:border-[#1a2e4a] transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-600 mb-1.5 block">Region</label>
                          <select
                            value={createWorkerRegion}
                            onChange={e => setCreateWorkerRegion(e.target.value)}
                            className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/20 focus:border-[#1a2e4a] transition-all"
                          >
                            {['Lusaka', 'Copperbelt', 'Central', 'Eastern', 'Northern', 'Luapula', 'Western', 'Southern', 'North-Western', 'Muchinga'].map(r => (
                              <option key={r} value={r}>{r} Province</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {createWorkerError && <p className="text-xs text-[#C0392B] font-medium">{createWorkerError}</p>}
                      {createWorkerSuccess && <p className="text-xs text-green-600 font-medium">{createWorkerSuccess}</p>}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => setShowCreateWorker(false)}
                          className="flex-1 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateWorker}
                          disabled={createWorkerLoading}
                          className="flex-1 bg-[#1B2A4A] text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-[#243c5c] transition-colors disabled:opacity-50"
                        >
                          {createWorkerLoading ? 'Creating...' : 'Create & Send Invite'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <table className="min-w-full divide-y divide-slate-100 text-[#0A0A0A]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Name / Registered</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Trade / Skills</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Zambian Region</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Availability</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Mobile Line</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Control Panel</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredSeekers.length > 0 ? (
                        filteredSeekers.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => setPreviewItem({ type: 'seeker', data: s })}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-slate-900">{s.full_name}</span>
                                {s.id_verified && (
                                  <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
                                    ✅ ID Verified
                                  </span>
                                )}
                              </div>
                              <LastUpdatedIndicator updatedAt={s.updated_at} createdAt={s.created_at} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                              {s.trade}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-600">
                              {s.region} Province
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <span className="bg-slate-50 border border-slate-200 text-slate-600 font-medium text-[11px] px-2.5 py-0.5 rounded-full w-max">
                                  {s.availability}
                                </span>
                                {s.availability_status && (
                                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded-full w-max ${
                                    s.availability_status === 'available'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : s.availability_status === 'placed'
                                      ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}>
                                    {s.availability_status.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-600 tabular-nums">
                              {s.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase border tracking-wider ${
                                  s.status === 'active' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {s.status}
                                </span>
                                {s.availability_status && (
                                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase border tracking-wide whitespace-nowrap ${
                                    s.availability_status === 'available'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : s.availability_status === 'placed'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {s.availability_status.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus('seekers', s.id, s.status); }}
                                disabled={actionLoading}
                                className={`px-3 py-2 uppercase font-bold text-xs border tracking-wider transition-colors inline-flex items-center justify-center gap-1 cursor-pointer min-h-[48px] ${
                                  s.status === 'active' 
                                    ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' 
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {s.status === 'active' ? <XOctagon size={13} /> : <CheckCircle size={13} />}
                                <span>{s.status === 'active' ? 'Suspend' : 'Activate'}</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteProfile('seekers', s.id); }}
                                disabled={actionLoading}
                                className="bg-red-600 text-white hover:bg-red-700 px-3 py-2 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer min-h-[48px]"
                              >
                                <Trash2 size={13} />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#1B2A4A]/40 uppercase tracking-widest">
                            No employees verified in standard schema directories.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="block md:hidden p-4 space-y-4 bg-slate-50">
                  {filteredSeekers.length > 0 ? (
                    filteredSeekers.map((s) => (
                      <div key={s.id} className="bg-white border border-slate-200 hover:border-[#1B2A4A] shadow-sm p-4 space-y-4 cursor-pointer transition-all" onClick={() => setPreviewItem({ type: 'seeker', data: s })}>
                        {/* Name / Registered date */}
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-black text-[#1B2A4A] uppercase tracking-wider">{s.full_name}</span>
                            {s.id_verified && (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider">
                                ✅ ID Verified
                              </span>
                            )}
                          </div>
                          <LastUpdatedIndicator updatedAt={s.updated_at} createdAt={s.created_at} />
                        </div>

                        {/* Trade / Skills */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Trade / Skills</span>
                          <span className="text-sm font-semibold uppercase tracking-wider text-[#1B2A4A]">{s.trade}</span>
                        </div>

                        {/* Zambian Region */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Zambian Region</span>
                          <span className="text-sm font-bold text-[#1B2A4A]">{s.region} Province</span>
                        </div>

                        {/* Availability */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-1.5">Availability</span>
                          <div className="flex flex-wrap gap-1">
                            <span className="bg-white border border-slate-200 text-[#1B2A4A] font-black text-xs uppercase tracking-wider px-2 py-1 inline-block">
                              {s.availability}
                            </span>
                            {s.availability_status && (
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 border rounded-full inline-block ${
                                s.availability_status === 'available'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : s.availability_status === 'placed'
                                  ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {s.availability_status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mobile Line */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Mobile Line</span>
                          <span className="text-sm font-semibold text-[#1B2A4A]">{s.phone}</span>
                        </div>

                        {/* Email Address */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">EMAIL</span>
                          <span className="text-sm font-semibold text-[#1B2A4A]">{s.email || 'Not provided'}</span>
                        </div>

                        {/* Status */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-1.5">Status</span>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase border tracking-wider ${
                              s.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {s.status}
                            </span>
                            {s.availability_status && (
                              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase border tracking-wide whitespace-nowrap ${
                                s.availability_status === 'available'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : s.availability_status === 'placed'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                {s.availability_status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions Control Panel */}
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus('seekers', s.id, s.status); }}
                            disabled={actionLoading}
                            className={`flex-1 px-3 py-2 uppercase font-black text-xs border tracking-wider transition-colors inline-flex items-center justify-center gap-1 cursor-pointer min-h-[48px] ${
                              s.status === 'active' 
                                ? 'bg-red-50 text-[#C0392B] border-red-200 hover:bg-red-100' 
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {s.status === 'active' ? <XOctagon size={13} /> : <CheckCircle size={13} />}
                            <span>{s.status === 'active' ? 'Suspend' : 'Activate'}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProfile('seekers', s.id); }}
                            disabled={actionLoading}
                            className="bg-[#C0392B] text-white hover:bg-red-700 px-3 py-2 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer min-h-[48px] flex-1 font-black uppercase tracking-wider text-xs"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-[#1B2A4A]/40 uppercase tracking-widest bg-white border border-dashed border-slate-200">
                      No employees verified in standard schema directories.
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'employers' && (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto w-full">
                  <table className="min-w-full divide-y divide-slate-100 text-[#0A0A0A]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Company Name / Registered</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Sector / Field</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Primary Region</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Contact Person</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Recruitment Mobile</th>
                        <th className="px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-6 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Control Panel</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {filteredEmployers.length > 0 ? (
                        filteredEmployers.map((emp) => (
                          <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => setPreviewItem({ type: 'employer', data: emp })}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-slate-900">{emp.company_name}</div>
                              <LastUpdatedIndicator updatedAt={emp.updated_at} createdAt={emp.created_at} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                              {emp.field_of_work}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-600">
                              {emp.region} Province
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-600">
                              {emp.contact_person}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-slate-600 tabular-nums">
                              {emp.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase border tracking-wider ${
                                emp.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {emp.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleUpdateStatus('employers', emp.id, emp.status); }}
                                disabled={actionLoading}
                                className={`px-3 py-2 uppercase font-bold text-xs border tracking-wider transition-colors inline-flex items-center justify-center gap-1 cursor-pointer min-h-[48px] ${
                                  emp.status === 'active' 
                                    ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' 
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                }`}
                              >
                                {emp.status === 'active' ? <XOctagon size={13} /> : <CheckCircle size={13} />}
                                <span>{emp.status === 'active' ? 'Suspend' : 'Activate'}</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteProfile('employers', emp.id); }}
                                disabled={actionLoading}
                                className="bg-red-600 text-white hover:bg-red-700 px-3 py-2 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer min-h-[48px]"
                              >
                                <Trash2 size={13} />
                                <span>Remove</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#1B2A4A]/40 uppercase tracking-widest">
                            No employers verified in standard schema directories.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Card List */}
                <div className="block md:hidden p-4 space-y-4 bg-slate-50">
                  {filteredEmployers.length > 0 ? (
                    filteredEmployers.map((emp) => (
                      <div key={emp.id} className="bg-white border border-slate-200 hover:border-[#1B2A4A] shadow-sm p-4 space-y-4 cursor-pointer transition-all" onClick={() => setPreviewItem({ type: 'employer', data: emp })}>
                        {/* Company name / Registered */}
                        <div>
                          <div className="text-base font-black text-[#1B2A4A] uppercase tracking-wider">{emp.company_name}</div>
                          <LastUpdatedIndicator updatedAt={emp.updated_at} createdAt={emp.created_at} />
                        </div>

                        {/* Sector / Field */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Sector / Field</span>
                          <span className="text-sm font-semibold uppercase tracking-wider text-[#1B2A4A]">{emp.field_of_work}</span>
                        </div>

                        {/* Primary Region */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Primary Region</span>
                          <span className="text-sm font-bold text-[#1B2A4A]">{emp.region} Province</span>
                        </div>

                        {/* Contact Person */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Contact Person</span>
                          <span className="text-sm font-bold text-[#1B2A4A]">{emp.contact_person}</span>
                        </div>

                        {/* Recruitment Mobile */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Recruitment Mobile</span>
                          <span className="text-sm font-semibold text-[#1B2A4A]">{emp.phone}</span>
                        </div>

                        {/* Email Address */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">EMAIL</span>
                          <span className="text-sm font-semibold text-[#1B2A4A]">{emp.email || 'Not provided'}</span>
                        </div>

                        {/* PACRA Certificate */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">PACRA CERTIFICATE</span>
                          {emp.pacra_certificate_url ? (
                            <a
                              href={emp.pacra_certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-red-600 hover:text-[#C0392B] underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View PACRA Certificate
                            </a>
                          ) : (
                            <span className="text-sm font-semibold text-slate-400">Not provided</span>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-1.5">Status</span>
                          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase border tracking-wider ${
                            emp.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {emp.status}
                          </span>
                        </div>

                        {/* Actions Control Panel */}
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUpdateStatus('employers', emp.id, emp.status); }}
                            disabled={actionLoading}
                            className={`flex-1 px-3 py-2 uppercase font-black text-xs border tracking-wider transition-colors inline-flex items-center justify-center gap-1 cursor-pointer min-h-[48px] ${
                              emp.status === 'active' 
                                ? 'bg-red-50 text-[#C0392B] border-red-200 hover:bg-red-100' 
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {emp.status === 'active' ? <XOctagon size={13} /> : <CheckCircle size={13} />}
                            <span>{emp.status === 'active' ? 'Suspend' : 'Activate'}</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteProfile('employers', emp.id); }}
                            disabled={actionLoading}
                            className="bg-[#C0392B] text-white hover:bg-red-700 px-3 py-2 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer min-h-[48px] flex-1 font-black uppercase tracking-wider text-xs"
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-sm text-[#1B2A4A]/40 uppercase tracking-widest bg-white border border-dashed border-slate-200">
                      No employers verified in standard schema directories.
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'requests' && (() => {
              const filteredRequests = requests.filter(r => {
                const matchesSearch = !requestSearch || 
                  r.seeker_name?.toLowerCase().includes(requestSearch.toLowerCase()) ||
                  r.company_name?.toLowerCase().includes(requestSearch.toLowerCase()) ||
                  r.contact_person?.toLowerCase().includes(requestSearch.toLowerCase());
                const matchesStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter;
                const matchesDirection = requestDirectionFilter === 'all' || r.direction === requestDirectionFilter || 
                  (requestDirectionFilter === 'employer_to_worker' && !r.direction);
                return matchesSearch && matchesStatus && matchesDirection;
              });

              const groupedByMonth = filteredRequests.reduce((acc, r) => {
                const date = new Date(r.created_at);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = date.toLocaleDateString('en-ZM', { month: 'long', year: 'numeric' });
                if (!acc[key]) acc[key] = { label, requests: [] };
                acc[key].requests.push(r);
                return acc;
              }, {} as Record<string, { label: string; requests: WorkerRequest[] }>);

              const sortedMonthKeys = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

              const overdueCount = filteredRequests.filter(r => {
                if (r.status !== 'pending') return false;
                const daysPending = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
                return daysPending >= 7;
              }).length;

              const toggleMonth = (key: string) => {
                setExpandedMonths(prev => {
                  const next = new Set(prev);
                  if (next.has(key)) {
                    next.delete(key);
                  } else {
                    next.add(key);
                  }
                  return next;
                });
              };

              return (
                /* REQUESTS PANEL */
                <div className="p-4 sm:p-6 bg-white space-y-4 text-[#0A0A0A]">
                  
                  {/* Filter Bar */}
                  <div className="bg-slate-50 border border-slate-200 p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 flex-wrap">
                    {/* Search */}
                    <div className="flex-1 min-w-[240px] relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Search size={14} />
                      </span>
                      <input
                        type="text"
                        placeholder="Search by worker or company name..."
                        value={requestSearch}
                        onChange={(e) => setRequestSearch(e.target.value)}
                        className="w-full text-xs font-sans pl-9 pr-3 py-2 border border-slate-200 focus:outline-[#1B2A4A] bg-white text-[#0A0A0A]"
                      />
                    </div>

                    {/* Direction filter pills */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#1B2A4A]/50 shrink-0">Direction</span>
                      <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded">
                        {(['all', 'worker_to_employer', 'employer_to_worker'] as const).map((dir) => (
                          <button
                            key={dir}
                            type="button"
                            onClick={() => setRequestDirectionFilter(dir)}
                            className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer rounded-sm ${
                              requestDirectionFilter === dir 
                                ? 'bg-[#1B2A4A] text-white' 
                                : 'text-[#1B2A4A]/60 hover:text-[#1B2A4A]'
                            }`}
                          >
                            {dir === 'all' ? 'All' : dir === 'worker_to_employer' ? 'Worker → Employer' : 'Employer → Worker'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Status filter */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#1B2A4A]/50 shrink-0">Status</span>
                      <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded">
                        {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setRequestStatusFilter(st)}
                            className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer rounded-sm ${
                              requestStatusFilter === st 
                                ? 'bg-[#1B2A4A] text-white' 
                                : 'text-[#1B2A4A]/60 hover:text-[#1B2A4A]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Overdue Warning Banner */}
                  {overdueCount > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 mb-4">
                      ⚠ {overdueCount} overdue request(s) require attention.
                    </div>
                  )}

                  {filteredRequests.length > 0 ? (
                    <div className="space-y-4">
                      {sortedMonthKeys.map((key) => {
                        const m = groupedByMonth[key];
                        const isExpanded = expandedMonths.has(key);
                        return (
                          <div key={key} className="space-y-3">
                            {/* Month Header Row */}
                            <div 
                              onClick={() => toggleMonth(key)}
                              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 font-black text-xs uppercase tracking-wider text-[#1B2A4A] select-none"
                            >
                              <div className="flex items-center gap-2">
                                <span>{m.label}</span>
                                <span className="px-1.5 py-0.5 text-[9px] font-black bg-slate-200 text-[#1B2A4A] rounded-sm">
                                  {m.requests.length}
                                </span>
                              </div>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>

                            {/* Cards, conditionally rendered based on expanded state */}
                            {isExpanded && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {m.requests.map((r) => (
                      <div 
                        key={r.id} 
                        className="border border-slate-200 hover:border-[#1B2A4A]/40 rounded-xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-semibold text-sm tracking-normal text-slate-900">
                                <>
                                  {r.direction === 'worker_to_employer' ? (
                                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Contacting Employer</span>
                                  ) : (
                                    <span className="text-[9px] font-semibold text-indigo-500 uppercase tracking-wider block mb-1">Recruiting Employer</span>
                                  )}
                                  {r.company_name}
                                </>
                              </h4>
                              <p className="text-xs font-bold text-[#1B2A4A]/80 uppercase tracking-wider mt-1">
                                {r.contact_person}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0 select-none">
                              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (window.confirm('Delete this request permanently? This cannot be undone.')) {
                                      await dbClient.deleteRequest(r.id);
                                      setRequests(prev => prev.filter(req => req.id !== r.id));
                                    }
                                  }}
                                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                  title="Delete permanent record"
                                >
                                  <Trash2 size={13} />
                                </button>

                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border ${
                                  r.status === 'pending'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : r.status === 'approved'
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {r.status}
                                </span>
                                {r.status === 'pending' && (() => {
                                  const daysPending = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24));
                                  let badgeStyle = "bg-slate-100 text-slate-600";
                                  let text = `${daysPending} days`;
                                  if (daysPending >= 7) {
                                    badgeStyle = "bg-red-100 text-red-700 font-black";
                                    text = `${daysPending} days — OVERDUE`;
                                  } else if (daysPending >= 3) {
                                    badgeStyle = "bg-amber-100 text-amber-700";
                                  }
                                  return (
                                    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                                      {text}
                                    </span>
                                  );
                                })()}
                              </div>
                             {r.direction === 'worker_to_employer' ? (
                               <span className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
                                 EMPLOYEE → EMPLOYER
                               </span>
                             ) : (
                               <span className="px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                                 EMPLOYER → EMPLOYEE
                               </span>
                             )}
                           </div>
                           <div className="hidden" style={{ display: 'none' }}> {/*
                             <span>
                            </span>
                          </div>

*/ }
                           </div>
                           </div>

                           <div className="py-2.5 border-t border-b border-dashed border-slate-100 space-y-2">
                            <div>
                              <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">Requested Candidate</span>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <span className="font-black text-xs text-[#1B2A4A] uppercase tracking-wider">
                                  {r.seeker_name || `Employee: ${r.worker_id}`}
                                </span>
                                {(() => {
                                  const workerData = seekers.find(seeker => seeker.id === r.worker_id);
                                  return workerData && workerData.id_verified ? (
                                    <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider">
                                      ✅ ID Verified
                                    </span>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                            <div>
                              <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mt-1">Proposal Message</span>
                              <p className="text-xs text-slate-700 leading-relaxed font-semibold mt-1">
                                {r.message}
                              </p>
                            </div>
                            <div>
                              <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mt-1">Mobile Line / Contact</span>
                              <span className="text-xs font-bold text-[#1B2A4A]">{r.phone}</span>
                            </div>

                            {(() => {
                              const workerData = seekers.find(seeker => seeker.id === r.worker_id);
                              if (workerData && workerData.certificate_urls && workerData.certificate_urls.length > 0) {
                                return (
                                  <div className="mt-2 text-left">
                                    <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">Candidate Certificates</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                      {workerData.certificate_urls.map((cert: any, idx: number) => {
                                        const isString = typeof cert === 'string';
                                        const label = isString ? '' : cert.label || '';
                                        const url = isString ? cert : cert.url || '';
                                        const displayName = label || `Document #${idx + 1}`;
                                        return (
                                          <a 
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between p-2 text-[10px] font-black uppercase tracking-wider bg-slate-50 border border-slate-200/60 hover:bg-[#1B2A4A]/5 hover:border-[#1B2A4A]/30 text-[#1B2A4A] transition-all rounded-sm"
                                          >
                                            <span className="truncate max-w-[85%]">{displayName}</span>
                                            <ExternalLink size={12} className="opacity-65 shrink-0" />
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-[#1B2A4A]/50">
                            <span>CREATED AT</span>
                            <span>{new Date(r.created_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {r.status === 'pending' && (
                          <div className="flex gap-3 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => handleRequestStatus(r.id, 'approved')}
                              disabled={actionLoading}
                              className="grow bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <CheckCircle size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRequestStatus(r.id, 'rejected')}
                              disabled={actionLoading}
                              className="grow bg-[#C41E3A] hover:bg-[#A9172F] disabled:bg-rose-300 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                            >
                              <XOctagon size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {r.status === 'approved' && (() => {
                          const wName = r.seeker_name || 'Employee';
                          const wPhone = r.seeker_phone || seekers.find(s => s.id === r.worker_id)?.phone || '';
                          const wEmail = seekers.find(s => s.id === r.worker_id)?.email || '';

                          const cName = r.company_name || 'Employer';
                          const cPerson = r.contact_person || 'Contact Person';
                          const ePhone = r.phone || employers.find(e => e.id === r.employer_id)?.phone || '';
                          const eEmail = r.employer_email || employers.find(e => e.id === r.employer_id)?.email || '';

                          const cleanPhone = (p: string) => p.replace(/\D/g, '');
                          const wPhoneCleaned = cleanPhone(wPhone);
                          const ePhoneCleaned = cleanPhone(ePhone);

                          const workerWaText = `Hi ${wName}, ${cName} has approved your request and would like to connect. Contact person: ${cPerson}, Phone: ${ePhone}, Email: ${eEmail}.`;
                          const workerWaLink = `https://wa.me/${wPhoneCleaned}?text=${encodeURIComponent(workerWaText)}`;

                          const workerEmailSubject = `Hire Request Approved - ${cName}`;
                          const workerEmailBody = `Hi ${wName},\n\n${cName} has approved your request and would like to connect.\n\nContact person: ${cPerson}\nPhone: ${ePhone}\nEmail: ${eEmail}`;
                          const workerEmailLink = `mailto:${wEmail}?subject=${encodeURIComponent(workerEmailSubject)}&body=${encodeURIComponent(workerEmailBody)}`;

                          const employerWaText = `Hi ${cPerson}, ${wName} has been approved and would like to connect. Phone: ${wPhone}, Email: ${wEmail}.`;
                          const employerWaLink = `https://wa.me/${ePhoneCleaned}?text=${encodeURIComponent(employerWaText)}`;

                          const employerEmailSubject = `Employee Request Approved - ${wName}`;
                          const employerEmailBody = `Hi ${cPerson},\n\n${wName} has been approved and would like to connect.\n\nPhone: ${wPhone}\nEmail: ${wEmail}`;
                          const employerEmailLink = `mailto:${eEmail}?subject=${encodeURIComponent(employerEmailSubject)}&body=${encodeURIComponent(employerEmailBody)}`;

                          return (
                            <div className="pt-2 border-t border-slate-100 space-y-3">
                              <button
                                onClick={() => handleGeneratePPEChecklist(r)}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs uppercase tracking-wider py-2.5 rounded-lg flex items-center justify-center gap-1.5 w-full mt-2 cursor-pointer transition-all shadow-sm"
                              >
                                <HardHat size={14} />
                                <span>Generate PPE Checklist</span>
                              </button>

                              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 mt-3">
                                <span className="text-slate-500 uppercase tracking-widest text-[9px] block font-semibold">
                                  Notify Parties
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {/* Employee */}
                                  <div className="p-2 bg-white border border-slate-150 rounded-lg flex flex-col justify-between gap-2 shadow-xs">
                                    <div>
                                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Employee</div>
                                      <div className="font-bold text-[#1B2A4A] truncate text-xs">{wName}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                      <a
                                        href={workerWaLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#20BA56] text-white font-bold text-[9px] uppercase tracking-wider py-1.5 transition-colors rounded text-center"
                                      >
                                        <MessageSquare size={10} />
                                        <span>WhatsApp</span>
                                      </a>
                                      <a
                                        href={workerEmailLink}
                                        className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 transition-colors rounded text-center"
                                      >
                                        <Mail size={10} />
                                        <span>Email</span>
                                      </a>
                                    </div>
                                  </div>

                                  {/* Employer */}
                                  <div className="p-2 bg-white border border-slate-150 rounded-lg flex flex-col justify-between gap-2 shadow-xs">
                                    <div>
                                      <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Employer</div>
                                      <div className="font-bold text-[#1B2A4A] truncate text-xs">{cPerson}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                                      <a
                                        href={employerWaLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#20BA56] text-white font-bold text-[9px] uppercase tracking-wider py-1.5 transition-colors rounded text-center"
                                      >
                                        <MessageSquare size={10} />
                                        <span>WhatsApp</span>
                                      </a>
                                      <a
                                        href={employerEmailLink}
                                        className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] uppercase tracking-wider py-1.5 transition-colors rounded text-center"
                                      >
                                        <Mail size={10} />
                                        <span>Email</span>
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-slate-400 text-sm py-12">No requests match your filters.</p>
                  )}
                </div>
              );
            })()}

            {activeTab === 'subscribers' && (
              /* SUBSCRIBERS PANEL */
              <div className="p-4 sm:p-6 bg-white space-y-6 text-[#0A0A0A]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bebas text-2xl text-[#1B2A4A] tracking-wider uppercase">NEWSLETTER SUBSCRIBERS</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">Export subscriber emails for marketing integrations</p>
                  </div>
                  
                  {subscribers.length > 0 && (
                    <button
                      onClick={() => {
                        const headers = ['email', 'subscribed_at'];
                        const rows = subscribers.map(s => [
                          s.email,
                          s.subscribed_at ? new Date(s.subscribed_at).toISOString() : ''
                        ]);
                        const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))].join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.setAttribute('href', url);
                        link.setAttribute('download', `alfs_newsletter_subscribers_${new Date().toISOString().slice(0,10)}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="inline-flex items-center gap-2 bg-[#C0392B] hover:bg-[#A32E22] text-white font-black text-xs uppercase tracking-widest px-4 py-3 shadow transition-colors min-h-[44px]"
                    >
                      <Download size={14} />
                      <span>Export to CSV</span>
                    </button>
                  )}
                </div>

                {/* Advanced Administrative Tools - Newsletter Management */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 border border-slate-200 p-5 rounded-sm">
                  
                  {/* MANUAL ADD PANEL */}
                  <div className="flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-bebas text-lg text-[#1B2A4A] tracking-wider uppercase flex items-center gap-2">
                        <Mail size={16} className="text-[#C0392B]" />
                        <span>Add Email Manually</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">
                        Insert a single newsletter subscriber manually
                      </p>
                    </div>

                    <form 
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const emailVal = manualEmail.trim();
                        setManualEmailError('');
                        setManualEmailSuccess('');

                        if (!emailVal) {
                          setManualEmailError('Please enter an email address.');
                          return;
                        }

                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(emailVal)) {
                          setManualEmailError('Invalid email format.');
                          return;
                        }

                        const targetEmail = emailVal.toLowerCase();

                        // Check if it already exists
                        if (subscribers.some((s) => s.email?.toLowerCase() === targetEmail)) {
                          setManualEmailError('Already on the list');
                          return;
                        }

                        const payload = {
                          email: targetEmail,
                          subscribed_at: new Date().toISOString(),
                          source: 'manual'
                        };

                        try {
                          setActionLoading(true);
                          let hasSucceeded = true;
                          
                          try {
                            const { error } = await supabase
                              .from('alfs_newsletter_subscribers')
                              .upsert(payload, { onConflict: 'email' });

                            if (error) {
                              console.warn('Supabase subscriber manual insert database warning:', error);
                              // We proceed to set the local state anyway to stay functional
                            }
                          } catch (dbErr) {
                            console.warn('Supabase subscriber manual insert threw error:', dbErr);
                          }

                          // Update state and localStorage instantly
                          const updated = [payload, ...subscribers];
                          setSubscribers(updated);
                          localStorage.setItem('alfs_local_newsletter_subscribers', JSON.stringify(updated));

                          setManualEmailSuccess('Successfully added!');
                          setManualEmail('');
                        } catch (err) {
                          console.error('Manual add failed catastrophically:', err);
                          setManualEmailError('Failed to save.');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      className="space-y-3"
                    >
                      <input
                        type="text"
                        placeholder="e.g. name@domain.com"
                        value={manualEmail}
                        onChange={(e) => {
                          setManualEmail(e.target.value);
                          setManualEmailError('');
                          setManualEmailSuccess('');
                        }}
                        className="w-full text-xs font-sans px-3 py-2 border border-slate-200 focus:border-[#1B2A4A] focus:outline-none bg-white text-[#0A0A0A] rounded-sm h-10"
                      />
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full bg-[#1B2A4A] hover:bg-[#111A30] text-white font-black text-xs uppercase tracking-widest py-2.5 shadow transition-colors cursor-pointer min-h-[40px] flex items-center justify-center gap-1"
                      >
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        <span>Add Email Manually</span>
                      </button>

                      {manualEmailError && (
                        <p className="text-[10px] font-bold text-[#C0392B] uppercase tracking-wider">{manualEmailError}</p>
                      )}

                      {manualEmailSuccess && (
                        <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider">{manualEmailSuccess}</p>
                      )}
                    </form>
                  </div>

                  {/* CSV BULK IMPORT PANEL */}
                  <div className="flex flex-col justify-between space-y-4 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
                    <div>
                      <h4 className="font-bebas text-lg text-[#1B2A4A] tracking-wider uppercase flex items-center gap-2">
                        <Upload size={16} className="text-[#C0392B]" />
                        <span>CSV Bulk Import</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">
                        Import subscriber list from any CSV file
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label 
                        htmlFor="csv-newsletter-file-upload"
                        className="w-full border border-dashed border-slate-300 hover:border-[#1B2A4A] bg-white text-[#1B2A4A] font-bold text-xs uppercase tracking-wider py-4 px-3 text-center cursor-pointer min-h-[50px] flex flex-col items-center justify-center gap-1.5 transition-all rounded-sm"
                      >
                        <Upload size={18} className="text-[#1B2A4A]/60" />
                        <span>Import CSV</span>
                        <span className="text-[9px] text-slate-400 capitalize font-normal">Accepts .csv file</span>
                      </label>
                      <input
                        id="csv-newsletter-file-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setCsvImportResult(null);
                          const reader = new FileReader();

                          reader.onload = async (event) => {
                            const text = event.target?.result as string;
                            if (!text) {
                              setCsvImportResult({ imported: 0, existed: 0, invalid: 0, error: 'File is empty or corrupted.' });
                              return;
                            }

                            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            const lines = text.split(/\r?\n/);
                            const parsedEmails = new Set<string>();
                            let invalidOrSkippedCount = 0;

                            for (const line of lines) {
                              if (!line.trim()) continue;
                              // Split by commas, semicolons or tabs
                              const cells = line.split(/[,\t;]/);
                              for (const cell of cells) {
                                const cleaned = cell.replace(/["']/g, '').trim().toLowerCase();
                                if (cleaned) {
                                  if (emailRegex.test(cleaned)) {
                                    parsedEmails.add(cleaned);
                                  } else if (cleaned.includes('@')) {
                                    invalidOrSkippedCount++;
                                  }
                                }
                              }
                            }

                            if (parsedEmails.size === 0) {
                              setCsvImportResult({ imported: 0, existed: 0, invalid: invalidOrSkippedCount, error: 'No valid email addresses found in the CSV file.' });
                              return;
                            }

                            let importedCount = 0;
                            let existedCount = 0;
                            const payloadList: any[] = [];
                            const updatedSubscribers = [...subscribers];

                            for (const email of Array.from(parsedEmails)) {
                              if (subscribers.some((s) => s.email?.toLowerCase() === email)) {
                                existedCount++;
                              } else {
                                const payload = {
                                  email,
                                  subscribed_at: new Date().toISOString(),
                                  source: 'csv_import'
                                };
                                payloadList.push(payload);
                                updatedSubscribers.unshift(payload);
                                importedCount++;
                              }
                            }

                            try {
                              setActionLoading(true);
                              
                              if (payloadList.length > 0) {
                                try {
                                  // Bulk upsert to Supabase
                                  const { error } = await supabase
                                    .from('alfs_newsletter_subscribers')
                                    .upsert(payloadList, { onConflict: 'email' });
                                  
                                  if (error) {
                                    console.warn('Supabase bulk upsert database warning:', error);
                                  }
                                } catch (dbErr) {
                                  console.warn('Supabase bulk upsert threw error:', dbErr);
                                }
                              }

                              // Update state and storage immediately
                              setSubscribers(updatedSubscribers);
                              localStorage.setItem('alfs_local_newsletter_subscribers', JSON.stringify(updatedSubscribers));

                              setCsvImportResult({
                                imported: importedCount,
                                existed: existedCount,
                                invalid: invalidOrSkippedCount
                              });
                            } catch (err) {
                              console.error('CSV import save error:', err);
                              setCsvImportResult({ imported: 0, existed: 0, invalid: invalidOrSkippedCount, error: 'Failed to save imported subscribers.' });
                            } finally {
                              setActionLoading(false);
                            }
                          };

                          reader.readAsText(file);
                          // Reset input so user can reselect the same file
                          e.target.value = '';
                        }}
                      />

                      {csvImportResult && (
                        <div className="p-3 text-[10px] border bg-white rounded-sm space-y-1">
                          {csvImportResult.error ? (
                            <p className="text-[#C0392B] font-bold uppercase tracking-wider">⚠ {csvImportResult.error}</p>
                          ) : (
                            <>
                              <p className="text-green-700 font-bold uppercase tracking-wider">✓ IMPORT COMPLETED</p>
                              <div className="grid grid-cols-3 gap-1 pt-1 text-slate-500 text-center border-t border-slate-100">
                                <div>
                                  <span className="block font-black text-xs text-green-700">{csvImportResult.imported}</span>
                                  <span className="text-[8px] uppercase tracking-wider">Imported</span>
                                </div>
                                <div>
                                  <span className="block font-black text-xs text-[#1B2A4A]">{csvImportResult.existed}</span>
                                  <span className="text-[8px] uppercase tracking-wider">Existed</span>
                                </div>
                                <div>
                                  <span className="block font-black text-xs text-amber-600">{csvImportResult.invalid}</span>
                                  <span className="text-[8px] uppercase tracking-wider">Skipped</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEND NEWSLETTER PANEL */}
                  <div className="flex flex-col justify-between space-y-4 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 pt-4 md:pt-0">
                    <div>
                      <h4 className="font-bebas text-lg text-[#1B2A4A] tracking-wider uppercase flex items-center gap-2">
                        <Mail size={16} className="text-[#C0392B]" />
                        <span>Send Newsletter</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider mt-1">
                        Broadcast a newsletter to your subscriber list
                      </p>
                    </div>

                    <div className="space-y-3">
                      <button
                        type="button"
                        disabled={subscribers.length === 0}
                        onClick={() => {
                          if (subscribers.length === 0) return;
                          
                          const confirmSend = window.confirm(
                            `This will open your email client with ${subscribers.length} subscribers in BCC. Continue?`
                          );
                          
                          if (confirmSend) {
                            const bccList = subscribers.map(s => s.email).join(',');
                            const mailtoUrl = `mailto:?bcc=${encodeURIComponent(bccList)}&subject=${encodeURIComponent('ALFS Limited — Newsletter')}&body=${encodeURIComponent('Write your newsletter content here...')}`;
                            window.open(mailtoUrl, '_blank');
                          }
                        }}
                        className={`w-full font-black text-xs uppercase tracking-widest py-3 px-4 shadow transition-colors flex items-center justify-center gap-2 h-10 ${
                          subscribers.length === 0 
                            ? 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-[#C0392B] hover:bg-[#A32E22] text-white cursor-pointer'
                        }`}
                      >
                        <Mail size={14} />
                        <span>{subscribers.length === 0 ? "No subscribers yet" : "Send Newsletter"}</span>
                      </button>

                      {subscribers.length > 0 && (
                        <p className="text-[10px] text-center text-slate-500 uppercase tracking-wider">
                          Ready to broadcast to {subscribers.length} email(s) via BCC
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {subscribersLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 size={32} className="animate-spin text-[#C0392B]" />
                  </div>
                ) : subscribers.length > 0 ? (
                  <>
                    <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-[#0A0A0A]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                          <tr>
                            <th className="px-6 py-3">Subscriber Email</th>
                            <th className="px-6 py-3">Subscription Date</th>
                            <th className="px-6 py-3">Source</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm bg-white">
                          {subscribers.map((s, idx) => (
                            <tr key={s.email || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-6 py-4 font-semibold text-slate-900">{s.email}</td>
                              <td className="px-6 py-4 text-slate-500 text-xs">
                                {s.subscribed_at ? new Date(s.subscribed_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                                  {s.source || 'website'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="block md:hidden p-4 space-y-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {subscribers.map((s, idx) => (
                        <div key={s.email || idx} className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Subscriber Email</span>
                            <span className="text-sm font-bold text-slate-900 break-all">{s.email}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Subscription Date</span>
                            <span className="text-xs text-slate-500">
                              {s.subscribed_at ? new Date(s.subscribed_at).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Source</span>
                            <span className="inline-block bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                              {s.source || 'website'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-sm text-[#1B2A4A]/40 uppercase tracking-widest bg-slate-50 border border-dashed border-slate-200">
                    No subscribers found yet.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              /* REPORTS PANEL */
              <div className="p-4 sm:p-6 bg-white space-y-6 text-[#0A0A0A]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bebas text-2xl text-[#1B2A4A] tracking-wider uppercase flex items-center gap-2">
                      <Flag size={20} className="text-[#C41E3A]" />
                      <span>FLAGGED PROFILE & ABUSE REPORTS</span>
                    </h3>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                      Monitor wage disputes, fraudulent accounts, non-payments, and platform compliance
                    </p>
                  </div>
                  <button
                    onClick={loadReports}
                    disabled={reportsLoading}
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#1B2A4A] font-black text-xs uppercase tracking-widest px-4 py-3 border border-slate-200 shadow-sm transition-colors min-h-[44px]"
                  >
                    <RefreshCw size={14} className={reportsLoading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                {reportsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 size={32} className="animate-spin text-[#C41E3A]" />
                  </div>
                ) : reports.length > 0 ? (
                  <>
                    <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left border-collapse text-[#0A0A0A]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                          <tr>
                            <th className="px-6 py-3">Reporter Info</th>
                            <th className="px-6 py-3">Reported Profile</th>
                            <th className="px-6 py-3">Issue Type</th>
                            <th className="px-6 py-3">Description / Details</th>
                            <th className="px-6 py-3">Date Submitted</th>
                            <th className="px-6 py-3">Compliance Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm bg-white">
                          {reports.map((report) => {
                            // Match up names and roles securely
                            const getPartyInfo = (id: string) => {
                              const seeker = seekers.find(s => s.id === id);
                              if (seeker) return { name: seeker.full_name, role: 'Employee', contact: seeker.phone };
                              const employer = employers.find(e => e.id === id);
                              if (employer) return { name: employer.company_name, role: 'Recruiter', contact: employer.phone };
                              return { name: `User ID: ${id.substring(0, 8)}...`, role: 'Unknown', contact: 'N/A' };
                            };

                            const reporter = getPartyInfo(report.reporter_id);
                            const reported = getPartyInfo(report.reported_user_id);

                            return (
                              <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                                {/* Reporter Info */}
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-900">{reporter.name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                      reporter.role === 'Employee' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {reporter.role}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">{reporter.contact}</span>
                                  </div>
                                </td>

                                {/* Reported profile */}
                                <td className="px-6 py-4">
                                  <div className="font-semibold text-slate-900">{reported.name}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                      reported.role === 'Employee' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {reported.role}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">{reported.contact}</span>
                                  </div>
                                </td>

                                {/* Issue Type */}
                                <td className="px-6 py-4">
                                  <span className={`inline-block font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border ${
                                    report.report_type.toLowerCase().includes('non-payment') || report.report_type.toLowerCase().includes('abuse')
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}>
                                    {report.report_type}
                                  </span>
                                </td>

                                {/* Description / Details */}
                                <td className="px-6 py-4 max-w-xs md:max-w-md">
                                  <div className="text-slate-700 text-xs break-words leading-relaxed whitespace-pre-wrap">
                                    {report.details}
                                  </div>
                                </td>

                                {/* Date Submitted */}
                                <td className="px-6 py-4 text-slate-500 text-xs">
                                  {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
                                </td>

                                {/* Compliance Status */}
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-normal px-2.5 py-1 rounded-full ${
                                    report.status === 'reviewed'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${report.status === 'reviewed' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                    <span>{report.status}</span>
                                  </span>
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right">
                                  {report.status === 'reviewed' ? (
                                    <span className="text-xs font-semibold text-slate-400 italic">Reviewed</span>
                                  ) : (
                                    <button
                                      onClick={() => handleAcknowledgeReport(report.id)}
                                      disabled={actionLoading}
                                      className="inline-flex items-center gap-1 bg-[#1B2A4A] hover:bg-[#C41E3A] hover:text-white text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition-all cursor-pointer shadow-sm"
                                    >
                                      <CheckCircle size={12} />
                                      <span>Acknowledge</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="block lg:hidden p-4 space-y-3 bg-slate-50 border border-slate-200 rounded-xl">
                      {reports.map((report) => {
                        const getPartyInfo = (id: string) => {
                          const seeker = seekers.find(s => s.id === id);
                          if (seeker) return { name: seeker.full_name, role: 'Employee', contact: seeker.phone };
                          const employer = employers.find(e => e.id === id);
                          if (employer) return { name: employer.company_name, role: 'Recruiter', contact: employer.phone };
                          return { name: `User ID: ${id.substring(0, 8)}...`, role: 'Unknown', contact: 'N/A' };
                        };

                        const reporter = getPartyInfo(report.reporter_id);
                        const reported = getPartyInfo(report.reported_user_id);

                        return (
                          <div key={report.id} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                              <div>
                                <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Reporter Info</span>
                                <div className="font-semibold text-slate-900 text-xs">{reporter.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    reporter.role === 'Employee' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {reporter.role}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">{reporter.contact}</span>
                                </div>
                              </div>

                              <div>
                                <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Reported Profile</span>
                                <div className="font-semibold text-slate-900 text-xs">{reported.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    reported.role === 'Employee' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {reported.role}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">{reported.contact}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-1">Issue Type</span>
                              <span className={`inline-block font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded border ${
                                report.report_type.toLowerCase().includes('non-payment') || report.report_type.toLowerCase().includes('abuse')
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}>
                                {report.report_type}
                              </span>
                            </div>

                            <div>
                              <span className="block text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 mb-0.5">Description / Details</span>
                              <div className="text-slate-700 text-xs break-words leading-relaxed whitespace-pre-wrap bg-slate-50 p-2.5 rounded border border-slate-100">
                                {report.details}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 block">Date Submitted</span>
                                <span className="text-slate-500 text-xs">
                                  {report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A'}
                                </span>
                              </div>

                              <div>
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#1B2A4A]/50 block mb-0.5">Compliance Status</span>
                                <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase tracking-normal px-2.5 py-1 rounded-full ${
                                  report.status === 'reviewed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${report.status === 'reviewed' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                  <span>{report.status}</span>
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                              {report.status === 'reviewed' ? (
                                <span className="text-xs font-semibold text-slate-400 italic">Reviewed</span>
                              ) : (
                                <button
                                  onClick={() => handleAcknowledgeReport(report.id)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 bg-[#1B2A4A] hover:bg-[#C41E3A] hover:text-white text-white font-black text-[10px] uppercase tracking-wider px-3.5 py-2 rounded transition-all cursor-pointer shadow-sm"
                                >
                                  <CheckCircle size={12} />
                                  <span>Acknowledge</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-sm text-[#1B2A4A]/40 uppercase tracking-widest bg-slate-50 border border-dashed border-slate-200">
                    No flagged reports have been submitted.
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Read-Only Profile Preview Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="bg-white border-2 border-[#1B2A4A] w-full max-w-2xl md:max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-y-auto animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#1B2A4A] text-white p-4 flex justify-between items-center shrink-0">
              <h3 className="font-sans font-semibold text-sm flex items-center gap-2">
                {previewItem.type === 'seeker' ? <Users size={16} /> : <Building2 size={16} />}
                <span>{previewItem.type === 'seeker' ? 'Employee Profile Preview' : 'Employer Profile Preview'}</span>
              </h3>
              <div className="flex items-center gap-2">
                {!adminIsEditing && (
                  <button
                    onClick={() => setAdminIsEditing(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest py-1.5 px-3 rounded shadow transition-all cursor-pointer min-h-[32px] flex items-center justify-center gap-1"
                  >
                    Edit Listing Info
                  </button>
                )}
                <button 
                  onClick={() => setPreviewItem(null)}
                  className="text-white/80 hover:text-white transition-colors cursor-pointer p-1"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-[#0A0A0A]">
              {feedback.text && (
                <div className={`p-4 border text-xs font-bold uppercase tracking-wider ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border-red-200 text-[#C0392B]'
                }`}>
                  {feedback.text}
                </div>
              )}

              {adminIsEditing ? (
                <form onSubmit={handleAdminSaveProfile} className="space-y-6">
                  {previewItem.type === 'seeker' ? (
                    /* EDIT SEEKER / WORKER PROFILE */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={adminEditName}
                          onChange={(e) => {
                            setAdminEditName(e.target.value);
                            if (adminNameError) validateAdminName(e.target.value);
                          }}
                          onBlur={() => validateAdminName(adminEditName)}
                          className="w-full text-sm font-semibold p-3 border border-slate-200 uppercase tracking-wider bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                        />
                        {adminNameError && (
                          <p className="text-xs text-[#C0392B] font-bold mt-1">{adminNameError}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                            Contact Phone / Telephone
                          </label>
                          <input
                            type="tel"
                            required
                            maxLength={14}
                            value={adminEditPhone}
                            onChange={(e) => {
                              setAdminEditPhone(e.target.value);
                              if (adminPhoneError) validateAdminPhone(e.target.value);
                            }}
                            onBlur={() => validateAdminPhone(adminEditPhone)}
                            placeholder="e.g. +260 97 123 4567"
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                          {adminPhoneError && (
                            <p className="text-xs text-[#C0392B] font-bold mt-1">{adminPhoneError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                            NRC Number
                          </label>
                          <input
                            type="text"
                            maxLength={11}
                            value={adminEditNrc}
                            onChange={(e) => {
                              setAdminEditNrc(e.target.value);
                              if (adminNrcError) validateAdminNrc(e.target.value);
                            }}
                            onBlur={() => validateAdminNrc(adminEditNrc)}
                            placeholder="e.g. 123456/11/1"
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                          {adminNrcError && (
                            <p className="text-xs text-[#C0392B] font-bold mt-1">{adminNrcError}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                            NAPSA Number (Optional)
                          </label>
                          <input
                            type="text"
                            maxLength={15}
                            value={adminEditNapsa}
                            onChange={(e) => {
                              setAdminEditNapsa(e.target.value);
                              if (adminNapsaError) validateAdminNapsa(e.target.value);
                            }}
                            onBlur={() => validateAdminNapsa(adminEditNapsa)}
                            placeholder="e.g. 123456789"
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                          {adminNapsaError && (
                            <p className="text-xs text-[#C0392B] font-bold mt-1">{adminNapsaError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                            Trade / Profession
                          </label>
                          <input
                            type="text"
                            value={adminEditTrade}
                            onChange={(e) => setAdminEditTrade(e.target.value)}
                            placeholder="e.g. Electrician"
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">
                            Province / Region
                          </label>
                          <select
                            value={adminEditRegion}
                            onChange={(e) => setAdminEditRegion(e.target.value)}
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          >
                            <option value="">Select Province</option>
                            {PROVINCES.map(prov => (
                              <option key={prov} value={prov}>{prov}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            Availability Commitment
                          </label>
                          <select
                            value={adminEditAvailability}
                            onChange={(e) => setAdminEditAvailability(e.target.value)}
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          >
                            <option value="Available">Available</option>
                            <option value="Looking for Work">Looking for Work</option>
                            <option value="Employed">Employed</option>
                            <option value="Not Available">Not Available</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            Availability Status (Employment State)
                          </label>
                          <select
                            value={adminEditAvailabilityStatus}
                            onChange={(e) => setAdminEditAvailabilityStatus(e.target.value as any)}
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          >
                            <option value="available">Available</option>
                            <option value="placed">Placed</option>
                            <option value="not_looking">Not Looking</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* EDIT EMPLOYER PROFILE */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            Company Name
                          </label>
                          <input
                            type="text"
                            required
                            value={adminEditName}
                            onChange={(e) => {
                              setAdminEditName(e.target.value);
                              if (adminNameError) validateAdminName(e.target.value);
                            }}
                            onBlur={() => validateAdminName(adminEditName)}
                            className="w-full text-sm font-semibold p-3 border border-slate-200 uppercase tracking-wider bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                          {adminNameError && (
                            <p className="text-xs text-[#C0392B] font-bold mt-1">{adminNameError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            Primary Contact Person
                          </label>
                          <input
                            type="text"
                            required
                            value={adminEditContact}
                            onChange={(e) => {
                              setAdminEditContact(e.target.value);
                              if (adminContactError) validateAdminContact(e.target.value);
                            }}
                            onBlur={() => validateAdminContact(adminEditContact)}
                            placeholder="e.g. John Doe (HR Manager)"
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                          {adminContactError && (
                            <p className="text-xs text-[#C0392B] font-bold mt-1">{adminContactError}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            Recruitment Phone
                          </label>
                          <input
                            type="tel"
                            required
                            maxLength={14}
                            value={adminEditPhone}
                            onChange={(e) => {
                              setAdminEditPhone(e.target.value);
                              if (adminPhoneError) validateAdminPhone(e.target.value);
                            }}
                            onBlur={() => validateAdminPhone(adminEditPhone)}
                            placeholder="e.g. +260 97 123 4567"
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                          {adminPhoneError && (
                            <p className="text-xs text-[#C0392B] font-bold mt-1">{adminPhoneError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            TPIN (Taxpayer ID) (Optional)
                          </label>
                          <input
                            type="text"
                            maxLength={10}
                            value={adminEditTpin}
                            onChange={(e) => {
                              setAdminEditTpin(e.target.value);
                              if (adminTpinError) validateAdminTpin(e.target.value);
                            }}
                            onBlur={() => validateAdminTpin(adminEditTpin)}
                            placeholder="e.g. 1012345678"
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                          {adminTpinError && (
                            <p className="text-xs text-[#C0392B] font-bold mt-1">{adminTpinError}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            PACRA Certificate
                          </label>
                          {adminEditPacraUrl ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={adminEditPacraUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-[#1B2A4A] underline"
                              >
                                View Current Certificate
                              </a>
                              <button
                                type="button"
                                onClick={() => setAdminEditPacraUrl('')}
                                className="text-xs font-bold text-[#C0392B] border border-[#C0392B]/30 rounded px-2 py-1 hover:bg-red-50 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 flex-wrap">
                              <label className="cursor-pointer bg-[#1B2A4A] text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-sm hover:bg-[#243c5c] transition-colors">
                                {pacraUploading ? 'Uploading...' : 'Upload PACRA Certificate'}
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  className="hidden"
                                  disabled={pacraUploading}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    setPacraUploading(true);
                                    const { url, error } = await dbClient.uploadCertificate(previewItem.data.id, file);
                                    if (error) {
                                      setFeedback({ text: error.message || 'Failed to upload certificate.', type: 'error' });
                                    } else if (url) {
                                      setAdminEditPacraUrl(url);
                                    }
                                    setPacraUploading(false);
                                  }}
                                />
                              </label>
                              <span className="text-[10px] text-gray-400">PDF, JPG, PNG, DOC, DOCX — max 5MB</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            Sector / Field of Work
                          </label>
                          <input
                            type="text"
                            value={adminEditFieldOfWork}
                            onChange={(e) => setAdminEditFieldOfWork(e.target.value)}
                            placeholder="e.g. Agriculture"
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          />
                        </div>

                        <div>
                          <label className="block text-[#1B2A4A]/65 text-xs font-black uppercase mb-1 tracking-wider">
                            Province / Region
                          </label>
                          <select
                            value={adminEditRegion}
                            onChange={(e) => setAdminEditRegion(e.target.value)}
                            className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px] focus:outline-none focus:border-[#C0392B]"
                          >
                            <option value="">Select Province</option>
                            {PROVINCES.map(prov => (
                              <option key={prov} value={prov}>{prov}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-4 border-t border-slate-105 justify-end">
                    <button
                      type="button"
                      onClick={() => setAdminIsEditing(false)}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider py-2.5 px-5 min-h-[40px] transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black text-xs uppercase tracking-wider py-2.5 px-5 min-h-[40px] transition-all cursor-pointer"
                    >
                      {actionLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                /* READ-ONLY PREVIEW DISPLAY */
                previewItem.type === 'seeker' ? (
                  // Seeker Profile Detail View
                  (() => {
                    const s = previewItem.data as Seeker;
                    return (
                      <div className="space-y-5">
                        {/* Top profile banner */}
                        <div className="flex gap-4 items-center">
                          <div className="h-20 w-20 shrink-0 bg-slate-100 border border-[#1B2A4A] flex items-center justify-center overflow-hidden">
                            {s.photo_url ? (
                              <img src={s.photo_url} alt={s.full_name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User size={36} className="text-[#1B2A4A]/40" />
                            )}
                          </div>
                          <div className="space-y-1 grow min-w-0">
                            <h4 className="font-sans font-black text-lg uppercase tracking-wide text-[#0A0A0A] truncate">
                              {s.full_name}
                            </h4>
                            <p className="text-xs font-black uppercase text-[#C0392B] tracking-wider truncate">
                              {s.trade}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500 items-center">
                              <span>{s.region} Province</span>
                              <span>•</span>
                              <span>{s.availability}</span>
                              {s.availability_status && (
                                <>
                                  <span>•</span>
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border rounded-full inline-block ${
                                    s.availability_status === 'available'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : s.availability_status === 'placed'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {s.availability_status.replace('_', ' ')}
                                  </span>
                                </>
                              )}
                            </div>
                            <LastUpdatedIndicator updatedAt={s.updated_at} createdAt={s.created_at} />
                          </div>
                        </div>

                        {/* Admin Change Availability Status */}
                        <div className="pt-3 border-t border-[#131b2c]/10 space-y-2">
                          <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block font-black">
                            Update Availability Status
                          </span>
                          <div className="flex gap-2">
                            {([
                              { value: 'available', label: 'Available' },
                              { value: 'placed', label: 'Placed' },
                              { value: 'not_looking', label: 'Not Looking' }
                            ] as const).map(option => {
                              const isActive = s.availability_status === option.value || (!s.availability_status && option.value === 'available');
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={async () => {
                                    const newValue = option.value;
                                    
                                    // Update locally first (sandbox / local state)
                                    if (isSandboxActive()) {
                                      const list = JSON.parse(localStorage.getItem('alfs_sb_seekers') || '[]');
                                      const index = list.findIndex((x: any) => x.id === s.id);
                                      if (index >= 0) {
                                        list[index].availability_status = newValue;
                                        localStorage.setItem('alfs_sb_seekers', JSON.stringify(list));
                                      }
                                    }
                                    
                                    // Supabase update
                                    await supabase.from('alfs_labour_seekers').update({ availability_status: newValue }).eq('id', s.id);
                                    
                                    // Refresh active preview item modal state
                                    setPreviewItem({
                                      type: 'seeker',
                                      data: { ...s, availability_status: newValue }
                                    });
                                    
                                    // Refresh admin list of seekers
                                    await loadSeekers();
                                  }}
                                  className={`text-xs font-bold uppercase tracking-wider py-2 px-3 border transition-colors cursor-pointer rounded ${
                                    isActive
                                      ? option.value === 'available'
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : option.value === 'placed'
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : 'bg-rose-600 border-rose-600 text-white'
                                      : 'border-[#1B2A4A]/30 text-[#1B2A4A]/60 hover:border-[#1B2A4A]'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Terms Acceptance Status */}
                        <div className={`text-xs font-bold uppercase tracking-wider px-3 py-2 mb-4 border ${
                          s.terms_accepted_at 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {s.terms_accepted_at 
                            ? `Terms Accepted: ${new Date(s.terms_accepted_at).toLocaleDateString()} (${s.terms_version || 'v1'})`
                            : 'Terms & Conditions: Not Yet Accepted'}
                        </div>

                        {/* Phone / Contact */}
                        <div className="p-3 bg-slate-50 border-l-2 border-[#1B2A4A] grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">Contact Number</span>
                            <span className="text-sm font-black text-[#1B2A4A]">{s.phone}</span>
                          </div>
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">EMAIL</span>
                            <span className="text-sm font-black text-[#1B2A4A]">{s.email || 'Not provided'}</span>
                          </div>
                          {s.nrc && (
                            <div>
                              <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">NRC Number</span>
                              <span className="text-xs font-bold text-[#1B2A4A]">{s.nrc}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">NAPSA Number</span>
                            <span className="text-xs font-bold text-[#1B2A4A]">{s.napsa_number || 'Not provided'}</span>
                          </div>
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">NRC Photo</span>
                            {s.nrc_photo_url ? (
                              <a
                                href={s.nrc_photo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-black uppercase text-red-600 hover:text-[#C0392B] underline inline-flex items-center gap-1 mt-0.5"
                              >
                                View NRC Photo
                              </a>
                            ) : (
                              <span className="text-xs font-black text-slate-400">Not provided</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">ID Verification Status</span>
                            <label className="flex items-center gap-2 mt-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!s.id_verified}
                                onChange={async (e) => {
                                  const checked = e.target.checked;
                                  setSeekers(prev => prev.map(item => item.id === s.id ? { ...item, id_verified: checked } : item));
                                  if (previewItem && previewItem.type === 'seeker' && previewItem.data.id === s.id) {
                                    setPreviewItem({
                                      type: 'seeker',
                                      data: { ...previewItem.data, id_verified: checked }
                                    });
                                  }
                                  try {
                                    const { error } = await dbClient.updateSeeker(s.id, { id_verified: checked });
                                    if (error) {
                                      console.error('Error updating worker Verification state:', error);
                                      setSeekers(prev => prev.map(item => item.id === s.id ? { ...item, id_verified: !checked } : item));
                                      if (previewItem && previewItem.type === 'seeker' && previewItem.data.id === s.id) {
                                        setPreviewItem({
                                          type: 'seeker',
                                          data: { ...previewItem.data, id_verified: !checked }
                                        });
                                      }
                                    }
                                  } catch (err) {
                                    console.error('Error in ID Verification update:', err);
                                    setSeekers(prev => prev.map(item => item.id === s.id ? { ...item, id_verified: !checked } : item));
                                    if (previewItem && previewItem.type === 'seeker' && previewItem.data.id === s.id) {
                                      setPreviewItem({
                                        type: 'seeker',
                                        data: { ...previewItem.data, id_verified: !checked }
                                      });
                                    }
                                  }
                                }}
                                className="accent-[#C0392B] h-4 w-4 rounded border-slate-300 text-[#C0392B]"
                              />
                              <span className="text-xs font-black uppercase text-[#1B2A4A] tracking-wider">ID Verified</span>
                            </label>
                          </div>
                        </div>

                        {/* Experience Summary */}
                        {s.experience_summary && (
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-1">Premium Profile Parameters</span>
                            <p className="p-3 bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-semibold">
                              {s.experience_summary}
                            </p>
                          </div>
                        )}

                        {/* Certifications */}
                        {s.certifications && s.certifications.length > 0 && (
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-1.5">Verified Certifications</span>
                            <div className="flex flex-wrap gap-1.5">
                              {s.certifications.map((cert, index) => (
                                <span key={index} className="bg-[#1B2A4A]/5 border border-[#1B2A4A]/20 text-[#1B2A4A] text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                                  {cert}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Employment Timeline / Previous Jobs */}
                        {s.previous_jobs && s.previous_jobs.length > 0 && (
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-2">Employment Timeline</span>
                            <div className="border-l-2 border-dashed border-slate-200 pl-3 space-y-3 ml-1">
                              {s.previous_jobs.map((job, idx) => (
                                <div key={idx} className="relative">
                                  <span className="absolute -left-[17px] top-1 h-2.5 w-2.5 rounded-full bg-[#1B2A4A] border border-white" />
                                  <div className="text-[11px] font-black uppercase text-[#1B2A4A]">{job.company}</div>
                                  <div className="text-[10px] font-semibold text-slate-600">
                                    {job.role} <span className="opacity-60">({job.duration})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Certificate URLs Document links */}
                        {s.certificate_urls && s.certificate_urls.length > 0 && (
                          <div>
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-1.5">Certificate Documents</span>
                            <div className="grid grid-cols-2 gap-2">
                              {s.certificate_urls.map((item, idx) => {
                                const isString = typeof item === 'string';
                                const label = isString ? '' : (item as any)?.label || '';
                                const url = isString ? item : (item as any)?.url || '';
                                const displayName = label || `Document #${idx + 1}`;
                                return (
                                  <a 
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between p-2 text-[11px] font-black uppercase tracking-wider bg-slate-50 border border-slate-200/60 hover:bg-[#1B2A4A]/5 hover:border-[#1B2A4A]/30 text-[#1B2A4A] transition-all"
                                  >
                                    <span className="truncate max-w-[85%]">{displayName}</span>
                                    <ExternalLink size={12} className="opacity-65 shrink-0" />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Internal Notes (Admin Only) */}
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-2 mt-4 text-[#0A0A0A]">
                          <div className="flex justify-between items-center">
                            <span className="font-sans font-extrabold text-amber-805 text-[10px] uppercase tracking-wider flex items-center gap-1">
                              <span>🔒 Internal Notes — Not visible to user</span>
                            </span>
                            <span className="text-[9px] text-amber-600 font-semibold uppercase tracking-wider">
                              Auto-saves on blur
                            </span>
                          </div>
                          <textarea
                            className="w-full text-xs font-semibold p-3 border border-amber-300 rounded focus:outline-none focus:border-amber-500 bg-white text-[#0A0A0A] resize-none"
                            rows={3}
                            placeholder="Type internal notes about this profile here (e.g. compliance flags, work feedback, verification logs)..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            onBlur={() => handleAutoSaveAdminNotes(adminNotes)}
                          />
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  // Employer Profile Detail View
                  (() => {
                    const emp = previewItem.data as Employer;
                    return (
                      <div className="space-y-4">
                        {/* Top banner info */}
                        <div className="flex gap-4 items-center">
                          <div className="h-16 w-16 shrink-0 bg-slate-100 border border-[#1B2A4A] flex items-center justify-center overflow-hidden">
                            {emp.logo_url ? (
                              <img src={emp.logo_url} alt={emp.company_name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Building2 size={30} className="text-[#1B2A4A]/40" />
                            )}
                          </div>
                          <div className="space-y-0.5 grow min-w-0">
                            <h4 className="font-sans font-black text-lg uppercase tracking-wide text-[#0A0A0A] truncate">
                              {emp.company_name}
                            </h4>
                            <p className="text-xs font-black uppercase text-indigo-600 tracking-wider truncate">
                              {emp.field_of_work}
                            </p>
                            <p className="text-xs font-semibold text-slate-500">
                              {emp.region} Province
                            </p>
                            <LastUpdatedIndicator updatedAt={emp.updated_at} createdAt={emp.created_at} />
                          </div>
                        </div>

                        {/* Terms Acceptance Status */}
                        <div className={`text-xs font-bold uppercase tracking-wider px-3 py-2 mb-4 border ${
                          emp.terms_accepted_at 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {emp.terms_accepted_at 
                            ? `Terms Accepted: ${new Date(emp.terms_accepted_at).toLocaleDateString()} (${emp.terms_version || 'v1'})`
                            : 'Terms & Conditions: Not Yet Accepted'}
                        </div>

                        {/* Detail attributes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                          <div className="p-3 bg-slate-50 border-l-2 border-[#1B2A4A] space-y-1">
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">Contact Person</span>
                            <span className="text-xs font-black uppercase text-[#1B2A4A]">{emp.contact_person}</span>
                          </div>
                          <div className="p-3 bg-slate-50 border-l-2 border-[#1B2A4A]/60 space-y-1">
                            <span className="text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">Email Address</span>
                            <span className="text-xs font-black text-[#1B2A4A]">{emp.email || 'Not provided'}</span>
                          </div>
                          <div className="p-3 bg-slate-50 border-l-2 border-indigo-500 space-y-1">
                            <span className="text-indigo-500/40 uppercase tracking-widest text-[10px] block">Recruitment Phone</span>
                            <span className="text-xs font-black text-indigo-900">{emp.phone}</span>
                          </div>
                          <div className="p-3 bg-slate-50 border-l-2 border-slate-500 space-y-1">
                            <span className="text-slate-500/40 uppercase tracking-widest text-[10px] block">TPIN (Taxpayer Identification)</span>
                            <span className="text-xs font-black text-slate-800">{emp.tpin || 'Not provided'}</span>
                          </div>
                          <div className="p-3 bg-slate-50 border-l-2 border-red-500 space-y-1">
                            <span className="text-red-500/40 uppercase tracking-widest text-[10px] block">PACRA Registration</span>
                            {emp.pacra_certificate_url ? (
                              <a
                                href={emp.pacra_certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-black uppercase text-red-600 hover:text-[#C0392B] underline inline-flex items-center gap-1 mt-0.5"
                              >
                                View PACRA Certificate
                              </a>
                            ) : (
                              <span className="text-xs font-black text-slate-400">Not provided</span>
                            )}
                          </div>
                        </div>

                        {/* Internal Notes (Admin Only) */}
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-2 mt-4 text-[#0A0A0A]">
                          <div className="flex justify-between items-center">
                            <span className="font-sans font-extrabold text-amber-805 text-[10px] uppercase tracking-wider flex items-center gap-1">
                              <span>🔒 Internal Notes — Not visible to user</span>
                            </span>
                            <span className="text-[9px] text-amber-600 font-semibold uppercase tracking-wider">
                              Auto-saves on blur
                            </span>
                          </div>
                          <textarea
                            className="w-full text-xs font-semibold p-3 border border-amber-300 rounded focus:outline-none focus:border-amber-500 bg-white text-[#0A0A0A] resize-none"
                            rows={3}
                            placeholder="Type internal notes about this profile here (e.g. compliance flags, unpaid wage disputes, payment timelines)..."
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            onBlur={() => handleAutoSaveAdminNotes(adminNotes)}
                          />
                        </div>
                      </div>
                    );
                  })()
                )
              )}
            </div>

            {/* Sticky bottom close button */}
            <div className="bg-slate-50 border-t border-[#1B2A4A]/10 p-3 sm:px-6 flex justify-end shrink-0">
              <button
                onClick={() => setPreviewItem(null)}
                className="bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-white font-black text-xs uppercase tracking-widest py-3 px-6 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
