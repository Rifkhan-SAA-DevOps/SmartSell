import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { CustomerIcon, CustomerPageHeader } from "../components/CustomerUi.jsx";
import SmartConfirmDialog from "../components/SmartConfirmDialog.jsx";
import { useCart } from "../context/CartContext.jsx";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

export default function Cart() {
  const { items, totalAmount, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const deliveryEstimate = useMemo(() => (Number(totalAmount || 0) > 0 ? 450 : 0), [totalAmount]);
  const grandTotal = Number(totalAmount || 0) + deliveryEstimate;

  function handleClearCart() {
    clearCart();
    setClearConfirmOpen(false);
  }

  return (
    <section className="cx-page cx-cart-page">
      <CustomerPageHeader
        eyebrow="Shopping cart"
        title="Review your products before checkout"
        description="Adjust quantities, remove anything you no longer need, and continue when your order is ready."
        actions={<Link className="cx-button cx-button--outline" to="/marketplace"><CustomerIcon name="arrowLeft" />Continue shopping</Link>}
        summary={
          <div className="cx-header-summary">
            <span>Cart value</span>
            <strong>Rs. {money(totalAmount)}</strong>
            <small>{totalItems || 0} item{Number(totalItems || 0) === 1 ? "" : "s"}</small>
          </div>
        }
      />

      {!items.length ? (
        <div className="cx-state-panel">
          <span className="cx-state-panel__icon"><CustomerIcon name="cart" /></span>
          <h2>Your cart is empty</h2>
          <p>Browse approved marketplace products and add the items you would like to order.</p>
          <Link className="cx-button cx-button--primary" to="/marketplace">Browse Marketplace</Link>
        </div>
      ) : (
        <div className="cx-cart-layout">
          <section className="cx-cart-list-panel">
            <div className="cx-section-heading cx-section-heading--bordered">
              <div>
                <span className="cx-eyebrow">Selected products</span>
                <h2>{items.length} product{items.length === 1 ? "" : "s"} in your cart</h2>
              </div>
              <button className="cx-text-button is-danger" type="button" onClick={() => setClearConfirmOpen(true)}>
                <CustomerIcon name="trash" />Clear cart
              </button>
            </div>

            <div className="cx-cart-list">
              {items.map((item) => (
                <article className="cx-cart-item" key={item.id}>
                  <Link className="cx-cart-item__media" to={`/products/${item.id}`} aria-label={`View ${item.name}`}>
                    <img src={item.image || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=400&q=80"} alt={item.name} />
                  </Link>

                  <div className="cx-cart-item__content">
                    <div className="cx-cart-item__title-row">
                      <div>
                        <Link to={`/products/${item.id}`}><h3>{item.name}</h3></Link>
                        <p>{item.location || "Sri Lanka"} · {(item.condition || "new").replaceAll("_", " ")}</p>
                      </div>
                      <button className="cx-icon-button is-danger" type="button" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}>
                        <CustomerIcon name="trash" />
                      </button>
                    </div>

                    <div className="cx-cart-item__details">
                      <span><small>Unit price</small><strong>Rs. {money(item.price)}</strong></span>
                      <div className="cx-quantity-control" aria-label={`Quantity for ${item.name}`}>
                        <button type="button" onClick={() => updateQuantity(item.id, Number(item.quantity || 1) - 1)} aria-label="Decrease quantity"><CustomerIcon name="minus" size={16} /></button>
                        <input
                          aria-label="Quantity"
                          type="number"
                          min="1"
                          max={item.stock || 99}
                          value={item.quantity}
                          onChange={(event) => updateQuantity(item.id, event.target.value)}
                        />
                        <button type="button" onClick={() => updateQuantity(item.id, Number(item.quantity || 1) + 1)} aria-label="Increase quantity"><CustomerIcon name="plus" size={16} /></button>
                      </div>
                      <span className="cx-cart-item__line-total"><small>Line total</small><strong>Rs. {money(item.price * item.quantity)}</strong></span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="cx-summary-card">
            <div className="cx-summary-card__heading">
              <span className="cx-summary-card__icon"><CustomerIcon name="package" /></span>
              <div><h2>Order summary</h2><p>Estimated before final checkout confirmation.</p></div>
            </div>

            <dl className="cx-summary-list">
              <div><dt>Items</dt><dd>{totalItems}</dd></div>
              <div><dt>Subtotal</dt><dd>Rs. {money(totalAmount)}</dd></div>
              <div><dt>Estimated delivery</dt><dd>Rs. {money(deliveryEstimate)}</dd></div>
              <div className="is-total"><dt>Estimated total</dt><dd>Rs. {money(grandTotal)}</dd></div>
            </dl>

            <Link className="cx-button cx-button--primary cx-button--wide cx-button--large" to="/checkout">
              Continue to checkout <CustomerIcon name="arrowRight" />
            </Link>

            <div className="cx-security-note">
              <CustomerIcon name="shield" />
              <div><strong>SmartSell order protection</strong><p>Track payment, seller fulfillment, delivery, and support from one account.</p></div>
            </div>
          </aside>
        </div>
      )}

      <SmartConfirmDialog
        open={clearConfirmOpen}
        title="Clear every product from your cart?"
        description="This removes all selected products and quantities from this browser. You can add them again later from Marketplace."
        eyebrow="Cart cleanup"
        confirmLabel="Clear cart"
        cancelLabel="Keep products"
        details={[
          { label: "Products", value: `${items.length}` },
          { label: "Quantity", value: `${totalItems || 0} item${Number(totalItems || 0) === 1 ? "" : "s"}` },
          { label: "Cart value", value: `Rs. ${money(totalAmount)}` },
        ]}
        onConfirm={handleClearCart}
        onClose={() => setClearConfirmOpen(false)}
      />
    </section>
  );
}
