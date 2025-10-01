import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppContextProvider, useAppContext } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import TabNavigation from './components/TabNavigation'
import TabContent from './components/TabContent'
import { useState } from 'react'
import { LogIn, LogOut, User } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import AuthModal from './components/AuthModal'

const queryClient = new QueryClient()

function HeaderAuth() {
  const { user, signOut, loading } = useAuth()
  const { resetAppState } = useAppContext()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    resetAppState() // Clear all app state and localStorage
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="w-20 h-8 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center space-x-2">
        {user ? (
          <>
            <div className="flex items-center space-x-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <LogOut className="w-4 h-4 sm:hidden" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-4 py-2 text-sm bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Sign In
          </button>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false)
          // Let AppContext and HomeTab handle the post-login flow
        }}
      />
    </>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContextProvider>
          <div className="min-h-screen bg-white">
            <header className="border-b border-gray-200 bg-white">
              <div className="max-w-6xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
                  <div className="flex items-center space-x-8">
                    <TabNavigation />
                    <HeaderAuth />
                  </div>
                </div>
              </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
              <TabContent />
            </main>
          </div>
        </AppContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
