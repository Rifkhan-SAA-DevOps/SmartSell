import { useEffect, useMemo, useState } from "react";
import SectionHeader from "../components/SectionHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";

const roleOptions = ["all", "customer", "seller", "shop", "service_provider", "delivery_partner", "admin", "super_admin"];
const statusOptions = ["all", "active", "pending_approval", "blocked"];
const businessStatusOptions = ["all", "pending", "approved", "rejected", "archived"];
const accountCreateRoles = ["customer", "seller", "shop", "service_provider", "delivery_partner", "admin", "super_admin"];

const roleMeta = {
  customer: { label: "Customer", icon: "CU", tone: "sky" },
  seller: { label: "Seller", icon: "SL", tone: "indigo" },
  shop: { label: "Shop Seller", icon: "SH", tone: "teal" },
  service_provider: { label: "Service Provider", icon: "SP", tone: "violet" },
  delivery_partner: { label: "Delivery Partner", icon: "DP", tone: "amber" },
  admin: { label: "Admin", icon: "AD", tone: "rose" },
  super_admin: { label: "Super Admin", icon: "SA", tone: "slate" },
};

function titleCase(value) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function getBusinessStatus(user) {
  return user?.serviceProviderProfile?.status || user?.sellerProfile?.status || "none";
}

function getBusinessName(user) {
  return (
    user?.sellerProfile?.shopName ||
    user?.sellerProfile?.businessName ||
    user?.serviceProviderProfile?.businessName ||
    user?.businessName ||
    "-"
  );
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function getRoleMeta(role) {
  return roleMeta[role] || { label: titleCase(role), icon: "US", tone: "sky" };
}

function StatCard({ icon, label, value, hint, tone = "sky" }) {
  return (
    <article className={`um-stat-card tone-${tone}`}>
      <span className="um-stat-icon" aria-hidden="true">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{formatNumber(value)}</strong>
        <small>{hint}</small>
      </div>
    </article>
  );
}

function AccountMiniCard({ user, active, onSelect }) {
  const meta = getRoleMeta(user.role);
  const businessStatus = getBusinessStatus(user);
  return (
    <button type="button" className={`um-user-row ${active ? "active" : ""}`} onClick={() => onSelect(user)}>
      <span className={`um-avatar tone-${meta.tone}`}>{getInitials(user.name)}</span>
      <span className="um-user-row-main">
        <strong>{user.name}</strong>
        <small>{user.email}</small>
        <span>{getBusinessName(user)}</span>
      </span>
      <span className="um-user-row-meta">
        <b className={`um-role-chip tone-${meta.tone}`}>{meta.icon}</b>
        <i className={`um-status-dot status-${user.status}`} title={titleCase(user.status)} />
        {businessStatus !== "none" ? <i className={`um-status-dot status-${businessStatus}`} title={`Business ${titleCase(businessStatus)}`} /> : null}
      </span>
    </button>
  );
}

function DetailMetric({ label, value }) {
  return (
    <div className="um-detail-metric">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ role: "all", status: "all", businessStatus: "all", search: "" });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    status: "active",
    businessName: "",
    location: "",
    description: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const isSuperAdmin = currentUser?.role === "super_admin";

  async function loadAccounts(nextFilters = filters, keepSelected = true) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const [overviewResponse, usersResponse] = await Promise.all([
        api.get("/users/admin/overview"),
        api.get(`/users/admin/accounts?${params.toString()}`),
      ]);

      const list = usersResponse.data.data || [];
      setOverview(overviewResponse.data.data || {});
      setUsers(list);

      if (!keepSelected) {
        setSelectedUser(list[0] || null);
      } else if (selectedUser) {
        setSelectedUser(list.find((item) => item.id === selectedUser.id) || list[0] || null);
      } else {
        setSelectedUser(list[0] || null);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load user management data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts(filters, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSummary = useMemo(() => {
    const pendingBusiness = users.filter((item) => ["pending", "rejected"].includes(getBusinessStatus(item))).length;
    const blocked = users.filter((item) => item.status === "blocked").length;
    const admins = users.filter((item) => ["admin", "super_admin"].includes(item.role)).length;
    const active = users.filter((item) => item.status === "active").length;
    return { pendingBusiness, blocked, admins, active };
  }, [users]);

  const selectedMeta = selectedUser ? getRoleMeta(selectedUser.role) : getRoleMeta("customer");
  const businessStatus = getBusinessStatus(selectedUser);
  const selectedListings = (selectedUser?.counts?.products || 0) + (selectedUser?.counts?.services || 0);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function submitFilters(event) {
    event.preventDefault();
    await loadAccounts(filters, false);
  }

  function clearFilters() {
    const cleanFilters = { role: "all", status: "all", businessStatus: "all", search: "" };
    setFilters(cleanFilters);
    loadAccounts(cleanFilters, false);
  }

  function updateNewUser(event) {
    const { name, value } = event.target;
    setNewUser((current) => ({ ...current, [name]: value }));
  }

  async function createAccount(event) {
    event.preventDefault();
    try {
      setCreating(true);
      setMessage("Creating user account...");
      setTempPassword("");
      const response = await api.post("/users/admin/accounts", newUser);
      const temporaryPassword = response.data.data?.temporaryPassword || newUser.password;
      setTempPassword(temporaryPassword);
      setNewUser({ name: "", email: "", phone: "", role: "customer", status: "active", businessName: "", location: "", description: "", password: "" });
      setMessage("User account created successfully.");
      await loadAccounts(filters, false);
    } catch (error) {
      setMessage(error.response?.data?.message || "User account creation failed.");
    } finally {
      setCreating(false);
    }
  }

  async function updateAccount(path, payload, successMessage) {
    if (!selectedUser) return;
    try {
      setMessage("Updating account...");
      setTempPassword("");
      const response = await api.patch(`/users/admin/accounts/${selectedUser.id}/${path}`, payload);
      setSelectedUser(response.data.data || selectedUser);
      setMessage(successMessage);
      await loadAccounts(filters);
    } catch (error) {
      setMessage(error.response?.data?.message || "Account update failed.");
    }
  }

  async function resetPassword() {
    if (!selectedUser) return;
    if (!confirm(`Reset password for ${selectedUser.email}?`)) return;
    try {
      setMessage("Resetting password...");
      const response = await api.patch(`/users/admin/accounts/${selectedUser.id}/reset-password`, {});
      setTempPassword(response.data.data?.temporaryPassword || "");
      setMessage("Temporary password generated. Copy it now and send it safely to the user.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Password reset failed.");
    }
  }

  return (
    <section className="section account-management-page um-page">
      <div className="um-hero">
        <div>
          <SectionHeader
            eyebrow="Admin Workspace"
            title="User management center"
            description="Create accounts, review sellers, manage roles, approve businesses, block risky users, and reset passwords from one clean management console."
          />
        </div>
        <div className="um-hero-panel">
          <span className="um-hero-icon">UM</span>
          <strong>{formatNumber(overview?.totalUsers)}</strong>
          <p>Total SmartSell accounts</p>
          <button type="button" className="secondary-btn small-btn" onClick={() => loadAccounts(filters)}>Refresh Data</button>
        </div>
      </div>

      {message && <div className="um-toast">{message}</div>}
      {tempPassword && (
        <div className="um-temp-password">
          <span>Temporary password</span>
          <strong>{tempPassword}</strong>
          <small>Copy it now. For security, share it with the user privately.</small>
        </div>
      )}

      <div className="um-stat-grid">
        <StatCard icon="US" label="Total Users" value={overview?.totalUsers} hint={`${formatNumber(overview?.activeUsers)} active accounts`} tone="sky" />
        <StatCard icon="AP" label="Pending Review" value={overview?.pendingUsers} hint={`${formatNumber(overview?.pendingBusinessApprovals)} business approvals`} tone="amber" />
        <StatCard icon="AD" label="Admin Accounts" value={overview?.admins} hint={`${formatNumber(filteredSummary.admins)} shown in filter`} tone="violet" />
        <StatCard icon="BL" label="Blocked Users" value={overview?.blockedUsers} hint={`${formatNumber(filteredSummary.blocked)} shown in filter`} tone="rose" />
      </div>

      <div className="um-command-grid">
        <form className="um-create-card" onSubmit={createAccount}>
          <div className="um-card-head">
            <span className="um-card-icon">+</span>
            <div>
              <h3>Create user account</h3>
              <p>Create customers, sellers, shops, service providers, delivery partners, admins, and super admins.</p>
            </div>
          </div>

          <div className="um-form-grid two">
            <label>Name<input name="name" value={newUser.name} onChange={updateNewUser} required placeholder="Full name" /></label>
            <label>Email<input name="email" type="email" value={newUser.email} onChange={updateNewUser} required placeholder="user@example.com" /></label>
          </div>

          <div className="um-form-grid three">
            <label>Phone<input name="phone" value={newUser.phone} onChange={updateNewUser} placeholder="Optional" /></label>
            <label>Role
              <select name="role" value={newUser.role} onChange={updateNewUser}>
                {accountCreateRoles.filter((role) => isSuperAdmin || role !== "super_admin").map((role) => (
                  <option key={role} value={role}>{titleCase(role)}</option>
                ))}
              </select>
            </label>
            <label>Status
              <select name="status" value={newUser.status} onChange={updateNewUser}>
                <option value="active">Active</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="blocked">Blocked</option>
              </select>
            </label>
          </div>

          <div className="um-form-grid two">
            <label>Business / Shop / Service Name
              <input name="businessName" value={newUser.businessName} onChange={updateNewUser} placeholder="Optional business name" />
            </label>
            <label>Location
              <input name="location" value={newUser.location} onChange={updateNewUser} placeholder="City / area" />
            </label>
          </div>

          <label>Description
            <textarea name="description" value={newUser.description} onChange={updateNewUser} rows="3" placeholder="Short business or service description" />
          </label>

          <label>Password
            <input name="password" type="text" value={newUser.password} onChange={updateNewUser} placeholder="Leave blank to auto-generate" />
          </label>

          <div className="um-form-footer">
            <small>Seller, shop, and service profiles will be created automatically.</small>
            <button className="primary-btn" type="submit" disabled={creating}>{creating ? "Creating..." : "Create Account"}</button>
          </div>
        </form>

        <form className="um-filter-card" onSubmit={submitFilters}>
          <div className="um-card-head compact">
            <span className="um-card-icon">FL</span>
            <div>
              <h3>Find accounts</h3>
              <p>Search, filter, and select a user to manage.</p>
            </div>
          </div>

          <label>Search
            <input name="search" value={filters.search} onChange={updateFilter} placeholder="Name, email, phone, business" />
          </label>

          <div className="um-form-grid two">
            <label>Role
              <select name="role" value={filters.role} onChange={updateFilter}>
                {roleOptions.map((role) => <option key={role} value={role}>{titleCase(role)}</option>)}
              </select>
            </label>
            <label>Status
              <select name="status" value={filters.status} onChange={updateFilter}>
                {statusOptions.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
              </select>
            </label>
          </div>

          <label>Business Approval
            <select name="businessStatus" value={filters.businessStatus} onChange={updateFilter}>
              {businessStatusOptions.map((status) => <option key={status} value={status}>{titleCase(status)}</option>)}
            </select>
          </label>

          <div className="um-filter-actions">
            <button type="submit" className="primary-btn">Apply Filters</button>
            <button type="button" className="ghost-btn" onClick={clearFilters}>Clear</button>
          </div>

          <div className="um-filter-summary">
            <span><b>{formatNumber(users.length)}</b> shown</span>
            <span><b>{formatNumber(filteredSummary.active)}</b> active</span>
            <span><b>{formatNumber(filteredSummary.pendingBusiness)}</b> review</span>
          </div>
        </form>
      </div>

      <div className="um-workspace-grid">
        <aside className="um-directory-panel">
          <div className="um-panel-title">
            <div>
              <h3>Account directory</h3>
              <p>Select any account to update permissions, approval, or security.</p>
            </div>
            <span>{formatNumber(users.length)}</span>
          </div>

          <div className="um-directory-list">
            {loading ? <p className="um-empty-copy">Loading accounts...</p> : null}
            {!loading && !users.length ? <p className="um-empty-copy">No accounts match this filter.</p> : null}
            {users.map((item) => (
              <AccountMiniCard key={item.id} user={item} active={selectedUser?.id === item.id} onSelect={setSelectedUser} />
            ))}
          </div>
        </aside>

        <main className="um-detail-panel">
          {!selectedUser ? (
            <div className="um-empty-state">Select a user account to manage.</div>
          ) : (
            <>
              <div className="um-profile-head">
                <div className={`um-profile-avatar tone-${selectedMeta.tone}`}>{getInitials(selectedUser.name)}</div>
                <div className="um-profile-copy">
                  <span className="eyebrow">{selectedMeta.label}</span>
                  <h2>{selectedUser.name}</h2>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="um-profile-status">
                  <b className={`um-status-pill status-${selectedUser.status}`}>{titleCase(selectedUser.status)}</b>
                  {businessStatus !== "none" ? <b className={`um-status-pill status-${businessStatus}`}>Business {titleCase(businessStatus)}</b> : null}
                </div>
              </div>

              <div className="um-detail-metric-grid">
                <DetailMetric label="Phone" value={selectedUser.phone} />
                <DetailMetric label="Business" value={getBusinessName(selectedUser)} />
                <DetailMetric label="Joined" value={formatDate(selectedUser.createdAt)} />
                <DetailMetric label="Listings" value={formatNumber(selectedListings)} />
                <DetailMetric label="Orders" value={formatNumber(selectedUser.counts?.orders)} />
                <DetailMetric label="Support" value={formatNumber(selectedUser.counts?.supportTickets)} />
              </div>

              <div className="um-action-grid">
                <article className="um-action-card">
                  <span className="um-action-icon">ST</span>
                  <h3>Account status</h3>
                  <p>Activate trusted accounts, hold new users for review, or block unsafe users.</p>
                  <div className="um-button-row">
                    <button className="secondary-btn small-btn" type="button" onClick={() => updateAccount("status", { status: "active" }, "Account activated.")}>Activate</button>
                    <button className="ghost-btn small-btn" type="button" onClick={() => updateAccount("status", { status: "pending_approval" }, "Account moved to pending approval.")}>Pending</button>
                    <button className="danger-btn small-btn" type="button" onClick={() => updateAccount("status", { status: "blocked" }, "Account blocked.")}>Block</button>
                  </div>
                </article>

                <article className="um-action-card">
                  <span className="um-action-icon">RL</span>
                  <h3>Role control</h3>
                  <p>Move users between customer, seller, shop, provider, delivery, and admin roles.</p>
                  <select value={selectedUser.role} onChange={(event) => updateAccount("role", { role: event.target.value }, "User role updated.")}>
                    {roleOptions.filter((role) => role !== "all" && (isSuperAdmin || role !== "super_admin")).map((role) => (
                      <option key={role} value={role}>{titleCase(role)}</option>
                    ))}
                  </select>
                </article>

                <article className="um-action-card">
                  <span className="um-action-icon">BA</span>
                  <h3>Business approval</h3>
                  <p>Review and approve seller, shop, and service-provider business profiles.</p>
                  <div className="um-button-row">
                    <button className="secondary-btn small-btn" type="button" onClick={() => updateAccount("business-status", { status: "approved" }, "Business profile approved.")}>Approve</button>
                    <button className="ghost-btn small-btn" type="button" onClick={() => updateAccount("business-status", { status: "pending" }, "Business profile moved to pending.")}>Pending</button>
                    <button className="danger-btn small-btn" type="button" onClick={() => updateAccount("business-status", { status: "rejected" }, "Business profile rejected.")}>Reject</button>
                  </div>
                </article>

                <article className="um-action-card security-card">
                  <span className="um-action-icon">PW</span>
                  <h3>Password recovery</h3>
                  <p>Generate a temporary password and copy it before leaving this screen.</p>
                  <button className="secondary-btn" type="button" onClick={resetPassword}>Generate Temporary Password</button>
                </article>
              </div>
            </>
          )}
        </main>
      </div>
    </section>
  );
}
