# InsightGPT Enterprise 🚀

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Gemini_AI-1.5_Flash-4285F4?style=for-the-badge&logo=google" />
</div>

<br />

**InsightGPT Enterprise** is an AI-powered Business Intelligence platform that enables non-technical executives (CXO persona) to generate interactive dashboards and insights using natural language queries — no SQL or BI tool expertise required.

---

## ✨ Key Features

- 🗣️ **Natural Language Querying** - Ask questions in plain English, get instant visualizations
- 📊 **Intelligent Chart Selection** - AI picks optimal chart types based on your query
- 🤖 **Context-Aware Conversations** - Follow-up questions maintain context
- 🎯 **What-If Simulation** - Adjust parameters and see projected impacts
- 🧠 **AI-Powered Insights** - Automatic anomaly detection and recommendations
- 🎨 **Modern UI/UX** - Premium glassmorphism design with animations
- 🎤 **Voice Input** - Ask questions using voice recognition
- 📤 **Custom Data Upload** - Upload your own CSV files for analysis

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router, Server Components |
| **React** | 19.2.3 | UI library with latest features |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Tailwind CSS** | 4.x | Utility-first styling with custom glassmorphism |
| **Framer Motion** | 12.35.2 | Smooth animations & micro-interactions |
| **Recharts** | 3.8.0 | Interactive data visualizations (bar, line, pie, area, radar) |
| **Lucide React** | 0.577.0 | Beautiful icon library |

### AI/ML
| Technology | Purpose |
|------------|---------|
| **Google Gemini AI** (gemini-2.5-flash + gemini-1.5-flash) | Natural language understanding, query analysis, insight generation with intelligent fallback |
| **@google/generative-ai** (0.24.1) | Official Google SDK for Gemini |
| **Multi-Key Fallback System** | Automatic API key rotation and model fallback for 99.9% uptime |

### State & Data
| Technology | Purpose |
|------------|---------|
| **Zustand** (5.0.11) | Lightweight global state management |
| **PapaParse** (5.5.3) | Fast CSV parsing |

### Utilities
| Technology | Purpose |
|------------|---------|
| **html2canvas** | Chart screenshot export |
| **jsPDF** | PDF report generation |

---

## 📁 Project Structure

```
insightgpt-enterprise/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page with hero
│   │   ├── dashboard/         # Executive dashboard with metrics
│   │   ├── query/             # AI chat interface
│   │   ├── explorer/          # Data explorer with stats
│   │   ├── insights/          # AI insights center
│   │   ├── simulation/        # What-if analysis engine
│   │   ├── upload/            # Dataset upload with drag-drop
│   │   ├── settings/          # User preferences
│   │   └── api/               # Server-side API routes
│   │       ├── data/          # Dataset loading & analysis
│   │       ├── analyze/       # AI query processing
│   │       └── insights/      # Insight generation
│   ├── components/            # Reusable UI components
│   │   ├── AIChat.tsx         # Chat interface with voice
│   │   ├── ChartRenderer.tsx  # Dynamic chart rendering
│   │   ├── Header.tsx         # Navigation header
│   │   ├── Sidebar.tsx        # Side navigation
│   │   └── LoadingState.tsx   # Loading animations
│   ├── lib/                   # Core business logic
│   │   ├── gemini.ts          # Gemini AI integration
│   │   ├── queryEngine.ts     # Data query execution
│   │   └── dataLoader.ts      # CSV parsing utilities
│   ├── store/                 # Zustand state management
│   │   └── index.ts           # Global app state
│   ├── types/                 # TypeScript interfaces
│   │   └── index.ts           # Type definitions
│   └── data/                  # Dataset files
│       └── insurance_claims.csv
├── .env.local                 # Environment variables (API keys)
├── .env.example               # Example environment file
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.0 or higher
- **npm** or **yarn** or **pnpm**
- **Google Gemini API key** (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/insightgpt-enterprise.git
   cd insightgpt-enterprise
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   cp .env.example .env.local
   
   # Edit .env.local and add your Gemini API key
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory:

```env
# Primary API Key (Required)
GEMINI_API_KEY=your_google_gemini_api_key

# Backup API Key (Optional - for automatic fallback when quota limits are hit)
GEMINI_API_KEY_BACKUP=your_backup_api_key
```

**Get your API key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste into your `.env.local` file

**Multi-Key Fallback System:**
- The app automatically switches to the backup key if the primary key hits quota limits
- Tries multiple model versions (gemini-2.5-flash → gemini-1.5-flash) for maximum reliability
- Graceful degradation ensures uninterrupted service

---

## 💾 Data Source

### Pre-loaded Dataset
The application includes the **India Life Insurance Claims Dataset** (IRDAI data):

| Property | Value |
|----------|-------|
| **Rows** | 80+ records |
| **Columns** | 24 fields |
| **Insurers** | LIC, HDFC Life, ICICI Prudential, SBI Life, Max Life, Kotak, Bajaj Allianz, Tata AIA |
| **Years** | 2018-19 to 2021-22 |
| **Metrics** | Claims paid, rejected, pending, settlement ratios |

### Custom Data Upload
Users can upload their own CSV files at `/upload`:
- Drag & drop interface
- Automatic column detection
- Data quality analysis

---

## 🧠 Architecture & How It Works

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User Query: "Show top 5 insurers by claims paid"          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend (AIChat Component)                                │
│  • Captures user input (text or voice)                     │
│  • Sends POST request to /api/analyze                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  API Route (/api/analyze)                                   │
│  • Loads dataset from CSV                                  │
│  • Sends query + schema to Gemini AI                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Gemini AI (gemini-1.5-flash)                              │
│  • Understands natural language intent                     │
│  • Extracts: action, metrics, dimensions, filters          │
│  • Selects optimal chart type                              │
│  • Generates business insights                             │
│  • Returns structured JSON response                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Query Engine (queryEngine.ts)                             │
│  • Executes intent against actual data                     │
│  • Filters, aggregates, sorts, limits                      │
│  • Builds chart configurations                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend Rendering                                         │
│  • Displays charts (Recharts)                              │
│  • Shows AI narrative explanation                          │
│  • Presents actionable insights                            │
│  • Suggests follow-up questions                            │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Gemini AI Integration (`lib/gemini.ts`)
- **System Prompt**: Includes full data schema with 24 columns
- **Chart Selection Guide**: Rules for optimal visualization
- **Intent Extraction**: Parses action (compare, trend, rank), metrics, filters
- **Response Format**: Structured JSON with charts, insights, narrative

#### 2. Query Engine (`lib/queryEngine.ts`)
- **Filter Execution**: Applies user-specified filters
- **Aggregation**: Groups by dimensions, aggregates metrics (SUM/AVG)
- **Trend Analysis**: Sorts by year for time-series
- **Ranking**: Top N by specified metric

#### 3. State Management (`store/index.ts`)
- **Zustand Store**: Lightweight, TypeScript-first
- **Key State**: dataset, conversations, insights, dashboardWidgets
- **Persistence**: User preferences saved to localStorage

---

## 🎯 Example Queries

Try asking the AI Copilot:

| Query | AI Action |
|-------|-----------|
| "Show top 5 insurers by claims paid" | Bar chart ranked by amount |
| "What's the trend of claim settlements over years?" | Line chart over time |
| "Compare LIC vs HDFC Life settlement ratios" | Grouped bar comparison |
| "Which insurer has the highest rejection rate?" | Metric card + bar chart |
| "Show breakdown of claims by status" | Pie chart composition |
| "Year-over-year claim growth analysis" | Area trend chart |

---

## 🔧 API Routes

| Route | Method | Request | Response |
|-------|--------|---------|----------|
| `/api/data` | GET | - | Dataset + analysis summary |
| `/api/analyze` | POST | `{ query, conversationContext }` | Charts, insights, narrative |
| `/api/insights` | POST | `{ action, datasetSize }` | AI-generated insights |

### Example API Call

```javascript
// Analyze a query
const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'Show top 5 insurers by claims paid'
  })
});

const { charts, insights, narrative } = await response.json();
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "framer-motion": "^12.35.2",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.0",
    "lucide-react": "^0.577.0",
    "next": "16.1.6",
    "papaparse": "^5.5.3",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^3.8.0",
    "zustand": "^5.0.11"
  }
}
```

---

## 🎨 UI/UX Design

### Design System
- **Theme**: Dark mode with glassmorphism effects
- **Colors**: Indigo-purple gradient accents
- **Typography**: System fonts with clear hierarchy
- **Animations**: Framer Motion for smooth transitions

### Custom CSS Classes
```css
.glass        /* Frosted glass background */
.glass-bright /* Brighter glass variant */
.glass-subtle /* Subtle glass for headers */
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

---

## 🐛 Troubleshooting

### "Error processing your request"
- **Cause**: Missing or invalid Gemini API key
- **Fix**: Check `.env.local` has `GEMINI_API_KEY=your_key`

### Voice input not working
- **Cause**: Browser doesn't support Web Speech API or microphone blocked
- **Fix**: Use Chrome/Edge, allow microphone permissions

### Charts not rendering
- **Cause**: No data matches the query
- **Fix**: Try a different query or check the dataset

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

Built with ❤️ for the Hackathon

---

<div align="center">
  <h3>InsightGPT Enterprise</h3>
  <p>Empowering executives with AI-driven insights</p>
  <br />
  <strong>🏆 Built for Hackathon Excellence 🏆</strong>
</div>
