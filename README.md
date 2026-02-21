# Soft Power Food - Data Collection System

A comprehensive web application for documenting, managing, and preserving Thai cultural food data along the canal zones (Khlong). Designed with a focus on ease of use, data integrity, and accessibility for elderly users.

## 🚀 Key Features

### 1. 📋 7-Part Survey System
A guided data collection flow to capture every detail of cultural food:
- **Part 1: Informant Info**: Personal details of theปราชญ์ (experts/informants) with PDPA consent management.
- **Part 2-5: Menu & Ingredients**: Detailed food categorizations, ingredients (with creatable list), and preparation steps.
- **Part 6: Story & Legacy**: Documenting the heritage and unique stories behind each dish.
- **Part 7: Photos**: Image gallery with client-side compression for efficient storage.

### 2. 🗃️ Management Dashboards
- **Food Inventory**: Search, filter (by area, category, status), edit, or delete menu entries.
- **Informant Management**: Directory of all contributing experts and their associated menus.
- **User Management**: Role-based access control (Admin, Director, Surveyor).

### 3. 📊 Data Portability
- **CSV Export**: Export all survey data (including ingredients, steps, and stories) into Excel-compatible reports for analysis.

### 4. 👵 Accessibility & UX
- **Warm Paper Theme**: A soft cream-based color palette (`#fdfbf7`) designed to reduce glare and eye strain for elderly users.
- **Outdoor Visibility**: Shifted color scales for high-contrast readability in sunlight.
- **Image Optimization**: Automatic client-side compression to handle large photo uploads seamlessly.

## 🛠️ Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database / Auth / Storage**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Solar Icons](https://iconify.design/icon-sets/solar/) via [Iconify](https://iconify.design/)
- **Language**: TypeScript

## ⚙️ Environment Variables
Required variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXTAUTH_SECRET=your_auth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🛠️ Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```
