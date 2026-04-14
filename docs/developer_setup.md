# BIGMAMA$ Developer Setup

## 1. Prerequisites
- Node.js 18+
- npm or yarn
- Git

## 2. Installation
```bash
git clone <repository-url>
cd BIGMAMA$
npm install
```

## 3. Development Server
```bash
npm run dev
```

## 4. Project Structure
- `src/components`: UI components (modularized)
- `src/styles`: CSS modules (tokens, base, glass, components)
- `src/utils`: Security and validation logic
- `docs/`: Technical and user documentation

## 5. Coding Standards
- **Granular Commits**: Aim for small, audit-ready commits.
- **Modularity**: Every major UI block must be its own component.
- **Glassmorphism**: Use the `--glass-*` tokens for all container components.
