import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'
import Home from './pages/Home.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'

function App() {
  const location = useLocation()
  const is_auth_page =
    location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className='flex min-h-screen flex-col'>
      {!is_auth_page && <Navbar />}
      <div className='flex-1'>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route
            path='/profile'
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
      {!is_auth_page && <Footer />}
    </div>
  )
}

export default App