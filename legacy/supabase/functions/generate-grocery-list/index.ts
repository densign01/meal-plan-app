import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GroceryCategory {
  [category: string]: string[]
}

const GROCERY_CATEGORIES: Record<string, string[]> = {
  produce: ['onion', 'garlic', 'tomato', 'lettuce', 'carrot', 'potato', 'bell pepper', 'mushroom', 'spinach', 'broccoli', 'cucumber', 'celery', 'lemon', 'lime', 'avocado', 'herbs', 'parsley', 'cilantro', 'basil'],
  meat: ['chicken', 'beef', 'pork', 'turkey', 'fish', 'salmon', 'shrimp', 'ground beef', 'ground turkey'],
  dairy: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'eggs', 'sour cream'],
  pantry: ['rice', 'pasta', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'soy sauce', 'garlic powder', 'onion powder', 'paprika', 'cumin', 'oregano', 'thyme', 'bay leaves'],
  canned_goods: ['tomatoes', 'beans', 'broth', 'stock', 'coconut milk', 'tomato paste', 'corn', 'diced tomatoes'],
  frozen: ['peas', 'corn', 'berries', 'ice cream'],
  bakery: ['bread', 'tortillas', 'bagels'],
  other: []
}

function categorizeIngredient(ingredient: string): string {
  const ingredientLower = ingredient.toLowerCase()

  for (const [category, keywords] of Object.entries(GROCERY_CATEGORIES)) {
    if (category === 'other') continue
    for (const keyword of keywords) {
      if (ingredientLower.includes(keyword)) {
        return category
      }
    }
  }

  return 'other'
}

interface ParsedIngredient {
  quantity: string
  unit: string
  item: string
  original: string
}

function parseIngredient(ingredient: string): ParsedIngredient {
  // Simple regex to extract quantity and unit
  const pattern = /^(\d*\.?\d*)\s*([a-zA-Z]*)\s*(.+)$/
  const match = ingredient.trim().match(pattern)

  if (match) {
    return {
      quantity: match[1] || '1',
      unit: match[2] || '',
      item: match[3].trim(),
      original: ingredient
    }
  }

  return {
    quantity: '1',
    unit: '',
    item: ingredient.trim(),
    original: ingredient
  }
}

function combineIngredients(ingredients: ParsedIngredient[]): Record<string, ParsedIngredient> {
  const combined: Record<string, ParsedIngredient> = {}

  for (const ing of ingredients) {
    const baseItem = ing.item.toLowerCase()

    if (combined[baseItem]) {
      const existing = combined[baseItem]
      if (ing.unit === existing.unit) {
        try {
          const totalQty = parseFloat(existing.quantity) + parseFloat(ing.quantity)
          combined[baseItem].quantity = totalQty.toString()
        } catch {
          combined[baseItem].original += `, ${ing.original}`
        }
      } else {
        combined[baseItem].original += `, ${ing.original}`
      }
    } else {
      combined[baseItem] = { ...ing }
    }
  }

  return combined
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { meal_plan_id } = await req.json()

    if (!meal_plan_id) {
      throw new Error('meal_plan_id is required')
    }

    // Get meal plan
    const { data: mealPlan, error: mealPlanError } = await supabaseClient
      .from('meal_plans')
      .select('*')
      .eq('id', meal_plan_id)
      .single()

    if (mealPlanError || !mealPlan) {
      throw new Error('Meal plan not found')
    }

    // Extract all ingredients from all meals
    const allIngredients: string[] = []
    const meals = mealPlan.meals || {}

    for (const [day, recipe] of Object.entries(meals)) {
      const ingredients = (recipe as any)?.recipe?.ingredients || (recipe as any)?.ingredients || []
      allIngredients.push(...ingredients)
    }

    // Parse ingredients
    const parsedIngredients = allIngredients.map(ing => parseIngredient(ing))

    // Combine duplicate ingredients
    const combined = combineIngredients(parsedIngredients)

    // Categorize ingredients
    const categorizedItems: Record<string, string[]> = {}

    for (const [itemKey, itemData] of Object.entries(combined)) {
      const category = categorizeIngredient(itemData.item)

      if (!categorizedItems[category]) {
        categorizedItems[category] = []
      }

      // Format the grocery list item
      const formatted = itemData.unit
        ? `${itemData.quantity} ${itemData.unit} ${itemData.item}`
        : `${itemData.quantity !== '1' ? itemData.quantity + ' ' : ''}${itemData.item}`.trim()

      categorizedItems[category].push(formatted)
    }

    // Sort items within each category
    for (const category of Object.keys(categorizedItems)) {
      categorizedItems[category].sort()
    }

    // Save grocery list to database
    const { data: groceryList, error: insertError } = await supabaseClient
      .from('grocery_lists')
      .insert({
        meal_plan_id,
        items: categorizedItems,
        total_estimated_cost: null
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to save grocery list: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({
        grocery_list_id: groceryList.id,
        message: 'Grocery list generated successfully',
        items: categorizedItems
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
