import { useState, useMemo } from 'react'
import { useAppContext } from '../../context/AppContext'
import { Calendar, ArrowLeft, Clock, Users } from 'lucide-react'
import type { Recipe } from '../../types'

const DAYS = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' }
]

interface MealListItemProps {
  day: { key: string; label: string }
  recipe: Recipe | null
  onEditRecipe?: () => void
  date?: string
}

function MealListItem({ day, recipe, onEditRecipe, date }: MealListItemProps) {
  // Handle both old format (simple meal object) and new format (with recipe details)
  const mealData = recipe as any
  const isNoCooking = mealData?.type === 'no_cooking' || mealData?.name === 'Dining Out' || mealData?.name === 'No Cooking Planned'
  const hasDetailedRecipe = mealData?.recipe && mealData?.type === 'cooked_meal'
  const actualRecipe = hasDetailedRecipe ? mealData.recipe : mealData

  const totalTime = actualRecipe ? (actualRecipe.prep_time || 0) + (actualRecipe.cook_time || 0) : 0

  // Format date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div
      onClick={!isNoCooking ? onEditRecipe : undefined}
      className={`
        py-4 border-b border-gray-200 last:border-b-0
        ${!isNoCooking ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-baseline space-x-3 mb-1">
            <h3 className="font-medium text-gray-900">{day.label}</h3>
            {date && (
              <span className="text-xs text-gray-500">{formatDate(date)}</span>
            )}
          </div>
          {recipe ? (
            isNoCooking ? (
              <p className="text-sm text-gray-600">{mealData.name}</p>
            ) : (
              <div>
                <p className="text-sm text-gray-900">{actualRecipe.name || 'Meal planned'}</p>
                {actualRecipe.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-1">{actualRecipe.description}</p>
                )}
              </div>
            )
          ) : (
            <p className="text-sm text-gray-500 italic">No meal planned</p>
          )}
        </div>
        {recipe && !isNoCooking && totalTime > 0 && (
          <div className="flex items-center space-x-1 text-xs text-gray-600 ml-4">
            <Clock className="w-3 h-3" />
            <span>{totalTime} min</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MealPlanTab() {
  const { currentMealPlan, setCurrentMealPlan, isOnboardingComplete, setActiveTab } = useAppContext()
  const [editingRecipe, setEditingRecipe] = useState<{ day: string; recipe: Recipe } | null>(null)

  // Create a mutable copy of the meal plan for drag and drop
  const workingMealPlan = useMemo(() => {
    if (!currentMealPlan) return null
    return { ...currentMealPlan, meals: { ...currentMealPlan.meals } }
  }, [currentMealPlan])

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please finish onboarding first</h2>
          <p className="text-gray-600 mb-6">Complete your household profile setup to access your personalized meal planning features.</p>
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Home</span>
          </button>
        </div>
      </div>
    )
  }

  if (!currentMealPlan || !workingMealPlan) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Meal Plan Available</h2>
          <p className="text-gray-600 mb-6">Create your first meal plan by completing the weekly planning process.</p>
          <button
            onClick={() => setActiveTab('home')}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Home</span>
          </button>
        </div>
      </div>
    )
  }


  const handleRemoveRecipe = (day: string) => {
    const updatedMeals = { ...workingMealPlan.meals }
    delete updatedMeals[day]

    const updatedMealPlan = {
      ...workingMealPlan,
      meals: updatedMeals
    }

    setCurrentMealPlan(updatedMealPlan)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleClearMealPlan = () => {
    if (confirm('Are you sure you want to clear this meal plan? This cannot be undone.')) {
      setCurrentMealPlan(null)
      setActiveTab('home')
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Weekly Meal Plan</h1>
          <p className="text-gray-600">Week of {formatDate(currentMealPlan.week_start_date)}</p>
        </div>
        <button
          onClick={handleClearMealPlan}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Clear meal plan
        </button>
      </div>

      {/* Meal List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {DAYS.map((day) => (
          <MealListItem
            key={day.key}
            day={day}
            recipe={workingMealPlan.meals[day.key] || null}
            date={(workingMealPlan.meals[day.key] as any)?.date}
            onEditRecipe={() => {
              const mealData = workingMealPlan.meals[day.key] as any
              if (mealData?.recipe) {
                // New format: nested recipe object
                setEditingRecipe({ day: day.key, recipe: mealData.recipe })
              } else if (mealData?.name) {
                // Old format: meal data is the recipe itself
                setEditingRecipe({ day: day.key, recipe: mealData as Recipe })
              }
            }}
          />
        ))}
      </div>

      {/* Recipe Details Modal */}
      {editingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{editingRecipe.recipe.name}</h2>
                  <p className="text-gray-600 capitalize">{editingRecipe.day}</p>
                  {editingRecipe.recipe.description && (
                    <p className="text-gray-700 mt-2">{editingRecipe.recipe.description}</p>
                  )}
                </div>
                <button
                  onClick={() => setEditingRecipe(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                {editingRecipe.recipe.prep_time && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Prep: {editingRecipe.recipe.prep_time}min</span>
                  </div>
                )}
                {editingRecipe.recipe.cook_time && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Cook: {editingRecipe.recipe.cook_time}min</span>
                  </div>
                )}
                {editingRecipe.recipe.servings && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Serves {editingRecipe.recipe.servings}</span>
                  </div>
                )}
                {editingRecipe.recipe.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    editingRecipe.recipe.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                    editingRecipe.recipe.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {editingRecipe.recipe.difficulty.charAt(0).toUpperCase() + editingRecipe.recipe.difficulty.slice(1)}
                  </span>
                )}
              </div>

              {/* Dietary Tags */}
              {editingRecipe.recipe.dietary_tags && editingRecipe.recipe.dietary_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {editingRecipe.recipe.dietary_tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-6">
                {/* Ingredients */}
                {editingRecipe.recipe.ingredients && editingRecipe.recipe.ingredients.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
                    <ul className="space-y-2 text-gray-700">
                      {editingRecipe.recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start">
                          <span className="inline-block w-1.5 h-1.5 bg-gray-900 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span>{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Instructions */}
                {editingRecipe.recipe.instructions && editingRecipe.recipe.instructions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
                    <ol className="space-y-3">
                      {editingRecipe.recipe.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start text-gray-700">
                          <span className="inline-flex items-center justify-center w-6 h-6 border border-gray-900 text-gray-900 rounded-full text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="flex-1">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Equipment Needed */}
                {editingRecipe.recipe.equipment_needed && editingRecipe.recipe.equipment_needed.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Equipment Needed</h3>
                    <div className="flex flex-wrap gap-2">
                      {editingRecipe.recipe.equipment_needed.map((equipment, index) => (
                        <span key={index} className="px-3 py-1 border border-gray-200 text-gray-700 rounded-lg text-sm">
                          {equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {editingRecipe.recipe.tips && editingRecipe.recipe.tips.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Tips & Notes</h3>
                    <ul className="space-y-2">
                      {editingRecipe.recipe.tips.map((tip, index) => (
                        <li key={index} className="flex items-start text-gray-700">
                          <span className="mr-2">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Nutrition Information */}
                {editingRecipe.recipe.nutrition_per_serving && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Nutrition Per Serving</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{editingRecipe.recipe.nutrition_per_serving.calories}</p>
                        <p className="text-sm text-gray-600">Calories</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{editingRecipe.recipe.nutrition_per_serving.protein}</p>
                        <p className="text-sm text-gray-600">Protein</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{editingRecipe.recipe.nutrition_per_serving.carbs}</p>
                        <p className="text-sm text-gray-600">Carbs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{editingRecipe.recipe.nutrition_per_serving.fat}</p>
                        <p className="text-sm text-gray-600">Fat</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setEditingRecipe(null)}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}