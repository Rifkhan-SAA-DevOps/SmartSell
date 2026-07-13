import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import logo from "../assets/smartsell-logo-full.png";

const roles = [
  { value: "customer", label: "Customer", hint: "Buy, request, compare offers, and track every order.", code: "CU" },
  { value: "seller", label: "Individual seller", hint: "List personal, own, or used products for customers.", code: "SE" },
  { value: "shop", label: "Shop seller", hint: "Create a storefront and manage a wider product catalogue.", code: "SH" },
  { value: "service_provider", label: "Service provider", hint: "Receive quote requests and manage service work.", code: "SP" },
];

function RegisterIcon({ name }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": "true" };
  if (name === "eye") return <svg {...common}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  if (name === "eye-off") return <svg {...common}><path d="m3 3 18 18"/><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a15.7 15.7 0 0 1-2.1 2.8M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6c1.4 0 2.7-.3 3.8-.8"/></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
  return null;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "customer", businessName: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectedRole = roles.find((role) => role.value === form.role) || roles[0];
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (form.password.length >= 8) score += 1;
    if (/[A-Z]/.test(form.password) && /[a-z]/.test(form.password)) score += 1;
    if (/\d/.test(form.password)) score += 1;
    if (/[^A-Za-z0-9]/.test(form.password)) score += 1;
    return score;
  }, [form.password]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await register(form);
      navigate(user.role === "customer" ? "/dashboard" : "/seller-hub", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please review the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="customer-auth-page customer-register-page">
      <section className="customer-auth-showcase customer-register-showcase">
        <Link className="customer-auth-brand" to="/"><img src={logo} alt="SmartSell" /></Link>
        <div className="customer-auth-showcase-copy">
          <span className="customer-auth-kicker">Create your account</span>
          <h1>Choose how you want to use SmartSell.</h1>
          <p>Start as a customer, seller, shop, or service provider. Each role gets a focused workspace without unnecessary complexity.</p>
        </div>

        <div className="customer-selected-role">
          <span>{selectedRole.code}</span>
          <div><small>Selected account type</small><strong>{selectedRole.label}</strong><p>{selectedRole.hint}</p></div>
        </div>

        <div className="customer-register-checks">
          <span><RegisterIcon name="check" />One secure login for every SmartSell activity</span>
          <span><RegisterIcon name="check" />Clear account, order, request, and message history</span>
          <span><RegisterIcon name="check" />Business accounts follow an approval workflow</span>
        </div>
      </section>

      <section className="customer-auth-form-panel customer-register-panel">
        <div className="customer-auth-form-head">
          <span className="customer-auth-kicker dark">Account setup</span>
          <h2>Join SmartSell</h2>
          <p>Select an account type, then complete your basic information.</p>
        </div>

        <form onSubmit={handleSubmit} className="customer-auth-form customer-register-form">
          {error && <div className="customer-auth-error" role="alert">{error}</div>}

          <fieldset className="customer-role-fieldset">
            <legend>How will you use SmartSell?</legend>
            <div className="customer-role-grid">
              {roles.map((role) => (
                <label key={role.value} className={form.role === role.value ? "customer-role-card active" : "customer-role-card"}>
                  <input type="radio" name="role" value={role.value} checked={form.role === role.value} onChange={updateField} />
                  <span className="customer-role-code">{role.code}</span>
                  <span><strong>{role.label}</strong><small>{role.hint}</small></span>
                  <i><RegisterIcon name="check" /></i>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="customer-register-fields">
            <label><span>Full name</span><input name="name" value={form.name} onChange={updateField} placeholder="Your full name" autoComplete="name" required /></label>
            <label><span>Email address</span><input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" required /></label>
            <label><span>Phone number</span><input name="phone" value={form.phone} onChange={updateField} placeholder="07XXXXXXXX" autoComplete="tel" inputMode="tel" /></label>
            {form.role !== "customer" && <label><span>{form.role === "service_provider" ? "Service name" : "Business or shop name"}</span><input name="businessName" value={form.businessName} onChange={updateField} placeholder="Name shown to customers" required /></label>}
            <label className="customer-register-password">
              <span>Password</span>
              <div className="customer-password-field">
                <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} placeholder="Minimum 8 characters" autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}><RegisterIcon name={showPassword ? "eye-off" : "eye"} /></button>
              </div>
              <div className="customer-password-strength" aria-label={`Password strength ${passwordStrength} of 4`}><span className={passwordStrength >= 1 ? "active" : ""}/><span className={passwordStrength >= 2 ? "active" : ""}/><span className={passwordStrength >= 3 ? "active" : ""}/><span className={passwordStrength >= 4 ? "active" : ""}/><small>{form.password ? ["Very weak", "Basic", "Good", "Strong", "Excellent"][passwordStrength] : "Use 8+ characters with letters, a number, and a symbol"}</small></div>
            </label>
          </div>

          <button className="customer-auth-submit" type="submit" disabled={submitting}>{submitting ? <><span className="customer-auth-spinner" />Creating account...</> : `Create ${selectedRole.label.toLowerCase()} account`}</button>
          <p className="customer-auth-consent">By creating an account, you agree to use SmartSell responsibly and provide accurate account information.</p>
        </form>

        <p className="customer-auth-switch">Already registered? <Link to="/login">Log in</Link></p>
        <Link className="customer-auth-back" to="/">← Return to the marketplace</Link>
      </section>
    </main>
  );
}
