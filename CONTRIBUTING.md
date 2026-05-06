# Contributing to Opix

Thanks for your interest in contributing to **Opix** — a realtime, event‑driven invite infrastructure built for developers.  
This guide explains how to contribute effectively and consistently.

---

## 📌 Before You Start

Opix is built with:

- Vite  
- TypeScript  
- React  
- Tailwind CSS  
- shadcn/ui  
- Supabase (database, RLS, triggers, realtime)

If you're new to the project, take a moment to explore the codebase and read the README.

---

## 🧱 Project Structure

A quick overview of important directories:

~~~~
api/          → API routes, server logic, Supabase interactions
src/          → React frontend, components, hooks, UI
supabase/     → SQL migrations, triggers, policies
public/       → Static assets
.lovable/     → Project plans (not used for runtime or metadata)
~~~~

---

## 🚀 Getting Started (Local Development)

1. **Clone the repository**

   ~~~~
   git clone https://github.com/ThatBobo/Opix.git
   cd Opix
   ~~~~

2. **Install dependencies**

   ~~~~
   npm install
   ~~~~

3. **Start the development server**

   ~~~~
   npm run dev
   ~~~~

4. **Supabase setup (if modifying backend)**  
   Install the Supabase CLI if you plan to work on migrations, triggers, or RLS.

---

## 🧪 Running Tests

Opix uses **Vitest**.

Run all tests:

~~~~
npm run test
~~~~

Run in watch mode:

~~~~
npm run test:watch
~~~~

---

## 🧩 Making Contributions

### 1. Open an Issue First  
Before submitting a PR, please open an issue describing:

- What you want to change  
- Why it’s needed  
- Any alternatives considered  

This helps maintainers discuss the approach before code is written.

### 2. Branch Naming

Use clear, conventional branch names:

~~~~
feature/add-realtime-events
fix/invite-expiry-bug
docs/update-readme
~~~~

### 3. Code Style

- Follow the existing TypeScript conventions  
- Use ESLint and Prettier  
- Keep components small and composable  
- Use Tailwind classes consistently  

### 4. Commit Messages

Use conventional commits:

~~~~
feat: add referral invite type
fix: correct event subscription cleanup
docs: update API usage examples
~~~~

### 5. Pull Requests

A good PR includes:

- A clear description of the change  
- Screenshots (for UI changes)  
- Tests when applicable  
- No unrelated formatting changes  

PRs should be small and focused.

---

## 🔐 Security & RLS Notes

Because Opix uses **Row-Level Security** and **database triggers**, please:

- Never bypass RLS in production code  
- Keep migrations backward‑compatible when possible  
- Document any new triggers or policies in the PR  

---

## 🧭 Roadmap Contributions

If you want to propose a new feature (e.g., new invite types, new event sources, new integrations), open a **Feature Request** issue.

---

## ❤️ Code of Conduct

By participating, you agree to uphold a respectful, inclusive environment.  
Be kind, constructive, and collaborative.
