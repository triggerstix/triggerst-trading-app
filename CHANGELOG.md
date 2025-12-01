# Changelog

All notable changes to Triggerstix will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- CHANGELOG.md for tracking all changes
- README.md with comprehensive project documentation
- Session summary template for tracking work sessions
- Safeguard infrastructure (incremental checkpoints, documentation)

### Changed
- Rebranded from "Gann Trading App" to "Triggerstix"
- Updated package.json name to "triggerstix"
- Updated todo.md with Trader Edition roadmap

---

## [0.9.0] - 2025-11-19

### Added
- Integration with existing W.D. Gann platform (9-feature homepage)
- Stock Analysis as 9th feature card
- StockAnalysisSearch page as entry point
- Routing for /stock-analysis path
- 3x3 grid layout for feature cards

### Changed
- Redesigned homepage to match original platform style
- Updated navigation structure

### Fixed
- All 9 feature cards now display correctly
- Stock Analysis navigation flow complete

---

## [0.8.0] - 2025-11-19

### Added
- Real-time stock data integration via Yahoo Finance API
- Stock data service module (server/services/stockData.ts)
- New tRPC procedure `analysis.analyzeStock`
- Support for stocks (AAPL, MSFT, etc.) and crypto (BTC-USD, ETH-USD)
- 13 passing tests for stock data service

### Changed
- Frontend updated to use real market data instead of mock data
- Analysis engine now uses actual historical price data
- Gann angles calculated from real market data

### Fixed
- Removed problematic includeAdjustedClose parameter
- Proper error handling for invalid symbols

---

## [0.7.0] - 2025-11-19

### Added
- Complete Gann + Ney analysis engine
- Three analysis modules: gann.ts, ney.ts, combined.ts
- tRPC API procedures for analysis
- Frontend StockAnalysisNew page with 4 tabs
- 21 passing tests for analysis engine

### Features
- Gann rally angle calculations (1x1, 2x1, 4x1, 8x1+)
- Square of Nine support/resistance levels
- Deviation from sustainable price tracking
- Ney market phase identification (4 phases)
- Volume pattern analysis
- Risk scoring (1-5 scale, LOW/MODERATE/HIGH/EXTREME)
- Scenario generation with probabilities
- Actionable recommendations with price targets

---

## [0.6.0] - 2025-10-24

### Fixed
- OAuth URL construction error
- Fallback handling for missing environment variables
- Production deployment issues

---

## [0.5.0] - 2025-10-20

### Added
- Production deployment to Railway
- Static file path configuration
- Build optimization

### Changed
- Removed nixpacks config, use Railway auto-detect
- Fixed Node.js configuration

---

## [0.4.0] - 2025-10-19

### Added
- Webull-style scalable charts
- Candlestick visualization
- Zoom and pan controls
- Technical indicators (SMA, EMA, Bollinger Bands)
- Volume chart overlay

### Fixed
- tRPC procedure names to match backend

---

## [0.3.0] - 2025-10-18

### Added
- Complete W.D. Gann Trading Platform with all 8 features
- Real Yahoo Finance API integration
- Comprehensive documentation
- Deployment summary
- Data accuracy fixes

### Features
1. Market Data - Real-time price tracking
2. Gann Angles & Charts - Support/resistance analysis
3. Square of Nine Calculator - Price/time analysis
4. Time Cycles - Market cycle analysis
5. Astrological Analysis - Lunar phases and planetary positions
6. Historical Charts - Price data with indicators
7. Interactive Gann Chart - Live data with overlays
8. Gann Drafting Machine - Chart upload and geometric patterns

### Fixed
- Astrological analysis page
- Data accuracy with real API integration

---

## [0.2.0] - 2025-10-18

### Added
- Initial project structure
- Basic tRPC setup
- Database schema
- Authentication flow

---

## [0.1.0] - 2025-10-16

### Added
- Project initialization
- Development environment setup
- Core dependencies

---

## Format Guide

### Types of Changes
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

### Version Numbering
- **Major** (X.0.0): Breaking changes
- **Minor** (0.X.0): New features, backwards compatible
- **Patch** (0.0.X): Bug fixes, backwards compatible
