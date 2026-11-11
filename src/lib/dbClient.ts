import { supabase } from './supabase';

export interface Seeker {
  id: string;
  full_name: string;
  trade: string;
  region: string;
  availability: string;
  phone: string;
  email?: string;
  role?: string;
  status: string;
  created_at: string;
  photo_url?: string;
  nrc?: string;
  certifications?: string[];
  certificate_urls?: any[];
  experience_summary?: string;
  previous_jobs?: { company: string; role: string; duration: string }[];
  terms_accepted_at?: string;
  terms_version?: string;
  nrc_photo_url?: string;
  id_verified?: boolean;
  updated_at?: string;
  napsa_number?: string;
  availability_status?: 'available' | 'placed' | 'not_looking';
  admin_notes?: string;
  trade_assessment?: Record<string, string>;
  auth_user_id?: string;
}

export interface Employer {
  id: string;
  company_name: string;
  field_of_work: string;
  region: string;
  contact_person: string;
  phone: string;
  email?: string;
  role?: string;
  status: string;
  created_at: string;
  logo_url?: string;
  pacra_certificate_url?: string;
  terms_accepted_at?: string;
  terms_version?: string;
  updated_at?: string;
  tpin?: string;
  admin_notes?: string;
}

export interface WorkerRequest {
  id: string;
  employer_id: string;
  worker_id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  employer_email?: string;
  direction?: 'employer_to_worker' | 'worker_to_employer';
  seeker_name?: string;
  seeker_phone?: string;
}

/* SQL: 
CREATE TABLE IF NOT EXISTS alfs_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY, 
  reporter_id text, 
  reported_user_id text, 
  report_type text, 
  details text, 
  status text DEFAULT 'pending', 
  created_at timestamptz DEFAULT now()
); 

ALTER TABLE alfs_labour_seekers ADD COLUMN IF NOT EXISTS admin_notes text; 
ALTER TABLE alfs_labour_employers ADD COLUMN IF NOT EXISTS admin_notes text; 
NOTIFY pgrst, 'reload schema'; 
*/
export interface AlfsReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: string;
  details: string;
  status: 'pending' | 'reviewed';
  created_at: string;
}

// Check if sandbox mode is activated
export function isSandboxActive(): boolean {
  return localStorage.getItem('alfs_sandbox_mode') === 'true';
}

export function activateSandbox() {
  localStorage.setItem('alfs_sandbox_mode', 'true');
  // Initialize some high fidelity Mock Data in local storage if not already there
  initializeSandboxData();
}

export function deactivateSandbox() {
  localStorage.removeItem('alfs_sandbox_mode');
}

// Prepopulate premium local storage demo records representing Zambian labor structures
function initializeSandboxData() {
  if (!localStorage.getItem('alfs_sb_users')) {
    localStorage.setItem('alfs_sb_users', JSON.stringify({
      'worker1@alfs.com': { id: 'sb-worker-1', email: 'worker1@alfs.com', role: 'seeker' },
      'employer1@alfs.com': { id: 'sb-employer-1', email: 'employer1@alfs.com', role: 'employer' },
      'admin@alfslimited.com': { id: 'sb-admin', email: 'admin@alfslimited.com', role: 'admin' }
    }));
  }

  if (!localStorage.getItem('alfs_sb_seekers')) {
    const mockSeekers: Seeker[] = [
      {
        id: 'sb-worker-1',
        full_name: 'Mwansa Chilufya',
        trade: 'certified structural welder',
        region: 'Copperbelt',
        availability: 'Full-Time',
        phone: '+260 96 588 4321',
        status: 'active',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        nrc: '493812/11/1',
        certifications: ['TEVETA Grade One Structural Welding', 'AWS Certified Welder (D1.1)', 'NCC Site Safety Certification'],
        certificate_urls: [],
        experience_summary: 'Over 8 years of industrial welding experience specializing in pressure vessel and high-rise structural alignments across the Copperbelt Mines.',
        previous_jobs: [
          { company: 'Mopani Copper Mines plc', role: 'Chief Structural Welder', duration: '2021 - 2024' },
          { company: 'Ndola Steel Fabrication Ltd', role: 'Welding Technician', duration: '2016 - 2021' }
        ]
      },
      {
        id: 'sb-seeker-2',
        full_name: 'Banda Josephat',
        trade: 'heavy mining machinery operator',
        region: 'North-Western',
        availability: 'Contract',
        phone: '+260 97 810 5990',
        status: 'active',
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        nrc: '284091/22/1',
        certifications: ['Zambian Heavy Machinery Operation Permit (Class A)', 'First Aid Rescuer Plus'],
        certificate_urls: [],
        experience_summary: 'Licensed heavy machinery operator specialized in open-cast excavator, dumper trucks, and high-altitude loaders operations.',
        previous_jobs: [
          { company: 'Kansanshi Copper Mines', role: 'Lead Excavator Operator', duration: '2020 - 2024' },
          { company: 'Sinohydro Zambia', role: 'Heavy Equipment Driver', duration: '2017 - 2020' }
        ]
      },
      {
        id: 'sb-seeker-3',
        full_name: 'Lumbwe Musonda',
        trade: 'industrial electrician (high voltage)',
        region: 'Lusaka',
        availability: 'Part-Time',
        phone: '+260 95 311 8802',
        status: 'active',
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        nrc: '782910/33/1',
        certifications: ['EIZ Certified Engineering Technician', 'ZESCO High-Voltage License B', 'TEVETA Electrical Diploma'],
        certificate_urls: [],
        experience_summary: 'Experienced industrial electrician specializing in high voltage commercial transformers, switchgear maintenance, and PLC systems integration.',
        previous_jobs: [
          { company: 'ZESCO Limited', role: 'Transformer Commissioning Officer', duration: '2022 - 2024' },
          { company: 'Lusaka Infrastructure Group', role: 'HV Technician', duration: '2019 - 2022' }
        ]
      },
      {
        id: 'sb-seeker-4',
        full_name: 'Kondwani Phiri',
        trade: 'scaffold safety supervisor',
        region: 'Copperbelt',
        availability: 'Contract',
        phone: '+260 96 112 3944',
        status: 'active',
        created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
        photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        nrc: '190283/44/1',
        certifications: ['OSHA Scaffolding Safety Standard Level 3', 'NEBOSH Construction Hazard Identification'],
        certificate_urls: [],
        experience_summary: 'Certified scaffolding inspector and safety inspector. Specializing in high-altitude construction rigging safety protocols.',
        previous_jobs: [
          { company: 'Chibuluma Mines Plc', role: 'Rigging Safety Lead', duration: '2021 - 2023' },
          { company: 'Kone Elevators Zambia', role: 'Lead Scaffolder', duration: '2018 - 2021' }
        ]
      },
      {
        id: 'sb-seeker-5',
        full_name: 'Nalwamba Mutale',
        trade: 'underground diesel mechanic',
        region: 'Muchinga',
        availability: 'Casual/Temporary',
        phone: '+260 97 400 3121',
        status: 'suspended',
        created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
        photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        nrc: '502911/55/1',
        certifications: ['Heavy Duty Diesel Repair Diploma', 'Underground Mine Safety Gold Permit'],
        certificate_urls: [],
        experience_summary: 'Experienced heavy-duty machinery technician specialized in rebuilding diesel train systems and drilling rig hydraulics underground.',
        previous_jobs: [
          { company: 'Lubambe Copper Basin', role: 'Hydraulic systems Specialist', duration: '2022 - 2024' }
        ]
      }
    ];
    localStorage.setItem('alfs_sb_seekers', JSON.stringify(mockSeekers));
  }

  if (!localStorage.getItem('alfs_sb_employers')) {
    const mockEmployers: Employer[] = [
      {
        id: 'sb-employer-1',
        company_name: 'Lusaka Infrastructure Group',
        field_of_work: 'Commercial Highway Construction',
        region: 'Lusaka',
        contact_person: 'Chipo Kabwe (HR Director)',
        phone: '+260 96 444 8181',
        status: 'active',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        logo_url: undefined
      },
      {
        id: 'sb-employer-2',
        company_name: 'Kansanshi Copper Contractors',
        field_of_work: 'Heavy Open Cast Metal Extraction',
        region: 'North-Western',
        contact_person: 'Mutale Kampamba (Site Agent)',
        phone: '+260 211 445 929',
        status: 'active',
        created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
        logo_url: undefined
      },
      {
        id: 'sb-employer-3',
        company_name: 'Ndola Engineering Refineries',
        field_of_work: 'Chemical Pipeline & Smelter Installation',
        region: 'Copperbelt',
        contact_person: 'Gregory Sorensen (operations Manager)',
        phone: '+260 97 733 4410',
        status: 'active',
        created_at: new Date(Date.now() - 3600000 * 60).toISOString(),
        logo_url: undefined
      }
    ];
    localStorage.setItem('alfs_sb_employers', JSON.stringify(mockEmployers));
  }

  if (!localStorage.getItem('alfs_sb_requests')) {
    const mockRequests: WorkerRequest[] = [
      {
        id: 'sb-req-1',
        employer_id: 'sb-employer-1',
        worker_id: 'sb-worker-1',
        company_name: 'Lusaka Infrastructure Group',
        contact_person: 'Chipo Kabwe (HR Director)',
        phone: '+260 96 444 8181',
        message: 'We are interested in hiring Mwansa Chilufya for a 6-month structural welding contract on our Kafue road project.',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        employer_email: 'employer1@alfs.com',
        direction: 'employer_to_worker'
      },
      {
        id: 'sb-req-2',
        employer_id: 'sb-employer-2',
        worker_id: 'sb-seeker-2',
        company_name: 'Kansanshi Copper Contractors',
        contact_person: 'Mutale Kampamba (Site Agent)',
        phone: '+260 211 445 929',
        message: 'Requesting Banda Josephat for heavy excavator operation at our North-Western open cast site starting next month.',
        status: 'pending',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        employer_email: 'employer1@alfs.com',
        direction: 'employer_to_worker'
      }
    ];
    localStorage.setItem('alfs_sb_requests', JSON.stringify(mockRequests));
  }
}

// Safe check if real Supabase environment properties are loaded
export function isSupabasePropertiesLoaded(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes('placeholder') || key.includes('placeholder')) return false;
  return true;
}

// Unified Database Provider Client
export const dbClient = {
  // ---- AUTHENTICATION ----
  async signUp(email: string, passwordString: string, role: 'seeker' | 'employer', fullName?: string) {
    if (isSandboxActive()) {
      const users = JSON.parse(localStorage.getItem('alfs_sb_users') || '{}');
      if (users[email.toLowerCase()]) {
        throw new Error('User already exists in sandbox memory.');
      }
      
      const newId = 'sb-u-' + Math.random().toString(36).substr(2, 9);
      userSession.currentUser = {
        id: newId,
        email: email.toLowerCase(),
        user_metadata: { role, full_name: fullName }
      };
      
      users[email.toLowerCase()] = { id: newId, email: email.toLowerCase(), role, fullName };
      localStorage.setItem('alfs_sb_users', JSON.stringify(users));
      
      return { data: { user: userSession.currentUser }, error: null };
    }

    return await supabase.auth.signUp({
      email,
      password: passwordString,
      options: {
        data: { role, full_name: fullName }
      }
    });
  },

  async signIn(email: string, passwordString: string) {
    if (isSandboxActive()) {
      const users = JSON.parse(localStorage.getItem('alfs_sb_users') || '{}');
      const found = users[email.toLowerCase()];
      if (!found) {
        throw new Error('User email not registered in Sandbox. Use worker1@alfs.com, employer1@alfs.com, admin@alfslimited.com, or sign up!');
      }
      
      userSession.currentUser = {
        id: found.id,
        email: found.email,
        user_metadata: { role: found.role, full_name: found.fullName }
      };
      
      return { data: { user: userSession.currentUser }, error: null };
    }

    return await supabase.auth.signInWithPassword({
      email,
      password: passwordString
    });
  },

  async signOut() {
    if (isSandboxActive()) {
      userSession.currentUser = null;
      return { error: null };
    }
    return await supabase.auth.signOut();
  },

  async getUser() {
    if (isSandboxActive()) {
      return { data: { user: userSession.currentUser || getFirstActiveSandboxUser() }, error: null };
    }
    try {
      const response = await supabase.auth.getUser();
      if (response.error) {
        throw response.error;
      }
      return response;
    } catch (err: any) {
      console.warn('Supabase getUser error:', err);
      const errMsg = String(err.message || err).toLowerCase();
      if (
        errMsg.includes('refresh_token') || 
        errMsg.includes('refresh token') || 
        errMsg.includes('invalid jwt') || 
        errMsg.includes('token not found') || 
        errMsg.includes('token is expired')
      ) {
        try {
          await supabase.auth.signOut().catch(() => {});
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('-auth-token'))) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          console.error('Failed to clear expired session:', e);
        }
      }
      return { data: { user: null }, error: err };
    }
  },

  async resetPasswordForEmail(email: string, redirectTo: string) {
    if (isSandboxActive()) {
      console.log(`[Sandbox Mode] Reset password request for ${email} pointing to ${redirectTo}`);
      return { data: {}, error: null };
    }
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
  },

  async updateUser(attributes: { password?: string }) {
    if (isSandboxActive()) {
      console.log(`[Sandbox Mode] Update user authentication:`, attributes);
      return { data: { user: userSession.currentUser }, error: null };
    }
    return await supabase.auth.updateUser(attributes);
  },

  async quickRegisterSeeker(params: {
    fullName: string;
    phone: string;
    email: string;
    trade: string;
    region: string;
    website?: string;
  }) {
    if (isSandboxActive()) {
      const seekers = JSON.parse(localStorage.getItem('alfs_sb_seekers') || '[]');
      const newId = 'sb-seeker-' + Math.random().toString(36).substr(2, 9);
      const newSeeker: Seeker = {
        id: newId,
        full_name: params.fullName,
        phone: params.phone,
        email: params.email,
        trade: params.trade,
        region: params.region,
        availability: 'Full-Time',
        status: 'active',
        created_at: new Date().toISOString()
      };
      seekers.push(newSeeker);
      localStorage.setItem('alfs_sb_seekers', JSON.stringify(seekers));

      const users = JSON.parse(localStorage.getItem('alfs_sb_users') || '{}');
      users[params.email.toLowerCase()] = { id: newId, email: params.email.toLowerCase(), role: 'seeker', fullName: params.fullName };
      localStorage.setItem('alfs_sb_users', JSON.stringify(users));

      return { error: null };
    }

    const tempPassword = Math.random().toString(36) + 'Aa1!@';
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: tempPassword,
      options: {
        data: {
          role: 'seeker',
          full_name: params.fullName
        }
      }
    });

    if (error) return { error };

    const userId = data.user?.id;
    if (userId) {
      const { error: insertError } = await supabase.from('alfs_labour_seekers').insert({
        full_name: params.fullName,
        phone: params.phone,
        email: params.email,
        trade: params.trade,
        region: params.region,
        availability: 'Full-Time',
        status: 'active',
        auth_user_id: userId
      });
      if (insertError) {
        console.error('Failed to create seeker profile after auth signup:', insertError);
        return { error: insertError };
      }
    }

    return { error: null };
  },

  // ---- WORKERS (SEEKERS) DIRECTORY ----
  async getSeekers(filters?: { status?: string, orderDescByDate?: boolean, userId?: string }) {
    if (isSandboxActive()) {
      let list: Seeker[] = JSON.parse(localStorage.getItem('alfs_sb_seekers') || '[]');
      if (filters?.status) {
        list = list.filter(s => s.status === filters.status);
      }
      if (filters?.userId) {
        list = list.filter(s => s.id === filters.userId);
      }
      if (filters?.orderDescByDate) {
        list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return { data: list, error: null };
    }

    let query = supabase.from('alfs_labour_seekers').select('*');
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.userId) {
      query = query.eq('id', filters.userId);
    }
    if (filters?.orderDescByDate) {
      query = query.order('created_at', { ascending: false });
    }
    return await query;
  },

  async upsertSeeker(record: Omit<Seeker, 'created_at'>) {
    if (isSandboxActive()) {
      const list: Seeker[] = JSON.parse(localStorage.getItem('alfs_sb_seekers') || '[]');
      const index = list.findIndex(s => s.id === record.id);
      
      const updatedRecord: Seeker = {
        ...record,
        created_at: index >= 0 ? list[index].created_at : new Date().toISOString()
      };

      if (index >= 0) {
        list[index] = updatedRecord;
      } else {
        list.push(updatedRecord);
      }

      localStorage.setItem('alfs_sb_seekers', JSON.stringify(list));
      return { error: null };
    }

    return await supabase.from('alfs_labour_seekers').upsert(record);
  },

  async updateSeeker(id: string, updates: Partial<Seeker>) {
    const updated_at = new Date().toISOString();
    const finalUpdates = { ...updates, updated_at };
    if (isSandboxActive()) {
      const list: Seeker[] = JSON.parse(localStorage.getItem('alfs_sb_seekers') || '[]');
      const index = list.findIndex(s => s.id === id);
      if (index >= 0) {
        list[index] = { ...list[index], ...finalUpdates };
        localStorage.setItem('alfs_sb_seekers', JSON.stringify(list));
      }
      return { error: null };
    }

    return await supabase.from('alfs_labour_seekers').update(finalUpdates).eq('id', id);
  },

  async deleteSeeker(id: string) {
    if (isSandboxActive()) {
      let list: Seeker[] = JSON.parse(localStorage.getItem('alfs_sb_seekers') || '[]');
      list = list.filter(s => s.id !== id);
      localStorage.setItem('alfs_sb_seekers', JSON.stringify(list));
      return { error: null };
    }

    return await supabase.from('alfs_labour_seekers').delete().eq('id', id);
  },


  // ---- EMPLOYERS (RECRUITERS) DIRECTORY ----
  async getEmployers(filters?: { status?: string, orderDescByDate?: boolean, userId?: string }) {
    if (isSandboxActive()) {
      let list: Employer[] = JSON.parse(localStorage.getItem('alfs_sb_employers') || '[]');
      if (filters?.status) {
        list = list.filter(e => e.status === filters.status);
      }
      if (filters?.userId) {
        list = list.filter(e => e.id === filters.userId);
      }
      if (filters?.orderDescByDate) {
        list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return { data: list, error: null };
    }

    let query = supabase.from('alfs_labour_employers').select('*');
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.userId) {
      query = query.eq('id', filters.userId);
    }
    if (filters?.orderDescByDate) {
      query = query.order('created_at', { ascending: false });
    }
    return await query;
  },

  async upsertEmployer(record: Omit<Employer, 'created_at'>) {
    if (isSandboxActive()) {
      const list: Employer[] = JSON.parse(localStorage.getItem('alfs_sb_employers') || '[]');
      const index = list.findIndex(e => e.id === record.id);
      
      const updatedRecord: Employer = {
        ...record,
        created_at: index >= 0 ? list[index].created_at : new Date().toISOString()
      };

      if (index >= 0) {
        list[index] = updatedRecord;
      } else {
        list.push(updatedRecord);
      }

      localStorage.setItem('alfs_sb_employers', JSON.stringify(list));
      return { error: null };
    }

    return await supabase.from('alfs_labour_employers').upsert(record);
  },

  async updateEmployer(id: string, updates: Partial<Employer>) {
    const updated_at = new Date().toISOString();
    const finalUpdates = { ...updates, updated_at };
    if (isSandboxActive()) {
      const list: Employer[] = JSON.parse(localStorage.getItem('alfs_sb_employers') || '[]');
      const index = list.findIndex(e => e.id === id);
      if (index >= 0) {
        list[index] = { ...list[index], ...finalUpdates };
        localStorage.setItem('alfs_sb_employers', JSON.stringify(list));
      }
      return { error: null };
    }

    return await supabase.from('alfs_labour_employers').update(finalUpdates).eq('id', id);
  },

  async deleteEmployer(id: string) {
    if (isSandboxActive()) {
      let list: Employer[] = JSON.parse(localStorage.getItem('alfs_sb_employers') || '[]');
      list = list.filter(e => e.id !== id);
      localStorage.setItem('alfs_sb_employers', JSON.stringify(list));
      return { error: null };
    }

    return await supabase.from('alfs_labour_employers').delete().eq('id', id);
  },

  async deleteUserAccount(userId: string) {
    if (isSandboxActive()) {
      // Remove from all sandbox stores
      const users = JSON.parse(localStorage.getItem('alfs_sb_users') || '{}');
      const updatedUsers = Object.fromEntries(
        Object.entries(users).filter(([_, u]: any) => u.id !== userId)
      );
      localStorage.setItem('alfs_sb_users', JSON.stringify(updatedUsers));

      let seekers = JSON.parse(localStorage.getItem('alfs_sb_seekers') || '[]');
      seekers = seekers.filter((s: any) => s.id !== userId);
      localStorage.setItem('alfs_sb_seekers', JSON.stringify(seekers));

      let employers = JSON.parse(localStorage.getItem('alfs_sb_employers') || '[]');
      employers = employers.filter((e: any) => e.id !== userId);
      localStorage.setItem('alfs_sb_employers', JSON.stringify(employers));

      return { error: null };
    }
    const { error } = await supabase.rpc('delete_user_account', { 
      target_user_id: userId 
    });
    return { error };
  },

  // ---- WORKER REQUESTS ----
  async uploadPhoto(userId: string, file: File, type: 'photo' | 'logo' = 'photo') {
    if (isSandboxActive()) {
      return { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', error: null };
    }
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { url: null, error: { message: 'Image must be under 2MB.' } };
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return { url: null, error: { message: 'Only JPG, PNG, and WEBP images are allowed.' } };
    }
    const fileName = `${userId}/${type}_${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('labour-avatars')
      .upload(fileName, file, { upsert: true });
    if (error) return { url: null, error };
    const { data } = supabase.storage
      .from('labour-avatars')
      .getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  },

  async uploadCertificate(userId: string, file: File) {
    if (isSandboxActive()) {
      return { url: `https://sandbox-cert-url/${file.name}`, error: null };
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { url: null, error: { message: 'Certificate file must be under 5MB.' } };
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      return { url: null, error: { message: 'Only PDF, JPG, PNG, DOC, and DOCX files are allowed.' } };
    }
    const fileName = `${userId}/certs/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from('labour-avatars')
      .upload(fileName, file, { upsert: false });
    if (error) return { url: null, error };
    const { data } = supabase.storage
      .from('labour-avatars')
      .getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
  },

  async createRequest(record: Omit<WorkerRequest, 'id' | 'created_at'>) {
    if (isSandboxActive()) {
      const list: WorkerRequest[] = JSON.parse(localStorage.getItem('alfs_sb_requests') || '[]');
      const duplicate = list.find(r => r.employer_id === record.employer_id && r.worker_id === record.worker_id && r.status === 'pending');
      if (duplicate) {
        return { data: null, error: { message: 'A pending request already exists between this worker and employer.' } };
      }
      const newRequest: WorkerRequest = {
        ...record,
        id: 'sb-req-' + Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      };
      list.push(newRequest);
      localStorage.setItem('alfs_sb_requests', JSON.stringify(list));
      return { data: newRequest, error: null };
    }

    const { data: existing, error: checkError } = await supabase
      .from('alfs_labour_requests')
      .select('id')
      .eq('employer_id', record.employer_id)
      .eq('worker_id', record.worker_id)
      .eq('status', 'pending');

    if (existing && existing.length > 0) {
      return { data: null, error: { message: 'A pending request already exists between this worker and employer.' } };
    }

    return await supabase.from('alfs_labour_requests').insert(record).select().single();
  },

  async getRequests(filters?: { employerId?: string; workerId?: string; status?: string }) {
    if (isSandboxActive()) {
      let list: WorkerRequest[] = JSON.parse(localStorage.getItem('alfs_sb_requests') || '[]');
      if (filters?.employerId) list = list.filter(r => r.employer_id === filters.employerId);
      if (filters?.workerId) list = list.filter(r => r.worker_id === filters.workerId);
      if (filters?.status) list = list.filter(r => r.status === filters.status);
      return { data: list, error: null };
    }
    let query = supabase.from('alfs_labour_requests').select('*');
    if (filters?.employerId) query = query.eq('employer_id', filters.employerId);
    if (filters?.workerId) query = query.eq('worker_id', filters.workerId);
    if (filters?.status) query = query.eq('status', filters.status);
    return await query;
  },

  async cancelRequest(id: string) {
    if (isSandboxActive()) {
      let list: WorkerRequest[] = JSON.parse(localStorage.getItem('alfs_sb_requests') || '[]');
      list = list.filter(r => r.id !== id);
      localStorage.setItem('alfs_sb_requests', JSON.stringify(list));
      return { error: null };
    }
    return await supabase.from('alfs_labour_requests').delete().eq('id', id);
  },

  async deleteRequest(id: string) {
    if (isSandboxActive()) {
      let list: WorkerRequest[] = JSON.parse(localStorage.getItem('alfs_sb_requests') || '[]');
      list = list.filter(r => r.id !== id);
      localStorage.setItem('alfs_sb_requests', JSON.stringify(list));
      return { error: null };
    }
    return await supabase.from('alfs_labour_requests').delete().eq('id', id);
  },

  async updateRequestStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
    if (isSandboxActive()) {
      const list: WorkerRequest[] = JSON.parse(localStorage.getItem('alfs_sb_requests') || '[]');
      const index = list.findIndex(r => r.id === id);
      if (index >= 0) {
        list[index].status = status;
        localStorage.setItem('alfs_sb_requests', JSON.stringify(list));
      }
      return { error: null };
    }
    return await supabase.from('alfs_labour_requests').update({ status }).eq('id', id);
  },

  // ---- REPORTS ----
  async submitReport(record: { reporter_id: string; reported_user_id: string; report_type: string; details: string; }) {
    if (isSandboxActive()) {
      const list: AlfsReport[] = JSON.parse(localStorage.getItem('alfs_sb_reports') || '[]');
      const newReport: AlfsReport = {
        ...record,
        id: 'sb-rep-' + Math.random().toString(36).substr(2, 9),
        status: 'pending',
        created_at: new Date().toISOString()
      };
      list.push(newReport);
      localStorage.setItem('alfs_sb_reports', JSON.stringify(list));
      return { data: newReport, error: null };
    }
    return await supabase.from('alfs_reports').insert({ ...record, status: 'pending' }).select().single();
  },

  async getReports() {
    if (isSandboxActive()) {
      const list: AlfsReport[] = JSON.parse(localStorage.getItem('alfs_sb_reports') || '[]');
      return { data: list, error: null };
    }
    return await supabase.from('alfs_reports').select('*').order('created_at', { ascending: false });
  },

  async acknowledgeReport(id: string) {
    if (isSandboxActive()) {
      const list: AlfsReport[] = JSON.parse(localStorage.getItem('alfs_sb_reports') || '[]');
      const index = list.findIndex(r => r.id === id);
      if (index >= 0) {
        list[index].status = 'reviewed';
        localStorage.setItem('alfs_sb_reports', JSON.stringify(list));
      }
      return { error: null };
    }
    return await supabase.from('alfs_reports').update({ status: 'reviewed' }).eq('id', id);
  }
};

// Simple active session holder during memory sandbox runtime
class UserSession {
  private user: any = null;

  get currentUser() {
    const cached = sessionStorage.getItem('alfs_sb_active_user');
    if (cached) return JSON.parse(cached);
    return this.user;
  }

  set currentUser(u: any) {
    this.user = u;
    if (u) {
      sessionStorage.setItem('alfs_sb_active_user', JSON.stringify(u));
    } else {
      sessionStorage.removeItem('alfs_sb_active_user');
    }
  }
}

const userSession = new UserSession();

function getFirstActiveSandboxUser() {
  const activeCached = sessionStorage.getItem('alfs_sb_active_user');
  if (activeCached) {
    return JSON.parse(activeCached);
  }
  return null;
}
