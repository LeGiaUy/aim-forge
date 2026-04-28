import AuthLayout from '../components/AuthLayout.jsx'
import RegisterForm from '../components/RegisterForm.jsx'

export default function RegisterPage() {
  return (
    <AuthLayout
      title_text='Create account'
      subtitle_text='Join AimForge and unlock premium FPS gear'
    >
      <RegisterForm />
    </AuthLayout>
  )
}
