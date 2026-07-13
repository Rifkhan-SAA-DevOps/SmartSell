import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CustomerIcon, CustomerJourneySteps, CustomerPageHeader } from "../components/CustomerUi.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import api from "../utils/api.js";

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalAmount, totalItems, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    deliveryName: user?.name || "",
    deliveryPhone: user?.phone || "",
    deliveryAddress: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [status, setStatus] = useState("");
  const [placing, setPlacing] = useState(false);

  const finalAmount = useMemo(
    () => Math.max(0, totalAmount - Number(coupon?.discountAmount || 0)),
    [totalAmount, coupon]
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function applyCoupon() {
    if (!couponCode.trim()) {
      setStatus("Enter a coupon code first.");
      return;
    }

    try {
      setStatus("Checking coupon...");
      const { data } = await api.post("/promotions/coupons/validate", {
        code: couponCode,
        subtotal: totalAmount,
      });
      setCoupon(data.data);
      setCouponCode(data.data.couponCode);
      setStatus(data.message || "Coupon applied.");
    } catch (error) {
      setCoupon(null);
      setStatus(error.response?.data?.message || "Coupon could not be applied.");
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponCode("");
    setStatus("Coupon removed.");
  }

  async function submitOrder(event) {
    event.preventDefault();
    if (!items.length) {
      setStatus("Your cart is empty.");
      return;
    }

    try {
      setPlacing(true);
      setStatus("Placing order...");
      const payload = {
        ...form,
        couponCode: coupon?.couponCode || "",
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      };
      const { data } = await api.post("/orders", payload);
      clearCart();
      setStatus(data.message || "Order placed successfully.");
      navigate("/orders");
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to place order.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <section className="cx-page cx-checkout-page">
      <CustomerPageHeader
        eyebrow="Secure checkout"
        title="Confirm delivery and place your order"
        description="Review your selected products, add the delivery address, and confirm the final amount before placing the order."
        actions={<Link className="cx-button cx-button--outline" to="/cart"><CustomerIcon name="arrowLeft" />Back to cart</Link>}
      />

      <CustomerJourneySteps
        current={2}
        items={[
          { title: "Cart reviewed", text: `${totalItems || 0} items selected` },
          { title: "Delivery & payment", text: "Confirm the order details" },
          { title: "Order tracking", text: "Follow status after placement" },
        ]}
      />

      {!items.length ? (
        <div className="cx-state-panel">
          <span className="cx-state-panel__icon"><CustomerIcon name="cart" /></span>
          <h2>Your cart is empty</h2>
          <p>Add products from Marketplace before opening checkout.</p>
          <Link className="cx-button cx-button--primary" to="/marketplace">Browse Marketplace</Link>
        </div>
      ) : (
        <form className="cx-checkout-layout" onSubmit={submitOrder}>
          <div className="cx-checkout-main">
            <section className="cx-form-card">
              <div className="cx-form-card__heading">
                <span>01</span>
                <div><h2>Delivery information</h2><p>Use the recipient and address where this order should be delivered.</p></div>
              </div>
              <div className="cx-form-grid cx-form-grid--two">
                <label>Delivery name<input name="deliveryName" value={form.deliveryName} onChange={updateField} required autoComplete="name" /></label>
                <label>Delivery phone<input name="deliveryPhone" value={form.deliveryPhone} onChange={updateField} required autoComplete="tel" /></label>
                <label className="cx-form-grid__full">Delivery address<textarea name="deliveryAddress" rows="5" value={form.deliveryAddress} onChange={updateField} required placeholder="House number, street, area, city" autoComplete="street-address" /></label>
              </div>
            </section>

            <section className="cx-form-card">
              <div className="cx-form-card__heading">
                <span>02</span>
                <div><h2>Promotion code</h2><p>Apply an active SmartSell coupon before confirming payment.</p></div>
              </div>
              <div className="cx-coupon-control">
                <input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Enter coupon code" aria-label="Coupon code" />
                <button className="cx-button cx-button--outline" type="button" onClick={applyCoupon}>Apply coupon</button>
                {coupon && <button className="cx-text-button is-danger" type="button" onClick={removeCoupon}>Remove</button>}
              </div>
              {coupon && (
                <div className="cx-notice is-success">
                  <CustomerIcon name="check" />
                  <span><strong>{coupon.couponCode}</strong> applied. You saved Rs. {money(coupon.discountAmount)}.</span>
                </div>
              )}
            </section>

            <section className="cx-form-card">
              <div className="cx-form-card__heading">
                <span>03</span>
                <div><h2>Products in this order</h2><p>Review quantities and line totals before placement.</p></div>
              </div>
              <div className="cx-checkout-items">
                {items.map((item) => (
                  <article className="cx-checkout-item" key={item.id}>
                    <img src={item.image || item.images?.[0] || "/images/logo.png"} alt={item.name} />
                    <div><strong>{item.name}</strong><span>{item.quantity} × Rs. {money(item.price)}</span></div>
                    <b>Rs. {money(item.price * item.quantity)}</b>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="cx-summary-card cx-checkout-summary">
            <div className="cx-summary-card__heading">
              <span className="cx-summary-card__icon"><CustomerIcon name="shield" /></span>
              <div><h2>Payment summary</h2><p>Final amount submitted with this order.</p></div>
            </div>

            <dl className="cx-summary-list">
              <div><dt>Items</dt><dd>{totalItems}</dd></div>
              <div><dt>Subtotal</dt><dd>Rs. {money(totalAmount)}</dd></div>
              <div><dt>Discount</dt><dd>- Rs. {money(coupon?.discountAmount || 0)}</dd></div>
              <div className="is-total"><dt>Total</dt><dd>Rs. {money(finalAmount)}</dd></div>
            </dl>

            <button className="cx-button cx-button--primary cx-button--wide cx-button--large" type="submit" disabled={placing}>
              {placing ? "Placing order..." : <>Place order <CustomerIcon name="arrowRight" /></>}
            </button>

            <p className="cx-checkout-consent">By placing this order, you confirm that the delivery details and selected quantities are correct.</p>
            {status && <div className="cx-notice" role="status"><CustomerIcon name="info" /><span>{status}</span></div>}
          </aside>
        </form>
      )}
    </section>
  );
}
