# Triggerstix

**Your Trading Signal - Where Geometry Meets Volume**

Triggerstix is a comprehensive trading platform that combines W.D. Gann's geometric analysis methods with Richard Ney's specialist behavior patterns to provide automated stock and crypto analysis with risk assessment and actionable trading recommendations.

---

## 🎯 What is Triggerstix?

Triggerstix helps traders identify high-probability entry and exit points by analyzing:

- **Gann Angles**: Geometric support and resistance levels based on price and time
- **Square of Nine**: Mathematical price targets and reversal zones
- **Ney Phases**: Market phases (Accumulation, Markup, Distribution, Markdown) based on specialist behavior
- **Volume Patterns**: Institutional buying/selling signals

---

## ✨ Key Features

### Current (Stock Analysis Tool)
- ✅ Real-time stock and crypto data from Yahoo Finance
- ✅ Gann angle calculations (1x1, 2x1, 4x1, 8x1+)
- ✅ Square of Nine support/resistance levels
- ✅ Ney phase detection (4 market phases)
- ✅ Risk assessment (LOW/MODERATE/HIGH/EXTREME)
- ✅ Trading recommendations (BUY/SELL/HOLD/AVOID)
- ✅ Price targets and stop-loss levels
- ✅ Probability-weighted forecast scenarios

### Coming Soon (Trader Edition)
- 🚧 Interactive TradingView charts
- 🚧 Gann angle drawing tools
- 🚧 Options chain integration with Greeks
- 🚧 Watchlist and price alerts
- 🚧 Real-time phase change notifications
- 🚧 Strategy recommendations for options trading

---

## 🚀 Technology Stack

**Frontend:**
- React 19 with TypeScript
- Remix for routing
- Tailwind CSS 4 for styling
- Recharts for data visualization
- shadcn/ui components

**Backend:**
- Node.js with Express
- tRPC for type-safe API
- Yahoo Finance API integration
- SQLite database with Drizzle ORM

**Testing:**
- Vitest (34 tests passing)
- Comprehensive test coverage for analysis algorithms

---

## 📊 How It Works

### Gann Analysis
W.D. Gann's methods use geometric angles to identify support and resistance:
- **1x1 angle (45°)**: Primary trend line
- **2x1 angle (63.75°)**: Strong support/resistance
- **Square of Nine**: Spiral-based price levels

### Ney Analysis
Richard Ney's specialist behavior analysis identifies market phases:
- **Accumulation**: Specialists buying (bullish signal)
- **Markup**: Price rising (trend continuation)
- **Distribution**: Specialists selling (bearish signal)
- **Markdown**: Price falling (downtrend)

### Combined Analysis
Triggerstix combines both methods to provide:
- **Agreement percentage**: How well Gann and Ney align
- **Risk scoring**: 1-5 scale based on multiple factors
- **Trading recommendations**: Clear BUY/SELL/HOLD signals
- **Price targets**: Where to take profits
- **Stop-loss levels**: Where to cut losses

---

## 🧪 Example Analysis

**Symbol:** AAPL  
**Current Price:** $268.56  
**Risk Level:** LOW (2/5)  
**Recommendation:** BUY  

**Gann Analysis:**
- Rally angle: 1x2 (moderate uptrend)
- Square of Nine resistance: $293.16
- Deviation from sustainable: -41.2% (undervalued)

**Ney Analysis:**
- Phase: ACCUMULATION
- Specialist behavior: Buying
- Volume pattern: Climactic buying

**Agreement:** 100% (both methods bullish)

**Price Targets:**
- Conservative: $280 (+4.3%)
- Moderate: $293 (+9.1%)
- Aggressive: $310 (+15.4%)

**Stop Loss:** $255 (-5.0%)

---

## 📁 Project Structure

```
triggerstix/
├── client/                    # Frontend React app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── lib/              # Utilities and tRPC client
│   │   └── App.tsx           # Main app component
│   └── public/               # Static assets
├── server/                    # Backend Node.js app
│   ├── analysis/             # Gann + Ney analysis engines
│   │   ├── gann.ts          # Gann calculations
│   │   ├── ney.ts           # Ney phase detection
│   │   └── combined.ts      # Combined analysis
│   ├── services/            # External API integrations
│   │   └── stockData.ts     # Yahoo Finance service
│   ├── routers.ts           # tRPC API routes
│   └── db.ts                # Database queries
├── drizzle/                  # Database schema
└── tests/                    # Test suites
```

---

## 🧪 Testing

Run the test suite:
```bash
pnpm test
```

Current test coverage:
- ✅ 21 analysis engine tests
- ✅ 13 stock data service tests
- ✅ 34 total tests passing

---

## 🛠️ Development

**Install dependencies:**
```bash
pnpm install
```

**Run development server:**
```bash
pnpm dev
```

**Build for production:**
```bash
pnpm build
```

**Run database migrations:**
```bash
pnpm db:push
```

---

## 📈 Roadmap

### Phase 1: Safeguard Infrastructure ✅
- [x] CHANGELOG.md
- [x] Session summaries
- [x] Incremental checkpoints

### Phase 2: October Code Review (In Progress)
- [ ] Extract original platform code
- [ ] Review drawing tools
- [ ] Compare architectures

### Phase 3: Trader Edition MVP
- [ ] TradingView charts integration
- [ ] Gann angle drawing tool
- [ ] Options chain with Greeks
- [ ] Watchlist and alerts
- [ ] Real-time notifications

### Phase 4: Investor Edition
- [ ] Long-term analysis
- [ ] Fundamental data integration
- [ ] Portfolio tracking
- [ ] Quality scoring

---

## 📝 License

MIT

---

## 🙏 Credits

**Analysis Methods:**
- W.D. Gann - Geometric trading methods
- Richard Ney - Specialist behavior analysis

**Built with:**
- Manus Platform
- Yahoo Finance API
- TradingView (planned)

---

## 📧 Support

For questions or issues, please open an issue on GitHub or contact support.

---

**Triggerstix** - Find Your Entry Point 🎯
