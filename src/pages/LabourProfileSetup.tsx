import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { dbClient, isSandboxActive, isSupabasePropertiesLoaded, deactivateSandbox } from '../lib/dbClient';
import { User, Briefcase, MapPin, Phone, Building2, CheckCircle2, Loader2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import SupabaseErrorPrompt from '../components/SupabaseErrorPrompt';

const PROVINCES = [
  'Lusaka',
  'Copperbelt',
  'Central',
  'Southern',
  'Eastern',
  'Western',
  'Northern',
  'North-Western',
  'Luapula',
  'Muchinga'
];

const AVAILABILITY_OPTIONS = [
  'Full-Time',
  'Part-Time',
  'Contract',
  'Casual/Temporary'
];

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

const EMPLOYER_SECTORS: Record<string, string[]> = {
  'Mining': ['Underground Mining', 'Open-cast / Surface Mining', 'Mine Services & Contracting', 'Mineral Processing', 'Exploration & Drilling', 'Mine Safety & Compliance', 'Quarrying & Aggregates', 'Copper Mining', 'Gold Mining', 'Coal & Energy Minerals'],
  'Civil & Infrastructure': ['Road & Highway Construction', 'Bridge & Structures', 'Dam & Water Infrastructure', 'Airport & Airfield', 'Railway & Transport', 'Urban Infrastructure', 'Rural Infrastructure Development', 'Drainage & Stormwater'],
  'Building & Construction': ['Commercial Building', 'Residential Construction', 'Industrial Building', 'Institutional Buildings (Schools, Hospitals)', 'Mixed-Use Developments', 'Renovation & Refurbishment', 'High-Rise Construction'],
  'Electrical & Telecommunications': ['Industrial Electrical Contracting', 'Domestic & Commercial Electrical', 'High Voltage & Substation Work', 'Telecommunications & Fibre', 'Solar & Renewable Energy', 'Generator & UPS Systems', 'Street Lighting & Traffic Systems'],
  'Mechanical & Engineering': ['Mechanical Contracting', 'Plant & Equipment Maintenance', 'HVAC & Refrigeration', 'Pump & Compressor Services', 'Hydraulics & Pneumatics', 'Fabrication & Steel Works', 'Boilermaking'],
  'Plumbing & Pipework': ['Industrial Pipework', 'Domestic Plumbing', 'Fire Suppression Systems', 'HDPE & PPR Piping', 'Water Reticulation', 'Sewer & Drainage'],
  'Structural & Fabrication': ['Structural Steel Fabrication', 'Welding & Coded Works', 'Rigging & Lifting', 'Scaffolding', 'Pressure Vessel Works'],
  'Roads & Earthworks': ['Road Construction & Rehabilitation', 'Earthworks & Bulk Excavation', 'Grading & Compaction', 'Asphalt & Surfacing', 'Land Clearing'],
  'IT & Technology Systems': ['SCADA & Automation Systems', 'PLC & Control Systems', 'Mining ERP Systems (SAP / JD Edwards)', 'Network Infrastructure (Mine Sites)', 'OT/IT Integration', 'Cybersecurity (Industrial)', 'GIS & Mine Mapping', 'Drone & Survey Technology', 'ICT Infrastructure & Support', 'Telecommunications & Radio Systems'],
  'Property & Real Estate': ['Property Development', 'Facilities Management', 'Property Maintenance', 'Real Estate Agency'],
  'Labour Supply & Staffing': ['Labour Hire & Outsourcing', 'Recruitment & Placement', 'Workforce Management', 'Training & Skills Development'],
  'Logistics & Transport': ['Heavy Haulage & Lowbed', 'Mining Logistics', 'Construction Logistics', 'Fuel & Bulk Transport', 'Fleet Management'],
  'Oil, Gas & Energy': ['Fuel Supply & Distribution', 'Pipeline Construction', 'Power Generation', 'Renewable Energy Projects'],
  'HSE & Quality Assurance': ['HSE Consulting', 'Quality Inspection Services', 'NDT & Testing', 'Environmental Compliance'],
  'General Contracting': ['General Building Contractor', 'Multi-disciplinary Contractor', 'Subcontracting Services'],
};

export default function LabourProfileSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [showConfigPrompt, setShowConfigPrompt] = useState(false);

  // Seeker Form Fields
  const [fullName, setFullName] = useState('');
  const [trade, setTrade] = useState('');
  const [tradeCategory, setTradeCategory] = useState('');
  const [tradeSpecialisation, setTradeSpecialisation] = useState('');
  const [tradeAssessment, setTradeAssessment] = useState<Record<string, string>>({});
  const [region, setRegion] = useState('Lusaka');
  const [availability, setAvailability] = useState('Full-Time');
  const [phone, setPhone] = useState('');
  const [napsaNumber, setNapsaNumber] = useState('');

  // Seeker Premium Fields
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [pacraFile, setPacraFile] = useState<File | null>(null);
  const [pacraError, setPacraError] = useState('');
  const [nrcFile, setNrcFile] = useState<File | null>(null);
  const [nrcError, setNrcError] = useState('');
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [nrc, setNrc] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [experienceSummary, setExperienceSummary] = useState('');
  const [previousJobs, setPreviousJobs] = useState<{ company: string; role: string; duration: string }[]>([]);
  const [nrcPhotoUrl, setNrcPhotoUrl] = useState('');
  const [existingCertUrls, setExistingCertUrls] = useState<string[]>([]);
  const [pacraCertificateUrl, setPacraCertificateUrl] = useState('');
  
  // States for adding a temporary previous job
  const [tempCompany, setTempCompany] = useState('');
  const [tempRole, setTempRole] = useState('');
  const [tempDuration, setTempDuration] = useState('');

  const handleAddCertification = (e: React.MouseEvent) => {
    e.preventDefault();
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (indexToRemove: number) => {
    setCertifications(certifications.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddPreviousJob = (e: React.MouseEvent) => {
    e.preventDefault();
    if (tempCompany.trim() && tempRole.trim() && tempDuration.trim()) {
      setPreviousJobs([
        ...previousJobs,
        {
          company: tempCompany.trim(),
          role: tempRole.trim(),
          duration: tempDuration.trim()
        }
      ]);
      setTempCompany('');
      setTempRole('');
      setTempDuration('');
    }
  };

  const handleRemovePreviousJob = (indexToRemove: number) => {
    setPreviousJobs(previousJobs.filter((_, idx) => idx !== indexToRemove));
  };

  // Employer Form Fields
  const [companyName, setCompanyName] = useState('');
  const [fieldOfWork, setFieldOfWork] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<{ category: string; specialisation: string }[]>([{ category: '', specialisation: '' }]);
  const [contactPerson, setContactPerson] = useState('');
  const [tpin, setTpin] = useState('');

  // Form Validation Errors
  const [fullNameError, setFullNameError] = useState('');
  const [nrcFormatError, setNrcFormatError] = useState('');
  const [napsaNumberError, setNapsaNumberError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [companyNameError, setCompanyNameError] = useState('');
  const [contactPersonError, setContactPersonError] = useState('');
  const [tpinError, setTpinError] = useState('');

  const validateFullName = (val: string): boolean => {
    const error = val.trim().length >= 2 && /[a-zA-Z]/.test(val) ? '' : 'Please enter a valid full name.';
    setFullNameError(error);
    return !error;
  };

  const validateNrcNumber = (val: string): boolean => {
    const error = /^\d{6}\/\d{2}\/\d{1}$/.test(val) ? '' : 'Please enter a valid NRC number in the format 123456/11/1.';
    setNrcFormatError(error);
    return !error;
  };

  const validateNapsaNumber = (val: string): boolean => {
    const error = !val || /^\d{5,15}$/.test(val) ? '' : 'NAPSA number should contain only digits.';
    setNapsaNumberError(error);
    return !error;
  };

  const validatePhoneNumber = (val: string): boolean => {
    const cleaned = val.replace(/\s+/g, '');
    const error = /^(0\d{9}|\+260\d{9})$/.test(cleaned) ? '' : 'Please enter a valid Zambian phone number (e.g. 0961234567 or +260961234567).';
    setPhoneError(error);
    return !error;
  };

  const validateCompanyName = (val: string): boolean => {
    const error = val.trim().length >= 2 && /[a-zA-Z]/.test(val) ? '' : 'Please enter a valid company name.';
    setCompanyNameError(error);
    return !error;
  };

  const validateContactPerson = (val: string): boolean => {
    const error = val.trim().length >= 2 && /[a-zA-Z]/.test(val) ? '' : 'Please enter a valid contact person name.';
    setContactPersonError(error);
    return !error;
  };

  const validateTpinNumber = (val: string): boolean => {
    const error = !val || /^\d{10}$/.test(val) ? '' : 'TPIN must be exactly 10 digits.';
    setTpinError(error);
    return !error;
  };

  useEffect(() => {
    // If Supabase is unconfigured and sandbox is off, show configuration guide
    if (!isSupabasePropertiesLoaded() && !isSandboxActive()) {
      setShowConfigPrompt(true);
      setLoading(false);
      return;
    }

    async function checkUser() {
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

        // Check if profile already exists and populate the form fields
        if (userRole === 'seeker') {
          const { data } = await dbClient.getSeekers({ userId: user.id });
          const existing = data && data[0];
          
          if (existing) {
            if (existing.full_name && existing.full_name !== 'Anonymous Seeker') {
              setFullName(existing.full_name);
            } else if (user.user_metadata?.full_name) {
              setFullName(user.user_metadata.full_name);
            }
            if (existing.trade && existing.trade !== 'unspecified') {
              setTrade(existing.trade);
            }
            if (existing.region) setRegion(existing.region);
            if (existing.availability) setAvailability(existing.availability);
            if (existing.phone && existing.phone !== 'Not provided') {
              setPhone(existing.phone);
            }
            if (existing.nrc) setNrc(existing.nrc);
            if (existing.napsa_number) setNapsaNumber(existing.napsa_number);
            if (existing.photo_url) setPhotoPreview(existing.photo_url);
            if (existing.nrc_photo_url) setNrcPhotoUrl(existing.nrc_photo_url);
            if (existing.certificate_urls) setExistingCertUrls(existing.certificate_urls);
            if (existing.certifications) setCertifications(existing.certifications);
            if (existing.experience_summary) setExperienceSummary(existing.experience_summary);
            if (existing.previous_jobs) setPreviousJobs(existing.previous_jobs);
            if (existing.trade_assessment) setTradeAssessment(existing.trade_assessment);
          } else {
            if (user.user_metadata?.full_name) {
              setFullName(user.user_metadata.full_name);
            }
          }
        } else {
          const { data } = await dbClient.getEmployers({ userId: user.id });
          const existing = data && data[0];

          if (existing) {
            if (existing.company_name && existing.company_name !== 'Anonymous Employer') {
              setCompanyName(existing.company_name);
            } else if (user.user_metadata?.full_name) {
              setCompanyName(user.user_metadata.full_name);
            }
            if (existing.field_of_work && existing.field_of_work !== 'unspecified') {
              setFieldOfWork(existing.field_of_work);
            }
            if (existing.region) setRegion(existing.region);
            if (existing.contact_person && existing.contact_person !== 'Anonymous Employer') {
              setContactPerson(existing.contact_person);
            }
            if (existing.phone && existing.phone !== 'Not provided') {
              setPhone(existing.phone);
            }
            if (existing.tpin) setTpin(existing.tpin);
            if (existing.logo_url) setLogoPreview(existing.logo_url);
            if (existing.pacra_certificate_url) setPacraCertificateUrl(existing.pacra_certificate_url);
          } else {
            if (user.user_metadata?.full_name) {
              setCompanyName(user.user_metadata.full_name);
              setContactPerson(user.user_metadata.full_name);
            }
          }
        }
      } catch (err: any) {
        if (err.message?.toLowerCase().includes('failed to fetch')) {
          console.warn('Error checking user profile setup status (handled):', err);
          setShowConfigPrompt(true);
        } else {
          console.error('Error checking user profile setup status:', err);
        }
      } finally {
        setLoading(false);
      }
    }
    checkUser();
  }, [navigate]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Profile photo must be under 2MB.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Company logo must be under 2MB.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handlePacraSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('PACRA Certificate must be under 5MB.');
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Only PDF, JPG, and PNG files are allowed.');
      return;
    }
    setPacraFile(file);
    setPacraError('');
  };

  const handleRemovePacraFile = () => {
    setPacraFile(null);
  };

  const handleNrcFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setNrcError('NRC photo must be under 5MB.');
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setNrcError('Only PDF, JPG, and PNG files are allowed.');
      return;
    }
    setNrcFile(file);
    setNrcError('');
  };

  const handleRemoveNrcFile = () => {
    setNrcFile(null);
  };

  const handleCertFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const remaining = 5 - certFiles.length;
    if (remaining <= 0) {
      setErrorMessage('Maximum 5 certificate files allowed.');
      return;
    }
    const toAdd = files.slice(0, remaining);
    const oversized = toAdd.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      setErrorMessage('Each certificate must be under 5MB.');
      return;
    }
    setCertFiles(prev => [...prev, ...toAdd]);
  };

  const handleRemoveCertFile = (index: number) => {
    setCertFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSkipAndCompleteLater = async () => {
    if (!user) return;

    setSaving(true);
    setErrorMessage('');

    try {
      if (role === 'seeker') {
        const payload: any = {
          id: user.id,
          full_name: fullName.trim() || 'Anonymous Seeker',
          trade: (trade.trim() || 'unspecified').toLowerCase(),
          region: region || 'Lusaka',
          availability: availability || 'Full-Time',
          phone: phone.trim() || 'Not provided',
          email: user.email || undefined,
          role: 'seeker',
          status: 'active',
          terms_accepted_at: new Date().toISOString(),
          terms_version: 'v1'
        };

        const { error } = await dbClient.upsertSeeker(payload);
        if (error) throw error;
      } else {
        const payload: any = {
          id: user.id,
          company_name: companyName.trim() || 'Anonymous Employer',
          field_of_work: fieldOfWork.trim() || 'unspecified',
          region: region || 'Lusaka',
          contact_person: contactPerson.trim() || 'HR Manager',
          phone: phone.trim() || 'Not provided',
          email: user.email || undefined,
          role: 'employer',
          status: 'active',
          terms_accepted_at: new Date().toISOString(),
          terms_version: 'v1'
        };

        const { error } = await dbClient.upsertEmployer(payload);
        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/labour/dashboard');
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to bypass profile setup.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErrorMessage('');

    try {
      if (role === 'seeker') {
        if (!fullName || !trade || !phone) {
          throw new Error('Please fill out all required fields.');
        }

        const isFullNameValid = validateFullName(fullName);
        const isNrcNumberValid = validateNrcNumber(nrc);
        const isPhoneValid = validatePhoneNumber(phone);
        const isNapsaValid = validateNapsaNumber(napsaNumber);

        if (!isFullNameValid || !isNrcNumberValid || !isPhoneValid || !isNapsaValid) {
          throw new Error('Please correct the validation errors in the form.');
        }


        setUploadingFiles(true);
        let finalPhotoUrl = '';
        let finalCertUrls: string[] = [];
        let finalNrcPhotoUrl = '';

        if (photoFile) {
          const { url, error: uploadErr } = await dbClient.uploadPhoto(user.id, photoFile, 'photo');
          if (uploadErr) throw new Error(uploadErr.message);
          finalPhotoUrl = url || '';
        }

        if (nrcFile) {
          const { url, error: uploadErr } = await dbClient.uploadCertificate(user.id, nrcFile);
          if (uploadErr) throw new Error(uploadErr.message);
          finalNrcPhotoUrl = url || '';
        }

        for (const certFile of certFiles) {
          const { url, error: uploadErr } = await dbClient.uploadCertificate(user.id, certFile);
          if (uploadErr) throw new Error(uploadErr.message);
          if (url) finalCertUrls.push(url);
        }
        setUploadingFiles(false);

        const { error } = await dbClient.upsertSeeker({
          id: user.id,
          full_name: fullName,
          trade: trade.toLowerCase(),
          region,
          availability,
          phone,
          email: user.email || undefined,
          role: 'seeker',
          status: 'active',
          photo_url: finalPhotoUrl || (photoPreview?.startsWith('http') ? photoPreview : undefined),
          nrc: nrc || undefined,
          nrc_photo_url: finalNrcPhotoUrl || nrcPhotoUrl || undefined,
          certifications: certifications.length > 0 ? certifications : undefined,
          certificate_urls: [...finalCertUrls, ...existingCertUrls].length > 0 ? [...finalCertUrls, ...existingCertUrls] : undefined,
          experience_summary: experienceSummary || undefined,
          previous_jobs: previousJobs.length > 0 ? previousJobs : undefined,
          terms_accepted_at: new Date().toISOString(),
          terms_version: 'v1',
          napsa_number: napsaNumber || undefined,
          trade_assessment: Object.keys(tradeAssessment).length > 0 ? tradeAssessment : undefined
        });

        if (error) throw error;
      } else {
        if (!companyName || !fieldOfWork || !contactPerson || !phone) {
          throw new Error('Please fill out all required fields.');
        }

        const isCompanyNameValid = validateCompanyName(companyName);
        const isContactPersonValid = validateContactPerson(contactPerson);
        const isPhoneValid = validatePhoneNumber(phone);
        const isTpinValid = validateTpinNumber(tpin);

        if (!isCompanyNameValid || !isContactPersonValid || !isPhoneValid || !isTpinValid) {
          throw new Error('Please correct the validation errors in the form.');
        }

        setUploadingFiles(true);
        let finalLogoUrl = '';
        let finalPacraUrl = '';
        if (logoFile) {
          const { url, error: uploadErr } = await dbClient.uploadPhoto(user.id, logoFile, 'logo');
          if (uploadErr) throw new Error(uploadErr.message);
          finalLogoUrl = url || '';
        }
        if (pacraFile) {
          const { url, error: uploadErr } = await dbClient.uploadCertificate(user.id, pacraFile);
          if (uploadErr) throw new Error(uploadErr.message);
          finalPacraUrl = url || '';
        }
        setUploadingFiles(false);

        const { error } = await dbClient.upsertEmployer({
          id: user.id,
          company_name: companyName,
          field_of_work: fieldOfWork,
          region,
          contact_person: contactPerson,
          phone,
          email: user.email || undefined,
          role: 'employer',
          status: 'active',
          logo_url: finalLogoUrl || (logoPreview?.startsWith('http') ? logoPreview : undefined),
          pacra_certificate_url: finalPacraUrl || pacraCertificateUrl || undefined,
          terms_accepted_at: new Date().toISOString(),
          terms_version: 'v1',
          tpin: tpin || undefined
        });

        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/labour/dashboard');
      }, 1500);

    } catch (err: any) {
      if (err.message?.toLowerCase().includes('failed to fetch')) {
        console.warn('Profile Setup Failure / Network error (handled):', err);
        setShowConfigPrompt(true);
      } else {
        console.error('Profile Setup Failure:', err);
      }
      setErrorMessage(err.message || 'An error occurred while saving your info.');
    } finally {
      setSaving(false);
      setUploadingFiles(false);
    }
  };

  const handleDisableSandbox = () => {
    deactivateSandbox();
    window.location.reload();
  };

  if (showConfigPrompt && !isSandboxActive()) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-center py-10">
        <SupabaseErrorPrompt 
          customMessage="Setting up your professional registry profile requires Supabase database connection. Please configure VITE_SUPABASE_URL or enter Sandbox Mode below."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-[#C41E3A] mb-4" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B2A4A]">Loading Profile Status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] py-6 md:py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#C41E3A]/10 relative">
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
      <div className="bg-white rounded-xl shadow border border-slate-100 max-w-3xl mx-auto p-4 sm:p-6 md:p-8 mt-4 md:mt-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C41E3A] to-[#1B2A4A]" />
        
        <button
          type="button"
          onClick={() => navigate('/labour')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1B2A4A] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Progress header */}
        <div className="mb-6 border-b border-[#1B2A4A]/10 pb-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C41E3A] block mb-1">FINAL STEP</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1B2A4A]">
            Complete Your Profile
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {role === 'seeker' 
              ? 'Tell Zambian employers about your trades & skills so they can hire you.'
              : 'Tell Zambian professionals about your organisation & construction environment.'}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-rose-50 border-l-4 border-[#C41E3A] text-[#C41E3A] rounded-r-xl text-xs p-3.5 flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 rounded-r-xl text-xs p-3.5 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span className="font-bold">Profile registered successfully! Opening dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {role === 'seeker' ? (
            /* SEEKER FORM */
            <>
              {/* Row 1: Full Name & Primary Trade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (fullNameError) validateFullName(e.target.value);
                      }}
                      onBlur={() => validateFullName(fullName)}
                      placeholder="Enter your full name"
                      className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                    />
                  </div>
                  {fullNameError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{fullNameError}</p>}
                </div>

                {/* Trade Title */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Primary Trade/Skill Role
                  </label>
                  <div className="relative mb-2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Briefcase size={16} />
                    </div>
                    <select
                      required
                      value={tradeCategory}
                      onChange={(e) => {
                        setTradeCategory(e.target.value);
                        setTradeSpecialisation('');
                        setTrade(e.target.value);
                      }}
                      className="block w-full pl-10 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium appearance-none"
                    >
                      <option value="">Select trade category...</option>
                      {Object.keys(ZAMBIAN_TRADES).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  {tradeCategory && (
                    <div className="relative">
                      <select
                        required
                        value={tradeSpecialisation}
                        onChange={(e) => {
                          setTradeSpecialisation(e.target.value);
                          setTrade(e.target.value);
                        }}
                        className="block w-full px-3 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium appearance-none"
                      >
                        <option value="">Select specialisation...</option>
                        {ZAMBIAN_TRADES[tradeCategory].map((spec) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Use standard trade words to help recruiters search more accurately.</p>
                </div>
              </div>

              {/* Row 2: Province / Region & Job Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Zambian Region (Province)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="block w-full pl-10 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium appearance-none"
                    >
                      {PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>{prov} Province</option>
                      ))}
                    </select>
                    {/* Add an indicator since we removed default arrow look */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Job Availability
                  </label>
                  <div className="relative">
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="block w-full px-3 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium appearance-none"
                    >
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Mobile Number & NRC Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Phone Field */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Mobile Number (With WhatsApp availability preferred)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={14}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) validatePhoneNumber(e.target.value);
                      }}
                      onBlur={() => validatePhoneNumber(phone)}
                      placeholder="e.g. +260 96 233 4797"
                      className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                    />
                  </div>
                  {phoneError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{phoneError}</p>}
                </div>

                {/* National Registration Card (NRC) */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    National Registration Card (NRC) Number
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={nrc}
                    onChange={(e) => {
                      setNrc(e.target.value);
                      if (nrcFormatError) validateNrcNumber(e.target.value);
                    }}
                    onBlur={() => validateNrcNumber(nrc)}
                    placeholder="e.g. 111111/11/1"
                    className="block w-full px-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Zambian NRC format is required for registry verification.</p>
                  {nrcFormatError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{nrcFormatError}</p>}
                </div>
              </div>

              {/* Row 4: NAPSA Number & Experience Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* NAPSA Number (Optional) */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    NAPSA Number (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={napsaNumber}
                    onChange={(e) => {
                      setNapsaNumber(e.target.value);
                      if (napsaNumberError) validateNapsaNumber(e.target.value);
                    }}
                    onBlur={() => validateNapsaNumber(napsaNumber)}
                    placeholder="e.g. 123456789"
                    className="block w-full px-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">If you're already registered with NAPSA, enter your number here.</p>
                  {napsaNumberError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{napsaNumberError}</p>}
                </div>

                {/* Experience Summary */}
                <div className="flex flex-col justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Professional Experience Summary
                  </label>
                  <textarea
                    rows={3}
                    value={experienceSummary}
                    onChange={(e) => setExperienceSummary(e.target.value)}
                    placeholder="Summarise your professional skills, trade expertise, and industrial environments you have operated in..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-medium bg-[#F4F5F7] placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Row 5: Profile Photo & NRC Photo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-8">
                {/* Profile Image & Presets */}
                <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-4 flex flex-col justify-center min-h-[114px]">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">Profile Photo</label>
                  <div className="flex gap-3 items-center">
                    <div className="h-16 w-16 shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <User size={24} className="text-[#1B2A4A]/40" />
                      )}
                    </div>
                    <div className="grow space-y-1">
                      <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#243c5c] text-white text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors inline-block">
                        {photoFile ? 'Change Photo' : 'Upload Photo'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} className="hidden" />
                      </label>
                      <p className="text-[10px] text-gray-400 mt-1">JPG, PNG or WEBP — max 2MB</p>
                      {photoFile && <p className="text-[10px] text-green-600 font-bold truncate max-w-[180px]">{photoFile.name}</p>}
                    </div>
                  </div>
                </div>

                {/* NRC Photo Upload Section */}
                <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-4 flex flex-col justify-center min-h-[114px]">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    NRC Photo <span className="text-gray-400 font-normal normal-case tracking-normal">(optional — upload later)</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed mb-3">Upload a clear photo of your National Registration Card (front side). You can upload this after completing your profile.</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3 items-center">
                      <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#243c5c] text-white text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors inline-block">
                        {nrcFile ? 'Change NRC Photo' : 'Upload NRC Photo'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleNrcFileSelect} className="hidden" />
                      </label>
                      {nrcFile && (
                        <button
                          type="button"
                          onClick={handleRemoveNrcFile}
                          className="text-[#C41E3A] hover:text-[#A9172F] text-xs font-bold hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {nrcPhotoUrl && !nrcFile && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 border border-emerald-200">Already Uploaded</span>
                        <a href={nrcPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#1B2A4A] hover:underline">View Current NRC Photo</a>
                      </div>
                    )}
                    {nrcFile && <p className="text-[10px] text-green-600 font-bold truncate max-w-[280px]">{nrcFile.name}</p>}
                    {nrcError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{nrcError}</p>}
                  </div>
                </div>
              </div>

              {/* Row 6: Certifications list & Certificate file uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Certifications (Interactive Badges) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Trade Certifications & Licenses
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCertification}
                      onChange={(e) => setNewCertification(e.target.value)}
                      placeholder="e.g. TEVETA Grade One Welding, NCC Safety Permit"
                      className="block w-full px-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleAddCertification}
                      className="bg-[#1B2A4A] text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-[#243c5c] transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                  {certifications.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 max-h-[140px] overflow-y-auto">
                      {certifications.map((cert, index) => (
                        <span 
                           key={index} 
                           className="bg-[#1B2A4A]/5 text-[#1B2A4A] border border-[#1B2A4A]/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5"
                        >
                          {cert}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveCertification(index)}
                            className="text-[#C41E3A] hover:text-[#A9172F] font-bold ml-1 text-sm focus:outline-none"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Certificate Documents Section */}
                <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-4 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Certificate Documents <span className="text-[#1B2A4A]/40 font-medium normal-case">(max 5 files)</span>
                  </label>
                  {certFiles.length + existingCertUrls.length < 5 && (
                    <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#243c5c] text-white text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors inline-block">
                      Add Certificate File
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleCertFileSelect}
                        className="hidden"
                        multiple
                      />
                    </label>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX — max 5MB each</p>
                  {existingCertUrls.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Already Uploaded:</p>
                      {existingCertUrls.map((url, i) => (
                        <div key={i} className="flex items-center justify-between bg-white border border-emerald-100 px-3 py-2 text-xs">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 truncate max-w-[200px] hover:underline">
                            Certificate #{i + 1}
                          </a>
                          <button
                            type="button"
                            onClick={() => setExistingCertUrls(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-[#C41E3A] hover:text-[#A9172F] font-bold text-sm ml-2 shrink-0"
                            title="Remove Certificate"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {certFiles.length > 0 && (
                    <div className="space-y-1.5 mt-2 max-h-[120px] overflow-y-auto">
                      {certFiles.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white border border-slate-100 px-3 py-2 text-xs">
                          <span className="font-semibold text-[#1B2A4A] truncate max-w-[200px]">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertFile(i)}
                            className="text-[#C41E3A] hover:text-[#A9172F] font-bold text-sm ml-2 shrink-0"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Jobs Registry (Interactive Timeline Builder) */}
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-5 mt-8 space-y-3">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                  Previous Employment History
                </label>
                
                {previousJobs.length > 0 && (
                  <div className="space-y-2 border-b border-[#1B2A4A]/10 pb-3">
                    {previousJobs.map((job, idx) => (
                      <div key={idx} className="flex justify-between items-start bg-white p-2.5 border border-slate-100 text-xs relative">
                        <div>
                          <strong className="text-[#0A0A0A] font-black uppercase block tracking-wide">{job.company}</strong>
                          <span className="text-[#1B2A4A]/70 font-semibold">{job.role} ({job.duration})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePreviousJob(idx)}
                          className="text-[#C41E3A] hover:text-[#A9172F] font-bold text-base focus:outline-none absolute top-1 right-2.5"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={tempCompany}
                    onChange={(e) => setTempCompany(e.target.value)}
                    placeholder="Company Name (e.g. Mopani Mines)"
                    className="block w-full px-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                  />
                  <input
                    type="text"
                    value={tempRole}
                    onChange={(e) => setTempRole(e.target.value)}
                    placeholder="Role (e.g. Structural Welder)"
                    className="block w-full px-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                  />
                  <input
                    type="text"
                    value={tempDuration}
                    onChange={(e) => setTempDuration(e.target.value)}
                    placeholder="Duration/Years (e.g. 2021 - 2024)"
                    className="block w-full px-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddPreviousJob}
                    className="bg-[#C41E3A] hover:bg-[#A9172F] text-white text-xs font-bold tracking-[0.12em] uppercase w-full h-[44px] rounded-lg transition-colors"
                  >
                    Add Employment Row
                  </button>
                </div>
              </div>

              {/* Trade Assessment Questionnaire */}
              {tradeCategory && TRADE_ASSESSMENT[tradeCategory] && (
                <div className="border border-gray-200 rounded-lg bg-gray-50 p-5 mt-8 space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                      Trade Assessment
                    </label>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Answer honestly — this helps employers understand your hands-on experience level.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {TRADE_ASSESSMENT[tradeCategory].map((item) => (
                      <div key={item.key} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center bg-white border border-gray-100 rounded px-4 py-3">
                        <p className="text-sm text-gray-700 font-medium">{item.question}</p>
                        <div className="flex gap-2">
                          {['Yes', 'No', 'In Training'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setTradeAssessment(prev => ({ ...prev, [item.key]: opt }))}
                              className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md border transition-colors duration-150 ${
                                tradeAssessment[item.key] === opt
                                  ? opt === 'Yes'
                                    ? 'bg-[#1B2A4A] text-white border-[#1B2A4A]'
                                    : opt === 'No'
                                    ? 'bg-[#C41E3A] text-white border-[#C41E3A]'
                                    : 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* EMPLOYER FORM */
            <>
              {/* Row 1: Company Name & Sector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Company Name */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Company / Organization Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        if (companyNameError) validateCompanyName(e.target.value);
                      }}
                      onBlur={() => validateCompanyName(companyName)}
                      placeholder="e.g. Copper Mining Supplies Ltd."
                      className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                    />
                  </div>
                  {companyNameError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{companyNameError}</p>}
                </div>

                {/* Sector / Field of Work */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Field of Work / Sector
                  </label>
                  <div className="space-y-3">
                    {selectedSectors.map((sector, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                          <div className="relative">
                            <select
                              value={sector.category}
                              onChange={(e) => {
                                const updated = [...selectedSectors];
                                updated[idx] = { category: e.target.value, specialisation: '' };
                                setSelectedSectors(updated);
                                setFieldOfWork(updated.filter(s => s.specialisation).map(s => s.specialisation).join(', ') || e.target.value);
                              }}
                              className="block w-full px-3 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium appearance-none"
                            >
                              <option value="">Select sector...</option>
                              {Object.keys(EMPLOYER_SECTORS).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                          </div>
                          {sector.category && (
                            <div className="relative">
                              <select
                                value={sector.specialisation}
                                onChange={(e) => {
                                  const updated = [...selectedSectors];
                                  updated[idx] = { ...updated[idx], specialisation: e.target.value };
                                  setSelectedSectors(updated);
                                  setFieldOfWork(updated.filter(s => s.specialisation).map(s => s.specialisation).join(', '));
                                }}
                                className="block w-full px-3 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium appearance-none"
                              >
                                <option value="">Select specialisation...</option>
                                {EMPLOYER_SECTORS[sector.category].map(spec => (
                                  <option key={spec} value={spec}>{spec}</option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
                            </div>
                          )}
                        </div>
                        {selectedSectors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedSectors.filter((_, i) => i !== idx);
                              setSelectedSectors(updated);
                              setFieldOfWork(updated.filter(s => s.specialisation).map(s => s.specialisation).join(', '));
                            }}
                            className="text-[#C41E3A] text-xs font-bold border border-[#C41E3A]/30 rounded px-2 py-1.5 hover:bg-rose-50 transition-colors shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {/* Selected sectors as tags */}
                    {selectedSectors.some(s => s.specialisation) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedSectors.filter(s => s.specialisation).map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 bg-[#1B2A4A]/8 text-[#1B2A4A] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#1B2A4A]/15">
                            {s.specialisation}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedSectors(prev => [...prev, { category: '', specialisation: '' }])}
                      className="text-xs font-bold text-[#1B2A4A] border border-[#1B2A4A]/20 rounded-lg px-4 py-2 hover:border-[#1B2A4A] hover:bg-[#1B2A4A]/5 transition-all animate-none"
                    >
                      + Add Another Sector
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">Select all sectors your company operates in. You can add multiple.</p>
                </div>
              </div>

              {/* Row 2: Base Region & Contact Person */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Zambian region */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Primary Regional Base
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MapPin size={16} />
                    </div>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="block w-full pl-10 pr-8 h-[44px] border border-gray-200 text-sm rounded-lg focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium appearance-none"
                    >
                      {PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>{prov} Province</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Contact Person */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Primary Contact Person
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => {
                        setContactPerson(e.target.value);
                        if (contactPersonError) validateContactPerson(e.target.value);
                      }}
                      onBlur={() => validateContactPerson(contactPerson)}
                      placeholder="e.g. John Phiri (HR)"
                      className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                    />
                  </div>
                  {contactPersonError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{contactPersonError}</p>}
                </div>
              </div>

              {/* Row 3: Telephone & TPIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Phone */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    Telephone / HR Recruiter Mobile
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      required
                      maxLength={14}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (phoneError) validatePhoneNumber(e.target.value);
                      }}
                      onBlur={() => validatePhoneNumber(phone)}
                      placeholder="e.g. +260 97 123 4567"
                      className="block w-full pl-10 pr-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                    />
                  </div>
                  {phoneError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{phoneError}</p>}
                </div>

                {/* TPIN */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    TPIN (Taxpayer Identification Number)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={tpin}
                    onChange={(e) => {
                      setTpin(e.target.value);
                      if (tpinError) validateTpinNumber(e.target.value);
                    }}
                    onBlur={() => validateTpinNumber(tpin)}
                    placeholder="e.g. 1234567890"
                    className="block w-full px-3 h-[44px] border border-gray-200 text-sm rounded-lg placeholder-slate-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] bg-[#F4F5F7] text-slate-900 transition-colors font-medium"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">Your 10-digit ZRA Taxpayer Identification Number.</p>
                  {tpinError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{tpinError}</p>}
                </div>
              </div>

              {/* Row 4: Company Logo & PACRA Certificate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-8">
                {/* Company Logo Upload */}
                <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-4 flex flex-col justify-center min-h-[114px]">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">Company Logo</label>
                  <div className="flex gap-3 items-center">
                    <div className="h-16 w-16 shrink-0 bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-cover" />
                      ) : (
                        <Building2 size={24} className="text-[#1B2A4A]/40" />
                      )}
                    </div>
                    <div className="grow space-y-1">
                      <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#243c5c] text-white text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors inline-block">
                        {logoFile ? 'Change Logo' : 'Upload Logo'}
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoSelect} className="hidden" />
                      </label>
                      <p className="text-[10px] text-gray-400 mt-1">JPG, PNG or WEBP — max 2MB</p>
                      {logoFile && <p className="text-[10px] text-green-600 font-bold truncate max-w-[180px]">{logoFile.name}</p>}
                    </div>
                  </div>
                </div>

                {/* PACRA Certificate */}
                <div className="border border-dashed border-gray-200 rounded-lg bg-gray-50 px-4 py-4 flex flex-col justify-center min-h-[114px]">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5 block">
                    PACRA Certificate <span className="text-gray-400 font-normal normal-case tracking-normal">(optional — upload later)</span>
                  </label>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed mb-3">Upload your Certificate of Incorporation / PACRA registration (PDF or image, max 5MB). You can upload this after completing your profile.</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3 items-center">
                      <label className="cursor-pointer bg-[#1B2A4A] hover:bg-[#243c5c] text-white text-xs font-bold uppercase tracking-wide px-4 py-2 rounded-lg transition-colors inline-block">
                        {pacraFile ? 'Change PACRA' : 'Upload PACRA'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handlePacraSelect} className="hidden" />
                      </label>
                      {pacraFile && (
                        <button
                          type="button"
                          onClick={handleRemovePacraFile}
                          className="text-[#C41E3A] hover:text-[#A9172F] text-xs font-bold hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    {pacraCertificateUrl && !pacraFile && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 border border-emerald-200">Already Uploaded</span>
                        <a href={pacraCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#1B2A4A] hover:underline">View Current PACRA</a>
                      </div>
                    )}
                    {pacraFile && <p className="text-[10px] text-green-600 font-bold truncate max-w-[280px]">{pacraFile.name}</p>}
                    {pacraError && <p className="text-xs text-[#C41E3A] font-bold mt-1">{pacraError}</p>}
                  </div>
                </div>
              </div>
            </>
          )}
 
          {/* Action Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving || uploadingFiles}
              className="bg-[#C41E3A] hover:bg-[#A9172F] text-white font-black text-sm tracking-[0.2em] uppercase w-full py-4 rounded-lg mt-8 transition-colors duration-200 shadow-md disabled:opacity-60"
            >
              {uploadingFiles ? 'Uploading Files...' : saving ? 'Saving Profile...' : 'Save Profile & Enter Portal →'}
            </button>
            <button
              type="button"
              onClick={handleSkipAndCompleteLater}
              disabled={saving || uploadingFiles}
              className="border border-slate-200 text-slate-500 hover:text-[#1B2A4A] text-xs font-bold uppercase tracking-wider py-3 px-6 w-full mt-2 cursor-pointer rounded-lg transition-all disabled:opacity-60 text-center block"
            >
              Skip for now — Complete profile later
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
