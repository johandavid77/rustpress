import Shop from './pages/public/Shop'
import Bookings from './pages/public/Bookings'
import ProductDetail from './pages/public/ProductDetail'
import Cart from './pages/public/Cart'
import Checkout from './pages/public/Checkout'
import PaymentSuccess from './pages/public/PaymentSuccess'
import PaymentCancel from './pages/public/PaymentCancel'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import { ThemedBlogIndex, ThemedBlogPost } from './themes/ThemeLoader'
import AuthorProfile from './pages/Blog/AuthorProfile'
import PostPreview from './pages/Posts/PostPreview'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/blog" />} />
        <Route path="/blog" element={<ThemedBlogIndex />} />
        <Route path='/bookings' element={<Bookings />} />
        <Route path='/shop/:slug' element={<ProductDetail />} />
        <Route path='/shop' element={<Shop />} />
        <Route path='/cart' element={<Cart />} />
        <Route path='/checkout/success' element={<PaymentSuccess />} />
        <Route path='/checkout/cancel' element={<PaymentCancel />} />
        <Route path='/checkout' element={<Checkout />} />
        <Route path="/blog/:slug" element={<ThemedBlogPost />} />
        <Route path="/author/:id" element={<AuthorProfile />} />
        <Route path="/preview/:id" element={<PostPreview />} />
        <Route path="/preview/:id" element={<PostPreview />} />
        <Route path="/preview/:id" element={<PostPreview />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/blog" />} />
      </Routes>
    </BrowserRouter>
  )
}
