import { auth } from '@/auth'
import LandingPage from './components/LandingPage'

export default async function RootPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user

  return <LandingPage isLoggedIn={isLoggedIn} />
}
