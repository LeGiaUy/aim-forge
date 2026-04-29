import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import Home from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import CartPage from './pages/CartPage.jsx'
import PaymentReturnPage from './pages/PaymentReturnPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AttributeList from './pages/admin/attributes/AttributeList.jsx'
import BrandList from './pages/admin/brands/BrandList.jsx'
import CategoryList from './pages/admin/categories/CategoryList.jsx'
import OrderDetail from './pages/admin/orders/OrderDetail.jsx'
import OrderList from './pages/admin/orders/OrderList.jsx'
import ProductList from './pages/admin/products/ProductList.jsx'
import ProductCreate from './pages/admin/products/ProductCreate.jsx'
import ProductEdit from './pages/admin/products/ProductEdit.jsx'

function App() {
  const location = useLocation()
  const is_auth_page =
    location.pathname === '/login' || location.pathname === '/register'
  const is_admin_page = location.pathname.startsWith('/admin')

  return (
    <div className='flex min-h-screen flex-col'>
      {!is_auth_page && !is_admin_page && <Navbar />}
      <div className='flex-1'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route path='/payment-return' element={<PaymentReturnPage />} />
          <Route
            path='/cart'
            element={
              <PrivateRoute>
                <CartPage />
              </PrivateRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path='/profile/orders/:id'
            element={
              <PrivateRoute>
                <OrderDetailPage />
              </PrivateRoute>
            }
          />

          {/* ─── Admin Routes ─── */}
          <Route path='/admin' element={<AdminLayout />}>
            <Route path='products' element={<ProductList />} />
            <Route path='orders' element={<OrderList />} />
            <Route path='orders/:id' element={<OrderDetail />} />
            <Route path='products/create' element={<ProductCreate />} />
            <Route path='products/edit/:id' element={<ProductEdit />} />
            <Route path='categories' element={<CategoryList />} />
            <Route path='attributes' element={<AttributeList />} />
            <Route path='brands' element={<BrandList />} />
          </Route>
        </Routes>
      </div>
      {!is_auth_page && !is_admin_page && <Footer />}
    </div>
  )
}

export default App