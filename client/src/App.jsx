import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { ApplicationErrorBoundary, RouteLoadingState } from "./components/ApplicationState.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Marketplace = lazy(() => import("./pages/Marketplace.jsx"));
const Services = lazy(() => import("./pages/Services.jsx"));
const RequestAnything = lazy(() => import("./pages/RequestAnything.jsx"));
const SellerHub = lazy(() => import("./pages/SellerHub.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Cart = lazy(() => import("./pages/Cart.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Orders = lazy(() => import("./pages/Orders.jsx"));
const BusinessDashboard = lazy(() => import("./pages/BusinessDashboard.jsx"));
const MyRequests = lazy(() => import("./pages/MyRequests.jsx"));
const Wishlist = lazy(() => import("./pages/Wishlist.jsx"));
const MyReviews = lazy(() => import("./pages/MyReviews.jsx"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings.jsx"));
const Fulfillment = lazy(() => import("./pages/Fulfillment.jsx"));
const Earnings = lazy(() => import("./pages/Earnings.jsx"));
const Notifications = lazy(() => import("./pages/Notifications.jsx"));
const Inbox = lazy(() => import("./pages/Inbox.jsx"));
const PromotionCenter = lazy(() => import("./pages/PromotionCenter.jsx"));
const HomeMerchandising = lazy(() => import("./pages/HomeMerchandising.jsx"));
const Reports = lazy(() => import("./pages/Reports.jsx"));
const SupportCenter = lazy(() => import("./pages/SupportCenter.jsx"));
const UserManagement = lazy(() => import("./pages/UserManagement.jsx"));
const ListingManagement = lazy(() => import("./pages/ListingManagement.jsx"));
const Storefronts = lazy(() => import("./pages/Storefronts.jsx"));
const StorefrontDetail = lazy(() => import("./pages/StorefrontDetail.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail.jsx"));
const ServiceQuote = lazy(() => import("./pages/ServiceQuote.jsx"));
const Offers = lazy(() => import("./pages/Offers.jsx"));
const PlatformSettings = lazy(() => import("./pages/PlatformSettings.jsx"));
const ContentManagement = lazy(() => import("./pages/ContentManagement.jsx"));
const SEOSettings = lazy(() => import("./pages/SEOSettings.jsx"));
const DeliveryDashboard = lazy(() => import("./pages/DeliveryDashboard.jsx"));
const SecurityCenter = lazy(() => import("./pages/SecurityCenter.jsx"));
const InventoryCenter = lazy(() => import("./pages/InventoryCenter.jsx"));
const AdvancedCatalog = lazy(() => import("./pages/AdvancedCatalog.jsx"));
const GalleryManagement = lazy(() => import("./pages/GalleryManagement.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

export default function App() {
  const location = useLocation();
  const resetKey = `${location.pathname}${location.search}`;

  return (
    <AppLayout>
      <ApplicationErrorBoundary resetKey={resetKey}>
        <Suspense fallback={<RouteLoadingState />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/services/:id/quote" element={<ServiceQuote />} />
            <Route path="/storefronts" element={<Storefronts />} />
            <Route path="/storefronts/:kind/:id" element={<StorefrontDetail />} />
            <Route path="/request-anything" element={<RequestAnything />} />
            <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
            <Route path="/my-reviews" element={<ProtectedRoute><MyReviews /></ProtectedRoute>} />
            <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
            <Route path="/seller-hub" element={<ProtectedRoute roles={["seller", "shop", "service_provider", "admin", "super_admin"]}><SellerHub /></ProtectedRoute>} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<ProtectedRoute roles={["customer", "admin", "super_admin"]}><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/business" element={<ProtectedRoute roles={["seller", "shop", "service_provider", "admin", "super_admin"]}><BusinessDashboard /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={["admin", "super_admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/fulfillment" element={<ProtectedRoute roles={["admin", "super_admin"]}><Fulfillment /></ProtectedRoute>} />
            <Route path="/delivery" element={<ProtectedRoute roles={["delivery_partner", "admin", "super_admin"]}><DeliveryDashboard /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute roles={["seller", "shop", "service_provider", "admin", "super_admin"]}><Earnings /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
            <Route path="/promotions" element={<ProtectedRoute roles={["admin", "super_admin"]}><PromotionCenter /></ProtectedRoute>} />
            <Route path="/home-merchandising" element={<ProtectedRoute roles={["admin", "super_admin"]}><HomeMerchandising /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute roles={["admin", "super_admin"]}><Reports /></ProtectedRoute>} />
            <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute roles={["admin", "super_admin"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/listings" element={<ProtectedRoute roles={["admin", "super_admin"]}><ListingManagement /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute roles={["admin", "super_admin"]}><PlatformSettings /></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute roles={["admin", "super_admin"]}><ContentManagement /></ProtectedRoute>} />
            <Route path="/seo" element={<ProtectedRoute roles={["admin", "super_admin"]}><SEOSettings /></ProtectedRoute>} />
            <Route path="/security" element={<ProtectedRoute roles={["admin", "super_admin"]}><SecurityCenter /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute roles={["seller", "shop", "admin", "super_admin"]}><InventoryCenter /></ProtectedRoute>} />
            <Route path="/catalog-advanced" element={<ProtectedRoute roles={["seller", "shop", "service_provider", "admin", "super_admin"]}><AdvancedCatalog /></ProtectedRoute>} />
            <Route path="/gallery-management" element={<ProtectedRoute roles={["seller", "shop", "service_provider", "admin", "super_admin"]}><GalleryManagement /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ApplicationErrorBoundary>
    </AppLayout>
  );
}
