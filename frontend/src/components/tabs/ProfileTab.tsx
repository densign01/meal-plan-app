import { useAppContext } from '../../context/AppContext2'
import { useAuth } from '../../context/AuthContext'
import { User, ArrowLeft, Edit3 } from 'lucide-react'

export default function ProfileTab() {
  const { householdProfile, isOnboardingComplete, setActiveTab } = useAppContext()
  const { user } = useAuth()

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please finish onboarding first</h2>
          <p className="text-gray-600 mb-6">Complete your household profile setup to view and manage your profile.</p>
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Home</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Household Profile</h2>
          <p className="text-gray-600">Manage your household preferences and members</p>
        </div>
        {user && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <User className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
        )}
      </div>

      {householdProfile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Household Members */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Household Members</h3>
              <Edit3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {householdProfile.members.map((member, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.age} years old</p>
                    {member.dietary_restrictions && member.dietary_restrictions.length > 0 && (
                      <p className="text-sm text-blue-600">
                        Dietary: {member.dietary_restrictions.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cooking Preferences */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cooking Preferences</h3>
              <Edit3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Cooking Skill</span>
                <span className="font-medium text-gray-900 capitalize">{householdProfile.cooking_skill}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Max Cooking Time</span>
                <span className="font-medium text-gray-900">{householdProfile.max_cooking_time} min</span>
              </div>
            </div>
          </div>

          {/* Food Preferences */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Food Preferences</h3>
              <Edit3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Favorite Cuisines</p>
                <div className="flex flex-wrap gap-2">
                  {householdProfile.favorite_cuisines.map((cuisine, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {cuisine}
                    </span>
                  ))}
                  {householdProfile.favorite_cuisines.length === 0 && (
                    <span className="text-gray-500 text-sm">None specified</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Dislikes</p>
                <div className="flex flex-wrap gap-2">
                  {householdProfile.dislikes.map((dislike, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                      {dislike}
                    </span>
                  ))}
                  {householdProfile.dislikes.length === 0 && (
                    <span className="text-gray-500 text-sm">None specified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Kitchen Equipment */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Kitchen Equipment</h3>
              <Edit3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex flex-wrap gap-2">
              {householdProfile.kitchen_equipment.map((equipment: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {equipment}
                </span>
              ))}
              {householdProfile.kitchen_equipment.length === 0 && (
                <span className="text-gray-500 text-sm">None specified</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600">No profile data available.</p>
        </div>
      )}

      {/* Future: Edit functionality */}
      <div className="text-center pt-6">
        <p className="text-sm text-gray-500">Profile editing interface coming soon!</p>
      </div>
    </div>
  )
}