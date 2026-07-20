import { useEffect, useMemo, useState } from "react";
import {
  AdminEmptyState,
  AdminIcon,
  AdminInfoGrid,
  AdminMetricCard,
  AdminModal,
  AdminPageHeader,
  AdminPagination,
  AdminSearchToolbar,
  AdminStatusBadge,
  useAdminPagination,
} from "../components/AdminWorkspaceUi.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../utils/api.js";
import "../styles/pages/admin/AdminWorkspaceV2.css";

const roleOptions = ["all", "customer", "seller", "shop", "service_provider", "delivery_partner", "admin", "super_admin"];
const statusOptions = ["all", "active", "pending_approval", "blocked"];
const businessStatusOptions = ["all", "pending", "approved", "rejected", "archived"];
const accountCreateRoles = ["customer", "seller", "shop", "service_provider", "delivery_partner", "admin", "super_admin"];

function titleCase(value) {
  return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleLabel(role) {
  if (role === "shop" || role === "shop_seller") return "Shop Seller";
  return titleCase(role);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-LK", { year: "numeric", month: "short", day: "2-digit" });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-LK");
}

function getBusinessStatus(user) {
  return user?.serviceProviderProfile?.status || user?.sellerProfile?.status || "none";
}

function getBusinessName(user) {
  return user?.sellerProfile?.shopName || user?.sellerProfile?.businessName || user?.serviceProviderProfile?.businessName || user?.businessName || "—";
}

function getInitials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") : "U";
}

function roleTone(role) {
  if (["admin", "super_admin"].includes(role)) return "violet";
  if (["seller", "shop", "shop_seller"].includes(role)) return "blue";
  if (role === "service_provider") return "cyan";
  if (role === "delivery_partner") return "amber";
  return "emerald";
}

const cleanNewUser = {
  name: "",
  email: "",
  phone: "",
  role: "customer",
  status: "active",
  businessName: "",
  location: "",
  description: "",
  password: "",
};

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ role: "all", status: "all", businessStatus: "all", search: "" });
  const [newUser, setNewUser] = useState(cleanNewUser);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [tempPassword, setTempPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const isSuperAdmin = currentUser?.role === "super_admin";

  async function loadAccounts(nextFilters = filters, preserveSelection = true) {
    try {
      setLoading(true);
      setMessage("");
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
      if (preserveSelection && selectedUser) setSelectedUser(list.find((item) => item.id === selectedUser.id) || null);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Could not load user management data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts(filters, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSummary = useMemo(() => ({
    active: users.filter((item) => item.status === "active").length,
    pendingBusiness: users.filter((item) => ["pending", "rejected"].includes(getBusinessStatus(item))).length,
    blocked: users.filter((item) => item.status === "blocked").length,
    admins: users.filter((item) => ["admin", "super_admin"].includes(item.role)).length,
  }), [users]);

  const pagination = useAdminPagination(users, 10, [filters.role, filters.status, filters.businessStatus, filters.search]);

  async function applyFilters(event) {
    event?.preventDefault();
    await loadAccounts(filters, false);
  }

  function clearFilters() {
    const clean = { role: "all", status: "all", businessStatus: "all", search: "" };
    setFilters(clean);
    loadAccounts(clean, false);
  }

  function updateNewUser(event) {
    const { name, value } = event.target;
    setNewUser((current) => ({ ...current, [name]: value }));
  }

  async function createAccount(event) {
    event.preventDefault();
    try {
      setCreating(true);
      setMessage("");
      setTempPassword("");
      const response = await api.post("/users/admin/accounts", newUser);
      const temporaryPassword = response.data.data?.temporaryPassword || newUser.password;
      setTempPassword(temporaryPassword || "");
      setNewUser(cleanNewUser);
      setMessageType("success");
      setMessage("User account created successfully.");
      await loadAccounts(filters, false);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "User account creation failed.");
    } finally {
      setCreating(false);
    }
  }

  async function updateAccount(path, payload, successMessage) {
    if (!selectedUser) return;
    try {
      setMessage("");
      setTempPassword("");
      const response = await api.patch(`/users/admin/accounts/${selectedUser.id}/${path}`, payload);
      const updated = response.data.data || selectedUser;
      setSelectedUser(updated);
      setMessageType("success");
      setMessage(successMessage);
      await loadAccounts(filters, true);
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Account update failed.");
    }
  }

  async function resetPassword() {
    if (!selectedUser) return;
    try {
      const response = await api.patch(`/users/admin/accounts/${selectedUser.id}/reset-password`, {});
      setTempPassword(response.data.data?.temporaryPassword || "");
      setMessageType("success");
      setMessage("Temporary password generated. Copy it and share it privately.");
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Password reset failed.");
    }
  }

  const selectedBusinessStatus = getBusinessStatus(selectedUser);
  const selectedListings = (selectedUser?.counts?.products || 0) + (selectedUser?.counts?.services || 0);

  return (
    <section className="admin-workspace-v2 admin-users-page-v2">
      <AdminPageHeader
        eyebrow="Identity and access"
        title="Users & roles"
        description="Search every SmartSell account, review business applicants, control roles and access, reset passwords, and create operational accounts from one clean directory."
        actions={(
          <>
            <button className="admin-ghost-button-v2" type="button" onClick={() => loadAccounts(filters, true)} disabled={loading}><AdminIcon name="refresh" size={17} />Refresh</button>
            <button className="admin-primary-button-v2" type="button" onClick={() => { setCreateOpen(true); setTempPassword(""); }}><AdminIcon name="user" size={17} />Create account</button>
          </>
        )}
        meta={<><span><AdminIcon name="users" size={15} />{formatNumber(overview?.totalUsers)} accounts</span><AdminStatusBadge status="pending" label={`${formatNumber(overview?.pendingBusinessApprovals)} business approvals`} /></>}
      />

      <div className="admin-metrics-grid-v2">
        <AdminMetricCard icon="users" label="Total accounts" value={formatNumber(overview?.totalUsers)} note={`${formatNumber(overview?.activeUsers)} active`} tone="blue" />
        <AdminMetricCard icon="alert" label="Pending review" value={formatNumber(overview?.pendingUsers)} note={`${formatNumber(overview?.pendingBusinessApprovals)} businesses`} tone="amber" />
        <AdminMetricCard icon="shield" label="Administrators" value={formatNumber(overview?.admins)} note={`${formatNumber(filteredSummary.admins)} in current result`} tone="violet" />
        <AdminMetricCard icon="flag" label="Blocked accounts" value={formatNumber(overview?.blockedUsers)} note={`${formatNumber(filteredSummary.blocked)} in current result`} tone="rose" />
      </div>

      {message && <div className={`admin-alert-v2 ${messageType}`}>{message}</div>}
      {tempPassword && !createOpen && <div className="admin-create-account-note-v2"><span>Temporary password</span><strong>{tempPassword}</strong><small>Copy it now and share it securely.</small></div>}

      <form onSubmit={applyFilters}>
        <AdminSearchToolbar
          value={filters.search}
          onChange={(search) => setFilters((current) => ({ ...current, search }))}
          placeholder="Search name, email, phone or business"
          filters={(
            <>
              <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))} aria-label="Role">
                {roleOptions.map((role) => <option key={role} value={role}>{role === "all" ? "All roles" : roleLabel(role)}</option>)}
              </select>
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} aria-label="Account status">
                {statusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "All statuses" : titleCase(status)}</option>)}
              </select>
              <select value={filters.businessStatus} onChange={(event) => setFilters((current) => ({ ...current, businessStatus: event.target.value }))} aria-label="Business approval">
                {businessStatusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "All business states" : titleCase(status)}</option>)}
              </select>
            </>
          )}
          actions={(
            <>
              <button className="admin-ghost-button-v2" type="button" onClick={clearFilters}>Clear</button>
              <button className="admin-secondary-button-v2" type="submit">Apply filters</button>
            </>
          )}
        />
      </form>

      <section className="admin-panel-v2 admin-users-layout-v2">
        <div className="admin-panel-head-v2">
          <div><h2>Account directory</h2><p>Click any account to view business details, permissions, security controls, and account activity.</p></div>
          <AdminStatusBadge status="active" label={`${users.length} results`} />
        </div>

        {loading ? <div className="admin-empty-v2"><span><AdminIcon name="refresh" /></span><h3>Loading accounts</h3><p>Retrieving users and business profiles.</p></div> : null}
        {!loading && !pagination.items.length ? <AdminEmptyState icon="users" title="No accounts found" description="Try clearing one or more filters or search for another name, email, or business." /> : null}
        {!loading && pagination.items.length ? (
          <div>
            {pagination.items.map((account) => {
              const businessStatus = getBusinessStatus(account);
              return (
                <button className="admin-user-row-v2" type="button" key={account.id} onClick={() => { setSelectedUser(account); setTempPassword(""); }}>
                  <span className="admin-user-identity-v2">
                    <span className="admin-user-avatar-v2">{getInitials(account.name)}</span>
                    <span><strong>{account.name}</strong><small>{account.email}</small></span>
                  </span>
                  <div><strong>{roleLabel(account.role)}</strong><small>{getBusinessName(account)}</small></div>
                  <div><strong>{account.phone || "No phone"}</strong><small>Joined {formatDate(account.createdAt)}</small></div>
                  <div><strong>{formatNumber((account.counts?.products || 0) + (account.counts?.services || 0))} listings</strong><small>{formatNumber(account.counts?.orders)} orders · {formatNumber(account.counts?.supportTickets)} tickets</small></div>
                  <span className="admin-user-statuses-v2"><AdminStatusBadge status={account.status} />{businessStatus !== "none" && <AdminStatusBadge status={businessStatus} label={`Business ${titleCase(businessStatus)}`} />}</span>
                  <span className="admin-row-open-v2"><AdminIcon name="chevron" size={16} /></span>
                </button>
              );
            })}
          </div>
        ) : null}
        <AdminPagination pagination={pagination} />
      </section>

      <AdminModal open={createOpen} onClose={() => setCreateOpen(false)} title="Create user account" eyebrow="Account provisioning" size="wide" footer={(
        <>
          <button className="admin-ghost-button-v2" type="button" onClick={() => setCreateOpen(false)}>Close</button>
          <button className="admin-primary-button-v2" type="submit" form="admin-create-user-form" disabled={creating}>{creating ? "Creating…" : "Create account"}</button>
        </>
      )}>
        <form id="admin-create-user-form" className="admin-form-v2" onSubmit={createAccount}>
          {tempPassword && <div className="admin-create-account-note-v2"><span>Account created — temporary password</span><strong>{tempPassword}</strong><small>Copy this password before closing the dialog.</small></div>}
          <div className="admin-form-section-v2">
            <h3>Identity and access</h3>
            <div className="admin-form-grid-v2">
              <label>Name<input name="name" value={newUser.name} onChange={updateNewUser} required placeholder="Full name" /></label>
              <label>Email<input name="email" type="email" value={newUser.email} onChange={updateNewUser} required placeholder="user@example.com" /></label>
              <label>Phone<input name="phone" value={newUser.phone} onChange={updateNewUser} placeholder="Optional" /></label>
              <label>Role<select name="role" value={newUser.role} onChange={updateNewUser}>{accountCreateRoles.filter((role) => isSuperAdmin || role !== "super_admin").map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select></label>
              <label>Status<select name="status" value={newUser.status} onChange={updateNewUser}><option value="active">Active</option><option value="pending_approval">Pending approval</option><option value="blocked">Blocked</option></select></label>
              <label>Password<input name="password" type="text" value={newUser.password} onChange={updateNewUser} placeholder="Leave blank to auto-generate" /></label>
            </div>
          </div>
          <div className="admin-form-section-v2">
            <h3>Business profile</h3>
            <div className="admin-form-grid-v2">
              <label>Business / shop / service name<input name="businessName" value={newUser.businessName} onChange={updateNewUser} placeholder="Optional business name" /></label>
              <label>Location<input name="location" value={newUser.location} onChange={updateNewUser} placeholder="City or service area" /></label>
            </div>
            <label>Description<textarea name="description" value={newUser.description} onChange={updateNewUser} rows="4" placeholder="Short business or service description" /></label>
          </div>
        </form>
      </AdminModal>

      <AdminModal open={Boolean(selectedUser)} onClose={() => setSelectedUser(null)} title={selectedUser?.name || "User details"} eyebrow={selectedUser ? roleLabel(selectedUser.role) : "Account"} size="wide" footer={(
        <button className="admin-ghost-button-v2" type="button" onClick={() => setSelectedUser(null)}>Close</button>
      )}>
        {selectedUser && (
          <div>
            <div className="admin-user-modal-head-v2">
              <span className="admin-user-avatar-v2">{getInitials(selectedUser.name)}</span>
              <div>
                <h3>{selectedUser.name}</h3>
                <p>{selectedUser.email}</p>
                <div className="admin-user-action-buttons-v2"><AdminStatusBadge status={selectedUser.status} /><AdminStatusBadge status={roleTone(selectedUser.role)} label={roleLabel(selectedUser.role)} />{selectedBusinessStatus !== "none" && <AdminStatusBadge status={selectedBusinessStatus} label={`Business ${titleCase(selectedBusinessStatus)}`} />}</div>
              </div>
            </div>

            {tempPassword && <div className="admin-create-account-note-v2"><span>Temporary password</span><strong>{tempPassword}</strong><small>Copy it now and share it securely.</small></div>}

            <AdminInfoGrid items={[
              { label: "Phone", value: selectedUser.phone || "Not provided" },
              { label: "Business", value: getBusinessName(selectedUser) },
              { label: "Joined", value: formatDate(selectedUser.createdAt) },
              { label: "Listings", value: formatNumber(selectedListings) },
              { label: "Orders", value: formatNumber(selectedUser.counts?.orders) },
              { label: "Support tickets", value: formatNumber(selectedUser.counts?.supportTickets) },
            ]} />

            <div className="admin-user-actions-v2">
              <article className="admin-user-action-card-v2">
                <h3>Account status</h3><p>Activate trusted accounts, hold accounts for review, or block unsafe access.</p>
                <div className="admin-user-action-buttons-v2">
                  <button className="admin-success-button-v2" type="button" onClick={() => updateAccount("status", { status: "active" }, "Account activated.")}>Activate</button>
                  <button className="admin-secondary-button-v2" type="button" onClick={() => updateAccount("status", { status: "pending_approval" }, "Account moved to pending approval.")}>Pending</button>
                  <button className="admin-danger-button-v2" type="button" onClick={() => updateAccount("status", { status: "blocked" }, "Account blocked.")}>Block</button>
                </div>
              </article>

              <article className="admin-user-action-card-v2 admin-form-v2">
                <h3>Role control</h3><p>Change workspace permissions and the operational role assigned to this account.</p>
                <select value={selectedUser.role} onChange={(event) => updateAccount("role", { role: event.target.value }, "User role updated.")}>{roleOptions.filter((role) => role !== "all" && (isSuperAdmin || role !== "super_admin")).map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select>
              </article>

              <article className="admin-user-action-card-v2">
                <h3>Business approval</h3><p>Approve, hold, or reject seller, shop, and service-provider profiles.</p>
                <div className="admin-user-action-buttons-v2">
                  <button className="admin-success-button-v2" type="button" onClick={() => updateAccount("business-status", { status: "approved" }, "Business profile approved.")}>Approve</button>
                  <button className="admin-secondary-button-v2" type="button" onClick={() => updateAccount("business-status", { status: "pending" }, "Business profile moved to pending.")}>Pending</button>
                  <button className="admin-danger-button-v2" type="button" onClick={() => updateAccount("business-status", { status: "rejected" }, "Business profile rejected.")}>Reject</button>
                </div>
              </article>

              <article className="admin-user-action-card-v2">
                <h3>Password recovery</h3><p>Generate a temporary password for secure account recovery.</p>
                <button className="admin-secondary-button-v2" type="button" onClick={resetPassword}><AdminIcon name="shield" size={16} />Generate temporary password</button>
              </article>
            </div>
          </div>
        )}
      </AdminModal>
    </section>
  );
}
