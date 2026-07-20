import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/smartsell-logo-full.png";

const demoAccounts = [
  { label: "Customer", email: "customer@smartsell.local", password: "Customer@12345" },
  { label: "Seller", email: "seller@smartsell.local", password: "Seller@12345" },
  { label: "Provider", email: "provider@smartsell.local", password: "Provider@12345" },
  { label: "Admin", email: "admin@smartsell.local", password: "Admin@12345" },
];

function LoginIcon({ name }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true" };
  if (name === "eye") return <svg {...common}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  if (name === "eye-off") return <svg {...common}><path d="m3 3 18 18"/><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.7 15.7 0 0 1-2.1 2.8M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 5 6v5c0 4.5 2.8 7.6 7 9.5 4.2-1.9 7-5 7-9.5V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (name === "message") return <svg {...common}><path d="M4 5h16v11H8l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg>;
  return <svg {...common}><path d="M4 6h16v12H4z"/><path d="m4 8 8 6 8-6"/></svg>;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);

  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    try {
      const storedNotice = sessionStorage.getItem("smartsell_auth_notice");
      if (storedNotice) {
        setNotice(storedNotice);
        sessionStorage.removeItem("smartsell_auth_notice");
      }
    } catch {
      // Continue normally when session storage is unavailable.
    }
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    if (error) setError("");
    if (notice) setNotice("");
  }

  function fillDemo(account) {
    setForm({ email: account.email, password: account.password });
    setError("");
    setDemoOpen(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form);
      navigate(user.role === "admin" || user.role === "super_admin" ? "/admin" : from, { replace: true });
    } catch (err) {
      setError(err.smartSellMessage || err.response?.data?.message || "Login failed. Please check your email and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="customer-auth-page">
      <section className="customer-auth-showcase">
        <Link className="customer-auth-brand" to="/"><img src={logo} alt="SmartSell" /></Link>
        <div className="customer-auth-showcase-copy">
          <span className="customer-auth-kicker">Welcome back</span>
          <h1>Your SmartSell activity, organised in one secure account.</h1>
          <p>Continue shopping, review orders, compare offers, message providers, and manage support without losing context.</p>
        </div>
        <div className="customer-auth-benefits">
          <article><LoginIcon name="shield" /><div><strong>Protected account</strong><span>Your orders, requests, and conversations stay connected to your profile.</span></div></article>
          <article><LoginIcon name="message" /><div><strong>One communication centre</strong><span>Keep customer, seller, service, and support discussions together.</span></div></article>
          <article><LoginIcon name="mail" /><div><strong>Clear progress tracking</strong><span>Follow order, offer, delivery, and support updates from one dashboard.</span></div></article>
        </div>
        <div className="customer-auth-showcase-note"><span>SmartSell</span><strong>Products · Services · Stores · Custom requests</strong></div>
      </section>

      <section className="customer-auth-form-panel">
        <div className="customer-auth-form-head">
          <span className="customer-auth-kicker dark">Secure sign in</span>
          <h2>Log in to SmartSell</h2>
          <p>Enter your account credentials to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="customer-auth-form">
          {notice && <div className="customer-auth-notice" role="status">{notice}</div>}
          {error && <div className="customer-auth-error" role="alert">{error}</div>}

          <label>
            <span>Email address</span>
            <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required />
          </label>

          <label>
            <span>Password</span>
            <div className="customer-password-field">
              <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} placeholder="Enter your password" autoComplete="current-password" required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                <LoginIcon name={showPassword ? "eye-off" : "eye"} />
              </button>
            </div>
          </label>

          <button className="customer-auth-submit" type="submit" disabled={submitting}>
            {submitting ? <><span className="customer-auth-spinner" />Signing in...</> : "Log in to SmartSell"}
          </button>
        </form>

        <div className="customer-demo-access">
          <button className="customer-demo-toggle" type="button" onClick={() => setDemoOpen((value) => !value)} aria-expanded={demoOpen}>
            <span><strong>Development demo access</strong><small>Fill a test account without typing credentials</small></span>
            <b>{demoOpen ? "−" : "+"}</b>
          </button>
          {demoOpen && <div className="customer-demo-grid">{demoAccounts.map((account) => <button type="button" key={account.email} onClick={() => fillDemo(account)}><strong>{account.label}</strong><span>{account.email}</span></button>)}</div>}
        </div>

        <p className="customer-auth-switch">New to SmartSell? <Link to="/register">Create your account</Link></p>
        <Link className="customer-auth-back" to="/">← Return to the marketplace</Link>
      </section>
    </main>
  );
}
