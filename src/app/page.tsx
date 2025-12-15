'use client'

import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import TabNavigation from '../components/TabNavigation'
import HomeTab from '../components/tabs/HomeTab'
import MealPlanTab from '../components/tabs/MealPlanTab'
import ProfileTab from '../components/tabs/ProfileTab'
import { LogOut, User } from 'lucide-react'

export default function Home() {
  const { activeTab } = useAppContext()
  const { user, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <span className="text-2xl">🍽️</span>
              <h1 className="text-xl font-bold text-gray-900">Meal Plan</h1>
            </div>

            {/* Navigation */}
            <TabNavigation />

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.email}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Guest</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'meal-plan' && <MealPlanTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>
    </div>
  )
}
