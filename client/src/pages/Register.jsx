import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/pages/customer/AuthPages.css";

const roles = [
  { value: "customer", label: "Customer", hint: "Buy products, track orders, request services", code: "CU" },
  { value: "seller", label: "Individual Seller", hint: "Sell own or used products", code: "SE" },
  { value: "shop", label: "Shop Seller", hint: "Run a shop storefront inside SmartSell", code: "SH" },
  { value: "service_provider", label: "Service Provider", hint: "Offer cake, editing, web, delivery, events", code: "SP" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
    businessName: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedRole = roles.find((role) => role.value === form.role) || roles[0];

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === "customer" ? "/dashboard" : "/seller-hub", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-modern-shell register-shell">
      <section className="auth-modern-panel auth-modern-copy register-copy">
        <span className="auth-kicker">Join SmartSell</span>
        <h1>Create the right account for your marketplace role.</h1>
        <p>
          Customers can start shopping immediately. Sellers, shops, and service providers can submit their business profile for admin review.
        </p>

        <div className="register-preview-card">
          <span>{selectedRole.code}</span>
          <div>
            <strong>{selectedRole.label}</strong>
            <p>{selectedRole.hint}</p>
          </div>
        </div>

        <div className="auth-feature-grid compact">
          <article>
            <strong>One login</strong>
            <p>Access orders, requests, inbox, support, and your workspace.</p>
          </article>
          <article>
            <strong>Approval flow</strong>
            <p>Business profiles can be reviewed before selling publicly.</p>
          </article>
        </div>
      </section>

      <section className="auth-modern-panel auth-form-panel register-form-panel">
        <div className="auth-form-heading">
          <span className="auth-kicker">Account setup</span>
          <h2>Register with SmartSell</h2>
          <p>Choose your role and complete the basic account information.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-modern-form register-modern-form">
          {error && <div className="auth-error-box">{error}</div>}

          <div className="auth-form-grid">
            <label>
              <span>Full name</span>
              <input name="name" value={form.name} onChange={updateField} placeholder="Your name" required />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" required />
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" value={form.phone} onChange={updateField} placeholder="07XXXXXXXX" />
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" value={form.password} onChange={updateField} placeholder="Minimum 8 characters" required />
            </label>
            <label className="auth-full-field">
              <span>Business / shop / service name</span>
              <input name="businessName" value={form.businessName} onChange={updateField} placeholder="Optional for customers" />
            </label>
          </div>

          <div className="modern-role-picker">
            {roles.map((role) => (
              <label key={role.value} className={form.role === role.value ? "modern-role-option active" : "modern-role-option"}>
                <input type="radio" name="role" value={role.value} checked={form.role === role.value} onChange={updateField} />
                <span className="role-code">{role.code}</span>
                <span>
                  <strong>{role.label}</strong>
                  <small>{role.hint}</small>
                </span>
              </label>
            ))}
          </div>

          <button className="auth-primary-action" type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Create SmartSell account"}
          </button>

          <p className="auth-switch-line">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
