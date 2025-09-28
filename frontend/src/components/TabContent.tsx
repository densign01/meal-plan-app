import { useAppContext } from '../context/AppContext2'
import HomeTab from './tabs/HomeTab'
import MealPlanTab from './tabs/MealPlanTab'
import GroceryTab from './tabs/GroceryTab'
import ProfileTab from './tabs/ProfileTab'

export default function TabContent() {
  const { activeTab } = useAppContext()

  switch (activeTab) {
    case 'home':
      return <HomeTab />
    case 'meal-plan':
      return <MealPlanTab />
    case 'grocery':
      return <GroceryTab />
    case 'profile':
      return <ProfileTab />
    default:
      return <HomeTab />
  }
}