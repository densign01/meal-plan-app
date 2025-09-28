import { useAppContext } from '../../context/AppContext2'
import { ShoppingCart, ArrowLeft } from 'lucide-react'

export default function GroceryTab() {
  const { currentGroceryList, currentMealPlan, isOnboardingComplete, setActiveTab } = useAppContext()

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please finish onboarding first</h2>
          <p className="text-gray-600 mb-6">Complete your household profile setup to access your personalized grocery list features.</p>
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

  if (!currentMealPlan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Meal Plan Available</h2>
        <p className="text-gray-600">Please create a meal plan first to generate a grocery list.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Grocery List</h2>
        <p className="text-gray-600">Enhanced grocery list management coming soon!</p>

        {currentGroceryList ? (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">You have an active grocery list ready for shopping</p>
          </div>
        ) : (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">Grocery list will be generated from your meal plan</p>
          </div>
        )}
      </div>
    </div>
  )
}