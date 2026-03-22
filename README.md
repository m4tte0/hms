# Handover Management System
Un sistema web per la gestione degli handover

## Setup iniziale (solo la prima volta)

**1. Installa le dipendenze:**
```bash
npm run install:all
```

**2. Configura le variabili d'ambiente del backend:**
```bash
cd backend
cp .env.example .env
# Apri .env e modifica i valori se necessario
```

Il file `.env` ha questi valori di default che vanno bene per lo sviluppo locale:
- `PORT=5000` — porta del backend
- `DATABASE_PATH=./database/handover.db` — percorso del database SQLite

**3. Inizializza il database:**
```bash
cd backend
npm run init-db
```

## Avvio dell'applicazione

Dalla cartella principale del progetto:

```bash
npm run dev
```

Questo comando avvia **contemporaneamente** backend e frontend:
- **Backend** (Express + SQLite) → `http://localhost:5000`
- **Frontend** (React + Vite) → `http://localhost:5173`

## Avvio separato (opzionale)

```bash
# Solo backend
npm run dev:backend

# Solo frontend
npm run dev:frontend
```
