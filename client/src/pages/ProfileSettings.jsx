import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { AccountIcon, AccountPageHeader, AccountStatus } from "../components/CustomerAccountUi.jsx";

const roleLabels = {
  customer: "Customer", seller: "Individual seller", shop: "Shop seller", shop_seller: "Shop seller",
  service_provider: "Service provider", delivery_partner: "Delivery partner", admin: "Admin", super_admin: "Super admin",
};
const businessRoles = ["seller", "shop", "shop_seller", "service_provider", "admin", "super_admin"];

function emptyProfileForm() { return { name: "", phone: "", businessName: "", shopName: "", location: "", description: "" }; }

export default function ProfileSettings() {
  const { user, updateLocalUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState(emptyProfileForm());
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  const normalizedRole = user?.role === "shop_seller" ? "shop" : user?.role;
  const isManagementRole = businessRoles.includes(normalizedRole);
  const isBusinessRole = ["seller", "shop", "service_provider"].includes(normalizedRole);
  const sellerProfile = profileData?.sellerProfile;
  const providerProfile = profileData?.serviceProviderProfile;

  const profileFields = useMemo(() => [
    { label: "Full name", done: Boolean(profileForm.name), icon: "user" },
    { label: "Phone number", done: Boolean(profileForm.phone), icon: "phone" },
    { label: "Location", done: Boolean(profileForm.location), icon: "activity" },
    { label: "Business identity", done: !isBusinessRole || Boolean(profileForm.businessName), icon: "spark" },
    { label: "Clear description", done: !isBusinessRole || Boolean(profileForm.description), icon: "edit" },
  ], [profileForm, isBusinessRole]);
  const profileStrength = Math.round((profileFields.filter((field) => field.done).length / profileFields.length) * 100);
  const initials = (user?.name || user?.email || "S").split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const { data } = await api.get("/profile/me");
        if (cancelled) return;
        const details = data.data;
        setProfileData(details);
        const loadedUser = details.user || {};
        const roleProfile = details.serviceProviderProfile || details.sellerProfile || {};
        setProfileForm({ name: loadedUser.name || "", phone: loadedUser.phone || roleProfile.phone || "", businessName: loadedUser.businessName || roleProfile.businessName || "", shopName: details.sellerProfile?.shopName || "", location: roleProfile.location || "", description: roleProfile.description || "" });
      } catch (error) { if (!cancelled) setMessage(error.response?.data?.message || "Failed to load profile."); }
      finally { if (!cancelled) setLoading(false); }
    }
    loadProfile();
    return () => { cancelled = true; };
  }, []);

  function updateProfileField(event) { const { name, value } = event.target; setProfileForm((current) => ({ ...current, [name]: value })); }
  function updatePasswordField(event) { const { name, value } = event.target; setPasswordForm((current) => ({ ...current, [name]: value })); }

  async function submitProfile(event) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const { data } = await api.patch("/profile/me", profileForm);
      setProfileData(data.data); updateLocalUser(data.data.user); await refreshUser(); setMessage("Profile updated successfully.");
    } catch (error) { setMessage(error.response?.data?.message || "Failed to update profile."); }
    finally { setSaving(false); }
  }

  async function submitPassword(event) {
    event.preventDefault(); setPasswordSaving(true); setPasswordMessage("");
    try {
      await api.patch("/profile/password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); setPasswordMessage("Password changed successfully.");
    } catch (error) { setPasswordMessage(error.response?.data?.message || "Failed to change password."); }
    finally { setPasswordSaving(false); }
  }

  if (loading) return <section className="ca-account-page"><div className="ca-loading">Loading your profile...</div></section>;

  return (
    <section className="ca-account-page ca-profile-page">
      <AccountPageHeader eyebrow="Account settings" title="Profile & security" description="Keep your identity, contact details, and password organized in one modern account workspace." icon="user" />

      <div className="ca-profile-identity-card">
        <div className="ca-profile-avatar">{initials}</div>
        <div className="ca-profile-identity-card__copy"><span>SmartSell account</span><h2>{user?.name || "SmartSell user"}</h2><p>{user?.email}</p><div className="ca-profile-badges"><AccountStatus value={user?.status || "active"} label={user?.status || "Active"} /><b>{roleLabels[normalizedRole] || normalizedRole}</b>{sellerProfile?.status && <b>Seller: {sellerProfile.status}</b>}{providerProfile?.status && <b>Provider: {providerProfile.status}</b>}</div></div>
        <div className="ca-profile-strength"><div><span>Profile completion</span><strong>{profileStrength}%</strong></div><div className="ca-profile-progress"><i style={{ width: `${profileStrength}%` }} /></div><small>{profileStrength === 100 ? "Your profile is complete." : "Complete the remaining details to improve account trust."}</small></div>
      </div>

      <div className="ca-profile-tabs" role="tablist">
        <button type="button" className={activeTab === "profile" ? "is-active" : ""} onClick={() => setActiveTab("profile")}><AccountIcon name="user" size={18} /> Profile information</button>
        <button type="button" className={activeTab === "security" ? "is-active" : ""} onClick={() => setActiveTab("security")}><AccountIcon name="lock" size={18} /> Password & security</button>
      </div>

      {activeTab === "profile" ? (
        <div className="ca-profile-layout">
          <form className="ca-profile-panel ca-profile-form" onSubmit={submitProfile}>
            <div className="ca-panel-heading"><div><span className="ca-eyebrow">Personal information</span><h2>Account details</h2></div><p>Used for orders, requests, support, and communication.</p></div>
            <div className="ca-form-grid ca-form-grid--two">
              <label>Full name<input name="name" value={profileForm.name} onChange={updateProfileField} required /></label>
              <label>Phone number<input name="phone" value={profileForm.phone} onChange={updateProfileField} placeholder="077xxxxxxx" /></label>
              <label className={!isManagementRole ? "ca-form-span-2" : ""}>Location<input name="location" value={profileForm.location} onChange={updateProfileField} placeholder="Example: Kalmunai" /></label>
            </div>

            {isManagementRole && <section className="ca-profile-business-section">
              <div className="ca-panel-heading ca-panel-heading--compact"><div><span className="ca-eyebrow">{isBusinessRole ? "Public identity" : "Management profile"}</span><h3>{isBusinessRole ? "Business information" : "Management contact"}</h3></div></div>
              <div className="ca-form-grid ca-form-grid--two">
                <label>Business / display name<input name="businessName" value={profileForm.businessName} onChange={updateProfileField} placeholder="Example: Rifkhan Digital Services" /></label>
                {normalizedRole === "shop" && <label>Shop name<input name="shopName" value={profileForm.shopName} onChange={updateProfileField} placeholder="Example: ABC Mobile Shop" /></label>}
              </div>
              <label>Profile description<textarea name="description" value={profileForm.description} onChange={updateProfileField} rows="5" placeholder="Tell customers what you sell or offer, your area, and why they can trust you." /></label>
            </section>}

            {message && <div className="ca-alert">{message}</div>}
            <div className="ca-form-actions"><button className="ca-button ca-button--primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button><span className="ca-form-note">Changes are applied to your SmartSell account.</span></div>
          </form>

          <aside className="ca-profile-side-panel">
            <div className="ca-panel-heading"><div><span className="ca-eyebrow">Profile quality</span><h2>Trust checklist</h2></div><p>A complete profile improves communication and order accuracy.</p></div>
            <div className="ca-profile-checklist">{profileFields.map((field) => <div className={field.done ? "is-done" : ""} key={field.label}><span><AccountIcon name={field.done ? "check" : field.icon} size={17} /></span><b>{field.label}</b><small>{field.done ? "Completed" : "Add this detail"}</small></div>)}</div>
          </aside>
        </div>
      ) : (
        <div className="ca-security-layout">
          <form className="ca-profile-panel ca-password-form" onSubmit={submitPassword}>
            <div className="ca-panel-heading"><div><span className="ca-eyebrow">Account protection</span><h2>Change password</h2></div><p>Use at least eight characters and avoid reusing an old password.</p></div>
            <label>Current password<input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={updatePasswordField} autoComplete="current-password" required /></label>
            <div className="ca-form-grid ca-form-grid--two"><label>New password<input type="password" name="newPassword" value={passwordForm.newPassword} onChange={updatePasswordField} minLength="8" autoComplete="new-password" required /></label><label>Confirm new password<input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={updatePasswordField} minLength="8" autoComplete="new-password" required /></label></div>
            {passwordMessage && <div className="ca-alert">{passwordMessage}</div>}
            <button className="ca-button ca-button--primary" type="submit" disabled={passwordSaving}>{passwordSaving ? "Changing..." : "Update password"}</button>
          </form>
          <aside className="ca-security-advice"><span><AccountIcon name="shield" size={26} /></span><h2>Keep your account secure</h2><p>Use a unique password, never share verification details, and contact SmartSell support if you notice unfamiliar activity.</p><ul><li>Use 8 or more characters</li><li>Mix letters, numbers, and symbols</li><li>Do not share your password</li></ul></aside>
        </div>
      )}
    </section>
  );
}
