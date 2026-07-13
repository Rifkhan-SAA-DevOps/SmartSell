# SmartSell Route/API Audit Report

Generated: 2026-07-12T04:59:25.376Z
Project root: `I:\SmartSell\smartsell`

✅ Frontend App.jsx found
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
- `*`
✅ App.jsx import targets exist
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

## Frontend API calls found
- POST `/communication/context-threads` in `client\src\components\ContextMessageButton.jsx`
- POST `/wishlist/toggle` in `client\src\components\ProductCard.jsx`
- GET `/settings/public` in `client\src\components\SEOHead.jsx`
- GET `/auth/me` in `client\src\context\AuthContext.jsx`
- POST `/auth/login` in `client\src\context\AuthContext.jsx`
- POST `/auth/register` in `client\src\context\AuthContext.jsx`
- GET `/auth/me` in `client\src\context\AuthContext.jsx`
- GET `/communication/summary` in `client\src\context\RealtimeContext.jsx`
- PATCH `/admin/requests/:param/status` in `client\src\pages\AdminDashboard.jsx`
- PATCH `/orders/:param/status` in `client\src\pages\AdminDashboard.jsx`
- GET `/admin/overview` in `client\src\pages\AdminDashboard.jsx`
- PATCH `/inventory/products/:param/advanced` in `client\src\pages\AdvancedCatalog.jsx`
- POST `/inventory/products/:param/variants` in `client\src\pages\AdvancedCatalog.jsx`
- POST `/inventory/products/:param/variants/bulk` in `client\src\pages\AdvancedCatalog.jsx`
- POST `/inventory/products/:param/duplicate` in `client\src\pages\AdvancedCatalog.jsx`
- PATCH `/inventory/products/:param/status` in `client\src\pages\AdvancedCatalog.jsx`
- PATCH `/inventory/services/:param/advanced` in `client\src\pages\AdvancedCatalog.jsx`
- POST `/inventory/services/:param/duplicate` in `client\src\pages\AdvancedCatalog.jsx`
- PATCH `/inventory/services/:param/status` in `client\src\pages\AdvancedCatalog.jsx`
- GET `/inventory/products` in `client\src\pages\AdvancedCatalog.jsx`
- GET `/inventory/services` in `client\src\pages\AdvancedCatalog.jsx`
- GET `/inventory/catalog-template` in `client\src\pages\AdvancedCatalog.jsx`
- PATCH `/business/products/:param` in `client\src\pages\BusinessDashboard.jsx`
- PATCH `/business/products/:param` in `client\src\pages\BusinessDashboard.jsx`
- PATCH `/business/services/:param` in `client\src\pages\BusinessDashboard.jsx`
- PATCH `/business/services/:param` in `client\src\pages\BusinessDashboard.jsx`
- PATCH `/business/requests/:param/status` in `client\src\pages\BusinessDashboard.jsx`
- GET `/business/me` in `client\src\pages\BusinessDashboard.jsx`
- POST `/promotions/coupons/validate` in `client\src\pages\Checkout.jsx`
- POST `/orders` in `client\src\pages\Checkout.jsx`
- GET `/settings/admin` in `client\src\pages\ContentManagement.jsx`
- PATCH `/settings/admin` in `client\src\pages\ContentManagement.jsx`
- PATCH `/delivery/orders/:param/status` in `client\src\pages\DeliveryDashboard.jsx`
- GET `/delivery/tasks?status=:param` in `client\src\pages\DeliveryDashboard.jsx`
- GET `/delivery/summary` in `client\src\pages\DeliveryDashboard.jsx`
- PATCH `/finance/payouts/:param/status` in `client\src\pages\Earnings.jsx`
- GET `/finance/summary` in `client\src\pages\Earnings.jsx`
- POST `/finance/payouts` in `client\src\pages\Earnings.jsx`
- GET `/delivery/tasks?status=:param` in `client\src\pages\Fulfillment.jsx`
- PATCH `/orders/:param/status` in `client\src\pages\Fulfillment.jsx`
- PATCH `/delivery/orders/:param/assign` in `client\src\pages\Fulfillment.jsx`
- GET `/delivery/partners` in `client\src\pages\Fulfillment.jsx`
- GET `/delivery/summary` in `client\src\pages\Fulfillment.jsx`
- GET `/settings/public` in `client\src\pages\Home.jsx`
- GET `/products` in `client\src\pages\Home.jsx`
- GET `/services` in `client\src\pages\Home.jsx`
- GET `/communication/threads/:param` in `client\src\pages\Inbox.jsx`
- POST `/communication/threads/:param/messages` in `client\src\pages\Inbox.jsx`
- GET `/communication/threads` in `client\src\pages\Inbox.jsx`
- GET `/communication/recipients` in `client\src\pages\Inbox.jsx`
- POST `/communication/threads` in `client\src\pages\Inbox.jsx`
- PATCH `/inventory/products/:param/stock` in `client\src\pages\InventoryCenter.jsx`
- GET `/inventory/summary` in `client\src\pages\InventoryCenter.jsx`
- GET `/inventory/products` in `client\src\pages\InventoryCenter.jsx`
- GET `/inventory/movements` in `client\src\pages\InventoryCenter.jsx`
- GET `/admin/listings` in `client\src\pages\ListingManagement.jsx`
- GET `/products:param` in `client\src\pages\Marketplace.jsx`
- GET `/promotions/categories?type=product&active=true` in `client\src\pages\Marketplace.jsx`
- PATCH `/requests/:param/customer` in `client\src\pages\MyRequests.jsx`
- GET `/requests/mine` in `client\src\pages\MyRequests.jsx`
- GET `/reviews/mine` in `client\src\pages\MyReviews.jsx`
- PATCH `/communication/notifications/:param/read` in `client\src\pages\Notifications.jsx`
- GET `/communication/notifications` in `client\src\pages\Notifications.jsx`
- PATCH `/communication/notifications/read-all` in `client\src\pages\Notifications.jsx`
- PATCH `/offers/:param` in `client\src\pages\Offers.jsx`
- GET `/offers` in `client\src\pages\Offers.jsx`
- POST `/reviews` in `client\src\pages\Orders.jsx`
- GET `/orders` in `client\src\pages\Orders.jsx`
- GET `/settings/admin` in `client\src\pages\PlatformSettings.jsx`
- PATCH `/settings/admin` in `client\src\pages\PlatformSettings.jsx`
- GET `/products/:param` in `client\src\pages\ProductDetail.jsx`
- GET `/products?category=:param&limit=5` in `client\src\pages\ProductDetail.jsx`
- POST `/offers/products/:param` in `client\src\pages\ProductDetail.jsx`
- POST `/wishlist/toggle` in `client\src\pages\ProductDetail.jsx`
- GET `/profile/me` in `client\src\pages\ProfileSettings.jsx`
- PATCH `/profile/me` in `client\src\pages\ProfileSettings.jsx`
- PATCH `/profile/password` in `client\src\pages\ProfileSettings.jsx`
- PATCH `/promotions/categories/:param` in `client\src\pages\PromotionCenter.jsx`
- PATCH `/promotions/coupons/:param` in `client\src\pages\PromotionCenter.jsx`
- GET `/promotions/categories` in `client\src\pages\PromotionCenter.jsx`
- GET `/promotions/coupons` in `client\src\pages\PromotionCenter.jsx`
- POST `/promotions/categories` in `client\src\pages\PromotionCenter.jsx`
- POST `/promotions/coupons` in `client\src\pages\PromotionCenter.jsx`
- GET `/analytics/admin` in `client\src\pages\Reports.jsx`
- POST `/requests` in `client\src\pages\RequestAnything.jsx`
- GET `/security/summary` in `client\src\pages\SecurityCenter.jsx`
- GET `/security/audit?limit=40` in `client\src\pages\SecurityCenter.jsx`
- POST `/upload/listing-images` in `client\src\pages\SellerHub.jsx`
- POST `/products` in `client\src\pages\SellerHub.jsx`
- POST `/services` in `client\src\pages\SellerHub.jsx`
- GET `/settings/admin` in `client\src\pages\SEOSettings.jsx`
- PATCH `/settings/admin` in `client\src\pages\SEOSettings.jsx`
- GET `/services/:param` in `client\src\pages\ServiceDetail.jsx`
- GET `/services?category=:param&limit=5` in `client\src\pages\ServiceDetail.jsx`
- GET `/services/:param` in `client\src\pages\ServiceQuote.jsx`
- POST `/requests/service-quote/:param` in `client\src\pages\ServiceQuote.jsx`
- GET `/services:param` in `client\src\pages\Services.jsx`
- GET `/promotions/categories?type=service&active=true` in `client\src\pages\Services.jsx`
- GET `/storefronts${params.toString() ? ` in `client\src\pages\Storefronts.jsx`
- PATCH `/support/tickets/:param` in `client\src\pages\SupportCenter.jsx`
- GET `/support/tickets` in `client\src\pages\SupportCenter.jsx`
- GET `/support/summary` in `client\src\pages\SupportCenter.jsx`
- GET `/orders` in `client\src\pages\SupportCenter.jsx`
- POST `/support/tickets` in `client\src\pages\SupportCenter.jsx`
- GET `/users/admin/accounts?:param` in `client\src\pages\UserManagement.jsx`
- PATCH `/users/admin/accounts/:param/:param` in `client\src\pages\UserManagement.jsx`
- PATCH `/users/admin/accounts/:param/reset-password` in `client\src\pages\UserManagement.jsx`
- GET `/users/admin/overview` in `client\src\pages\UserManagement.jsx`
- POST `/users/admin/accounts` in `client\src\pages\UserManagement.jsx`
- GET `/wishlist` in `client\src\pages\Wishlist.jsx`
- GET `/wishlist` in `client\src\pages\Wishlist.jsx`
- POST `/wishlist/toggle` in `client\src\pages\Wishlist.jsx`
✅ Mounted backend route files exist

## Warnings
⚠️ Frontend API calls whose first path segment is not mounted in server.js:
  - GET /products:param in client\src\pages\Marketplace.jsx
  - GET /services:param in client\src\pages\Services.jsx
  - GET /storefronts${params.toString() ?  in client\src\pages\Storefronts.jsx

## Errors
No blocking errors found by static audit.

## Next manual checks
- Run frontend and open every protected route with the correct role.
- Run backend and use the smoke script for public API routes.
- Check browser console for React runtime errors.
- Check terminal logs for Prisma or missing-field errors.
