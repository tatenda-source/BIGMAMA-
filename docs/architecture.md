# BIGMAMA$ Architecture

## 1. Modular Component Strategy
The platform is built using a highly modular React architecture, where each view is decomposed into specialized sub-components (e.g., `ReportForm` uses `FormHeader`, `FormInput`, `MediaDropzone`).

## 2. Design System
- **Styles**: Organized into `src/styles/` (tokens, base, glass, components).
- **Glassmorphism**: Leverages `backdrop-filter: blur()` with dynamic performance adjustment for "Low Data Mode".

## 3. State Management
- **Navigation**: Managed via a centralized `activeTab` state in `App.jsx`.
- **Modals**: Global modal portal system for reporting and alerts.

## 4. Security
- **Data Handling**: Input sanitization and simulated AES-256 encryption via `src/utils/security.js`.
- **Anonymity**: Dedicated toggle logic to strip identity metadata from reports.
