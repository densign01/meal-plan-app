import { useAppContext } from '../../context/AppContext'

export default function MealPlanTab() {
  const { currentMealPlan, isOnboardingComplete } = useAppContext()

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile First</h2>
        <p className="text-gray-600">Please complete your onboarding in the Home tab to access meal planning.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Meal Plan</h2>
        <p className="text-gray-600">Drag and drop meal planning interface coming soon!</p>

        {currentMealPlan ? (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">You have an active meal plan for week of {currentMealPlan.week_start_date}</p>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">No active meal plan. Complete weekly planning in the Home tab first.</p>
          </div>
        )}
      </div>
    </div>
  )
}