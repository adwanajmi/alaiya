# Bably 🌸

A beautiful, real-time Progressive Web App (PWA) designed to help parents, caregivers, and families collaboratively track baby activities. From milk intake and breast pumping to sleep schedules and growth percentiles, Bably keeps everyone in sync without the clutter.

![Bably Dashboard Placeholder](https://via.placeholder.com/800x450.png?text=Bably+Dashboard+Preview)

## ✨ Features
* **Real-Time Synchronization:** Seamlessly syncs logs across all family members' devices instantly.
* **Comprehensive Tracking:** Log bottle feeding, direct breastfeeding, breast pumping, sleep, diapers, baths, and medication.
* **Smart Insights:** End-of-day summaries and intelligent timeline filtering.
* **Premium UI/UX:** Glassmorphic navigation, soft drop shadows, and fluid animations for a modern, social-app feel.
* **Interactive Media:** High-quality fullscreen image viewer with download functionality and smooth transitions.
* **Role-Based Access:** Safe collaboration with distinct "Parent" (full access/admin) and "Caregiver" (restricted view/logging) roles.
* **Multi-Child Support:** Sleek pill-shaped baby switcher for families with multiple babies.
* **Growth Tracking:** Chart weight, height, and head circumference over time.
* **QR Code Joining:** Quickly invite grandparents or nannies to the family via a secure QR code scanner.

## 🛠 Tech Stack
* **Frontend:** React 19, Vite, React Router DOM v7
* **Backend/Database:** Firebase (Auth, Firestore, Storage)
* **Styling/UI:** Vanilla CSS (Custom Design System with CSS variables and keyframes), Lucide React
* **Charts/Analytics:** Recharts
* **Utilities:** `@yudiel/react-qr-scanner` (QR scanning)

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* A Firebase Project (Spark Plan is sufficient for development)

### 1. Clone & Install
\`\`\`bash
git clone https://github.com/your-username/bably.git
cd bably
npm install
\`\`\`

### 2. Environment Setup
Create a `.env` file in the root directory and add your Firebase configuration:
\`\`\`env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
\`\`\`

### 3. Run Locally
\`\`\`bash
npm run dev
\`\`\`
Visit `http://localhost:5173` to view the app.
