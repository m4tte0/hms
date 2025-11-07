# Guida alla Configurazione dell'Ambiente

Questo documento descrive gli unici punti da modificare per cambiare le porte e gli indirizzi dell'applicazione. Grazie al refactoring, la configurazione è ora centralizzata e semplificata.

---

### 1. Per cambiare la porta del Server di Backend

Modifica la porta su cui il server Node.js si mette in ascolto.

- **File**: `backend/.env`
- **Variabile**: `PORT`

**Esempio:**
```
PORT=3002
```

---

### 2. Per cambiare la porta del Server di Sviluppo del Frontend

Modifica la porta su cui il server Vite (`npm run dev`) è accessibile.

- **File**: `frontend/vite.config.js`
- **Variabile**: `port` (all'interno della sezione `server`)

**Esempio:**
```javascript
// ...
server: {
  port: 5174,
  // ...
},
// ...
```

---

### 3. Per cambiare l'indirizzo del Backend (per il Frontend)

Questo è il punto più importante e l'unico da modificare per cambiare l'indirizzo IP o il dominio del server backend a cui il frontend si collega.

- **File**: `frontend/.env`
- **Variabile**: `VITE_API_URL`

**Esempio:**
```
VITE_API_URL=http://192.168.1.200:3002/api
```

**Importante**: Dopo aver modificato una qualsiasi di queste configurazioni, è sempre necessario **fermare e riavviare** i rispettivi server (backend o frontend) per rendere le modifiche effettive.
