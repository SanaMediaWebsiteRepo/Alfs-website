import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { trackEvent } from '../lib/analytics';
import { dbClient, isSandboxActive, isSupabasePropertiesLoaded, deactivateSandbox, WorkerRequest } from '../lib/dbClient';
import { 
  Briefcase, 
  MapPin, 
  Phone, 
  Search, 
  LogOut, 
  User, 
  Building2, 
  CheckCircle, 
  Filter, 
  RefreshCcw, 
  Globe, 
  MessageSquare,
  AlertCircle,
  Loader2,
  Lock,
  Send,
  ExternalLink,
  FileText,
  X,
  Mail,
  ArrowLeft,
  ArrowRight,
  Flag,
  ChevronDown
} from 'lucide-react';
import SupabaseErrorPrompt from '../components/SupabaseErrorPrompt';
import { supabase } from '../lib/supabase';
import TermsModal from '../components/TermsModal';

interface Seeker {
  id: string;
  full_name: string;
  trade: string;
  region: string;
  availability: string;
  phone: string;
  status: string;
  created_at: string;
  photo_url?: string;
  nrc?: string;
  certifications?: string[];
  experience_summary?: string;
  previous_jobs?: { company: string; role: string; duration: string }[];
  terms_accepted_at?: string;
  terms_version?: string;
}

interface Employer {
  id: string;
  company_name: string;
  field_of_work: string;
  region: string;
  contact_person: string;
  phone: string;
  status: string;
  created_at: string;
  logo_url?: string;
  terms_accepted_at?: string;
  terms_version?: string;
  tpin?: string;
}

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-3);
};

const maskNRC = (nrc?: string): string => {
  if (!nrc) return "Not provided";
  const parts = nrc.split('/');
  if (parts.length > 0) {
    parts[0] = parts[0].replace(/\d/g, '*');
    return parts.join('/');
  }
  return nrc;
};

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
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = reject;
    img.src = url;
  });
};

const ZAMBIAN_TRADES: Record<string, string[]> = {
  'Civil Works': ['Civil Engineer', 'Resident Engineer', 'Site Engineer', 'Assistant Engineer', 'Highway Engineer', 'Road Engineer', 'Geotechnical Engineer', 'Survey Engineer', 'Materials Engineer', 'Quality Control Engineer', 'Land Surveyor', 'Engineering Surveyor', 'Survey Assistant', 'Chainman', 'GIS Technician', 'Civil Foreman', 'Site Supervisor', 'Clerk of Works', 'Excavator Operator', 'Bulldozer Operator', 'Grader Operator', 'Roller Operator', 'Backhoe Operator', 'Tipper Truck Driver', 'Water Bowser Driver', 'Compactor Operator', 'Concrete Pump Operator', 'General Labourer', 'Digger', 'Trench Worker', 'Concrete Worker', 'Kerb Layer', 'Paver', 'Flagman/Banksman'],
  'Structural Works': ['Structural Engineer', 'Structural Draftsperson', 'Structural Detailer', 'Steel Detailer', 'Steel Fabricator', 'Structural Steel Erector', 'Boilermaker', 'Plate Fabricator', 'Welder Class 1', 'Welder Class 2', 'Welder Class 3', 'Arc Welder', 'MIG Welder', 'TIG Welder', 'Pipe Welder', 'Structural Welder', 'Coded Welder', 'Welding Inspector', 'Steel Fixer', 'Rebar Installer', 'Rebar Foreman', 'Formwork Carpenter', 'Shuttering Carpenter', 'Concrete Finisher', 'Concrete Foreman', 'Rigger', 'Rigger Class 1', 'Rigger Class 2', 'Rigger Class 3', 'Crane Operator', 'Slinger', 'Banksman'],
  'Plumbing Works': ['Master Plumber', 'Plumber', 'Assistant Plumber', 'Pipe Fitter', 'Pipe Installer', 'HDPE Pipe Technician', 'PPR Pipe Technician', 'Copper Pipe Specialist', 'Drainage Specialist', 'Sewer Technician', 'Water Reticulation Technician', 'Fire Sprinkler Installer', 'Fire Systems Technician', 'Fire Pump Technician', 'Plumbing Foreman', 'Plumbing Supervisor'],
  'Electrical Works': ['Electrical Engineer', 'Electrical Technician', 'Electrical Inspector', 'Electrician', 'Industrial Electrician', 'Domestic Electrician', 'Commercial Electrician', 'Cable Jointer', 'Cable Puller', 'Electrical Fitter', 'Instrument Technician', 'Instrument Engineer', 'SCADA Technician', 'Automation Technician', 'High Voltage Technician', 'Low Voltage Technician', 'Substation Technician', 'Generator Technician', 'Electrical Foreman', 'Electrical Supervisor'],
  'Mechanical Works': ['Mechanical Engineer', 'Mechanical Technician', 'Mechanical Inspector', 'Mechanical Fitter', 'Millwright', 'Pipe Fitter', 'Plant Fitter', 'Diesel Mechanic', 'Heavy Equipment Mechanic', 'Hydraulic Technician', 'Pump Technician', 'Compressor Technician', 'Maintenance Technician', 'Maintenance Planner', 'Mechanical Foreman', 'Mechanical Supervisor'],
  'HVAC Works': ['HVAC Technician', 'HVAC Engineer', 'Refrigeration Technician', 'Air Conditioning Installer', 'Duct Installer', 'Duct Fabricator', 'Ventilation Technician', 'HVAC Foreman', 'HVAC Supervisor'],
  'Finishing Works': ['Bricklayer', 'Block Layer', 'Mason', 'Carpenter', 'Joiner', 'Cabinet Maker', 'Furniture Installer', 'Ceiling Installer', 'Drywall Installer', 'Partition Installer', 'Tiler', 'Marble Installer', 'Terrazzo Specialist', 'Vinyl Flooring Installer', 'Epoxy Flooring Specialist', 'Painter', 'Spray Painter', 'Industrial Painter', 'Sandblaster', 'Glazier', 'Aluminium Installer', 'Glass Installer'],
  'Plant & Equipment Operators': ['Excavator Operator', 'Bulldozer Operator', 'Grader Operator', 'Roller Operator', 'Backhoe Operator', 'Crane Operator', 'Forklift Operator', 'Telehandler Operator', 'Reach Stacker Operator', 'Truck Driver', 'Tipper Driver', 'Fuel Bowser Driver', 'Lowbed Driver'],
  'Site Management & Professional Services': ['Architect', 'Architectural Technologist', 'Architectural Drafter', 'Project Manager', 'Construction Manager', 'Site Manager', 'Project Coordinator', 'Quantity Surveyor', 'Cost Controller', 'Estimator', 'Planning Engineer', 'Project Planner', 'Contracts Manager', 'Procurement Officer', 'Contracts Administrator'],
  'HSE & Quality': ['HSE Officer', 'HSE Supervisor', 'HSE Manager', 'Safety Marshal', 'Fire Marshal', 'QA/QC Inspector', 'QA/QC Engineer', 'NDT Technician', 'Welding Inspector', 'Materials Inspector'],
  'General Labour': ['General Labourer', 'Cleaner', 'Digger', 'Helper', 'Store Assistant', 'Skilled Labourer', 'Construction Assistant', 'Trades Assistant', 'Storeman', 'Yardman', 'Material Handler', 'Handyman', 'Multi-Skilled Artisan'],
};

const TRADE_ASSESSMENT: Record<string, { question: string; key: string }[]> = {
  'Civil Works': [
    { question: 'Have you read and interpreted civil engineering drawings?', key: 'civil_drawings' },
    { question: 'Have you operated earthmoving equipment on site?', key: 'earthmoving' },
    { question: 'Have you supervised a civil construction crew?', key: 'civil_supervision' },
    { question: 'Have you worked on road or bridge construction?', key: 'road_bridge' },
    { question: 'Have you used surveying instruments (total station, level)?', key: 'surveying_instruments' },
  ],
  'Structural Works': [
    { question: 'Have you performed structural welding on-site?', key: 'structural_welding' },
    { question: 'Have you erected structural steelwork?', key: 'steel_erection' },
    { question: 'Have you operated MIG or TIG welding equipment?', key: 'mig_tig' },
    { question: 'Have you worked with formwork and shuttering?', key: 'formwork' },
    { question: 'Have you performed rigging or lifting operations?', key: 'rigging_lifting' },
  ],
  'Plumbing Works': [
    { question: 'Have you installed hot and cold water systems?', key: 'hot_cold_water' },
    { question: 'Have you worked on industrial pipe fitting?', key: 'industrial_pipefitting' },
    { question: 'Have you installed or maintained sewage systems?', key: 'sewage' },
    { question: 'Have you worked with HDPE or PPR piping?', key: 'hdpe_ppr' },
    { question: 'Have you installed fire suppression or sprinkler systems?', key: 'fire_systems' },
  ],
  'Electrical Works': [
    { question: 'Have you worked on 3-phase electrical systems?', key: 'three_phase' },
    { question: 'Have you installed or maintained distribution boards (DB boards)?', key: 'db_boards' },
    { question: 'Have you worked on high voltage systems (above 1000V)?', key: 'high_voltage' },
    { question: 'Have you carried out fault finding on industrial machinery?', key: 'fault_finding' },
    { question: 'Have you worked on instrumentation or SCADA systems?', key: 'scada' },
  ],
  'Mechanical Works': [
    { question: 'Have you worked on hydraulic or pneumatic systems?', key: 'hydraulics' },
    { question: 'Have you serviced diesel engines above 200HP?', key: 'heavy_diesel' },
    { question: 'Have you performed preventive maintenance on plant equipment?', key: 'preventive_maintenance' },
    { question: 'Have you used alignment tools (laser or dial gauge)?', key: 'alignment_tools' },
    { question: 'Have you worked as a millwright or mechanical fitter?', key: 'millwright_fitter' },
  ],
  'HVAC Works': [
    { question: 'Have you installed or serviced air conditioning units?', key: 'ac_install' },
    { question: 'Have you worked on commercial or industrial ventilation systems?', key: 'ventilation' },
    { question: 'Have you handled refrigerants (F-Gas or equivalent)?', key: 'refrigerants' },
    { question: 'Have you fabricated or installed ductwork?', key: 'ductwork' },
    { question: 'Have you commissioned HVAC systems on completion?', key: 'hvac_commissioning' },
  ],
  'Finishing Works': [
    { question: 'Have you laid tiles, marble or specialised flooring?', key: 'flooring' },
    { question: 'Have you installed ceilings or drywall partitions?', key: 'ceiling_drywall' },
    { question: 'Have you done spray painting or industrial coating?', key: 'spray_painting' },
    { question: 'Have you installed aluminium windows or glass?', key: 'aluminium_glass' },
    { question: 'Have you done carpentry or joinery work professionally?', key: 'carpentry_joinery' },
  ],
  'Plant & Equipment Operators': [
    { question: 'Do you hold a valid operator licence for heavy equipment?', key: 'operator_licence' },
    { question: 'Have you operated excavators or bulldozers on site?', key: 'excavator_bulldozer' },
    { question: 'Have you operated a crane or lifting equipment?', key: 'crane_lifting' },
    { question: 'Have you driven lowbed or articulated trucks?', key: 'lowbed_articulated' },
    { question: 'Have you operated equipment on a mine site?', key: 'mine_equipment' },
  ],
  'Site Management & Professional Services': [
    { question: 'Have you managed a construction or engineering project end-to-end?', key: 'project_management' },
    { question: 'Have you prepared or reviewed Bills of Quantities (BOQ)?', key: 'boq' },
    { question: 'Have you used AutoCAD or similar design/planning software?', key: 'cad_software' },
    { question: 'Have you worked on EPC or EPCM projects?', key: 'epc_projects' },
    { question: 'Have you managed contracts or procurement processes?', key: 'contracts_procurement' },
  ],
  'HSE & Quality': [
    { question: 'Are you certified in First Aid (Level 1 or above)?', key: 'first_aid' },
    { question: 'Have you conducted toolbox talks or safety briefings?', key: 'toolbox_talks' },
    { question: 'Have you performed incident or accident investigations?', key: 'incident_investigation' },
    { question: 'Have you carried out QA/QC inspections on site?', key: 'qaqc_inspections' },
    { question: 'Are you familiar with Zambia OSH Act requirements?', key: 'osh_act' },
  ],
  'General Labour': [
    { question: 'Have you worked on a construction site before?', key: 'construction_site' },
    { question: 'Have you operated any basic power tools?', key: 'power_tools' },
    { question: 'Have you worked in a stores or materials handling role?', key: 'stores_handling' },
    { question: 'Have you received any on-the-job safety training?', key: 'safety_training' },
    { question: 'Are you available for shift work or night shifts?', key: 'shift_work' },
  ],
};

export default function LabourDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [welcomeDismissed, setWelcomeDismissed] = useState<boolean>(() => {
    return localStorage.getItem('alfs_welcome_dismissed') === 'true';
  });

  const handleDismissWelcome = () => {
    setWelcomeDismissed(true);
    localStorage.setItem('alfs_welcome_dismissed', 'true');
  };

  const getSeekerCompletion = (p: Seeker | null): number => {
    if (!p) return 20;
    let score = 0;
    if (p.full_name && p.full_name !== 'Anonymous Seeker') score += 20;
    if (p.phone && p.phone !== 'Not provided' && p.phone.trim() !== '') score += 15;
    if (p.region && p.region !== '') score += 10;
    if (p.trade && p.trade !== 'unspecified' && p.trade !== '') score += 15;
    if (p.nrc && p.nrc.trim() !== '') score += 15;
    if (p.experience_summary && p.experience_summary.trim() !== '') score += 15;
    if (p.previous_jobs && p.previous_jobs.length > 0) score += 10;
    return score;
  };

  const getEmployerCompletion = (p: Employer | null): number => {
    if (!p) return 20;
    let score = 0;
    if (p.company_name && p.company_name !== 'Anonymous Employer') score += 20;
    if (p.phone && p.phone !== 'Not provided' && p.phone.trim() !== '') score += 15;
    if (p.region && p.region !== '') score += 10;
    if (p.field_of_work && p.field_of_work !== 'unspecified' && p.field_of_work !== '') score += 15;
    if (p.tpin && p.tpin.trim() !== '') score += 20;
    if (p.contact_person && p.contact_person.trim() !== '') score += 20;
    return score;
  };
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [loading, setLoading] = useState(true);
  const [needsTermsAcceptance, setNeedsTermsAcceptance] = useState(false);
  const [showConfigPrompt, setShowConfigPrompt] = useState(false);

  // Lists fetched from DB
  const [seekers, setSeekers] = useState<Seeker[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');

  // Edit State (for Seeker to update availability etc.)
  const [mySeekerProfile, setMySeekerProfile] = useState<Seeker | null>(null);
  const [myEmployerProfile, setMyEmployerProfile] = useState<Employer | null>(null);
  const [availability, setAvailability] = useState<'available' | 'placed' | 'not_looking'>('available');
  const [isEditing, setIsEditing] = useState(false);
  const [profileCardCollapsed, setProfileCardCollapsed] = useState(true);
  
  // Edit Form Fields
  const [editNameOrCompany, setEditNameOrCompany] = useState('');
  const [editTradeOrField, setEditTradeOrField] = useState('');
  const [editTradeCategory, setEditTradeCategory] = useState('');
  const [editTradeSpecialisation, setEditTradeSpecialisation] = useState('');
  const [editTradeAssessment, setEditTradeAssessment] = useState<Record<string, string>>({});
  const [editRegion, setEditRegion] = useState('Lusaka');
  const [editPhone, setEditPhone] = useState('');
  const [editAvailabilityOrContact, setEditAvailabilityOrContact] = useState('');

  // Seeker Premium Fields for Edit Mode
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editNrc, setEditNrc] = useState('');
  const [editNapsa, setEditNapsa] = useState('');
  const [editTpin, setEditTpin] = useState('');
  const [editCertifications, setEditCertifications] = useState<string[]>([]);
  const [editCertificationInput, setEditCertificationInput] = useState('');
  const [editExperienceSummary, setEditExperienceSummary] = useState('');
  const [editPreviousJobs, setEditPreviousJobs] = useState<{ company: string; role: string; duration: string }[]>([]);

  // Temporary inputs inside dashboard edit form
  const [editTempCompany, setEditTempCompany] = useState('');
  const [editTempRole, setEditTempRole] = useState('');
  const [editTempDuration, setEditTempDuration] = useState('');

  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [certSearch, setCertSearch] = useState('');
  const [tradeDropdownFilter, setTradeDropdownFilter] = useState('all');
  const [hasExperienceFilter, setHasExperienceFilter] = useState(false);

  // Mobile card compact expansion & pagination states
  const [visibleSeekerCount, setVisibleSeekerCount] = useState<number>(5);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVisibleSeekerCount(5);
  }, [searchQuery, tradeDropdownFilter, regionFilter, availabilityFilter, certSearch, hasExperienceFilter]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [editCertFiles, setEditCertFiles] = useState<{ file: File; label: string }[]>([]);
  const [certLabel, setCertLabel] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Validation State for Dashboard Edit Profile
  const [dashboardNameError, setDashboardNameError] = useState('');
  const [dashboardContactError, setDashboardContactError] = useState('');
  const [dashboardPhoneError, setDashboardPhoneError] = useState('');
  const [dashboardNrcError, setDashboardNrcError] = useState('');
  const [dashboardNapsaError, setDashboardNapsaError] = useState('');
  const [dashboardTpinError, setDashboardTpinError] = useState('');

  const validateDashboardName = (val: string): boolean => {
    if (role === 'seeker') {
      const error = val.trim().length >= 2 && /[a-zA-Z]/.test(val) ? '' : 'Please enter a valid full name.';
      setDashboardNameError(error);
      return !error;
    } else {
      const error = val.trim().length >= 2 && /[a-zA-Z]/.test(val) ? '' : 'Please enter a valid company name.';
      setDashboardNameError(error);
      return !error;
    }
  };

  const validateDashboardContact = (val: string): boolean => {
    if (role === 'employer') {
      const error = val.trim().length >= 2 && /[a-zA-Z]/.test(val) ? '' : 'Please enter a valid contact person name.';
      setDashboardContactError(error);
      return !error;
    }
    return true;
  };

  const validateDashboardPhone = (val: string): boolean => {
    const cleaned = val.replace(/\s+/g, '');
    const error = /^(0\d{9}|\+260\d{9})$/.test(cleaned) ? '' : 'Enter a valid Zambian number e.g. 0961234567';
    setDashboardPhoneError(error);
    return !error;
  };

  const validateDashboardNrc = (val: string): boolean => {
    if (role === 'seeker') {
      const error = !val.trim() || /^\d{6}\/\d{2}\/\d{1}$/.test(val) ? '' : 'NRC format must be 123456/11/1';
      setDashboardNrcError(error);
      return !error;
    }
    return true;
  };

  const validateDashboardNapsa = (val: string): boolean => {
    if (role === 'seeker') {
      const error = !val.trim() || /^\d+$/.test(val) ? '' : 'NAPSA must be digits only';
      setDashboardNapsaError(error);
      return !error;
    }
    return true;
  };

  const validateDashboardTpin = (val: string): boolean => {
    if (role === 'employer') {
      const error = !val.trim() || /^\d{10}$/.test(val) ? '' : 'TPIN must be exactly 10 digits';
      setDashboardTpinError(error);
      return !error;
    }
    return true;
  };

  useEffect(() => {
    if (!isEditing) {
      setDashboardNameError('');
      setDashboardContactError('');
      setDashboardPhoneError('');
      setDashboardNrcError('');
      setDashboardNapsaError('');
      setDashboardTpinError('');
    }
  }, [isEditing]);

  const handleDashboardAddCert = (e: React.MouseEvent) => {
    e.preventDefault();
    if (editCertificationInput.trim() && !editCertifications.includes(editCertificationInput.trim())) {
      setEditCertifications([...editCertifications, editCertificationInput.trim()]);
      setEditCertificationInput('');
    }
  };

  const handleDashboardRemoveCert = (index: number) => {
    setEditCertifications(editCertifications.filter((_, idx) => idx !== index));
  };

  const handleDashboardAddJob = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editTempCompany.trim() && editTempRole.trim() && editTempDuration.trim()) {
      setEditPreviousJobs(prev => [
        ...prev,
        {
          company: editTempCompany.trim(),
          role: editTempRole.trim(),
          duration: editTempDuration.trim()
        }
      ]);
      setEditTempCompany('');
      setEditTempRole('');
      setEditTempDuration('');
    }
  };

  const handleDashboardRemoveJob = (index: number) => {
    setEditPreviousJobs(editPreviousJobs.filter((_, idx) => idx !== index));
  };

  const handleEditPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'Photo must be under 2MB.', type: 'error' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleEditLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'Logo must be under 2MB.', type: 'error' });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleEditCertFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const existing = mySeekerProfile?.certificate_urls?.length || 0;
    const remaining = 5 - existing - editCertFiles.length;
    if (remaining <= 0) {
      setMessage({ text: 'Maximum 5 certificate files allowed.', type: 'error' });
      return;
    }
    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      setMessage({ text: 'Each certificate must be under 5MB.', type: 'error' });
      return;
    }
    setEditCertFiles(prev => [
      ...prev,
      ...toAdd.map(f => ({ file: f, label: certLabel }))
    ]);
    setCertLabel('');
  };

  const handleRemoveEditCertFile = (index: number) => {
    setEditCertFiles(prev => prev.filter((_, i) => i !== index));
  };

  const [requestSent, setRequestSent] = useState<{ [seekerId: string]: boolean }>({});
  const [requestLoading, setRequestLoading] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  // Report Modal States
  const [reportModalData, setReportModalData] = useState<{ reported_user_id: string; reported_user_name: string; } | null>(null);
  const [reportType, setReportType] = useState<string>('Fraudulent profile');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportSuccessText, setReportSuccessText] = useState<string>('');
  const [reportErrorText, setReportErrorText] = useState<string>('');

  const handleOpenReportModal = (reportedUserId: string, reportedUserName: string) => {
    setReportModalData({ reported_user_id: reportedUserId, reported_user_name: reportedUserName });
    setReportType('Fraudulent profile');
    setReportDetails('');
    setReportSuccessText('');
    setReportErrorText('');
  };

  const handleSubmitReport = async () => {
    if (!user?.id) {
      setReportErrorText('You must be logged in to file a report.');
      return;
    }
    if (reportDetails.trim().length < 20) {
      setReportErrorText('Please provide more details (at least 20 characters).');
      return;
    }

    setReportSubmitting(true);
    setReportErrorText('');
    try {
      const { error } = await dbClient.submitReport({
        reporter_id: user.id,
        reported_user_id: reportModalData!.reported_user_id,
        report_type: reportType,
        details: reportDetails
      });
      if (error) {
        setReportErrorText(error.message || 'Failed to submit report. Please try again.');
      } else {
        setReportSuccessText('Report submitted. ALFS will review within 2 business days.');
        setReportDetails('');
      }
    } catch (err: any) {
      setReportErrorText(err.message || 'An unexpected error occurred.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const [introRequestSent, setIntroRequestSent] = useState<{ [employerId: string]: boolean }>({});
  const [introRequestLoading, setIntroRequestLoading] = useState<string | null>(null);
  const [myApplications, setMyApplications] = useState<WorkerRequest[]>([]);
  const [myEmployerRequests, setMyEmployerRequests] = useState<WorkerRequest[]>([]);

  const [contractModalSeeker, setContractModalSeeker] = useState<Seeker | null>(null);
  const [contractPosition, setContractPosition] = useState('');
  const [contractWage, setContractWage] = useState('');
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractDuration, setContractDuration] = useState('');
  const [contractLocation, setContractLocation] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });

  const getSeenRequestStates = (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(`alfs_seen_requests_${user?.id}`) || '{}');
    } catch {
      return {};
    }
  };

  const markRequestsAsSeen = (requests: WorkerRequest[]) => {
    if (!user?.id) return;
    const seen: Record<string, string> = {};
    requests.forEach(r => { seen[r.id] = r.status; });
    localStorage.setItem(`alfs_seen_requests_${user?.id}`, JSON.stringify(seen));
  };

  const isRequestNew = (request: WorkerRequest, seenStates: Record<string, string>): boolean => {
    const seenStatus = seenStates[request.id];
    return seenStatus === undefined || seenStatus !== request.status;
  };

  const seenStates = getSeenRequestStates();

  useEffect(() => {
    if (!user?.id) return;
    if (myApplications.length === 0 && myEmployerRequests.length === 0) return;

    const timer = setTimeout(() => {
      markRequestsAsSeen([...myApplications, ...myEmployerRequests]);
    }, 3000);

    return () => clearTimeout(timer);
  }, [myApplications, myEmployerRequests, user?.id]);

  useEffect(() => {
    // If Supabase is unconfigured and sandbox is off, show configuration guide
    if (!isSupabasePropertiesLoaded() && !isSandboxActive()) {
      setShowConfigPrompt(true);
      setLoading(false);
      return;
    }

    async function loadData() {
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
        const adminEmailRaw = import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || 'admin@alfslimited.com';
        const ADMIN_EMAILS = adminEmailRaw
          .split(',')
          .map((e: string) => e.trim().toLowerCase());

        if (ADMIN_EMAILS.includes(userEmail)) {
          navigate('/admin');
          return;
        }

        setUser(user);

        const userRole = user.user_metadata?.role || 'seeker';
        setRole(userRole);

        // Load the session user's specific record
        if (userRole === 'seeker') {
          const { data } = await dbClient.getSeekers({ userId: user.id });
          let profile = data && data[0];

          if (!profile) {
            // Automatically initialize a minimal profile for the seeker
            const { error: initError } = await supabase.from('alfs_labour_seekers').insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || 'Anonymous Seeker',
              phone: 'Not provided',
              email: user.email || '',
              trade: 'unspecified',
              region: 'Lusaka',
              availability: 'Full-Time',
              status: 'active',
              auth_user_id: user.id
            });
            if (!initError) {
              const { data: refetched } = await dbClient.getSeekers({ userId: user.id });
              profile = refetched && refetched[0];
            }
          }

          if (profile) {
            setMySeekerProfile(profile);
            setAvailability(profile.availability_status || 'available');
            if (!profile.terms_accepted_at || profile.terms_version !== 'v1') {
              setNeedsTermsAcceptance(true);
            }
            setEditNameOrCompany(profile.full_name);
            setEditTradeOrField(profile.trade);
            setEditRegion(profile.region);
            setEditPhone(profile.phone);
            setEditAvailabilityOrContact(profile.availability);
            setEditPhotoUrl(profile.photo_url || '');
            setEditNrc(profile.nrc || '');
            setEditNapsa(profile.napsa_number || '');
            setEditCertifications(profile.certifications || []);
            setEditExperienceSummary(profile.experience_summary || '');
            setEditPreviousJobs(profile.previous_jobs || []);
          } else {
            // Fallback
            const fallbackProfile: Seeker = {
              id: user.id,
              full_name: user.user_metadata?.full_name || 'Anonymous Seeker',
              trade: 'unspecified',
              region: 'Lusaka',
              availability: 'Full-Time',
              phone: 'Not provided',
              status: 'active',
              created_at: new Date().toISOString()
            };
            setMySeekerProfile(fallbackProfile);
            setAvailability('available');
            setEditNameOrCompany(fallbackProfile.full_name);
            setEditTradeOrField(fallbackProfile.trade);
            setEditRegion(fallbackProfile.region);
            setEditPhone(fallbackProfile.phone);
            setEditAvailabilityOrContact(fallbackProfile.availability);
          }

          // Fetch other active employers
          const { data: employersData } = await dbClient.getEmployers({ status: 'active' });
          if (employersData) setEmployers(employersData);

          const { data: myRequestsData } = await dbClient.getRequests({ workerId: user.id });
          if (myRequestsData) {
            setMyApplications(myRequestsData);
            const mapping: { [employerId: string]: boolean } = {};
            myRequestsData.forEach(r => {
              if (r.direction === 'worker_to_employer' && r.employer_id) {
                mapping[r.employer_id] = true;
              }
            });
            setIntroRequestSent(mapping);
          }

        } else if (userRole === 'employer') {
          const { data } = await dbClient.getEmployers({ userId: user.id });
          let profile = data && data[0];

          if (!profile) {
            // Automatically initialize a minimal profile for the employer
            const { error: initError } = await supabase.from('alfs_labour_employers').insert({
              id: user.id,
              company_name: user.user_metadata?.full_name || 'Anonymous Employer',
              field_of_work: 'unspecified',
              region: 'Lusaka',
              contact_person: user.user_metadata?.full_name || 'Anonymous Employer',
              phone: 'Not provided',
              email: user.email || '',
              status: 'active'
            });
            if (!initError) {
              const { data: refetched } = await dbClient.getEmployers({ userId: user.id });
              profile = refetched && refetched[0];
            }
          }

          if (profile) {
            setMyEmployerProfile(profile);
            if (!profile.terms_accepted_at || profile.terms_version !== 'v1') {
              setNeedsTermsAcceptance(true);
            }
            setEditNameOrCompany(profile.company_name);
            setEditTradeOrField(profile.field_of_work);
            setEditRegion(profile.region);
            setEditPhone(profile.phone);
            setEditAvailabilityOrContact(profile.contact_person);
            setEditTpin(profile.tpin || '');
          } else {
            // Fallback
            const fallbackProfile: Employer = {
              id: user.id,
              company_name: user.user_metadata?.full_name || 'Anonymous Employer',
              field_of_work: 'unspecified',
              region: 'Lusaka',
              contact_person: user.user_metadata?.full_name || 'Anonymous Employer',
              phone: 'Not provided',
              status: 'active',
              created_at: new Date().toISOString()
            };
            setMyEmployerProfile(fallbackProfile);
            setEditNameOrCompany(fallbackProfile.company_name);
            setEditTradeOrField(fallbackProfile.field_of_work);
            setEditRegion(fallbackProfile.region);
            setEditPhone(fallbackProfile.phone);
            setEditAvailabilityOrContact(fallbackProfile.contact_person);
          }

          // Fetch active seekers
          const { data: seekersData } = await dbClient.getSeekers({ status: 'active' });
          if (seekersData) setSeekers(seekersData);

          const { data: myEmpReqData } = await dbClient.getRequests({ employerId: user.id });
          if (myEmpReqData) setMyEmployerRequests(myEmpReqData);
        }

      } catch (err: any) {
        if (err.message?.toLowerCase().includes('failed to fetch')) {
          console.warn('Network connection failed / Failed to fetch (handled):', err);
          setShowConfigPrompt(true);
        } else {
          console.error('Error loading dashboard:', err);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const handleLogout = async () => {
    await dbClient.signOut();
    navigate('/labour');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);
    setMessage({ text: '', type: 'info' });

    // Validate fields format before save
    const isNameValid = validateDashboardName(editNameOrCompany);
    const isPhoneValid = validateDashboardPhone(editPhone);
    const isContactValid = role === 'employer' ? validateDashboardContact(editAvailabilityOrContact) : true;
    const isNrcValid = role === 'seeker' ? validateDashboardNrc(editNrc) : true;
    const isNapsaValid = role === 'seeker' ? validateDashboardNapsa(editNapsa) : true;
    const isTpinValid = role === 'employer' ? validateDashboardTpin(editTpin) : true;

    if (
      !isNameValid ||
      !isPhoneValid ||
      !isContactValid ||
      !isNrcValid ||
      !isNapsaValid ||
      !isTpinValid ||
      dashboardNameError ||
      dashboardPhoneError ||
      dashboardContactError ||
      dashboardNrcError ||
      dashboardNapsaError ||
      dashboardTpinError
    ) {
      setActionLoading(false);
      setMessage({ text: 'Please correct the validation errors in the form.', type: 'error' });
      return;
    }

    try {
      if (role === 'seeker') {
        setUploadingFiles(true);
        let updatedPhotoUrl = editPhotoUrl;
        let newCertUrls: { label: string; url: string }[] = (mySeekerProfile?.certificate_urls || []).map(item => {
          if (typeof item === 'string') {
            return { label: '', url: item };
          }
          return {
            label: item?.label || '',
            url: item?.url || ''
          };
        });

        if (photoFile) {
          const { url, error: uploadErr } = await dbClient.uploadPhoto(user.id, photoFile, 'photo');
          if (uploadErr) throw new Error(uploadErr.message);
          updatedPhotoUrl = url || editPhotoUrl;
        }

        for (const item of editCertFiles) {
          const { url, error: uploadErr } = await dbClient.uploadCertificate(user.id, item.file);
          if (uploadErr) throw new Error(uploadErr.message);
          if (url) {
            newCertUrls.push({
              label: item.label,
              url: url
            });
          }
        }
        setUploadingFiles(false);

        const { error } = await dbClient.updateSeeker(user.id, {
          full_name: editNameOrCompany,
          trade: editTradeOrField.toLowerCase(),
          region: editRegion,
          phone: editPhone,
          availability: editAvailabilityOrContact,
          photo_url: updatedPhotoUrl || undefined,
          nrc: editNrc || undefined,
          napsa_number: editNapsa || undefined,
          certifications: editCertifications,
          certificate_urls: newCertUrls.length > 0 ? newCertUrls : undefined,
          experience_summary: editExperienceSummary || undefined,
          previous_jobs: editPreviousJobs,
          trade_assessment: Object.keys(editTradeAssessment).length > 0 ? editTradeAssessment : undefined
        });

        if (error) throw error;
        
        setMySeekerProfile((prev: any) => ({
          ...prev,
          full_name: editNameOrCompany,
          trade: editTradeOrField.toLowerCase(),
          region: editRegion,
          phone: editPhone,
          availability: editAvailabilityOrContact,
          photo_url: updatedPhotoUrl,
          nrc: editNrc,
          napsa_number: editNapsa,
          certifications: editCertifications,
          certificate_urls: newCertUrls,
          experience_summary: editExperienceSummary,
          previous_jobs: editPreviousJobs
        }));

        setPhotoFile(null);
        setEditCertFiles([]);
      } else {
        setUploadingFiles(true);
        let updatedLogoUrl = myEmployerProfile?.logo_url || '';
        if (logoFile) {
          const { url, error: uploadErr } = await dbClient.uploadPhoto(user.id, logoFile, 'logo');
          if (uploadErr) throw new Error(uploadErr.message);
          updatedLogoUrl = url || updatedLogoUrl;
        }
        setUploadingFiles(false);

        const { error } = await dbClient.updateEmployer(user.id, {
          company_name: editNameOrCompany,
          field_of_work: editTradeOrField,
          region: editRegion,
          phone: editPhone,
          contact_person: editAvailabilityOrContact,
          logo_url: updatedLogoUrl || undefined,
          tpin: editTpin || undefined
        });

        if (error) throw error;

        setMyEmployerProfile((prev: any) => ({
          ...prev,
          company_name: editNameOrCompany,
          field_of_work: editTradeOrField,
          region: editRegion,
          phone: editPhone,
          contact_person: editAvailabilityOrContact,
          logo_url: updatedLogoUrl,
          tpin: editTpin
        }));

        setLogoFile(null);
      }

      setMessage({ text: 'Listing updated successfully.', type: 'success' });
      setIsEditing(false);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('failed to fetch')) {
        console.warn('Network / fetch error (handled):', err);
        setShowConfigPrompt(true);
      } else {
        console.error(err);
      }
      setMessage({ text: err.message || 'Error occurred while updating.', type: 'error' });
    } finally {
      setActionLoading(false);
      setUploadingFiles(false);
    }
  };

  const handleRefreshSeekers = async () => {
    setActionLoading(true);
    try {
      const { data } = await dbClient.getSeekers({ status: 'active' });
      if (data) setSeekers(data);
    } catch (err: any) {
      if (err.message?.toLowerCase().includes('failed to fetch')) {
        console.warn('Network / fetch error (handled):', err);
        setShowConfigPrompt(true);
      } else {
        console.error(err);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendRequest = async (seeker: Seeker) => {
    if (!user || !myEmployerProfile) return;
    setRequestLoading(seeker.id);
    try {
      const { error } = await dbClient.createRequest({
        employer_id: user.id,
        worker_id: seeker.id,
        company_name: myEmployerProfile.company_name,
        contact_person: myEmployerProfile.contact_person,
        phone: myEmployerProfile.phone,
        message: requestMessage || `${myEmployerProfile.company_name} is interested in your profile and would like to discuss a work opportunity.`,
        status: 'pending',
        direction: 'employer_to_worker',
        seeker_name: seeker.full_name,
        seeker_phone: seeker.phone
      });
      if (error) {
        if (error.message === 'A pending request already exists between this worker and employer.') {
          setMessage({ text: "You already have a pending request with this person — check your Requests tab.", type: 'error' });
          return;
        }
        throw error;
      }
      setRequestSent(prev => ({ ...prev, [seeker.id]: true }));
      setShowRequestModal(null);
      setRequestMessage('');
      setMessage({ text: `Request sent to ${seeker.full_name}.`, type: 'success' });
    } catch (err: any) {
      if (err.message === 'A pending request already exists between this worker and employer.') {
        setMessage({ text: "You already have a pending request with this person — check your Requests tab.", type: 'error' });
      } else {
        setMessage({ text: err.message || 'Failed to send request.', type: 'error' });
      }
    } finally {
      setRequestLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) {
      return;
    }
    try {
      const { error } = await dbClient.cancelRequest(requestId);
      if (error) {
        setMessage({ text: error.message || 'Failed to cancel request.', type: 'error' });
        return;
      }
      
      const cancelledApp = myApplications.find(r => r.id === requestId);
      if (cancelledApp && cancelledApp.direction === 'worker_to_employer' && cancelledApp.employer_id) {
        setIntroRequestSent(prev => {
          const updated = { ...prev };
          delete updated[cancelledApp.employer_id];
          return updated;
        });
      }

      const cancelledEmpReq = myEmployerRequests.find(r => r.id === requestId);
      if (cancelledEmpReq && cancelledEmpReq.direction === 'employer_to_worker' && cancelledEmpReq.worker_id) {
        setRequestSent(prev => {
          const updated = { ...prev };
          delete updated[cancelledEmpReq.worker_id];
          return updated;
        });
      }

      setMyApplications(prev => prev.filter(r => r.id !== requestId));
      setMyEmployerRequests(prev => prev.filter(r => r.id !== requestId));
      setMessage({ text: 'Request cancelled successfully.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to cancel request.', type: 'error' });
    }
  };

  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractModalSeeker) return;
    if (!contractPosition.trim() || !contractWage.trim() || !contractStartDate.trim() || !contractDuration.trim()) {
      setMessage({ text: 'Please fill in all contract fields.', type: 'error' });
      return;
    }

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

    const employerLogoUrl = myEmployerProfile?.logo_url;
    if (employerLogoUrl) {
      try {
        employerLogoData = await loadImageAsDataURL(employerLogoUrl);
      } catch { /* fall back to text-only company name if this fails */ }
    }

    try {
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

      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(192, 57, 43); // ALFS red
      doc.text("EMPLOYMENT CONTRACT", 105, 34 + offset, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Reset

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated via ALFS Labour Force Hub — ${new Date().toLocaleDateString()}`, 105, 41 + offset, { align: 'center' });

      // Add a horizontal rule
      doc.setLineWidth(0.5);
      doc.setDrawColor(192, 57, 43); // ALFS red
      doc.line(20, 46 + offset, 190, 46 + offset);
      doc.setDrawColor(0, 0, 0); // Reset

      let y = 56 + offset;

      const addSectionHeader = (title: string) => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(27, 42, 74); // ALFS navy
        doc.text(title, 20, y);
        doc.setTextColor(0, 0, 0); // Reset
        y += 6;
      };

      const addField = (label: string, value: string) => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(label + ":", 25, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 65, y);
        y += 7;
      };

      // SECTION A: EMPLOYER
      addSectionHeader("PARTY A: EMPLOYER");
      if (employerLogoData) {
        doc.addImage(employerLogoData, 'JPEG', 20, y, 20, 20);

        const addFieldSecA = (label: string, value: string, curY: number) => {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(label + ":", 45, curY);
          doc.setFont("helvetica", "normal");
          doc.text(value, 80, curY);
        };

        addFieldSecA("Company Name", myEmployerProfile?.company_name || 'N/A', y + 3);
        addFieldSecA("Representative", myEmployerProfile?.contact_person || 'N/A', y + 10);
        addFieldSecA("Contact Phone", myEmployerProfile?.phone || 'N/A', y + 17);

        y += 24;

        addField("Region", myEmployerProfile?.region ? `${myEmployerProfile.region} Province` : 'N/A');
      } else {
        addField("Company Name", myEmployerProfile?.company_name || 'N/A');
        addField("Representative", myEmployerProfile?.contact_person || 'N/A');
        addField("Contact Phone", myEmployerProfile?.phone || 'N/A');
        addField("Region", myEmployerProfile?.region ? `${myEmployerProfile.region} Province` : 'N/A');
      }

      y += 4; // Spacing

      // SECTION B: EMPLOYEE
      addSectionHeader("PARTY B: EMPLOYEE");
      addField("Employee Name", contractModalSeeker.full_name);
      addField("Primary Trade", contractModalSeeker.trade || 'N/A');
      if (contractModalSeeker.nrc) {
        addField("NRC Number", contractModalSeeker.nrc);
      }
      addField("Contact Phone", contractModalSeeker.phone);

      y += 4; // Spacing

      // SECTION C: TERMS OF ENGAGEMENT
      addSectionHeader("TERMS OF ENGAGEMENT");
      addField("Position / Role", contractPosition);
      addField("Wage / Salary", contractWage);
      addField("Start Date", contractStartDate);
      addField("Contract Duration", contractDuration);
      addField("Work Location", contractLocation || 'N/A');

      y += 4; // Spacing

      // NEW SECTION: ALFS LIABILITY DISCLAIMER
      addSectionHeader("ALFS LIABILITY DISCLAIMER");
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const disclaimerText = "ALFS — Achilles Labour-Force Services acts solely as an intermediary connecting Party A (Employer) and Party B (Employee). ALFS assumes no liability for the conduct, performance, workplace safety, payment, injury, disputes, or any other matter arising from the employment relationship established under this contract. All obligations herein are agreed directly and solely between Party A and Party B.";
      const disclaimerSplit = doc.splitTextToSize(disclaimerText, 170);
      doc.text(disclaimerSplit, 20, y);
      y += disclaimerSplit.length * 5 + 6;

      y += 4; // Spacing

      // Boilerplate Text Section
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const boilerplate = "This contract outlines the terms of engagement between the above parties. Both parties agree to act in good faith and in accordance with applicable Zambian labour laws. Any disputes should be raised with ALFS Labour Force administration.";
      const splitText = doc.splitTextToSize(boilerplate, 170);
      doc.text(splitText, 20, y);
      y += splitText.length * 5 + 15; // Gap before signatures

      // Signature lines
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Employer Signature: _____________________", 20, y);
      doc.text("Employee Signature: _____________________", 110, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.text("Date: _____________________", 20, y);
      doc.text("Date: _____________________", 110, y);

      const filename = `Contract_${contractModalSeeker.full_name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(filename);
      trackEvent('pdf_download', { document: 'contract' });

      setMessage({ text: 'Contract PDF downloaded. You can now send it via email.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to generate contract PDF.', type: 'error' });
    }
  };

  const handleRequestIntroduction = async (emp: Employer) => {
    if (!user || !mySeekerProfile) return;
    setIntroRequestLoading(emp.id);
    try {
      const { error } = await dbClient.createRequest({
        employer_id: emp.id,
        worker_id: user.id,
        company_name: emp.company_name,
        contact_person: emp.contact_person,
        phone: emp.phone,
        seeker_name: mySeekerProfile.full_name,
        seeker_phone: mySeekerProfile.phone,
        message: `${mySeekerProfile.full_name} (${mySeekerProfile.trade}) is interested in opportunities with ${emp.company_name}.`,
        status: 'pending',
        direction: 'worker_to_employer'
      });
      if (error) {
        if (error.message === 'A pending request already exists between this worker and employer.') {
          setMessage({ text: "You already have a pending request with this person — check your Requests tab.", type: 'error' });
          return;
        }
        throw error;
      }
      setIntroRequestSent(prev => ({ ...prev, [emp.id]: true }));
    } catch (err: any) {
      if (err.message === 'A pending request already exists between this worker and employer.') {
        setMessage({ text: "You already have a pending request with this person — check your Requests tab.", type: 'error' });
      } else {
        setMessage({ text: err.message || 'Failed to send request.', type: 'error' });
      }
    } finally {
      setIntroRequestLoading(null);
    }
  };

  const PROVINCES = [
    'Lusaka', 'Copperbelt', 'Central', 'Southern', 'Eastern', 
    'Western', 'Northern', 'North-Western', 'Luapula', 'Muchinga'
  ];

  const TRADE_CATEGORIES_FLAT = [
    'Civil Works', 'Structural Works', 'Plumbing Works', 'Electrical Works',
    'Mechanical Works', 'HVAC Works', 'Finishing Works', 'Plant & Equipment Operators',
    'Site Management & Professional Services', 'HSE & Quality', 'General Labour',
    'Civil Engineer', 'Structural Engineer', 'Electrical Engineer', 'Mechanical Engineer',
    'Welder', 'MIG Welder', 'TIG Welder', 'Pipe Welder', 'Structural Welder', 'Coded Welder',
    'Electrician', 'Industrial Electrician', 'Plumber', 'Pipe Fitter', 'Mechanical Fitter',
    'Millwright', 'Diesel Mechanic', 'Crane Operator', 'Forklift Operator', 'Excavator Operator',
    'Bulldozer Operator', 'Grader Operator', 'HSE Officer', 'QA/QC Inspector', 'Rigger',
    'Boilermaker', 'Steel Fixer', 'Carpenter', 'Bricklayer', 'Tiler', 'Painter',
    'Project Manager', 'Quantity Surveyor', 'Site Supervisor', 'Foreman', 'General Labourer',
    'SCADA Technician', 'Automation Technician', 'Instrument Technician', 'NDT Technician',
    'Truck Driver', 'Tipper Driver', 'Lowbed Driver', 'Heavy Equipment Operator',
  ];

  // Client side filters
  const filteredSeekers = seekers.filter(s => {
    const completion = getSeekerCompletion(s);
    if (completion < 50) return false;

    const matchesSearch = s.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === 'all' || s.region === regionFilter;
    const matchesAvailability = availabilityFilter === 'all' || s.availability === availabilityFilter;
    const matchesCert = certSearch.trim() === '' ||
      (s.certifications || []).some(c => c.toLowerCase().includes(certSearch.toLowerCase()));
    const matchesExperience = !hasExperienceFilter ||
      (s.previous_jobs && s.previous_jobs.length > 0);
    const matchesTradeDropdown = tradeDropdownFilter === 'all' ||
      s.trade.toLowerCase().includes(tradeDropdownFilter.toLowerCase());
    return matchesSearch && matchesRegion && matchesAvailability && matchesCert && matchesExperience && matchesTradeDropdown;
  });

  const filteredEmployers = employers.filter(emp => {
    const matchesSearch = emp.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          emp.field_of_work.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === 'all' || emp.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const handleDisableSandbox = () => {
    deactivateSandbox();
    window.location.reload();
  };

  if (showConfigPrompt && !isSandboxActive()) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex flex-col justify-center py-10">
        <SupabaseErrorPrompt 
          customMessage="Interactions inside the main registry portal dashboard require direct Supabase database configuration. Please update your VITE_SUPABASE_URL inside your credentials block or enter Sandbox Mode below."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-[#C0392B] mb-4" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B2A4A]">Securing portal session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF2F5] font-sans pb-10 md:pb-16 lg:pb-20 relative overflow-x-hidden">
      {/* Sandbox Mode Ribbon */}
      {isSandboxActive() && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-1.5 px-4 text-center text-[10px] font-black uppercase tracking-[0.2em] flex justify-center items-center gap-4 shadow-sm z-50">
          <span>RUNNING IN MEMORY SANDBOX MODE (OFFLINE DEMO)</span>
          <button 
            onClick={handleDisableSandbox}
            className="bg-black/20 hover:bg-black/40 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase transition-colors rounded"
          >
            Exit Sandbox & Retry Real URL
          </button>
        </div>
      )}
      {/* Top Professional Header */}
      <nav className="bg-[#1B2A4A] text-white py-3 sm:py-4 px-4 md:px-12 flex flex-wrap justify-between items-center gap-y-2 gap-x-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-bold text-white/70 hover:text-white uppercase tracking-wider mr-1 sm:mr-2 cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <Link to="/labour" className="text-xs sm:text-sm font-bold text-white/70 hover:text-white uppercase tracking-wider shrink-0">
            ALFS Labour Hub
          </Link>
          <span className="h-4 w-px bg-white/20 shrink-0" />
          <span className="text-[10px] font-black tracking-[0.15em] sm:tracking-[0.2em] bg-[#C0392B] text-white px-2 py-0.5 shrink-0">
            {role === 'seeker' ? 'EMPLOYEE ACCESS' : 'EMPLOYER ACCESS'}
          </span>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 ml-auto sm:ml-0">
          <span className="hidden sm:inline text-xs sm:text-sm font-mono text-white/70 truncate max-w-[200px] sm:max-w-none">
            User: <span className="lowercase">{user?.email}</span>
          </span>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white bg-white/5 border border-white/10 hover:bg-[#C0392B] hover:border-[#C0392B] px-3 sm:px-4 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[48px] transition-all cursor-pointer shrink-0 rounded-md"
            title="Exit Portal"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Exit Portal</span>
          </button>
        </div>
      </nav>

      <div className="w-full max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 md:px-10 lg:px-8 xl:px-10 2xl:px-12 py-6 md:py-8 min-h-screen bg-transparent">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-8 items-start">
          
          {/* LEFT COLUMN: ACTIVE PROFILE OVERVIEW */}
          <aside className="w-full md:max-w-2xl md:mx-auto lg:max-w-none lg:mx-0 lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
          {((role === 'seeker' && !mySeekerProfile?.nrc) || (role === 'employer' && !myEmployerProfile?.tpin)) && (
            <div id="incomplete-profile-banner" className="bg-amber-50 border-l-2 border-amber-400 p-4 text-xs text-amber-700 font-bold shadow-sm space-y-2 rounded-lg">
              <p>Your profile is incomplete. Finish your profile setup to make it more professional and stand out!</p>
              <button
                onClick={() => navigate('/labour/profile-setup')}
                className="bg-[#1B2A4A] hover:bg-[#C0392B] text-white px-3 py-1.5 font-bold uppercase tracking-wider transition-colors cursor-pointer rounded-md"
              >
                Complete Your Profile
              </button>
            </div>
          )}
          
          <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 shadow-sm rounded-lg">
            {/* Mobile collapse toggle */}
            <button
              type="button"
              onClick={() => setProfileCardCollapsed(prev => !prev)}
              className="flex lg:hidden w-full items-center justify-between text-[11px] font-bold uppercase tracking-widest text-[#1B2A4A]/60 mb-2 pb-1.5 border-b border-slate-100"
            >
              <span>{profileCardCollapsed ? 'Show Profile Info' : 'Hide Profile Info'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${profileCardCollapsed ? '' : 'rotate-180'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
            </button>

            <div className={`${profileCardCollapsed ? 'hidden' : 'block'} lg:block`}>
              <span className="text-[10px] font-mono tracking-widest text-white bg-[#1B2A4A] px-2 py-0.5 uppercase">
                STATUS ACTIVE
              </span>
              <div className="mt-3 flex items-center gap-3 border-b border-[#131b2c]/10 pb-3">
              <div className="h-10 w-10 bg-[#1B2A4A]/5 border border-[#1b2a4a]/20 flex items-center justify-center text-[#1B2A4A] overflow-hidden shrink-0">
                {role === 'seeker' ? (
                  mySeekerProfile?.photo_url ? (
                    <img src={mySeekerProfile.photo_url} alt="Profile avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={20} />
                  )
                ) : myEmployerProfile?.logo_url ? (
                  <img src={myEmployerProfile.logo_url} alt="Company logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Building2 size={20} />
                )}
              </div>
              <div>
                <h3 className="font-sans font-black text-base uppercase tracking-tight text-[#0A0A0A]">
                  {role === 'seeker' ? mySeekerProfile?.full_name : myEmployerProfile?.company_name}
                </h3>
                <p className="text-xs text-[#1B2A4A]/60 font-semibold uppercase tracking-wider">
                  {role === 'seeker' ? mySeekerProfile?.trade : myEmployerProfile?.field_of_work}
                </p>
              </div>
            </div>

            {/* Profile specifications */}
            <div className="py-3 space-y-2.5 border-b border-[#131b2c]/10 pb-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px]">Region</span>
                <span className="font-bold text-[#1B2A4A] flex items-center gap-1">
                  <MapPin size={12} className="text-[#C0392B]" />
                  {role === 'seeker' ? mySeekerProfile?.region : myEmployerProfile?.region} Province
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px]">
                  {role === 'seeker' ? 'Availability' : 'Contact Person'}
                </span>
                <span className="font-bold text-white bg-[#C0392B] px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full">
                  {role === 'seeker' ? mySeekerProfile?.availability : myEmployerProfile?.contact_person}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px]">Phone Line</span>
                <span className="font-bold text-[#1B2A4A]">{role === 'seeker' ? mySeekerProfile?.phone : myEmployerProfile?.phone}</span>
              </div>
              {role === 'seeker' && mySeekerProfile?.nrc && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px]">NRC ID</span>
                  <span className="font-bold text-[#1B2A4A] uppercase bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono">{mySeekerProfile.nrc}</span>
                </div>
              )}
              {role === 'seeker' && mySeekerProfile?.napsa_number && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px]">NAPSA Number</span>
                  <span className="font-bold text-[#1B2A4A] uppercase bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono">{mySeekerProfile.napsa_number}</span>
                </div>
              )}
              {role === 'employer' && myEmployerProfile?.tpin && (
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px]">TPIN</span>
                  <span className="font-bold text-[#1B2A4A] uppercase bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono">{myEmployerProfile.tpin}</span>
                </div>
              )}
              {role === 'seeker' && (
                <div className="pt-2.5 border-t border-[#131b2c]/10 space-y-1.5">
                  <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">
                    Availability Status
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      { value: 'available', label: 'Available' },
                      { value: 'placed', label: 'Placed' },
                      { value: 'not_looking', label: 'Not Looking' }
                    ] as const).map(option => {
                      const isActive = availability === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={async () => {
                            const newValue = option.value;
                            if (isSandboxActive()) {
                              const list = JSON.parse(localStorage.getItem('alfs_sb_seekers') || '[]');
                              const index = list.findIndex((s: any) => s.id === user?.id);
                              if (index >= 0) {
                                list[index].availability_status = newValue;
                                localStorage.setItem('alfs_sb_seekers', JSON.stringify(list));
                              }
                            }
                            await supabase.from('alfs_labour_seekers').update({ availability_status: newValue }).eq('id', user?.id);
                            setAvailability(newValue);
                            setMySeekerProfile(prev => prev ? { ...prev, availability_status: newValue } : null);
                          }}
                          className={`text-[9px] font-bold uppercase tracking-wider py-1.5 px-0.5 text-center border transition-all cursor-pointer rounded-md ${
                            isActive
                              ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                              : 'border-[#1B2A4A]/30 text-[#1B2A4A]/60 hover:border-[#1B2A4A]'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Contact ALFS Section */}
            <div className="py-3 border-b border-[#131b2c]/10 space-y-2">
              <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block">
                Need Help? Contact ALFS
              </span>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                {role === 'seeker' 
                  ? "Have questions about a company or job opportunity? Reach out to ALFS directly." 
                  : "Need help with an employee request, contract, or job listing? Reach out to ALFS directly."}
              </p>
              <div className="flex gap-2 pt-0.5">
                <a
                  href={`mailto:admin@alfslimited.com?subject=${encodeURIComponent(role === 'seeker' ? 'Job Enquiry' : 'Employer Enquiry')}`}
                  className="flex-1 bg-[#1B2A4A] hover:bg-[#C0392B] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-2 flex items-center justify-center gap-1 min-h-[38px] transition-all rounded-md"
                >
                  <Mail size={14} />
                  <span>Email ALFS</span>
                </a>
                <a
                  href={`https://wa.me/260962334797?text=${encodeURIComponent(role === 'seeker' ? "Hi ALFS, I'd like to ask about a job opportunity." : "Hi ALFS, I'd like assistance with an employee request.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-2 flex items-center justify-center gap-1 min-h-[38px] transition-all rounded-md"
                >
                  <MessageSquare size={14} />
                  <span>WhatsApp ALFS</span>
                </a>
              </div>
            </div>

            {/* Extra seeker info nested dynamically inside active profile overview */}
            {role === 'seeker' && (
              <div className="py-2.5 space-y-4 text-xs font-sans">
                {mySeekerProfile?.experience_summary && (
                  <div>
                    <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-1">Professional Summary</span>
                    <p className="text-[#0A0A0A]/80 leading-relaxed font-semibold">{mySeekerProfile.experience_summary}</p>
                  </div>
                )}

                {mySeekerProfile?.certifications && mySeekerProfile.certifications.length > 0 && (
                  <div>
                    <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-1.5">Verified Certifications</span>
                    <div className="flex flex-wrap gap-1">
                      {mySeekerProfile.certifications.map((cert, idx) => (
                        <span key={idx} className="bg-slate-100 text-[#1B2A4A] border border-slate-200 px-2 py-0.5 font-bold uppercase text-[9px] tracking-wide rounded-full">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {mySeekerProfile?.previous_jobs && mySeekerProfile.previous_jobs.length > 0 && (
                  <div>
                    <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-1.5">Employment Timeline</span>
                    <div className="space-y-2 pl-2 border-l border-slate-200">
                      {mySeekerProfile.previous_jobs.map((job, idx) => (
                        <div key={idx} className="relative pl-2.5 py-0.5">
                          <div className="absolute top-2 -left-[12.5px] h-1.5 w-1.5 rounded-full bg-[#C0392B]" />
                          <strong className="block text-[#0A0A0A] font-extrabold uppercase text-[10px]">{job.company}</strong>
                          <span className="text-[#1B2A4A]/60 font-semibold">{job.role} ({job.duration})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {myApplications.length > 0 && (
                  <div>
                    <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-1.5">My Applications</span>
                    <div className="space-y-2">
                      {myApplications.map((app) => {
                        const isNew = isRequestNew(app, seenStates);
                        const isOriginalSender = app.direction === 'worker_to_employer';
                        const showCancel = isOriginalSender && app.status === 'pending';
                        return (
                          <div key={app.id} className={`flex justify-between items-center border border-slate-200/60 p-2.5 ${isNew ? 'bg-amber-50/50' : 'bg-slate-50'}`}>
                            <div className="space-y-0.5">
                              <strong className="block text-[#0A0A0A] font-extrabold uppercase text-[10px] tracking-wide leading-tight">
                                {app.company_name}
                              </strong>
                              <span className="text-[9px] text-[#1B2A4A]/50 font-semibold font-mono block">
                                {new Date(app.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <span className={`text-[10px] font-black uppercase border tracking-wider px-2 py-0.5 whitespace-nowrap ${
                                app.status === 'pending'
                                  ? 'bg-[#FFFBEB] text-amber-700 border-amber-200'
                                  : app.status === 'approved'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {app.status}
                              </span>
                              {isNew && (
                                <span className="bg-[#C0392B] text-white text-[8px] font-black uppercase px-1.5 py-0.5 ml-1.5">
                                  NEW
                                </span>
                              )}
                              {showCancel && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelRequest(app.id);
                                  }}
                                  className="ml-2 px-2 py-0.5 border border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-[10px] font-black uppercase tracking-wider transition-all rounded cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {role === 'employer' && myEmployerRequests.length > 0 && (
              <div className="py-2.5 space-y-4 text-xs font-sans border-t border-[#131b2c]/10 mt-4 pt-4">
                <div>
                  <span className="font-mono text-[#1B2A4A]/40 uppercase tracking-widest text-[10px] block mb-1.5">My Requests</span>
                  <div className="space-y-2">
                    {myEmployerRequests.map((request) => {
                      const isNew = isRequestNew(request, seenStates);
                      const isOriginalSender = request.direction === 'employer_to_worker';
                      const showCancel = isOriginalSender && request.status === 'pending';
                      return (
                        <div key={request.id} className={`flex justify-between items-center border border-slate-200/60 p-2.5 ${isNew ? 'bg-amber-50/50' : 'bg-slate-50'}`}>
                          <div className="space-y-0.5">
                            <strong className="block text-[#0A0A0A] font-extrabold uppercase text-[10px] tracking-wide leading-tight">
                              {request.seeker_name || 'Unknown Employee'}
                            </strong>
                            <span className="text-[9px] text-[#1B2A4A]/50 font-semibold font-mono block">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className={`text-[10px] font-black uppercase border tracking-wider px-2 py-0.5 whitespace-nowrap ${
                              request.status === 'pending'
                                ? 'bg-[#FFFBEB] text-amber-700 border-amber-200'
                                : request.status === 'approved'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {request.status}
                            </span>
                            {isNew && (
                              <span className="bg-[#C0392B] text-white text-[8px] font-black uppercase px-1.5 py-0.5 ml-1.5">
                                  NEW
                              </span>
                            )}
                            {showCancel && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelRequest(request.id);
                                }}
                                className="ml-2 px-2 py-0.5 border border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 text-[10px] font-black uppercase tracking-wider transition-all rounded cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons inside card */}
            <div className="mt-3 pt-3 border-t border-[#1b2a4a]/10">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full bg-[#1B2A4A] text-white py-2.5 px-3 font-black uppercase tracking-wider text-xs hover:bg-[#C0392B] transition-all flex justify-center items-center gap-1 min-h-[40px] rounded-md"
              >
                <RefreshCcw size={14} />
                <span>{isEditing ? 'Cancel Edit' : 'Edit My Listing'}</span>
              </button>
            </div>
            </div>
          </div>

          {/* EDIT FORM (Hidden by default) */}
          {isEditing && (
            <div className="lg:col-span-3 w-full">
              <form onSubmit={handleUpdateProfile} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
              <h4 className="font-sans font-black uppercase text-sm tracking-wider text-[#C0392B] border-b border-[#C0392B]/10 pb-2">
                Edit Listing Info
              </h4>
              
              <div>
                <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">
                  {role === 'seeker' ? 'Full Name' : 'Company Name'}
                </label>
                <input
                  type="text"
                  required
                  value={editNameOrCompany}
                  onChange={(e) => {
                    setEditNameOrCompany(e.target.value);
                    if (dashboardNameError) validateDashboardName(e.target.value);
                  }}
                  onBlur={() => validateDashboardName(editNameOrCompany)}
                  className="w-full text-sm font-semibold p-3 border border-slate-200 uppercase tracking-wider bg-white text-[#0A0A0A] min-h-[48px]"
                />
                {dashboardNameError && <p className="text-xs text-[#C0392B] font-bold mt-1">{dashboardNameError}</p>}
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">
                  {role === 'seeker' ? 'Trade / Skill Role' : 'Industry Sector'}
                </label>
                {role === 'seeker' ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <select
                        required
                        value={editTradeCategory}
                        onChange={(e) => { setEditTradeCategory(e.target.value); setEditTradeSpecialisation(''); setEditTradeOrField(e.target.value); }}
                        className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/20 focus:border-[#1a2e4a] transition-all"
                      >
                        <option value="">Select trade category...</option>
                        {Object.keys(ZAMBIAN_TRADES).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#1B2A4A]"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                    </div>
                    {editTradeCategory && (
                      <div className="relative">
                        <select
                          required
                          value={editTradeSpecialisation}
                          onChange={(e) => { setEditTradeSpecialisation(e.target.value); setEditTradeOrField(e.target.value); }}
                          className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#1a2e4a]/20 focus:border-[#1a2e4a] transition-all"
                        >
                          <option value="">Select specialisation...</option>
                          {ZAMBIAN_TRADES[editTradeCategory].map((spec) => (<option key={spec} value={spec}>{spec}</option>))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#1B2A4A]"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input type="text" required value={editTradeOrField} onChange={(e) => setEditTradeOrField(e.target.value)} className="w-full text-sm font-semibold p-3 border border-slate-200 uppercase tracking-wider bg-white text-[#0A0A0A] min-h-[48px]" />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">Region</label>
                  <select
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    className="w-full text-sm font-bold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px]"
                  >
                    {PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">
                    {role === 'seeker' ? 'Availability' : 'Contact Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editAvailabilityOrContact}
                    onChange={(e) => {
                      setEditAvailabilityOrContact(e.target.value);
                      if (dashboardContactError) validateDashboardContact(e.target.value);
                    }}
                    onBlur={() => validateDashboardContact(editAvailabilityOrContact)}
                    className="w-full text-sm font-bold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px]"
                  />
                  {role === 'employer' && dashboardContactError && <p className="text-xs text-[#C0392B] font-bold mt-1">{dashboardContactError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  maxLength={14}
                  value={editPhone}
                  onChange={(e) => {
                    setEditPhone(e.target.value);
                    setDashboardPhoneError('');
                  }}
                  onBlur={() => validateDashboardPhone(editPhone)}
                  className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px]"
                />
                {dashboardPhoneError && (
                  <p className="text-[10px] font-bold text-red-500 mt-0.5">{dashboardPhoneError}</p>
                )}
              </div>

              {role === 'employer' && (
                <div>
                  <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">TPIN (Taxpayer Identification Number)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={editTpin}
                    onChange={(e) => {
                      setEditTpin(e.target.value);
                      setDashboardTpinError('');
                    }}
                    onBlur={() => validateDashboardTpin(editTpin)}
                    placeholder="e.g. 1234567890"
                    className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px]"
                  />
                  {dashboardTpinError && (
                    <p className="text-[10px] font-bold text-red-500 mt-0.5">{dashboardTpinError}</p>
                  )}
                </div>
              )}

              {role === 'employer' && (
                <div className="p-3 bg-slate-50 border-l-2 border-[#1B2A4A] space-y-2">
                  <label className="block text-xs font-black uppercase text-[#1B2A4A]">Company Logo</label>
                  <div className="flex gap-3 items-center">
                    <div className="h-12 w-12 shrink-0 bg-white border border-[#1B2A4A] overflow-hidden flex items-center justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : myEmployerProfile?.logo_url ? (
                        <img src={myEmployerProfile.logo_url} alt="Current" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 size={20} className="text-[#1B2A4A]/40" />
                      )}
                    </div>
                    <div className="grow space-y-1">
                      <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#C0392B] text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 inline-block transition-all">
                        {logoFile ? 'Change Logo' : 'Upload Logo'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditLogoSelect} className="hidden" />
                      </label>
                      <p className="text-[10px] text-slate-400">JPG, PNG, WEBP — max 2MB</p>
                      {logoFile && <p className="text-[10px] text-green-600 font-bold truncate max-w-[160px]">{logoFile.name}</p>}
                    </div>
                  </div>
                </div>
              )}

              {role === 'seeker' && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h5 className="text-xs font-black uppercase text-[#C0392B] tracking-wider">Premium Profile Parameters</h5>
                  
                  {/* NRC field */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">NRC Number</label>
                    <input
                      type="text"
                      maxLength={11}
                      value={editNrc}
                      onChange={(e) => {
                        setEditNrc(e.target.value);
                        setDashboardNrcError('');
                      }}
                      onBlur={() => validateDashboardNrc(editNrc)}
                      placeholder="e.g. 111111/11/1"
                      className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px]"
                    />
                    {dashboardNrcError && (
                      <p className="text-[10px] font-bold text-red-500 mt-0.5">{dashboardNrcError}</p>
                    )}
                  </div>

                  {/* NAPSA field */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">NAPSA Number (Optional)</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={editNapsa}
                      onChange={(e) => {
                        setEditNapsa(e.target.value);
                        setDashboardNapsaError('');
                      }}
                      onBlur={() => validateDashboardNapsa(editNapsa)}
                      placeholder="e.g. 123456789012345"
                      className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A] min-h-[48px]"
                    />
                    {dashboardNapsaError && (
                      <p className="text-[10px] font-bold text-red-500 mt-0.5">{dashboardNapsaError}</p>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-l-2 border-[#1B2A4A] space-y-2">
                    <label className="block text-xs font-black uppercase text-[#1B2A4A]">Profile Photo</label>
                    <div className="flex gap-3 items-center">
                      <div className="h-12 w-12 shrink-0 bg-white border border-[#1B2A4A] overflow-hidden flex items-center justify-center">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                        ) : editPhotoUrl ? (
                          <img src={editPhotoUrl} alt="Current" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={20} className="text-[#1B2A4A]/40" />
                        )}
                      </div>
                      <div className="grow space-y-1">
                        <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#C0392B] text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 inline-block transition-all">
                          {photoFile ? 'Change Photo' : 'Upload Photo'}
                          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEditPhotoSelect} className="hidden" />
                        </label>
                        <p className="text-[10px] text-slate-400">JPG, PNG, WEBP — max 2MB</p>
                        {photoFile && <p className="text-[10px] text-green-600 font-bold truncate max-w-[160px]">{photoFile.name}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#1B2A4A] mb-1">Experience Summary</label>
                    <textarea
                      rows={3}
                      value={editExperienceSummary}
                      onChange={(e) => setEditExperienceSummary(e.target.value)}
                      placeholder="Write brief bio or target work environments..."
                      className="w-full text-sm font-semibold p-3 border border-slate-200 bg-white text-[#0A0A0A]"
                    />
                  </div>

                  {/* Certifications and list */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase text-[#1B2A4A]">Certifications</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editCertificationInput}
                        onChange={(e) => setEditCertificationInput(e.target.value)}
                        placeholder="Add new certification..."
                        className="block grow px-3 py-2 border border-slate-200 text-sm font-semibold bg-white text-[#0A0A0A] min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={handleDashboardAddCert}
                        className="bg-[#1B2A4A] hover:bg-[#C0392B] text-white px-3 text-xs uppercase tracking-wider transition-all shrink-0 font-bold"
                      >
                        Add
                      </button>
                    </div>
                    {editCertifications.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {editCertifications.map((cert, index) => (
                          <span 
                            key={index} 
                            className="bg-slate-100 text-[#1B2A4A] border border-slate-200 px-2 py-0.5 text-xs font-bold uppercase flex items-center gap-1.5"
                          >
                            {cert}
                            <button 
                              type="button" 
                              onClick={() => handleDashboardRemoveCert(index)}
                              className="text-[#C0392B] hover:text-[#C0392B]/80 font-bold ml-1 text-sm focus:outline-none"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                   {/* Certifications documents upload */}
                  <div className="p-3 bg-slate-50 border-l-2 border-[#1B2A4A] space-y-2 mt-2">
                    <label className="block text-xs font-black uppercase text-[#1B2A4A]">Support Certificate Files (Optional)</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#C0392B] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 transition-all">
                          Browse Files
                          <input type="file" multiple accept="application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleEditCertFileSelect} className="hidden" />
                        </label>
                        <span className="text-[9.5px] text-slate-400">PDF, JPG, PNG, DOCX — max 5MB/file</span>
                      </div>

                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Label this certificate (e.g. Grade 7 Electrician, First Aid)"
                          value={certLabel}
                          onChange={(e) => setCertLabel(e.target.value)}
                          className="w-full text-xs p-1.5 border border-slate-200 focus:outline-[#1B2A4A] bg-white text-[#0A0A0A] placeholder-slate-400 font-sans"
                        />
                      </div>

                      {/* Selected files preview */}
                      {editCertFiles.length > 0 && (
                        <div className="space-y-1 border-t border-slate-200/50 pt-2">
                          <p className="text-[10px] font-bold text-slate-500 uppercase">Selected for upload:</p>
                          <div className="grid grid-cols-1 gap-2">
                            {editCertFiles.map((item, idx) => (
                              <div key={idx} className="bg-white p-2 border border-slate-100 space-y-1.5 text-[10.5px]">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 truncate max-w-[200px]">{item.file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditCertFile(idx)}
                                    className="text-red-500 hover:text-red-700 font-bold px-1.5 text-xs"
                                  >
                                    &times;
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Label this certificate (e.g. Grade 7 Electrician, First Aid)"
                                  value={item.label}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditCertFiles(prev => prev.map((x, i) => i === idx ? { ...x, label: val } : x));
                                  }}
                                  className="w-full text-[10px] p-1 border border-slate-200 focus:outline-[#1B2A4A] text-slate-700 font-semibold"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Currently existing certificates in profile */}
                      {mySeekerProfile?.certificate_urls && mySeekerProfile.certificate_urls.length > 0 && (
                        <div className="space-y-1 border-t border-slate-200/50 pt-2">
                          <p className="text-[10px] font-bold text-[#1B2A4A] uppercase">Active Certificate Files:</p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {mySeekerProfile.certificate_urls.map((item: any, idx: number) => {
                              const isString = typeof item === 'string';
                              const label = isString ? '' : item?.label || '';
                              const url = isString ? item : item?.url || '';
                              const fileName = url.substring(url.lastIndexOf('/') + 1);
                              const displayName = label || `Document #${idx + 1}`;
                              return (
                                <div key={idx} className="flex items-center justify-between bg-white/70 p-1.5 border border-slate-100 text-[10.5px]">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-bold text-[#C0392B] hover:underline flex items-center gap-1 shrink-0 truncate max-w-[240px]"
                                  >
                                    <ExternalLink size={12} />
                                    <span>{displayName} ({fileName.split('-').pop() || 'certificate'})</span>
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employment history timeline */}
                  <div className="space-y-2 p-3 bg-[#F9F9F9] border border-dashed border-slate-200 text-xs">
                    <label className="block text-xs font-black uppercase text-[#1B2A4A]">Employment Timeline</label>
                    
                    {editPreviousJobs.length > 0 && (
                      <div className="space-y-1.5 border-b border-slate-200 pb-2">
                        {editPreviousJobs.map((job, idx) => (
                          <div key={idx} className="flex justify-between items-start bg-white p-2 border border-slate-100 text-xs relative">
                            <div>
                              <strong className="text-[#0A0A0A] uppercase block font-bold text-[10px]">{job.company}</strong>
                              <span className="text-[#1B2A4A]/70 font-semibold">{job.role} ({job.duration})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDashboardRemoveJob(idx)}
                              className="text-[#C0392B] hover:text-[#C0392B]/80 font-bold text-sm focus:outline-none absolute top-1 right-2"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2">
                      <input
                        type="text"
                        value={editTempCompany}
                        onChange={(e) => setEditTempCompany(e.target.value)}
                        placeholder="Company Name (e.g. KCM)"
                        className="block w-full px-2.5 py-1.5 border border-slate-200 text-xs bg-white text-[#0A0A0A]"
                      />
                      <input
                        type="text"
                        value={editTempRole}
                        onChange={(e) => setEditTempRole(e.target.value)}
                        placeholder="Role / Trade"
                        className="block w-full px-2.5 py-1.5 border border-slate-200 text-xs bg-white text-[#0A0A0A]"
                      />
                      <input
                        type="text"
                        value={editTempDuration}
                        onChange={(e) => setEditTempDuration(e.target.value)}
                        placeholder="Duration (e.g. 2022 - Present)"
                        className="block w-full px-2.5 py-1.5 border border-slate-200 text-xs bg-white text-[#0A0A0A]"
                      />
                      <button
                        type="button"
                        onClick={handleDashboardAddJob}
                        className="bg-[#C0392B] hover:bg-[#1B2A4A] text-white py-1.5 font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        Add History Row
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Logo Upload */}
              {role === 'employer' && (
                <div className="p-3 bg-slate-50 border-l-2 border-[#1B2A4A] space-y-2">
                  <label className="block text-xs font-black uppercase text-[#1B2A4A]">Company Logo</label>
                  <div className="flex gap-3 items-center">
                    <div className="h-12 w-12 shrink-0 bg-white border border-[#1B2A4A] overflow-hidden flex items-center justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                      ) : myEmployerProfile?.logo_url ? (
                        <img src={myEmployerProfile.logo_url} alt="Current logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Building2 size={20} className="text-[#1B2A4A]/40" />
                      )}
                    </div>
                    <div className="grow space-y-1">
                      <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#C0392B] text-white text-xs font-black uppercase tracking-wider px-3 py-1.5 inline-block transition-all">
                        {logoFile ? 'Change Logo' : 'Upload Logo'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleEditLogoSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400">JPG, PNG, WEBP — max 2MB</p>
                      {logoFile && (
                        <p className="text-[10px] text-green-600 font-bold truncate max-w-[160px]">{logoFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {role === 'seeker' && editTradeCategory && TRADE_ASSESSMENT[editTradeCategory] && (
                <div className="border border-gray-200 rounded-md bg-gray-50 p-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-600 mb-0.5">Trade Assessment</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">Answer honestly — this helps employers understand your experience level.</p>
                  </div>
                  <div className="space-y-2">
                    {TRADE_ASSESSMENT[editTradeCategory].map((item) => (
                      <div key={item.key} className="bg-white border border-gray-100 rounded px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2">
                        <p className="text-sm text-gray-700 font-medium flex-1">{item.question}</p>
                        <div className="flex gap-1.5 shrink-0">
                          {['Yes', 'No', 'In Training'].map((opt) => (
                            <button key={opt} type="button"
                              onClick={() => setEditTradeAssessment(prev => ({ ...prev, [item.key]: opt }))}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border transition-colors duration-150 ${
                                editTradeAssessment[item.key] === opt
                                  ? opt === 'Yes' ? 'bg-[#1a2e4a] text-white border-[#1a2e4a]'
                                  : opt === 'No' ? 'bg-[#C0392B] text-white border-[#C0392B]'
                                  : 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                              }`}
                            >{opt}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={actionLoading || uploadingFiles}
                className="w-full bg-[#C0392B] text-white font-black uppercase tracking-widest text-sm py-3.5 cursor-pointer min-h-[48px]"
              >
                {actionLoading || uploadingFiles ? 'Uploading Files...' : 'Deploy Updates'}
              </button>
            </form>
          </div>
          )}

          {message.text && (
            <div className={`p-4 text-sm font-semibold flex items-center gap-2 border-l-4 ${
              message.type === 'success' ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-[#C0392B]'
            }`}>
              <AlertCircle size={16} className="shrink-0" />
              <span>{message.text}</span>
            </div>
          )}
        </aside>

        {/* RIGHT COLUMN: SEARCHABLE DIRECTORY BLOCK */}
        <main className="w-full md:max-w-2xl md:mx-auto lg:max-w-none lg:mx-0 lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Welcome and Onboarding Progress Card */}
          {role === 'seeker' && getSeekerCompletion(mySeekerProfile) < 100 && !welcomeDismissed && (
            <div className="bg-white rounded-lg shadow border border-slate-100 p-4 sm:p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1B2A4A]">
                    Welcome to ALFS Labour
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Your profile is only <span className="text-[#C41E3A] font-extrabold">{getSeekerCompletion(mySeekerProfile)}%</span> complete.
                  </p>
                </div>
                <button 
                  onClick={handleDismissWelcome}
                  className="text-slate-400 hover:text-slate-600 font-bold text-base p-0.5"
                  title="Dismiss Welcome Card"
                >
                  &times;
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-[#1B2A4A] uppercase tracking-wider">
                  <span>Profile Setup Progress</span>
                  <span>{getSeekerCompletion(mySeekerProfile)}%</span>
                </div>
                <div className="w-full bg-[#F4F5F7] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#C41E3A] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${getSeekerCompletion(mySeekerProfile)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-[#1B2A4A] tracking-wider mb-1.5">
                    Complete your profile to:
                  </h4>
                  <ul className="space-y-1 text-xs font-medium text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#C41E3A] font-extrabold">•</span>
                      <span>Apply for jobs and request introductions</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#C41E3A] font-extrabold">•</span>
                      <span>Be discovered by verified employers</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#C41E3A] font-extrabold">•</span>
                      <span>Verify your National Registration Card (NRC)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#C41E3A] font-extrabold">•</span>
                      <span>Increase your employment chances by 5x</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col justify-end gap-2 sm:pl-3">
                  <button
                    onClick={() => navigate('/labour/profile-setup')}
                    className="w-full bg-[#1B2A4A] hover:bg-[#C41E3A] text-white py-2 px-3 font-black uppercase tracking-wider text-[11px] shadow-sm transition-all text-center flex items-center justify-center gap-1.5 rounded-md"
                  >
                    <span>Complete Profile</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleDismissWelcome}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 py-2 px-3 font-bold uppercase tracking-wider text-[10px] transition-all text-center rounded-md"
                  >
                    Continue Later
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Card for Employers */}
          {role === 'employer' && getEmployerCompletion(myEmployerProfile) < 100 && !welcomeDismissed && (
            <div className="bg-white rounded-lg shadow border border-slate-100 p-4 sm:p-5 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1B2A4A]">
                    Welcome to ALFS Labour
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    Your organisation profile is only <span className="text-[#C41E3A] font-extrabold">{getEmployerCompletion(myEmployerProfile)}%</span> complete.
                  </p>
                </div>
                <button 
                  onClick={handleDismissWelcome}
                  className="text-slate-400 hover:text-slate-600 font-bold text-base p-0.5"
                  title="Dismiss Welcome Card"
                >
                  &times;
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-[#1B2A4A] uppercase tracking-wider">
                  <span>Profile Setup Progress</span>
                  <span>{getEmployerCompletion(myEmployerProfile)}%</span>
                </div>
                <div className="w-full bg-[#F4F5F7] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#C41E3A] h-full rounded-full transition-all duration-500" 
                    style={{ width: `${getEmployerCompletion(myEmployerProfile)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-[#1B2A4A] tracking-wider mb-1.5">
                    Complete your profile to:
                  </h4>
                  <ul className="space-y-1 text-xs font-medium text-slate-600">
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#C41E3A] font-extrabold">•</span>
                      <span>Post verified job opportunities</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#C41E3A] font-extrabold">•</span>
                      <span>Find and contact qualified tradesmen</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#C41E3A] font-extrabold">•</span>
                      <span>Verify your TPIN & PACRA status</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-[#C41E3A] font-extrabold">•</span>
                      <span>Build trust with professional job seekers</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col justify-end gap-2 sm:pl-3">
                  <button
                    onClick={() => navigate('/labour/profile-setup')}
                    className="w-full bg-[#1B2A4A] hover:bg-[#C41E3A] text-white py-2 px-3 font-black uppercase tracking-wider text-[11px] shadow-sm transition-all text-center flex items-center justify-center gap-1.5 rounded-md"
                  >
                    <span>Complete Profile</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={handleDismissWelcome}
                    className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 py-2 px-3 font-bold uppercase tracking-wider text-[10px] transition-all text-center rounded-md"
                  >
                    Continue Later
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-[#1B2A4A] p-4 sm:p-6 shadow-sm rounded-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1b2a4a]/10 pb-6 mb-6">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-[#0A0A0A]">
                  {role === 'seeker' ? 'Active Recruiters in Zambia' : 'Search Qualified tradesmen'}
                </h2>
                <p className="text-sm text-[#1B2A4A]/60 font-semibold mt-1">
                  {role === 'seeker' 
                    ? 'Reach out or apply directly to these companies active in the region.'
                    : 'Dial certified tradesmen or heavy machine operators with immediate availability.'}
                </p>
              </div>

              {role === 'employer' && (
                <button
                  onClick={handleRefreshSeekers}
                  className="bg-[#1B2A4A]/5 hover:bg-[#1B2A4A]/10 text-[#1B2A4A] font-semibold text-xs uppercase tracking-wider px-3.5 py-2 border border-[#1b2a4a]/25 self-start flex items-center gap-1.5 min-h-[40px] rounded-md"
                >
                  <RefreshCcw size={12} />
                  <span>Refresh Seekers</span>
                </button>
              )}
            </div>

            {/* DIRECTREE BAR FILTERS */}
            {role === 'employer' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-4">
                {/* Name search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#1B2A4A] bg-white text-[#0A0A0A] placeholder:text-slate-400 min-h-[36px]"
                  />
                </div>
                {/* Trade dropdown */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                    <Briefcase size={14} />
                  </div>
                  <select
                    value={tradeDropdownFilter}
                    onChange={(e) => setTradeDropdownFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#1B2A4A] bg-white text-[#0A0A0A] appearance-none min-h-[36px]"
                  >
                    <option value="all">All Trades & Skills</option>
                    {TRADE_CATEGORIES_FLAT.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                {/* Province select */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                    <Filter size={14} />
                  </div>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#1B2A4A] bg-white text-[#0A0A0A] appearance-none min-h-[36px]"
                  >
                    <option value="all">All Provinces</option>
                    {PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov} Province</option>
                    ))}
                  </select>
                </div>
                {/* Availability select */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                    <Briefcase size={14} />
                  </div>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#1B2A4A] bg-white text-[#0A0A0A] appearance-none min-h-[36px]"
                  >
                    <option value="all">All Availability</option>
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Casual/Temporary">Casual / Temporary</option>
                  </select>
                </div>
                {/* Certification search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search certifications..."
                    value={certSearch}
                    onChange={(e) => setCertSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-[#1B2A4A] bg-white text-[#0A0A0A] placeholder:text-slate-400 min-h-[36px]"
                  />
                </div>
                {/* Has Work History toggle */}
                <button
                  type="button"
                  onClick={() => setHasExperienceFilter(prev => !prev)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider border rounded-md transition-all min-h-[36px] ${
                    hasExperienceFilter
                      ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                      : 'bg-white text-[#1B2A4A] border-slate-200 hover:border-[#1B2A4A]'
                  }`}
                >
                  <CheckCircle size={13} />
                  <span>Has Work History</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Search input */}
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                    <Search size={14} />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by company or sector..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 focus:outline-none focus:border-[#C0392B] bg-white text-[#0A0A0A] min-h-[36px] rounded-md"
                  />
                </div>

                {/* Province select */}
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#1B2A4A]/40">
                    <Filter size={14} />
                  </div>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold uppercase tracking-wider border border-slate-200 focus:outline-none focus:border-[#C0392B] bg-white text-[#0A0A0A] min-h-[36px] rounded-md"
                  >
                    <option value="all">All Provinces</option>
                    {PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov} Province</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* MEMBERS CONTAINER DATA GRID */}
            <div className="space-y-4">
              {role === 'employer' ? (
                /* SEEKERS LIST FOR EMPLOYER VIEW */
                filteredSeekers.length > 0 ? (
                  <>
                    {filteredSeekers.slice(0, visibleSeekerCount).map((s) => (
                      <div key={s.id} className="border border-slate-200 hover:border-[#1B2A4A]/50 p-3.5 sm:p-4 flex flex-col gap-3 transition-all bg-white shadow-sm rounded-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
                        <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
                          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-none bg-slate-100 border border-[#1B2A4A]/20 flex items-center justify-center text-[#1B2A4A] shrink-0 overflow-hidden">
                            {s.photo_url ? (
                              <img src={s.photo_url} alt="Candidate profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="h-5 w-5 sm:h-6 sm:w-6" />
                            )}
                          </div>

                          <div className="space-y-1 grow">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-sans font-black text-sm uppercase tracking-wider text-[#0A0A0A]">
                                {s.full_name}
                              </h4>
                              <span className="bg-[#C0392B]/10 text-[#C0392B] font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                {s.availability}
                              </span>
                              {getSeekerCompletion(s) >= 80 ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  Verified Profile
                                </span>
                              ) : (
                                <span className="bg-amber-50 text-amber-700 border border-amber-200 font-black text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full" title="Profile needs administrative verification">
                                  Needs Verification ({getSeekerCompletion(s)}%)
                                </span>
                              )
                              }
                              {s.nrc && (
                                <span 
                                  className="bg-slate-100 text-[#1B2A4A]/70 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border border-slate-200 flex items-center gap-1 rounded-full"
                                  title="Full NRC visible to ALFS admin only"
                                >
                                  <span>NRC: {maskNRC(s.nrc)}</span>
                                  <span className="text-[8px] text-slate-400 font-sans font-normal normal-case border-l border-slate-200 pl-1">
                                    Full NRC visible to ALFS admin only
                                  </span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold uppercase tracking-widest text-[#1B2A4A]">{s.trade}</p>
                            <div className="flex items-center gap-1.5 text-xs text-[#1B2A4A]/50 font-semibold uppercase">
                              <MapPin size={12} className="text-[#C0392B]" />
                              <span>{s.region} Province</span>
                            </div>

                            {/* Mobile Toggle Details Button */}
                            <button
                              type="button"
                              onClick={() => setExpandedCards(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                              className="sm:hidden text-[11px] font-bold text-[#1B2A4A] hover:text-[#C0392B] flex items-center gap-1 mt-1.5 transition-colors underline decoration-slate-300 cursor-pointer"
                            >
                              <span>{expandedCards[s.id] ? 'Hide details' : 'View details'}</span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${expandedCards[s.id] ? 'rotate-180' : ''}`} />
                            </button>

                            {s.experience_summary && (
                              <p className={`text-xs text-[#1B2A4A]/60 font-medium mt-1 leading-relaxed line-clamp-2 ${expandedCards[s.id] ? 'block' : 'hidden sm:block'}`}>
                                {s.experience_summary}
                              </p>
                            )}
                            {s.certifications && s.certifications.length > 0 && (
                              <div className={`${expandedCards[s.id] ? 'flex' : 'hidden sm:flex'} flex-wrap gap-1 mt-2`}>
                                {s.certifications.slice(0, 3).map((cert, i) => (
                                  <span key={i} className="bg-[#1B2A4A]/5 text-[#1B2A4A] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-[#1B2A4A]/10 rounded-full">
                                    {cert}
                                  </span>
                                ))}
                                {s.certifications.length > 3 && (
                                  <span className="text-[9px] font-black text-[#1B2A4A]/40 uppercase tracking-wider px-1 py-0.5">
                                    +{s.certifications.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:flex lg:flex-col gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
                            <button
                              onClick={() => setShowRequestModal(s.id)}
                              disabled={!!requestSent[s.id] || requestLoading === s.id}
                              className={`font-bold text-[11px] uppercase tracking-wider px-3.5 py-2 flex items-center justify-center gap-1.5 min-h-[36px] w-full transition-all rounded-md ${
                                requestSent[s.id]
                                  ? 'bg-green-600 text-white cursor-default'
                                  : 'bg-[#C0392B] hover:bg-[#a93226] text-[#FFFFFF]'
                              }`}
                            >
                              {requestLoading === s.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : requestSent[s.id] ? (
                                <><CheckCircle size={14} /><span>Requested</span></>
                              ) : (
                                <><Send size={14} /><span>Request via ALFS</span></>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setContractModalSeeker(s);
                                setContractPosition(s.trade || '');
                                setContractLocation(s.region || '');
                                setContractWage('');
                                setContractStartDate('');
                                setContractDuration('');
                              }}
                              className="bg-[#1B2A4A] hover:bg-[#C0392B] text-white font-black text-[11px] uppercase tracking-wider px-3 py-2 flex items-center justify-center gap-1.5 min-h-[36px] w-full transition-colors rounded-md"
                            >
                              <FileText size={13} />
                              <span>Generate Contract</span>
                            </button>
                            
                            <button
                              onClick={() => handleOpenReportModal(s.id, s.full_name)}
                              className="bg-slate-50 hover:bg-slate-100 hover:text-[#C41E3A] border border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider px-3 py-2 flex items-center justify-center gap-1.5 min-h-[36px] min-[480px]:col-span-2 lg:col-span-1 w-full transition-colors rounded-md"
                              title="Report Profile"
                            >
                              <Flag size={13} />
                              <span>Report Profile</span>
                            </button>
                          </div>
                        </div>

                        {/* Summary & Tags Block (Internal details) */}
                        {(s.experience_summary || (s.certifications && s.certifications.length > 0) || (s.previous_jobs && s.previous_jobs.length > 0)) && (
                          <div className={`pt-3 border-t border-slate-100 space-y-3.5 text-xs ${expandedCards[s.id] ? 'block' : 'hidden sm:block'}`}>
                            {s.experience_summary && (
                              <div>
                                <strong className="font-mono text-[#1B2A4A]/50 uppercase tracking-widest text-[9px] block mb-1">PRO BIO SUMMARY:</strong>
                                <p className="text-slate-700 font-medium leading-relaxed italic">"{s.experience_summary}"</p>
                              </div>
                            )}

                            {s.certifications && s.certifications.length > 0 && (
                              <div>
                                <strong className="font-mono text-[#1B2A4A]/50 uppercase tracking-widest text-[9px] block mb-1.5">VERIFIED CERTIFICATES / LICENSES:</strong>
                                <div className="flex flex-wrap gap-1.5">
                                  {s.certifications.map((cert, idx) => {
                                    const item = s.certificate_urls?.[idx];
                                    const url = typeof item === 'string' ? item : item?.url || '';
                                    if (url) {
                                      return (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="bg-red-50 text-[#C0392B] border border-[#C0392B]/30 hover:border-[#C0392B] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all rounded-full"
                                        >
                                          <ExternalLink size={10} />
                                          <span>{cert}</span>
                                        </a>
                                      );
                                    }
                                    return (
                                      <span key={idx} className="bg-slate-50 text-[#1B2A4A] border border-slate-200/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full">
                                        {cert}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {s.previous_jobs && s.previous_jobs.length > 0 && (
                              <div>
                                <strong className="font-mono text-[#1B2A4A]/50 uppercase tracking-widest text-[9px] block mb-1.5">ZAMBIAN EMPLOYMENT TIMELINE:</strong>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                  {s.previous_jobs.map((job, idx) => (
                                    <div key={idx} className="bg-slate-50/50 p-2 border border-slate-100 flex items-start gap-2">
                                      <span className="text-[10px] font-bold text-[#C0392B] shrink-0 font-mono bg-white h-5 w-5 border border-slate-200 flex items-center justify-center">
                                        {idx + 1}
                                      </span>
                                      <div>
                                        <span className="font-extrabold uppercase text-[#0A0A0A] block">{job.company}</span>
                                        <span className="text-slate-600 font-semibold">{job.role} <span className="text-[#1B2A4A]/40">({job.duration})</span></span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Load More Pagination Button */}
                    {filteredSeekers.length > visibleSeekerCount && (
                      <div className="flex flex-col items-center justify-center pt-3 pb-1">
                        <button
                          type="button"
                          onClick={() => setVisibleSeekerCount(prev => prev + 5)}
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-[#1B2A4A] font-bold uppercase text-xs tracking-wider px-6 py-2.5 rounded-md shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>Load More Tradesmen ({filteredSeekers.length - visibleSeekerCount} remaining)</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-[#1B2A4A]/40 text-sm font-semibold uppercase tracking-widest">
                    No active job seekers found matching your filters.
                  </div>
                )
              ) : (
                /* EMPLOYERS LIST FOR SEEKER VIEW */
                filteredEmployers.length > 0 ? (
                  filteredEmployers.map((emp) => (
                    <div key={emp.id} className="border border-slate-200 hover:border-[#C0392B]/50 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all col-span-1 bg-white shadow-sm rounded-lg">
                      <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center">
                        <div className="h-14 w-14 rounded-none bg-slate-100 border border-[#1B2A4A]/20 flex items-center justify-center text-[#1B2A4A] shrink-0 overflow-hidden">
                          {emp.logo_url ? (
                            <img src={emp.logo_url} alt="Company logo" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Building2 size={24} />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-sans font-black text-sm uppercase tracking-wider text-[#0A0A0A]">
                              {emp.company_name}
                            </h4>
                          </div>
                          <p className="text-sm font-bold uppercase tracking-widest text-[#1B2A4A]">Sector: {emp.field_of_work}</p>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs text-[#1B2A4A]/50 font-semibold uppercase">
                            <span className="flex items-center gap-0.5">
                              <MapPin size={12} className="text-[#C0392B]" />
                              {emp.region} Province
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto mt-2 sm:mt-0 flex flex-col sm:items-end gap-2 shrink-0">
                        {introRequestSent[emp.id] ? (
                          <div className="bg-green-50 border border-green-200 text-green-800 font-bold text-[11px] px-3 py-2 flex items-center justify-center gap-1 min-h-[36px] w-full sm:w-auto text-center rounded-md">
                            <CheckCircle size={14} />
                            <span>Thanks for reaching out to the ALFS Labour Force — our team will reach out to you shortly.</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRequestIntroduction(emp)}
                            disabled={introRequestLoading === emp.id}
                            className="bg-[#1B2A4A] hover:bg-[#C0392B] text-white font-bold text-[11px] uppercase tracking-wider px-3.5 py-2 flex items-center justify-center gap-1.5 min-h-[36px] w-full sm:w-auto transition-all rounded-md"
                          >
                            {introRequestLoading === emp.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <><Send size={14} /><span>Request Introduction</span></>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenReportModal(emp.id, emp.company_name)}
                          className="bg-slate-50 hover:bg-slate-100 hover:text-[#C41E3A] border border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider py-1.5 px-2.5 flex items-center justify-center gap-1 transition-colors min-h-[30px] rounded-md"
                          title="Report Employer"
                        >
                          <Flag size={12} />
                          <span>Report Employer</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-[#1B2A4A]/40 text-sm font-semibold uppercase tracking-widest">
                    No registered corporate employers found matching your filters.
                  </div>
                )
              )}
            </div>

          </div>
        </main>
      </div>
    </div>

      {showRequestModal && (
        <div
          style={{ minHeight: '400px', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="fixed inset-0 z-50 px-4"
          onClick={() => setShowRequestModal(null)}
        >
          <div
            className="bg-white w-full max-w-md p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-black text-sm uppercase tracking-widest text-[#0A0A0A] mb-1">
              Send Employee Request
            </h3>
            <p className="text-xs text-[#1B2A4A]/60 font-medium mb-4">
              This request will be reviewed by ALFS before connecting you with the employee.
            </p>
            <textarea
              rows={4}
              placeholder="Describe the role, duration, and any specific requirements..."
              value={requestMessage}
              onChange={e => setRequestMessage(e.target.value)}
              className="w-full text-sm font-medium p-3 border border-slate-200 focus:outline-none focus:border-[#C0392B] resize-none text-[#0A0A0A] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRequestModal(null)}
                className="flex-1 bg-[#F2F2F2] text-[#1B2A4A] font-black text-xs uppercase tracking-widest py-3 min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const seeker = filteredSeekers.find(s => s.id === showRequestModal);
                  if (seeker) handleSendRequest(seeker);
                }}
                disabled={requestLoading !== null}
                className="flex-1 bg-[#C0392B] text-white font-black text-xs uppercase tracking-widest py-3 min-h-[48px] hover:bg-[#a93226] transition-colors disabled:opacity-50"
              >
                {requestLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Employment Contract Modal */}
      {contractModalSeeker && (
        <div
          style={{ minHeight: '400px', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="fixed inset-0 z-50 px-4 py-8 overflow-y-auto"
          onClick={() => setContractModalSeeker(null)}
        >
          <div
            className="bg-white w-full max-w-3xl p-6 shadow-2xl border-2 border-[#1B2A4A] relative max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="font-sans font-black text-sm uppercase tracking-widest text-[#1B2A4A] flex items-center gap-2">
                <FileText size={16} />
                <span>Generate Employment Contract</span>
              </h3>
              <button
                onClick={() => setContractModalSeeker(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Read-only Summary Block */}
            <div className="mb-5 bg-slate-50 border-l-4 border-emerald-500 p-4 space-y-3">
              <span className="font-mono text-[#1B2A4A]/50 uppercase tracking-widest text-[9px] block">Contracting Parties</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                {/* Employer Side */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Employer (First Party)</span>
                  <div className="text-[#0A0A0A] font-extrabold uppercase text-[11px] tracking-wide">
                    {myEmployerProfile?.company_name || 'N/A'}
                  </div>
                  <div className="text-slate-600">Company Representative: {myEmployerProfile?.contact_person || 'N/A'}</div>
                </div>

                {/* Employee Side */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400">Employee (Second Party)</span>
                  <div className="text-[#0A0A0A] font-extrabold uppercase text-[11px] tracking-wide">
                    {contractModalSeeker.full_name}
                  </div>
                  <div className="text-slate-600">Primary Trade / Skill: {contractModalSeeker.trade}</div>
                  <div className="text-slate-600">Phone Code: {maskPhone(contractModalSeeker.phone)}</div>
                  {contractModalSeeker.nrc && (
                    <div className="text-slate-600">
                      NRC Number:{' '}
                      <span className="font-mono" title="Full NRC visible to ALFS admin only">
                        {maskNRC(contractModalSeeker.nrc)}
                      </span>{' '}
                      <span className="text-[10px] text-slate-400 font-sans block sm:inline">
                        (Full NRC visible to ALFS admin only)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleGenerateContract} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Position / Role */}
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase tracking-wider text-[#1B2A4A] block">
                    Position / Role <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contractPosition}
                    onChange={e => setContractPosition(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-200 focus:outline-none focus:border-[#C0392B] text-[#0A0A0A]"
                  />
                </div>

                {/* Work Location */}
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase tracking-wider text-[#1B2A4A] block">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={contractLocation}
                    onChange={e => setContractLocation(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-200 focus:outline-none focus:border-[#C0392B] text-[#0A0A0A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Wage / Salary */}
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase tracking-wider text-[#1B2A4A] block">
                    Wage / Salary <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ZMW 5,000 / month"
                    value={contractWage}
                    onChange={e => setContractWage(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-200 focus:outline-none focus:border-[#C0392B] text-[#0A0A0A]"
                  />
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase tracking-wider text-[#1B2A4A] block">
                    Contract Duration <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6 months / Permanent"
                    value={contractDuration}
                    onChange={e => setContractDuration(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-200 focus:outline-none focus:border-[#C0392B] text-[#0A0A0A]"
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase tracking-wider text-[#1B2A4A] block">
                    Start Date <span className="text-[#C0392B]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={contractStartDate}
                    onChange={e => setContractStartDate(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-200 focus:outline-none focus:border-[#C0392B] text-[#0A0A0A]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setContractModalSeeker(null)}
                  className="flex-1 bg-[#F2F2F2] text-[#1B2A4A] hover:bg-slate-200 font-black text-xs uppercase tracking-widest py-3 min-h-[48px] cursor-pointer transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#1B2A4A] text-white hover:bg-[#C0392B] font-black text-xs uppercase tracking-widest py-3 min-h-[48px] cursor-pointer transition-colors"
                >
                  Generate PDF
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const emailTo = "";
                    const emailSubject = encodeURIComponent(`Employment Contract - ${contractModalSeeker.full_name} - ${myEmployerProfile?.company_name || ''}`);
                    const emailBody = encodeURIComponent(
                      `Dear ${contractModalSeeker.full_name},\n\n` +
                      `Please find attached the employment contract for the position of ${contractPosition} with ${myEmployerProfile?.company_name || ''}.\n\n` +
                      `Please remember to attach the downloaded contract PDF to this email before sending.\n\n` +
                      `Regards,\n` +
                      `${myEmployerProfile?.contact_person || ''}`
                    );
                    window.location.href = `mailto:${emailTo}?subject=${emailSubject}&body=${emailBody}`;
                  }}
                  className="flex-1 bg-white border-2 border-[#1B2A4A] text-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white font-black text-xs uppercase tracking-widest py-3 min-h-[48px] cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Mail size={14} />
                  <span>Send via Email</span>
                </button>
              </div>

              <div className="text-[10px] text-slate-500 font-semibold text-center mt-3 leading-normal">
                Download the PDF first, then attach it manually in your email client before sending.
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terms Gate Modal for Existing Users */}
      <TermsModal
        isOpen={needsTermsAcceptance}
        onAccept={async () => {
          const tableName = role === 'seeker' ? 'alfs_labour_seekers' : 'alfs_labour_employers';
          const userId = role === 'seeker' ? mySeekerProfile?.id : myEmployerProfile?.id;
          if (userId) {
            await supabase.from(tableName).update({ terms_accepted_at: new Date().toISOString(), terms_version: 'v1' }).eq('id', userId);
          }
          setNeedsTermsAcceptance(false);
        }}
      />

      {/* Report Modal */}
      {reportModalData && (
        <div
          style={{ minHeight: '400px', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="fixed inset-0 z-50 px-4"
          onClick={() => setReportModalData(null)}
        >
          <div
            className="bg-white w-full max-w-md p-6 shadow-2xl border-2 border-[#1B2A4A]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-black text-sm uppercase tracking-widest text-[#1B2A4A] flex items-center gap-2">
                <Flag size={16} className="text-[#C41E3A]" />
                <span>Report / Flag Profile</span>
              </h3>
              <button
                onClick={() => setReportModalData(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {reportSuccessText ? (
              <div className="space-y-4 py-2 text-center">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 font-semibold text-xs leading-relaxed">
                  {reportSuccessText}
                </div>
                <button
                  onClick={() => setReportModalData(null)}
                  className="w-full bg-[#1B2A4A] text-white font-black text-xs uppercase tracking-widest py-3 min-h-[48px]"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#1B2A4A]/60 font-medium leading-relaxed">
                  You are reporting profile <strong>{reportModalData.reported_user_name}</strong>. Please select the reason and provide specific details.
                </p>

                {reportErrorText && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 text-xs font-semibold">
                    {reportErrorText}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase tracking-wider text-[#1B2A4A] block">
                    Reason for Report
                  </label>
                  <select
                    value={reportType}
                    onChange={e => setReportType(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 border border-slate-200 focus:outline-none focus:border-[#C41E3A] bg-white text-[#0A0A0A]"
                  >
                    <option value="Non-payment of wages">Non-payment of wages</option>
                    <option value="Fraudulent profile">Fraudulent profile</option>
                    <option value="Harassment or abuse">Harassment or abuse</option>
                    <option value="Misrepresentation">Misrepresentation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-[10px] uppercase tracking-wider text-[#1B2A4A] block">
                    Report Details (Min 20 characters)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide detailed description of the incident, including dates, names, or specific situations..."
                    value={reportDetails}
                    onChange={e => setReportDetails(e.target.value)}
                    className="w-full text-xs font-medium p-3 border border-slate-200 focus:outline-none focus:border-[#C41E3A] resize-none text-[#0A0A0A]"
                  />
                  <p className="text-[10px] text-slate-400 font-semibold text-right">
                    {reportDetails.length} / 20+ characters
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setReportModalData(null)}
                    className="flex-1 bg-slate-100 text-[#1B2A4A] font-black text-xs uppercase tracking-widest py-3 min-h-[48px] hover:bg-slate-250 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={reportSubmitting || reportDetails.trim().length < 20}
                    className="flex-1 bg-[#C41E3A] text-white font-black text-xs uppercase tracking-widest py-3 min-h-[48px] hover:bg-[#a9172f] transition-colors disabled:opacity-50 font-bold"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
