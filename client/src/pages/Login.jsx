import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/smartsell-icon.png";
import "../styles/pages/customer/AuthPages.css";

const demoAccounts = [
  { label: "Admin", email: "admin@smartsell.local", password: "Admin@12345" },
  { label: "Customer", email: "customer@smartsell.local", password: "Customer@12345" },
  { label: "Seller", email: "seller@smartsell.local", password: "Seller@12345" },
  { label: "Provider", email: "provider@smartsell.local", password: "Provider@12345" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "admin@smartsell.local", password: "Admin@12345" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function fillDemo(account) {
    setForm({ email: account.email, password: account.password });
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form);
      navigate(user.role === "admin" || user.role === "super_admin" ? "/admin" : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-modern-shell">
      <section className="auth-modern-panel auth-modern-copy">
        <div className="auth-logo-line">
          <img src={logo} alt="SmartSell" />
          <div>
            <strong>SmartSell</strong>
            <span>Marketplace • Services • Requests</span>
          </div>
        </div>

        <div className="auth-copy-content">
          <span className="auth-kicker">Welcome back</span>
          <h1>Run your marketplace from one clean workspace.</h1>
          <p>
            Login to manage buying, selling, service requests, orders, payouts, support, and admin operations inside SmartSell.
          </p>
        </div>

        <div className="auth-feature-grid">
          <article>
            <span>01</span>
            <strong>Buy & request</strong>
            <p>Shop products, used items, services, and custom requests.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Sell & manage</strong>
            <p>Upload listings, track orders, handle quotes, and view earnings.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Admin control</strong>
            <p>Approve users, listings, payments, deliveries, and support tickets.</p>
          </article>
        </div>
      </section>

      <section className="auth-modern-panel auth-form-panel">
        <div className="auth-form-heading">
          <span className="auth-kicker">Secure login</span>
          <h2>Sign in to your account</h2>
          <p>Use your SmartSell credentials or pick a demo account below.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-modern-form">
          {error && <div className="auth-error-box">{error}</div>}

          <label>
            <span>Email address</span>
            <input name="email" type="email" value={form.email} onChange={updateField} required />
          </label>

          <label>
            <span>Password</span>
            <input name="password" type="password" value={form.password} onChange={updateField} required />
          </label>

          <button className="auth-primary-action" type="submit" disabled={submitting}>
            {submitting ? "Logging in..." : "Login to SmartSell"}
          </button>
        </form>

        <div className="auth-demo-panel">
          <div className="auth-demo-title">
            <strong>Demo accounts</strong>
            <span>Click to fill credentials</span>
          </div>
          <div className="auth-demo-list">
            {demoAccounts.map((account) => (
              <button type="button" key={account.email} onClick={() => fillDemo(account)}>
                <strong>{account.label}</strong>
                <span>{account.email}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="auth-switch-line">
          New to SmartSell? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
