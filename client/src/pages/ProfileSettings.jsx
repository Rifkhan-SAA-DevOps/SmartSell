import { useEffect, useMemo, useState } from "react";
import api from "../utils/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "../styles/pages/customer/ProfileSettings.css";

const roleLabels = {
  customer: "Customer",
  seller: "Individual Seller",
  shop: "Shop Seller",
  shop_seller: "Shop Seller",
  service_provider: "Service Provider",
  delivery_partner: "Delivery Partner",
  admin: "Admin",
  super_admin: "Super Admin",
};

const businessRoles = ["seller", "shop", "shop_seller", "service_provider", "admin", "super_admin"];

function emptyProfileForm() {
  return {
    name: "",
    phone: "",
    businessName: "",
    shopName: "",
    location: "",
    description: "",
  };
}

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

  const normalizedRole = user?.role === "shop_seller" ? "shop" : user?.role;
  const isManagementRole = businessRoles.includes(normalizedRole);
  const isBusinessRole = ["seller", "shop", "service_provider"].includes(normalizedRole);
  const sellerProfile = profileData?.sellerProfile;
  const providerProfile = profileData?.serviceProviderProfile;

  const profileStrength = useMemo(() => {
    const fields = [profileForm.name, profileForm.phone, isBusinessRole ? profileForm.businessName : "ok", profileForm.location, isBusinessRole ? profileForm.description : "ok"];
    const filled = fields.filter((field) => String(field || "").trim()).length;
    return Math.round((filled / fields.length) * 100);
  }, [profileForm, isBusinessRole]);

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
        setProfileForm({
          name: loadedUser.name || "",
          phone: loadedUser.phone || roleProfile.phone || "",
          businessName: loadedUser.businessName || roleProfile.businessName || "",
          shopName: details.sellerProfile?.shopName || "",
          location: roleProfile.location || "",
          description: roleProfile.description || "",
        });
      } catch (error) {
        if (!cancelled) setMessage(error.response?.data?.message || "Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateProfileField(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  function updatePasswordField(event) {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  }

  async function submitProfile(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const { data } = await api.patch("/profile/me", profileForm);
      setProfileData(data.data);
      updateLocalUser(data.data.user);
      await refreshUser();
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");

    try {
      await api.patch("/profile/password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (error) {
      setPasswordMessage(error.response?.data?.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="section smart-profile-page">
        <div className="profile-loading-card">
          <span>Profile</span>
          <h1>Loading profile...</h1>
        </div>
      </section>
    );
  }

  return (
    <section className="section smart-profile-page">
      <div className="smart-profile-hero">
        <div className="smart-profile-identity">
          <div className="smart-profile-avatar">{user?.name?.charAt(0)?.toUpperCase() || "S"}</div>
          <div>
            <span>SmartSell account</span>
            <h1>{user?.name || "SmartSell User"}</h1>
            <p>{user?.email}</p>
            <div className="smart-profile-badges">
              <b>{roleLabels[normalizedRole] || normalizedRole}</b>
              <b>{user?.status || "active"}</b>
              {sellerProfile?.status ? <b>Seller: {sellerProfile.status}</b> : null}
              {providerProfile?.status ? <b>Provider: {providerProfile.status}</b> : null}
            </div>
          </div>
        </div>

        <aside className="smart-profile-progress">
          <div>
            <span>Profile completion</span>
            <strong>{profileStrength}%</strong>
          </div>
          <div className="smart-profile-progress-track"><i style={{ width: `${profileStrength}%` }} /></div>
          <p>Complete contact, location, and profile details to make your account more trusted.</p>
        </aside>
      </div>

      <div className="smart-profile-layout">
        <form className="smart-profile-panel smart-profile-form" onSubmit={submitProfile}>
          <div className="smart-panel-heading">
            <div>
              <span>Account details</span>
              <h2>Personal information</h2>
            </div>
            <p>These details are used for orders, requests, support, and account communication.</p>
          </div>

          <div className="smart-form-grid two">
            <label>
              Full name
              <input name="name" value={profileForm.name} onChange={updateProfileField} required />
            </label>
            <label>
              Phone number
              <input name="phone" value={profileForm.phone} onChange={updateProfileField} placeholder="077xxxxxxx" />
            </label>
          </div>

          {isManagementRole && (
            <div className="smart-business-profile-box">
              <div className="smart-panel-heading compact">
                <div>
                  <span>{isBusinessRole ? "Business profile" : "Management profile"}</span>
                  <h2>{isBusinessRole ? "Public identity" : "Management contact"}</h2>
                </div>
                <p>{isBusinessRole ? "Customers use this information to understand your shop, product, or service identity." : "Keep admin contact information organized."}</p>
              </div>

              <div className="smart-form-grid two">
                <label>
                  Business / display name
                  <input name="businessName" value={profileForm.businessName} onChange={updateProfileField} placeholder="Example: Rifkhan Digital Services" />
                </label>
                {normalizedRole === "shop" ? (
                  <label>
                    Shop name
                    <input name="shopName" value={profileForm.shopName} onChange={updateProfileField} placeholder="Example: ABC Mobile Shop" />
                  </label>
                ) : (
                  <label>
                    Location
                    <input name="location" value={profileForm.location} onChange={updateProfileField} placeholder="Example: Kalmunai" />
                  </label>
                )}
              </div>

              {normalizedRole === "shop" && (
                <label>
                  Location
                  <input name="location" value={profileForm.location} onChange={updateProfileField} placeholder="Example: Kalmunai" />
                </label>
              )}

              <label>
                Profile description
                <textarea name="description" value={profileForm.description} onChange={updateProfileField} rows="5" placeholder="Tell customers what you sell, what services you offer, your area, and why they can trust you." />
              </label>
            </div>
          )}

          {message && <p className="form-status">{message}</p>}
          <button className="customer-primary-btn" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Profile"}</button>
        </form>

        <aside className="smart-profile-side">
          <form className="smart-profile-panel smart-password-panel" onSubmit={submitPassword}>
            <div className="smart-panel-heading compact">
              <div>
                <span>Security</span>
                <h2>Password</h2>
              </div>
              <p>Change your password securely.</p>
            </div>

            <label>
              Current password
              <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={updatePasswordField} required />
            </label>
            <label>
              New password
              <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={updatePasswordField} minLength="8" required />
            </label>
            <label>
              Confirm new password
              <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={updatePasswordField} minLength="8" required />
            </label>

            {passwordMessage && <p className="form-status">{passwordMessage}</p>}
            <button className="customer-outline-btn" type="submit" disabled={passwordSaving}>{passwordSaving ? "Changing..." : "Change Password"}</button>
          </form>

          <div className="smart-profile-panel smart-trust-panel">
            <div className="smart-panel-heading compact">
              <div>
                <span>Trust checklist</span>
                <h2>Profile quality</h2>
              </div>
              <p>Complete these fields to look more professional.</p>
            </div>
            <ul className="smart-trust-list">
              <li className={profileForm.name ? "done" : ""}>Full name added</li>
              <li className={profileForm.phone ? "done" : ""}>Phone number added</li>
              <li className={!isBusinessRole || profileForm.businessName ? "done" : ""}>Business/display name added</li>
              <li className={profileForm.location ? "done" : ""}>Location added</li>
              <li className={!isBusinessRole || profileForm.description ? "done" : ""}>Clear description added</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
