# SmartSell

SmartSell is a modern marketplace application idea for:

- Own products
- Client products
- Shop/vendor products
- Used products such as phones, bikes, laptops, electronics, and furniture
- Services such as cakes, editing, web development, delivery, event support, gifts, and custom requests
- Admin-managed quotations and request handling

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database-ready structure: DynamoDB-ready service layer included
- Assets: SmartSell logo included in `client/public/images`

## Run locally

```bash
cd SmartSell
npm install
npm run install:all
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## Important folders

```text
client/src/pages       Main website pages
client/src/components  Shared UI components
client/src/data        Demo data for first UI build
server/src/routes      Express API routes
server/src/services    Business logic and mock database service
server/src/config      Environment and DynamoDB-ready config
```

## Next development phases

1. Connect real database: DynamoDB or PostgreSQL
2. Add authentication: customer, seller, service provider, admin
3. Add seller dashboard
4. Add service provider dashboard
5. Add admin approval and quotation system
6. Add payment, delivery, chat, and notifications
