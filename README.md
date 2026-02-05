# 🌿 Green AI Orbit (EcoCompute)

**EcoCompute** is an intelligent dashboard designed to monitor, audit, and optimize the carbon footprint of AI workloads. It empowers organizations to balance innovation with environmental responsibility by providing real-time insights and automated governance policies.

![Dashboard Preview](https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop)

## 🚀 Key Features

### 📊 Real-Time Dashboard
- **Live Emission Tracking**: Monitor CO₂ emissions relative to a baseline.
- **Cost Savings**: Dynamic calculation of projected savings from green optimizations.
- **Energy Mix**: Visualize the renewable vs. fossil fuel split of your compute regions.
- **Smart Recommendations**: Always see top 3 actionable tips (e.g., "Switch Region", "Enable Green Mode").

### 🤖 Model Management
- **Inventory**: Track all deployed AI models, their GPU usage, and efficiency scores.
- **Auto-Sleep Policy**: Automatically puts inefficient models (Efficiency < 75) to sleep to save energy.
- **Right-sizing**: Get recommendations to downgrade GPU instances for idle workloads.
- **Lifecycle Actions**: Deploy updates, wake/sleep models, and delete deprecated models.

### 📝 Reporting & Compliance
- **Carbon Audits**: Generate PDF/CSV reports for environmental auditing.
- **Dynamic Charts**: Visualize emission trends over the last 6 months.
- **Certificates**: Tokenized proof of offset (Mock-up).

### ⚙️ Automation Studio
- **Policy Engine**: Configure rules like "Auto-Sleep", "Green Region Only", and "Right-sizing Assistant".

## 🛠 Tech Stack

- **Frontend**: React (Vite), TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend/Auth**: Supabase
- **State Management**: React Context / Hooks

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/green-ai-orbit.git
    cd green-ai-orbit
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Build for production**
    ```bash
    npm run build
    ```

## 🧹 Project Structure

```
src/
├── components/     # UI Components (Layout, Cards, Charts)
├── pages/          # Main Views (Dashboard, Models, Reports, Settings)
├── hooks/          # Custom Hooks (useAuth)
├── lib/            # Utilities (PDF Generator, Helpers)
└── integrations/   # Supabase Client
```

## 🤝 Contributing

We welcome contributions to make AI greener! Please see `CONTRIBUTING.md` (coming soon) for details.

## 📄 License

This project is licensed under the MIT License.
