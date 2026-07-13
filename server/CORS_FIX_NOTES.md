# SmartSell CORS Fix

This patch allows both Vite development ports:

- http://localhost:5173
- http://localhost:5174
- http://127.0.0.1:5173
- http://127.0.0.1:5174

If Vite uses another port later, add it to `server/.env`:

```env
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,http://localhost:5175,http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175"
```

Then restart the backend.
