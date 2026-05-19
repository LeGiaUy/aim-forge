import AuthLayout from '../components/AuthLayout.jsx'
import LoginForm from '../components/LoginForm.jsx'

export default function LoginPage() {
  return (
    <AuthLayout
      title_text='Chào mừng trở lại'
      subtitle_text='Đăng nhập để tiếp tục sử dụng AimForge'
    >
      <LoginForm />
    </AuthLayout>
  )
}
