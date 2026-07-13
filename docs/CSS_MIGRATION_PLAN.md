# SmartSell CSS Migration Plan

## Goal

Move page styles out of `client/src/styles/global.css` into separate, safe files without breaking the app.

## Current safe structure

```txt
client/src/styles/app.css
client/src/styles/global.css
client/src/styles/design-system.css
client/src/styles/base/
client/src/styles/components/
client/src/styles/pages/customer/
client/src/styles/pages/management/
client/src/styles/legacy/global-boundary.css
```

## Rules

1. Do not delete `global.css` in one step.
2. Move only one page group at a time.
3. Add scoped wrapper classes before moving selectors.
4. Avoid generic names like `.card`, `.section`, `.btn`, `.table` for page-specific UI.
5. Use names like `.customer-product-card`, `.admin-users-table`, `.inventory-panel`.
6. After each move, check desktop, tablet, and mobile.

## Suggested cleanup order

```txt
1. Marketplace / Services
2. Product Detail / Service Detail
3. Request Anything
4. Cart / Checkout / Orders
5. Dashboard / Wishlist / Reviews / Support
6. Admin dashboard / Users / Listings
7. Inventory / Advanced Catalog
8. Business dashboard / Seller Hub / Earnings
9. Reusable components: buttons, forms, tables, badges, modals
```

## Audit command

```bash
cd /d I:\SmartSell\smartsell
node scripts/smartsell-css-audit.mjs
```

This creates:

```txt
SMARTSELL_CSS_CLEANUP_REPORT.md
```
