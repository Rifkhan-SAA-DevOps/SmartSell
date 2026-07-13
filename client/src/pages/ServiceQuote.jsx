import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CustomerBreadcrumbs, CustomerIcon, CustomerJourneySteps, CustomerPageHeader } from "../components/CustomerUi.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  budget: "",
  location: "",
  preferredDate: "",
  preferredTime: "",
  message: "",
};

function money(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function imageList(service) {
  const urls = [];
  if (service?.image) urls.push(service.image);
  if (Array.isArray(service?.images)) {
    service.images.forEach((item) => {
      const url = typeof item === "string" ? item : item?.url;
      if (url) urls.push(url);
    });
  }
  return [...new Set(urls)].filter(Boolean);
}

export default function ServiceQuote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [service, setService] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successRequest, setSuccessRequest] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadService() {
      try {
        setLoading(true);
        setStatus("");
        const { data } = await api.get(`/services/${id}`);
        if (!cancelled) setService(data.data);
      } catch (error) {
        if (!cancelled) setStatus(error.response?.data?.message || "Service could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadService();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
    }));
  }, [user]);

  const previewImage = useMemo(
    () => imageList(service)[0] || "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    [service]
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submitQuote(event) {
    event.preventDefault();
    if (!service) return;

    setStatus("Submitting your quotation request...");
    setSuccessRequest(null);
    setSubmitting(true);

    try {
      const { data } = await api.post(`/requests/service-quote/${service.id}`, form);
      setSuccessRequest(data.data?.request || null);
      setStatus("Quotation request submitted successfully.");
      setForm((current) => ({
        ...emptyForm,
        name: current.name,
        phone: current.phone,
        email: current.email,
      }));
    } catch (error) {
      setStatus(error.response?.data?.message || "Could not submit quotation request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="cx-page cx-state-panel" aria-live="polite">
        <span className="cx-state-panel__icon"><CustomerIcon name="message" /></span>
        <h1>Loading quotation workspace</h1>
        <p>Preparing the selected service and request form.</p>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="cx-page cx-state-panel">
        <span className="cx-state-panel__icon"><CustomerIcon name="info" /></span>
        <h1>Service unavailable</h1>
        <p>{status || "This service is not available for quote requests."}</p>
        <Link className="cx-button cx-button--primary" to="/services">Back to Services</Link>
      </section>
    );
  }

  return (
    <section className="cx-page cx-quote-page">
      <CustomerBreadcrumbs items={[
        { label: "Services", to: "/services" },
        { label: service.title, to: `/services/${service.id}` },
        { label: "Quotation" },
      ]} />

      <CustomerPageHeader
        eyebrow="Service quotation"
        title="Request a clear price before the work begins"
        description="Share the scope, date, location, and budget so the provider can review the requirement and respond accurately."
        actions={<button className="cx-button cx-button--outline" type="button" onClick={() => navigate(`/services/${service.id}`)}><CustomerIcon name="arrowLeft" />Back to service</button>}
      />

      <CustomerJourneySteps
        current={1}
        items={[
          { title: "Share requirement", text: "Budget, place, date, and scope" },
          { title: "Provider review", text: "Questions or quotation response" },
          { title: "Accept and track", text: "Continue from My Requests" },
        ]}
      />

      <div className="cx-quote-layout">
        <form className="cx-form-card cx-quote-form" onSubmit={submitQuote}>
          <div className="cx-form-card__heading">
            <span>01</span>
            <div><h2>Your contact information</h2><p>These details help the provider or SmartSell contact you about the quotation.</p></div>
          </div>
          <div className="cx-form-grid cx-form-grid--two">
            <label>Name<input name="name" value={form.name} onChange={updateField} required placeholder="Customer name" autoComplete="name" /></label>
            <label>Phone<input name="phone" value={form.phone} onChange={updateField} required placeholder="077xxxxxxx" autoComplete="tel" /></label>
            <label className="cx-form-grid__full">Email <small>Optional</small><input type="email" name="email" value={form.email} onChange={updateField} placeholder="Email for updates" autoComplete="email" /></label>
          </div>

          <div className="cx-form-divider" />

          <div className="cx-form-card__heading">
            <span>02</span>
            <div><h2>Budget and schedule</h2><p>Add practical details that affect provider availability and pricing.</p></div>
          </div>
          <div className="cx-form-grid cx-form-grid--two">
            <label>Budget <small>Optional</small><input name="budget" value={form.budget} onChange={updateField} placeholder="Example: 15000" inputMode="numeric" /></label>
            <label>Location <small>Optional</small><input name="location" value={form.location} onChange={updateField} placeholder="Kalmunai, Colombo..." /></label>
            <label>Preferred date <small>Optional</small><input type="date" name="preferredDate" value={form.preferredDate} onChange={updateField} /></label>
            <label>Preferred time <small>Optional</small><input type="time" name="preferredTime" value={form.preferredTime} onChange={updateField} /></label>
          </div>

          <div className="cx-form-divider" />

          <div className="cx-form-card__heading">
            <span>03</span>
            <div><h2>Describe the work</h2><p>Explain the final result, quantity, style, references, and any important restrictions.</p></div>
          </div>
          <div className="cx-form-grid">
            <label className="cx-form-grid__full">Requirement details<textarea name="message" value={form.message} onChange={updateField} required rows="8" placeholder="Example: I need a 2 kg birthday cake with a blue theme, delivery to Kalmunai before 5 PM, and the name written on top." /></label>
          </div>

          <div className="cx-form-actions cx-form-actions--submit">
            <button className="cx-button cx-button--primary cx-button--large" type="submit" disabled={submitting}>
              {submitting ? "Submitting request..." : <>Submit quotation request <CustomerIcon name="arrowRight" /></>}
            </button>
            <span>{isAuthenticated ? "You can track the response in My Requests." : "Login is recommended for easier request tracking."}</span>
          </div>

          {status && <div className={`cx-notice ${successRequest ? "is-success" : ""}`} role="status"><CustomerIcon name={successRequest ? "check" : "info"} /><span>{status}</span></div>}
          {successRequest && (
            <div className="cx-success-actions">
              <Link className="cx-button cx-button--outline" to="/my-requests">Track in My Requests <CustomerIcon name="arrowRight" /></Link>
            </div>
          )}
        </form>

        <aside className="cx-service-summary-card">
          <div className="cx-service-summary-card__media">
            <img src={previewImage} alt={service.title} />
            <span>{service.category || "SmartSell service"}</span>
          </div>
          <div className="cx-service-summary-card__body">
            <span className="cx-eyebrow">Selected service</span>
            <h2>{service.title}</h2>
            <p>{service.description || "Tell us what you need and SmartSell will help arrange the service."}</p>
            <dl className="cx-spec-list">
              <div><dt>Starting price</dt><dd>{service.priceFrom ? `Rs. ${money(service.priceFrom)}` : "Quote based"}</dd></div>
              <div><dt>Provider</dt><dd>{service.providerName || service.providerType || "SmartSell provider"}</dd></div>
              <div><dt>Request tracking</dt><dd>{isAuthenticated ? "Available" : "Login recommended"}</dd></div>
            </dl>
            <div className="cx-security-note">
              <CustomerIcon name="shield" />
              <div><strong>Quotation first</strong><p>Review pricing and provider response before moving forward with the service.</p></div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
