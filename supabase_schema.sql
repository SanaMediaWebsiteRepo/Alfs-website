-- ============================================================================
-- ALFS Limited — Complete Supabase Database & Storage Setup
-- Designed and Created by Mupenda Chama
-- 
-- Instructions:
-- 1. Go to your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Open the "SQL Editor" from the left sidebar
-- 3. Paste this entire file into a new query and click "RUN"
-- ============================================================================

-- ============================================================================
-- 1. PRODUCTS & STORE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS alfs_products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  supplier TEXT,
  spec TEXT,
  colours TEXT[],
  description TEXT,
  image TEXT,
  fallback_image TEXT,
  features TEXT[],
  applications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS alfs_resellers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  show_name BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS alfs_site_config (
  id TEXT PRIMARY KEY,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS alfs_newsletter_subscribers (
  email TEXT PRIMARY KEY,
  full_name TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  source TEXT DEFAULT 'website'
);

-- ============================================================================
-- 2. LABOUR FORCE PORTAL TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS alfs_labour_seekers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  trade TEXT NOT NULL,
  region TEXT NOT NULL,
  availability TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'seeker' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  photo_url TEXT,
  nrc TEXT,
  nrc_photo_url TEXT,
  id_verified BOOLEAN DEFAULT false,
  certifications TEXT[],
  certificate_urls JSONB DEFAULT '[]'::jsonb,
  experience_summary TEXT,
  previous_jobs JSONB DEFAULT '[]'::jsonb,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  terms_version TEXT,
  napsa_number TEXT,
  availability_status TEXT DEFAULT 'available',
  admin_notes TEXT,
  trade_assessment JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS alfs_labour_employers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  field_of_work TEXT NOT NULL,
  region TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'employer' NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  logo_url TEXT,
  pacra_certificate_url TEXT,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  terms_version TEXT,
  tpin TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS alfs_labour_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID,
  worker_id UUID,
  company_name TEXT,
  contact_person TEXT,
  phone TEXT,
  employer_email TEXT,
  message TEXT,
  direction TEXT DEFAULT 'employer_to_worker',
  seeker_name TEXT,
  seeker_phone TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS alfs_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id TEXT,
  reported_user_id TEXT,
  report_type TEXT,
  details TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE alfs_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE alfs_resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alfs_site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE alfs_newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alfs_labour_seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alfs_labour_employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE alfs_labour_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE alfs_reports ENABLE ROW LEVEL SECURITY;

-- Products: Everyone can view, authenticated users can edit
DROP POLICY IF EXISTS "Public read products" ON alfs_products;
CREATE POLICY "Public read products" ON alfs_products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated manage products" ON alfs_products;
CREATE POLICY "Authenticated manage products" ON alfs_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Resellers: Everyone can view, authenticated users can edit
DROP POLICY IF EXISTS "Public read resellers" ON alfs_resellers;
CREATE POLICY "Public read resellers" ON alfs_resellers
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated manage resellers" ON alfs_resellers;
CREATE POLICY "Authenticated manage resellers" ON alfs_resellers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Site Config: Everyone can view, authenticated users can edit
DROP POLICY IF EXISTS "Public read site_config" ON alfs_site_config;
CREATE POLICY "Public read site_config" ON alfs_site_config
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated manage site_config" ON alfs_site_config;
CREATE POLICY "Authenticated manage site_config" ON alfs_site_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Newsletter: Anyone can subscribe, authenticated users can view/manage
DROP POLICY IF EXISTS "Public insert subscribers" ON alfs_newsletter_subscribers;
CREATE POLICY "Public insert subscribers" ON alfs_newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage subscribers" ON alfs_newsletter_subscribers;
CREATE POLICY "Authenticated manage subscribers" ON alfs_newsletter_subscribers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Labour Seekers: Public can view active profiles, users can update own, admin can do all
DROP POLICY IF EXISTS "Select active seekers" ON alfs_labour_seekers;
CREATE POLICY "Select active seekers" ON alfs_labour_seekers
  FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS "Insert own seeker" ON alfs_labour_seekers;
CREATE POLICY "Insert own seeker" ON alfs_labour_seekers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Update own seeker" ON alfs_labour_seekers;
CREATE POLICY "Update own seeker" ON alfs_labour_seekers
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Labour Employers: Public can view active employers, users can update own
DROP POLICY IF EXISTS "Select active employers" ON alfs_labour_employers;
CREATE POLICY "Select active employers" ON alfs_labour_employers
  FOR SELECT TO anon, authenticated USING (status = 'active');

DROP POLICY IF EXISTS "Insert own employer" ON alfs_labour_employers;
CREATE POLICY "Insert own employer" ON alfs_labour_employers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Update own employer" ON alfs_labour_employers;
CREATE POLICY "Update own employer" ON alfs_labour_employers
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Labour Requests: Authenticated users can manage requests
DROP POLICY IF EXISTS "Authenticated manage requests" ON alfs_labour_requests;
CREATE POLICY "Authenticated manage requests" ON alfs_labour_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reports: Authenticated users can insert and view
DROP POLICY IF EXISTS "Authenticated insert reports" ON alfs_reports;
CREATE POLICY "Authenticated insert reports" ON alfs_reports
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated manage reports" ON alfs_reports;
CREATE POLICY "Authenticated manage reports" ON alfs_reports
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. STORAGE BUCKETS & PUBLIC ACCESS (CRITICAL FOR IMAGES)
-- ============================================================================

-- Create storage buckets as PUBLIC so uploaded images display properly
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('labour-avatars', 'labour-avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies: Public Read access for product-images
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated Upload Product Images" ON storage.objects;
CREATE POLICY "Authenticated Upload Product Images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated Update Product Images" ON storage.objects;
CREATE POLICY "Authenticated Update Product Images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images');

-- Storage Policies: Public Read access for labour-avatars
DROP POLICY IF EXISTS "Public Read Labour Avatars" ON storage.objects;
CREATE POLICY "Public Read Labour Avatars" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'labour-avatars');

DROP POLICY IF EXISTS "Authenticated Upload Labour Avatars" ON storage.objects;
CREATE POLICY "Authenticated Upload Labour Avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'labour-avatars');

DROP POLICY IF EXISTS "Authenticated Update Labour Avatars" ON storage.objects;
CREATE POLICY "Authenticated Update Labour Avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'labour-avatars');

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
