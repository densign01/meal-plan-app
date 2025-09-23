import { useAppContext } from '../../context/AppContext'

export default function GroceryTab() {
  const { currentGroceryList, currentMealPlan, isOnboardingComplete } = useAppContext()

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile First</h2>
        <p className="text-gray-600">Please complete your onboarding in the Home tab to access grocery lists.</p>
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