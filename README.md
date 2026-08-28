# CymbalMart Party Planner 🛒🎉

An AI-powered smart party planning and budget-conscious shopping assistant built for CymbalMart. CymbalMart Party Planner crafts curated grocery and party supply lists tailored to your theme, guest count, dietary preferences, and budget limits—with real-time budget optimization and hands-free voice control.

---

## ✨ Features

- **🎙️ Hands-Free Voice Control**
  - Complete voice-driven interface using Web Speech API with real-time audio visualizers and speech synthesis feedback.
  - Voice commands for event setup (*"Plan a BBQ for 16 guests"*), adding/removing items (*"Add 2 packs of hamburger buns"*), budget trimming (*"Optimize budget to value tier"*), and navigation (*"Take me to checkout please"*).
  - Multi-tone auditory sound chimes and 1-click simulation pills.

- **🤖 AI Event Planning & Catalog Generation**
  - Powered by the Google Gemini API (`@google/genai`).
  - Tailors party menus, portion sizes, condiments, and decor to event types (Backyard BBQ, Kids Birthday, Game Day, Fiesta, Elegant Cocktail, etc.).
  - Accounts for dietary preferences (Vegetarian, Vegan, Gluten-Free, Nut-Free, Halal, Kosher).

- **💰 Real-Time Budget Tracking & Multi-Tier Optimization**
  - Live budget meters with visual alerts for on-target, nearing-limit, and over-budget states.
  - Multi-tier brand comparison (*Everyday Value*, *Standard*, *Premium Artisanal*).
  - 1-Click **Auto-Trim Budget** algorithm that swaps high-cost items to store brand alternatives to meet strict budget targets.

- **🥩 Accurate Portion & Quantity Guide**
  - Built-in party catering calculator determining exact weights and quantities needed per guest for mains, sides, snacks, beverages, and desserts.

- **💬 CymbalMart AI Concierge**
  - Interactive chat assistant capable of answering party-planning queries, suggesting ingredient substitutions, and generating 1-click actionable cart modifications.

- **🛍️ Complete Checkout & Fulfillment Experience**
  - Supports curbside pickup and doorstep delivery scheduling.
  - Store aisle categorization (*Produce, Bakery, Meat & Seafood, Beverages, Party Supplies, Deli*).
  - Quick share and exportable shopping checklists.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/)
- **Backend & Middleware**: [Express](https://expressjs.com/) + [tsx](https://github.com/privatenumber/tsx) + [esbuild](https://esbuild.github.io/)
- **AI Model & SDK**: [Google GenAI SDK (`@google/genai`)](https://github.com/google-gemini/generative-ai-js)
- **Audio & Speech**: Web Speech API (`SpeechRecognition`, `SpeechSynthesis`) + Web Audio Synthesizer

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20 or higher recommended)
- **npm** (v10 or higher)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cymbalmart-party-planner.git
cd cymbalmart-party-planner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Add your Gemini API key:

```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

*(Note: If no API key is provided, the application automatically falls back to an intelligent local heuristics engine so you can still explore all features.)*

### 4. Run Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

---

## 📦 Build & Production

To create an optimized production build:

```bash
# Build Vite client assets and bundle Express backend
npm run build

# Start the standalone production server
npm start
```

---

## 📂 Project Structure

```text
├── index.html                   # HTML entry point with metadata
├── metadata.json                # Applet configuration & permissions
├── package.json                 # Dependencies and build scripts
├── server.ts                    # Express backend with Gemini API proxy & voice command endpoint
├── src/
│   ├── main.tsx                 # React DOM root
│   ├── App.tsx                  # Core state coordinator & layout
│   ├── index.css                # Global Tailwind CSS imports
│   ├── types.ts                 # TypeScript interfaces and types
│   ├── components/
│   │   ├── Navbar.tsx           # Top navigation bar with voice indicator & budget pill
│   │   ├── EventWizard.tsx      # Party creation wizard with presets & parameters
│   │   ├── ShoppingListView.tsx # Main grocery list with aisle sorting & brand tier toggles
│   │   ├── BudgetOverview.tsx   # Visual budget analytics & 1-click optimization
│   │   ├── VoiceControlHUD.tsx  # Floating hands-free voice control bar & cheatsheet
│   │   ├── PortionGuideModal.tsx# Guest catering & portion calculator modal
│   │   ├── CheckoutModal.tsx    # Order review, pickup/delivery selector & fulfillment
│   │   ├── CymbalMartAssistantChat.tsx # Floating AI Concierge drawer
│   │   └── AddItemModal.tsx     # Custom item addition modal
│   ├── data/
│   │   ├── sampleProducts.ts    # Comprehensive catalog of store products & brand tiers
│   │   └── presetParties.ts     # Pre-configured party packages (BBQ, Birthday, Game Day)
│   ├── hooks/
│   │   └── useVoiceControl.ts   # Voice state management & intent execution hook
│   └── utils/
│       ├── speechRecognition.ts # Browser Web Speech API & TTS engine
│       ├── soundEffects.ts      # Multi-tone audio synthesizer effects
│       └── portionCalculator.ts # Portion estimation formulas
```

---

## 🎙️ Sample Voice Commands

| Category | Example Phrases |
|---|---|
| **Event Planning** | *"Plan a BBQ for 16 people"*, *"Set budget to 250 dollars"*, *"Load Kids Birthday party pack"* |
| **Cart Items** | *"Add 2 packs of burger buns"*, *"Remove party ice"*, *"Increase burger patties to 4"* |
| **Budget & Tiers** | *"Optimize my budget"*, *"Swap burgers to value tier"*, *"Upgrade everything to premium"* |
| **Navigation & Order**| *"Take me to check out please"*, *"Open portion guide"*, *"Filter by drinks"*, *"Place order"* |

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
