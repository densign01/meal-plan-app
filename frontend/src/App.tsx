import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppContextProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import TabNavigation from './components/TabNavigation'
import TabContent from './components/TabContent'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContextProvider>
        <div className="min-h-screen bg-gray-50 pb-20">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">Meal Plan Assistant</h1>
              <p className="text-gray-600 mt-1">
                AI-powered meal planning for busy families
              </p>
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
