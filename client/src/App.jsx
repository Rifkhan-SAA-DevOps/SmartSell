import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import Marketplace from "./pages/Marketplace.jsx";
import Services from "./pages/Services.jsx";
import RequestAnything from "./pages/RequestAnything.jsx";
import SellerHub from "./pages/SellerHub.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import BusinessDashboard from "./pages/BusinessDashboard.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import MyReviews from "./pages/MyReviews.jsx";
import ProfileSettings from "./pages/ProfileSettings.jsx";
import Fulfillment from "./pages/Fulfillment.jsx";
import Earnings from "./pages/Earnings.jsx";
import Notifications from "./pages/Notifications.jsx";
import Inbox from "./pages/Inbox.jsx";
import PromotionCenter from "./pages/PromotionCenter.jsx";
import Reports from "./pages/Reports.jsx";
import SupportCenter from "./pages/SupportCenter.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import ListingManagement from "./pages/ListingManagement.jsx";
import Storefronts from "./pages/Storefronts.jsx";
import StorefrontDetail from "./pages/StorefrontDetail.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import ServiceDetail from "./pages/ServiceDetail.jsx";
import ServiceQuote from "./pages/ServiceQuote.jsx";
import Offers from "./pages/Offers.jsx";
import PlatformSettings from "./pages/PlatformSettings.jsx";
import ContentManagement from "./pages/ContentManagement.jsx";
import SEOSettings from "./pages/SEOSettings.jsx";
import DeliveryDashboard from "./pages/DeliveryDashboard.jsx";
import SecurityCenter from "./pages/SecurityCenter.jsx";
import InventoryCenter from "./pages/InventoryCenter.jsx";
import AdvancedCatalog from "./pages/AdvancedCatalog.jsx";
import GalleryManagement from "./pages/GalleryManagement.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NotFound from "./pages/NotFound.jsx";

export default function App() {
  return (
    <AppLayout>
      <Routes>
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
        <Route path="/seller-hub" element={<ProtectedRoute roles={["seller", "shop", "shop_seller", "service_provider", "admin", "super_admin"]}><SellerHub /></ProtectedRoute>} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<ProtectedRoute roles={["customer", "admin", "super_admin"]}><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/business" element={<ProtectedRoute roles={["seller", "shop", "shop_seller", "service_provider", "admin", "super_admin"]}><BusinessDashboard /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={["admin", "super_admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/fulfillment" element={<ProtectedRoute roles={["admin", "super_admin"]}><Fulfillment /></ProtectedRoute>} />
        <Route path="/delivery" element={<ProtectedRoute roles={["delivery_partner", "admin", "super_admin"]}><DeliveryDashboard /></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute roles={["seller", "shop", "shop_seller", "service_provider", "admin", "super_admin"]}><Earnings /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
        <Route path="/promotions" element={<ProtectedRoute roles={["admin", "super_admin"]}><PromotionCenter /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute roles={["admin", "super_admin"]}><Reports /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><SupportCenter /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute roles={["admin", "super_admin"]}><UserManagement /></ProtectedRoute>} />
        <Route path="/listings" element={<ProtectedRoute roles={["admin", "super_admin"]}><ListingManagement /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute roles={["admin", "super_admin"]}><PlatformSettings /></ProtectedRoute>} />
        <Route path="/content" element={<ProtectedRoute roles={["admin", "super_admin"]}><ContentManagement /></ProtectedRoute>} />
        <Route path="/seo" element={<ProtectedRoute roles={["admin", "super_admin"]}><SEOSettings /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute roles={["admin", "super_admin"]}><SecurityCenter /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute roles={["seller", "shop", "shop_seller", "admin", "super_admin"]}><InventoryCenter /></ProtectedRoute>} />
        <Route path="/catalog-advanced" element={<ProtectedRoute roles={["seller", "shop", "shop_seller", "service_provider", "admin", "super_admin"]}><AdvancedCatalog /></ProtectedRoute>} />
        <Route path="/gallery-management" element={<ProtectedRoute roles={["seller", "shop", "shop_seller", "service_provider", "admin", "super_admin"]}><GalleryManagement /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}
