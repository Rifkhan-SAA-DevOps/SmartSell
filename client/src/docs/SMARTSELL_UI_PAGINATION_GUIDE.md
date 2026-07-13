# SmartSell UI Pagination Guide

Every data list should use pagination once records become more than 10.

## Standard rule

- Show 10 records first.
- Keep cards/tables readable.
- Do not shrink tables to fit side-by-side columns.
- Use internal horizontal scroll for wide tables.
- Put pagination below the list/table/card grid.

## Usage

```jsx
import SmartPagination from "../components/SmartPagination.jsx";
import useSmartPagination from "../hooks/useSmartPagination.js";

const productPagination = useSmartPagination(products, {
  initialPageSize: 10,
  resetKey: `products-${products.length}`,
});

<div className="product-grid">
  {productPagination.items.map((product) => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
<SmartPagination pagination={productPagination} label="products" />
```

## For tables

```jsx
const orderPagination = useSmartPagination(orders, { initialPageSize: 10 });

<table>
  <tbody>
    {orderPagination.items.map((order) => (
      <tr key={order.id}>...</tr>
    ))}
  </tbody>
</table>
<SmartPagination pagination={orderPagination} label="orders" compact />
```
