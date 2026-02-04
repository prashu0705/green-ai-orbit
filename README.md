# EcoCompute - Green AI Orbit 🌍

EcoCompute is a comprehensive dashboard for tracking, optimizing, and certifying the carbon footprint of AI models. It empowers developers to schedule workloads in low-carbon regions, view real-time efficiency reports, and mint sustainability certificates to a simulated blockchain.

![Project Status](https://img.shields.io/badge/Status-Live-success)
![Tech Stack](https://img.shields.io/badge/Stack-T3_Stack-blue)

## 🚀 Key Features

### 1. Advanced Scheduler V2 (Pro)
*   **Dynamic Forecast Grid**: Visualizes carbon intensity across regions with a clean "Pill" style interface.
*   **Smart Recommendation**: Automatically highlights the absolute best time slot to run your training jobs.
*   **simulation Mode**: "What-If" analysis allows you to preview different regions and immediately see potential CO2 savings before checking out.
*   **Actionable Insights**: One-click "Shift Workload" implementation.

### 2. Real-Time Reports & Analytics
*   **Executive Summary**: Live dashboard comparing your CO2 savings and efficiency gains against a baseline.
*   **Dynamic AI Insights**: An intelligent engine that scans your actual model data to flag underperforming instances or praise top-tier efficiency.
*   **Adaptive Context**: Automatically adjusts report granularity whether you have 1 model or 100.

### 3. Web3 Certificate Simulation
*   **Blockchain Integration**: Simulates the full lifecycle of a Green AI Certificate.
*   **Flow**: Mint -> Sign (Wallet) -> Mine (Simulated Delay) -> Verify (Immutable Ledger).
*   **Status Persistence**: Uses robust database strategies to ensure verified statuses are persistent and secure.

### 4. Interactive Dashboard
*   **Rightsizing Engine**: Interactive UI that demonstrates the impact of resizing instances (e.g., downgrading from `p4d.24xlarge` to `g4dn.xlarge`).
*   **Visual Metrics**: Real-time charts for renewable energy mix and total carbon footprint.

---

## 🛠 Tech Stack

This project is built using the **T3 Architecture** (Vite + React + Supabase), ensuring high performance and scalability.

*   **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) (TypeScript)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
*   **Backend & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Data Fetching**: [TanStack Query](https://tanstack.com/query/latest)
*   **Visualizations**: [Recharts](https://recharts.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)

---

## 💻 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/prashu0705/green-ai-orbit.git
    cd green-ai-orbit
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start Development Server**
    ```bash
    npm run dev
    ```

### Environment Setup
This project uses Supabase. Ensure you have your `.env` file configured with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🔒 Security & Performance
*   **Row Level Security (RLS)**: Data access is strictly controlled via PostgreSQL policies.
*   **Edge-Ready**: Designed to be deployable on edge networks (Vercel/Netlify).

---

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
