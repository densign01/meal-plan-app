import { useAppContext } from '../../context/AppContext'
import { Calendar, ArrowLeft } from 'lucide-react'

export default function MealPlanTab() {
  const { currentMealPlan, isOnboardingComplete, setActiveTab } = useAppContext()

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please finish onboarding first</h2>
          <p className="text-gray-600 mb-6">Complete your household profile setup to access your personalized meal planning features.</p>
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