import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppContextProvider } from './context/AppContext2'
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
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleSignOut = async () => {
    await signOut()
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
            <div className="flex items-center space-x-2 text-gray-700">
              <User className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">{user.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
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
          <div className="min-h-screen bg-gray-50 pb-20">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Meal Plan Assistant</h1>
                  <p className="text-gray-600 mt-1">
                    AI-powered meal planning for busy families
                  </p>
                </div>
                <HeaderAuth />
              </div>
            </div>
          </header>

          <TabNavigation />

          <main className="max-w-6xl mx-auto px-4 py-6">
            <TabContent />
          </main>
          </div>
        </AppContextProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
