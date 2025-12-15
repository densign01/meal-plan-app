'use client'

import { useAppContext, type TabType } from '../context/AppContext'

interface TabData {
    id: TabType
    label: string
}

const tabs: TabData[] = [
    { id: 'home', label: 'Home' },
    { id: 'meal-plan', label: 'Meal Plan' },
    { id: 'profile', label: 'Profile' }
]

interface TabButtonProps extends TabData {
    active: boolean
    onClick: () => void
}

function TabButton({ label, active, onClick }: TabButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`
        text-sm transition-colors pb-1
        ${active
                    ? 'text-gray-900 font-medium border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }
      `}
        >
            {label}
        </button>
    )
}

export default function TabNavigation() {
    const { activeTab, setActiveTab } = useAppContext()

    return (
        <nav className="flex items-center space-x-8">
            {tabs.map(tab => (
                <TabButton
                    key={tab.id}
                    {...tab}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                />
            ))}
        </nav>
    )
}
