import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CustomerIcon, CustomerJourneySteps, CustomerPageHeader } from "../components/CustomerUi.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

const requestOptions = [
  { value: "custom", icon: "spark", title: "Custom need", text: "Anything not already listed" },
  { value: "product", icon: "bag", title: "New product", text: "Find or arrange an item" },
  { value: "used-product", icon: "tag", title: "Used product", text: "Phones, vehicles, furniture" },
  { value: "service", icon: "user", title: "Service", text: "Events, editing, food, web" },
  { value: "package", icon: "package", title: "Package", text: "Combine products and services" },
  { value: "urgent", icon: "clock", title: "Urgent request", text: "Same-day or next-day need" },
];

const baseForm = {
  name: "",
  phone: "",
  email: "",
  requestType: "custom",
  budget: "",
  location: "",
  neededDate: "",
  message: "",
};

export default function RequestAnything() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState(baseForm);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const service = searchParams.get("service");
    const product = searchParams.get("product");
    const provider = searchParams.get("provider");

    if (service) {
      setForm((current) => ({
        ...current,
        requestType: "service",
        message: current.message || `I need a quotation for ${service}.`,
      }));
      return;
    }

    if (product) {
      setForm((current) => ({
        ...current,
        requestType: "product",
        message: current.message || `I need help with ${product}.`,
      }));
      return;
    }

    if (provider) {
      setForm((current) => ({
        ...current,
        requestType: "custom",
        message: current.message || `I would like to request something from ${provider}.`,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
    }));
  }, [user]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitRequest(event) {
    event.preventDefault();
    setStatus("Sending request...");
    setSubmitting(true);
    try {
      const messageWithDate = form.neededDate
        ? `${form.message}\nNeeded date: ${form.neededDate}`
        : form.message;

      await api.post("/requests", {
        ...form,
        message: messageWithDate,
      });

      setForm({
        ...baseForm,
        name: user?.name || "",
        phone: user?.phone || "",
        email: user?.email || "",
      });
      setStatus("Request submitted successfully. SmartSell can now review it, assign the right seller or provider, and send an update or quotation.");
    } catch (error) {
      setStatus(error.response?.data?.message || "Request failed. Please check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="cx-page cx-request-page">
      <CustomerPageHeader
        eyebrow="Request anything"
        title="Tell SmartSell what you need"
        description="Use one clear request for products, services, packages, or urgent needs that are not easy to find in the marketplace."
        actions={isAuthenticated ? <Link className="cx-button cx-button--outline" to="/my-requests">View my requests <CustomerIcon name="arrowRight" /></Link> : <Link className="cx-button cx-button--outline" to="/login">Login to track requests</Link>}
      />

      <CustomerJourneySteps
        current={1}
        items={[
          { title: "Share your need", text: "Type, budget, place, and date" },
          { title: "SmartSell reviews", text: "We route it to the right business" },
          { title: "Receive an update", text: "Quotation, offer, or progress status" },
        ]}
      />

      <div className="cx-request-layout">
        <form className="cx-form-card cx-request-form" onSubmit={submitRequest}>
          <div className="cx-form-card__heading">
            <span>01</span>
            <div><h2>Choose the request type</h2><p>Select the option that best matches what you need.</p></div>
          </div>

          <div className="cx-request-type-grid" role="radiogroup" aria-label="Request type">
            {requestOptions.map((option) => (
              <button
                type="button"
                role="radio"
                aria-checked={form.requestType === option.value}
                key={option.value}
                className={form.requestType === option.value ? "cx-request-type is-active" : "cx-request-type"}
                onClick={() => setForm((current) => ({ ...current, requestType: option.value }))}
              >
                <span><CustomerIcon name={option.icon} /></span>
                <b>{option.title}</b>
                <small>{option.text}</small>
              </button>
            ))}
          </div>

          <div className="cx-form-divider" />

          <div className="cx-form-card__heading">
            <span>02</span>
            <div><h2>Add your contact and requirement</h2><p>Clear details help SmartSell respond with a more accurate option.</p></div>
          </div>

          <input type="hidden" name="requestType" value={form.requestType} />
          <div className="cx-form-grid cx-form-grid--two">
            <label>Name<input name="name" value={form.name} onChange={updateField} required autoComplete="name" /></label>
            <label>Phone<input name="phone" value={form.phone} onChange={updateField} required autoComplete="tel" /></label>
            <label>Email <small>Optional</small><input type="email" name="email" value={form.email} onChange={updateField} placeholder="Useful for updates" autoComplete="email" /></label>
            <label>Budget <small>Optional</small><input name="budget" value={form.budget} onChange={updateField} placeholder="Example: 8000" inputMode="numeric" /></label>
            <label>Location <small>Optional</small><input name="location" value={form.location} onChange={updateField} placeholder="Kalmunai, Colombo..." /></label>
            <label>Needed date <small>Optional</small><input type="date" name="neededDate" value={form.neededDate} onChange={updateField} /></label>
            <label className="cx-form-grid__full">Requirement details<textarea name="message" value={form.message} onChange={updateField} rows="7" required placeholder="Example: I need a 2 kg birthday cake, a gift, and delivery to Kalmunai before 5 PM tomorrow. My budget is Rs. 8,000." /></label>
          </div>

          <div className="cx-form-actions cx-form-actions--submit">
            <button className="cx-button cx-button--primary cx-button--large" type="submit" disabled={submitting}>
              {submitting ? "Submitting request..." : <>Submit request <CustomerIcon name="arrowRight" /></>}
            </button>
            <span>Your request will be saved for admin/provider follow-up.</span>
          </div>
          {status && <div className="cx-notice" role="status"><CustomerIcon name="info" /><span>{status}</span></div>}
        </form>

        <aside className="cx-guidance-panel">
          <div className="cx-guidance-panel__heading">
            <span><CustomerIcon name="spark" /></span>
            <div><h2>Write a request that gets a useful response</h2><p>Add the information a seller or provider needs to make a decision.</p></div>
          </div>
          <ul className="cx-check-list">
            <li><CustomerIcon name="check" /><span><strong>Describe the final result</strong><small>Explain what you expect, not only the product or service name.</small></span></li>
            <li><CustomerIcon name="check" /><span><strong>Share budget and timing</strong><small>A realistic amount and required date help providers respond faster.</small></span></li>
            <li><CustomerIcon name="check" /><span><strong>Add the location</strong><small>Delivery and service availability often depend on your area.</small></span></li>
            <li><CustomerIcon name="check" /><span><strong>Track everything in one place</strong><small>Logged-in customers can follow responses in My Requests.</small></span></li>
          </ul>
          <div className="cx-guidance-note">
            <CustomerIcon name="shield" />
            <p>SmartSell can review the request, assign a business, and keep quotation or progress updates connected to your account.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
