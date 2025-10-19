
# Recruit-Pal Smart Onboard


Recruit-Pal Smart Onboard is a modern, production-ready onboarding system for organizations. It allows companies to onboard candidates efficiently through an interactive **chatbot**, while providing an **HR admin panel** to manage candidates, send emails, and communicate effectively. Built with **TypeScript**, **React**, **Supabase**, and **TailwindCSS**, this project is fully ready for deployment.

**Live Demo:** [https://easy-onboard-jet.vercel.app/](https://easy-onboard-jet.vercel.app/)

---

## Features

### Candidate Onboarding
- Interactive **chatbot interface** for onboarding candidates.
- Collects essential candidate details:
  - Name, Email, Phone
  - Department, Designation
  - Documents upload (e.g., ID, resume)
  - Any other necessary onboarding data
- Generates a **candidate profile**:
  - Employee ID (based on name, department, and designation)
  - Company email assignment
  - Complete profile summary

### HR Admin Panel
- Access via `/admin` route (credentials: `admin` / `password`).
- View and manage all candidate details.
- Send **emails and messages** to candidates with **predefined templates**.
- Search, filter, and track candidate progress.

### Tech Stack
- **Frontend:** React + TypeScript + TailwindCSS + Vite
- **Backend / DB:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **UI Components:** Custom reusable components (accordion, alert, input, toast, table, etc.)

### Directory Structure
```bash
smart_onboard/
├── README.md
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│ └── robots.txt
├── src/
│ ├── App.css
│ ├── App.tsx
│ ├── index.css
│ ├── main.tsx
│ ├── vite-env.d.ts
│ ├── components/
│ │ ├── admin/
│ │ │ ├── CandidatesList.tsx
│ │ │ └── EmailTemplates.tsx
│ │ └── ui/ (reusable UI components)
│ ├── hooks/ (custom hooks)
│ ├── integrations/supabase/ (client & types)
│ ├── lib/ (utility functions)
│ └── pages/
│ ├── Admin.tsx
│ ├── Chatbot.tsx
│ ├── Index.tsx
│ └── NotFound.tsx
└── supabase/
├── config.toml
├── functions/
│ └── save-to-sheets/
│ └── index.ts
└── migrations/
└── 20251019062251_e0e393a1-5f0b-4a33-9b5a-ba8efb4e459f.sql

```

## Getting Started

### Prerequisites
- Node.js >= 20
- npm >= 9
- Supabase account and project
- Vercel account for deployment

## Screeeshots

![alt text](<Screenshot 2025-10-19 135033.png>) ![alt text](<Screenshot 2025-10-19 135002.png>) ![alt text](<Screenshot 2025-10-19 135018.png>)