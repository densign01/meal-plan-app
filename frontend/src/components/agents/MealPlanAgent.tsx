import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { MealPlanAPI } from '../../services/api'
import type { MealPlan, GroceryList, Recipe } from '../../types'
import { Calendar, Clock, Users, ShoppingCart, Download, RotateCcw, Plus } from 'lucide-react'

interface MealPlanAgentProps {
  householdId: string
  weeklyContext: any
  onStartOver: () => void
  onPlanNewWeek: () => void
}

export default function MealPlanAgent({
  householdId,
  weeklyContext,
  onStartOver,
  onPlanNewWeek
}: MealPlanAgentProps) {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>('monday')

  // Generate meal plan
  const generateMealPlanMutation = useMutation({
    mutationFn: () => MealPlanAPI.generateMealPlan(householdId, weeklyContext),
    onSuccess: async (data) => {
      const planData = await MealPlanAPI.getMealPlan(data.meal_plan_id)
      setMealPlan(planData)

      // Auto-generate grocery list
      generateGroceryListMutation.mutate(data.meal_plan_id)
    },
    onError: (error) => {
      console.error('Failed to generate meal plan:', error)
    }
  })

  // Generate grocery list
  const generateGroceryListMutation = useMutation({
    mutationFn: (mealPlanId: string) => MealPlanAPI.generateGroceryList(mealPlanId),
    onSuccess: async (data) => {
      const listData = await MealPlanAPI.getGroceryList(data.grocery_list_id)
      setGroceryList(listData)
    },
    onError: (error) => {
      console.error('Failed to generate grocery list:', error)
    }
  })

  // Start meal plan generation when component mounts
  useEffect(() => {
    generateMealPlanMutation.mutate()
  }, [householdId, weeklyContext])

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  }

  const selectedRecipe: Recipe | undefined = mealPlan?.meals[selectedDay]

  const exportGroceryList = () => {
    if (!groceryList) return

    const content = Object.entries(groceryList.items)
      .map(([category, items]) =>
        `${category.toUpperCase()}:\n${items.map(item => `• ${item}`).join('\n')}`
      )
      .join('\n\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'grocery-list.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (generateMealPlanMutation.isPending) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Creating Your Meal Plan
        </h3>
        <p className="text-gray-600">
          Our AI is crafting personalized recipes based on your preferences...
        </p>
      </div>
    )
  }

  if (generateMealPlanMutation.isError || !mealPlan) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-4xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Meal Plan Generation Failed
        </h3>
        <p className="text-gray-600 mb-6">
          We couldn't generate your meal plan. Please try again.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => generateMealPlanMutation.mutate()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={onStartOver}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Start Over
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your Weekly Meal Plan
          </h2>
          <p className="text-gray-600">
            Week of {new Date(mealPlan.week_start_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onPlanNewWeek}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Plan Another Week</span>
          </button>
          <button
            onClick={onStartOver}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Days sidebar */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 mb-3">This Week</h3>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedDay === day
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
              }`}
            >
              <div className="font-medium">{dayNames[day as keyof typeof dayNames]}</div>
              <div className="text-sm opacity-75 truncate">
                {mealPlan.meals[day]?.name || 'No meal planned'}
              </div>
            </button>
          ))}
        </div>

        {/* Recipe details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRecipe ? (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {selectedRecipe.name}
              </h3>

              <div className="flex items-center space-x-6 mb-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedRecipe.prep_time + selectedRecipe.cook_time} min total</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{selectedRecipe.servings} servings</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Ingredients</h4>
                  <ul className="space-y-1">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        • {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Instructions</h4>
                  <ol className="space-y-2">
                    {selectedRecipe.instructions.map((instruction, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        <span className="font-medium">{index + 1}.</span> {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {selectedRecipe.dietary_tags.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    {selectedRecipe.dietary_tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No meal planned for this day</p>
            </div>
          )}
        </div>
      </div>

      {/* Grocery List */}
      {groceryList && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5" />
              <span>Grocery List</span>
            </h3>
            <button
              onClick={exportGroceryList}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              <span>Export List</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(groceryList.items).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                  {category.replace('_', ' ')}
                </h4>
                <ul className="space-y-1">
                  {items.map((item, index) => (
                    <li key={index} className="text-sm text-gray-700">
                      • {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
