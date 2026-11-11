# ALFS Limited — Web & Procurement Portal

> **Designed and Created by Mupenda Chama**  
> Official corporate website, safety procurement portal, and e-commerce store for **ALFS Limited** (Achilles Labour Force Services) — Lusaka & Chingola, Zambia.

---

## 🌟 Overview

**ALFS Limited** is Zambia's trusted standard for industrial safety gear, personal protective equipment (PPE), corporate workwear, and specialized labour workforce procurement.

This application provides a unified digital experience:
- **Corporate Website & Catalogue**: Comprehensive SABS-certified product showcase, downloadable compliance profiles, company certifications, and an interactive quotation builder with live PDF generation.
- **Online Safety Store (`/store`)**: High-performance mobile-first store featuring contractor discount tiers, category filtering, search, interactive product cards, a responsive mini-cart, and multi-province delivery calculations.
- **Labour Force Recruitment (`/labour`)**: Dedicated workforce supply portal connecting certified artisans, machine operators, safety officers, and general labour with industrial contractors across Zambia.

---

## ✨ Key Features

### 🛒 Online Safety Store
- **Product Catalogue**: Safety Footwear, High-Visibility Gear, Heavy Workwear, Head Protection, Hand Protection, and Eye & Ear Protection.
- **Contractor Pricing**: Dual pricing display (Normal vs Contractor rates) with dynamic savings indicators.
- **Interactive Shopping Cart**: Client-side cart with option matrix (sizes, colours, quantities), live subtotal updates, and instant slide-up mini-cart drawer.
- **Delivery Zone Matrix**: Automated regional fee calculation covering Lusaka Central, Lusaka Outskirts, Copperbelt (Kitwe, Ndola, Chingola), Southern, Eastern, Northern/Luapula, and North-Western provinces, plus free office depot pickup.
- **WhatsApp Integration**: Instant one-click quotation enquiry linking directly to official sales representatives with pre-filled product details.

### 💼 Corporate & Procurement Tools
- **Instant Quotation Builder**: Add catalogue items to a requisition list and generate professional, branded PDF quotes via `jspdf`.
- **Compliance & Credential Hub**: Direct access to PACRA, ZPPA, CEEC, and NAPSA compliance documents.
- **Labour Force Portal**: Direct application and deployment channels for skilled Zambian industrial workers.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Document Export**: [jsPDF](https://github.com/parallax/jsPDF)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/alfs-web.git

# Navigate into project directory
cd alfs-web

# Install dependencies
npm install
```

### Development
```bash
# Start local development server
npm run dev
```
The application will launch at `http://localhost:3000`.

### Production Build
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🗄️ Supabase Database & Images Setup

To have your live database and uploaded product images reflect on the hosted website:

### 1. Run the Database Schema
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. In the left navigation, click **SQL Editor** -> **New query**.
3. Copy the contents of [`supabase_schema.sql`](./supabase_schema.sql) into the editor and click **Run**.
   - This creates all tables: `alfs_products`, `alfs_resellers`, `alfs_site_config`, `alfs_labour_seekers`, `alfs_labour_employers`, `alfs_labour_requests`, `alfs_reports`, and `alfs_newsletter_subscribers`.
   - It also provisions the **`product-images`** and **`labour-avatars`** Storage Buckets with **Public Read Access**.

### 2. Configure Storage & Images
- The schema automatically creates the `product-images` and `labour-avatars` storage buckets with `public: true`.
- When product photos are uploaded via the admin portal, Supabase stores them in the `product-images` bucket and generates a public URL (`https://<project-ref>.supabase.co/storage/v1/object/public/product-images/...`) stored in the database.
- Any visitor to the hosted website can view these images directly without needing login permissions.

### 3. Configure Supabase Authentication URLs
1. In Supabase Dashboard, go to **Authentication** -> **URL Configuration**.
2. Set **Site URL** to your hosted website (e.g., `https://your-username.github.io/alfs-web` or `https://alfslimited.com`).
3. Under **Redirect URLs**, add:
   - `https://your-username.github.io/**` (or your custom domain `https://alfslimited.com/**`)
   - `http://localhost:3000/**`

---

## 🚀 Hosting on GitHub Pages

This repository includes a pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit by Mupenda Chama"
   git remote add origin https://github.com/your-username/alfs-web.git
   git push -u origin main
   ```
2. **Add Supabase Secrets to GitHub**:
   - In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
   - Add:
     - `VITE_SUPABASE_URL`: Your Supabase Project URL (`https://xyzcompany.supabase.co`)
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key (`eyJhbG...`)
     - `VITE_ADMIN_EMAILS`: Authorized administrator email(s) separated by commas
3. **Enable GitHub Pages**:
   - Go to **Settings** -> **Pages**.
   - Under **Build and deployment** -> **Source**, select **GitHub Actions**.
   - Every push to `main` will automatically build the site with your Supabase credentials and deploy to GitHub Pages!

*(Alternative: You can also import this GitHub repository directly into **Vercel** or **Netlify** with zero configuration and paste the same environment variables into their project settings).*

---

## 🎨 Design & Attribution

- **Creator & Lead Designer**: **Mupenda Chama**
- **Brand Palette**:
  - Deep Industrial Navy (`#1a2e4a` / `#21305b`)
  - Safety Crimson (`#C0392B` / `#e42321`)
  - Clean Slate / White backgrounds with rounded card architecture
- **Typography**: Poppins & Inter modern sans-serif

---

## 📄 License

All rights reserved. Designed and developed by **Mupenda Chama** for **ALFS Limited**.
