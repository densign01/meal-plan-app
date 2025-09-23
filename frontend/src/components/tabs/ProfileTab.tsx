import { useAppContext } from '../../context/AppContext'

export default function ProfileTab() {
  const { householdProfile, isOnboardingComplete } = useAppContext()

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile First</h2>
        <p className="text-gray-600">Please complete your onboarding in the Home tab to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Household Profile</h2>
        <p className="text-gray-600">Profile management interface coming soon!</p>

        {householdProfile && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Household Members</h3>
              <p className="text-gray-600">{householdProfile.members.length} member(s)</p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Cooking Preferences</h3>
              <p className="text-gray-600">
                Skill: {householdProfile.cooking_skill} |
                Max time: {householdProfile.max_cooking_time} min
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Food Preferences</h3>
              <p className="text-gray-600">
                Favorites: {householdProfile.favorite_cuisines.join(', ') || 'None specified'}
              </p>
              <p className="text-gray-600">
                Dislikes: {householdProfile.dislikes.join(', ') || 'None specified'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}