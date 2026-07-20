# SmartSell Route/UI Regression Audit

Generated: 2026-07-20T08:56:42.346Z
Project root: `I:\SmartSell\smartsell`

✅ Root audit script configured
✅ API-contract audit configured
✅ Server syntax audit configured
✅ Root check command runs from the project root
✅ All local frontend import targets exist
✅ Frontend App.jsx found
✅ Frontend routes detected — 42 routes
✅ No duplicate frontend routes

## Frontend routes
- `/`
- `/marketplace`
- `/products/:id`
- `/services`
- `/services/:id`
- `/services/:id/quote`
- `/storefronts`
- `/storefronts/:kind/:id`
- `/request-anything`
- `/my-requests`
- `/wishlist`
- `/my-reviews`
- `/offers`
- `/profile`
- `/seller-hub`
- `/cart`
- `/checkout`
- `/orders`
- `/business`
- `/login`
- `/register`
- `/dashboard`
- `/admin`
- `/fulfillment`
- `/delivery`
- `/earnings`
- `/notifications`
- `/inbox`
- `/promotions`
- `/home-merchandising`
- `/reports`
- `/support`
- `/users`
- `/listings`
- `/settings`
- `/content`
- `/seo`
- `/security`
- `/inventory`
- `/catalog-advanced`
- `/gallery-management`
- `*`
✅ Active CSS import graph is complete
✅ Backend server.js found

## Backend API mounts
- `/api` → healthRoutes
- `/api/auth` → authRoutes
- `/api/admin` → adminRoutes
- `/api/upload` → uploadRoutes
- `/api/products` → productRoutes
- `/api/services` → serviceRoutes
- `/api/requests` → requestRoutes
- `/api/sellers` → sellerRoutes
- `/api/orders` → orderRoutes
- `/api/business` → businessRoutes
- `/api/reviews` → reviewRoutes
- `/api/wishlist` → wishlistRoutes
- `/api/profile` → profileRoutes
- `/api/finance` → financeRoutes
- `/api/communication` → communicationRoutes
- `/api/promotions` → promotionRoutes
- `/api/analytics` → analyticsRoutes
- `/api/support` → supportRoutes
- `/api/users` → userRoutes
- `/api/storefronts` → storefrontRoutes
- `/api/offers` → offerRoutes
- `/api/settings` → settingsRoutes
- `/api/delivery` → deliveryRoutes
- `/api/security` → securityRoutes
- `/api/inventory` → inventoryRoutes
- `/api/gallery` → galleryRoutes
✅ Mounted backend route files exist

## Warnings
No warnings found.

## Errors
No blocking errors found.

## Manual browser checks still required
- Open protected routes with the correct role and live API data.
- Check browser console and server logs.
- Verify desktop, tablet, and mobile layouts with realistic record counts.
