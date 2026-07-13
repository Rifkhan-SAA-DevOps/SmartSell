# SmartSell CORS Fix V2

This update makes local development CORS flexible.

In development mode, the backend allows any origin that matches:

- http://localhost:any_port
- http://127.0.0.1:any_port

This fixes Vite changing from port 5173 to 5174 or another local port.

## Replaced files

- server/src/server.js
- server/src/config/env.js
- server/.env.example

## Important

Your real `server/.env` should include:

```env
NODE_ENV=development
CORS_ORIGINS="http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174"
```

After replacing files, kill old Node processes and restart backend.
