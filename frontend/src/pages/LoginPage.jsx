import AuthLayout from '../components/AuthLayout.jsx'
import LoginForm from '../components/LoginForm.jsx'

export default function LoginPage() {
  return (
    <AuthLayout
      title_text='Welcome back'
      subtitle_text='Sign in to continue your AimForge setup'
    >
      <LoginForm />
    </AuthLayout>
  )
}
