# SmartSell Phase 134 — Realistic Multi-Page Demo Data

Phase 134 expands the SmartSell PostgreSQL seed into an idempotent, connected dataset intended for UI pagination, filtering, search, role, and workflow testing.

## What the seed provides

The final database targets include at least:

- 20 customers
- 24 seller, shop, and service-provider accounts
- 18 categories
- 48 products, including at least 34 approved products
- 10 or more approved products below Rs. 1,000
- 30 services, including at least 22 approved services
- 30 custom requests
- 36 orders
- 30 product offers
- 50 reviews
- 30 wishlist records
- 50 notifications
- 24 Inbox conversations
- 24 support tickets
- 24 commission records
- 18 payout requests
- 16 coupons
- 24 admin audit actions

The seed also creates realistic relationships between customers, businesses, products, orders, delivery partners, offers, reviews, messages, support tickets, finance records, and Home merchandising.

## Important behaviour

- The seed is idempotent: it can be run again without creating duplicate Phase 134 records.
- Existing admin-created Home merchandising selections are preserved.
- Initial Home merchandising data is created only when no manual offer/highlight selection exists.
- No Prisma migration or schema change is required.
- Existing records are not deleted.

## Run the seed

From the SmartSell project root:

```bat
cd /d I:\SmartSell\smartsell
npm run data:seed
```

The seed uses the `DATABASE_URL` configured in `server/.env`.

## Verify the live database

After the seed completes:

```bat
npm run data:verify
```

This checks record counts and important relationships, including:

- Approved public products and services
- Under-Rs.-1,000 Home products
- Multi-page orders and delivery assignments
- Admin-review listings
- Offers, reviews, wishlist, notifications, Inbox, support, finance, and audit data
- Today’s Offers, Flash Sale, budget collection, and Marketplace Highlight selections

## Run the normal project validation

```bat
npm run check
```

The static `audit:data` check is now included automatically.

## Demo credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@smartsell.local` | `Admin@12345` |
| Customer | `customer1@smartsell.local` | `Customer@12345` |
| Seller | `seller1@smartsell.local` | `Seller@12345` |
| Shop seller | `shop1@smartsell.local` | `Shop@12345` |
| Service provider | `provider1@smartsell.local` | `Provider@12345` |
| Delivery partner | `delivery1@smartsell.local` | `Delivery@12345` |

Additional accounts continue the same numbered email pattern.
