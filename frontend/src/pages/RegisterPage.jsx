import AuthLayout from '../components/AuthLayout.jsx'
import RegisterForm from '../components/RegisterForm.jsx'

export default function RegisterPage() {
  return (
    <AuthLayout
      title_text='Tạo tài khoản'
      subtitle_text='Tham gia AimForge và mua sắm các phụ kiện chính hãng'
    >
      <RegisterForm />
    </AuthLayout>
  )
}
