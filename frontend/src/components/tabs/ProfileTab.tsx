import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppContext } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { User, ArrowLeft, Edit3, Save, X, Plus, Trash2 } from 'lucide-react'
import { MealPlanAPI } from '../../services/api'
import type { HouseholdProfile, HouseholdMember } from '../../types'

export default function ProfileTab() {
  const { householdProfile, setHouseholdProfile, isOnboardingComplete, setActiveTab } = useAppContext()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<HouseholdProfile | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (householdProfile && isEditing) {
      setEditedProfile({ ...householdProfile })
    }
  }, [householdProfile, isEditing])

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<HouseholdProfile>) => {
      if (!householdProfile?.id) throw new Error('No household ID')
      console.log('🔄 Updating profile:', householdProfile.id, updates)
      const response = await MealPlanAPI.updateHouseholdProfile(householdProfile.id, updates)
      console.log('✅ Profile update response:', response)
      return response
    },
    onSuccess: (data) => {
      console.log('✅ Profile update successful:', data)
      if (editedProfile) {
        setHouseholdProfile(editedProfile)
      }
      setIsEditing(false)
      setErrors({})
      queryClient.invalidateQueries({ queryKey: ['household-profile'] })
    },
    onError: (error: any) => {
      console.error('❌ Profile update failed:', error)
      setErrors({ general: error.message || 'Failed to update profile' })
    }
  })

  if (!isOnboardingComplete) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please finish onboarding first</h2>
          <p className="text-gray-600 mb-6">Complete your household profile setup to view and manage your profile.</p>
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

  const handleSave = () => {
    if (!editedProfile) return

    // Validate
    const newErrors: Record<string, string> = {}
    if (editedProfile.members.length === 0) {
      newErrors.members = 'At least one household member is required'
    }
    if (!editedProfile.cooking_skill) {
      newErrors.cooking_skill = 'Cooking skill is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    updateProfileMutation.mutate(editedProfile)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedProfile(null)
    setErrors({})
  }

  const addMember = () => {
    if (!editedProfile) return
    const newMember: HouseholdMember = {
      name: '',
      age: undefined,
      is_adult: true,
      dietary_restrictions: []
    }
    setEditedProfile({
      ...editedProfile,
      members: [...editedProfile.members, newMember]
    })
  }

  const removeMember = (index: number) => {
    if (!editedProfile) return
    const newMembers = editedProfile.members.filter((_, i) => i !== index)
    setEditedProfile({ ...editedProfile, members: newMembers })
  }

  const updateMember = (index: number, updates: Partial<HouseholdMember>) => {
    if (!editedProfile) return
    const newMembers = [...editedProfile.members]
    newMembers[index] = { ...newMembers[index], ...updates }
    setEditedProfile({ ...editedProfile, members: newMembers })
  }

  const addCuisine = (cuisine: string) => {
    if (!editedProfile || !cuisine.trim()) return
    if (editedProfile.favorite_cuisines.includes(cuisine.trim())) return
    setEditedProfile({
      ...editedProfile,
      favorite_cuisines: [...editedProfile.favorite_cuisines, cuisine.trim()]
    })
  }

  const removeCuisine = (cuisine: string) => {
    if (!editedProfile) return
    setEditedProfile({
      ...editedProfile,
      favorite_cuisines: editedProfile.favorite_cuisines.filter(c => c !== cuisine)
    })
  }

  const addDislike = (dislike: string) => {
    if (!editedProfile || !dislike.trim()) return
    if (editedProfile.dislikes.includes(dislike.trim())) return
    setEditedProfile({
      ...editedProfile,
      dislikes: [...editedProfile.dislikes, dislike.trim()]
    })
  }

  const removeDislike = (dislike: string) => {
    if (!editedProfile) return
    setEditedProfile({
      ...editedProfile,
      dislikes: editedProfile.dislikes.filter(d => d !== dislike)
    })
  }

  const profile = isEditing ? editedProfile : householdProfile

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No profile data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Household Profile</h2>
          <p className="text-gray-600">Manage your household preferences and members</p>
        </div>
        <div className="flex items-center space-x-3">
          {user && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <User className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
          )}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{errors.general}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Household Members */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Household Members</h3>
            {isEditing && (
              <button
                onClick={addMember}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            )}
          </div>
          {errors.members && (
            <p className="text-red-600 text-sm mb-2">{errors.members}</p>
          )}
          <div className="space-y-3">
            {profile.members.map((member, index) => (
              <div key={index} className={`p-3 rounded-lg ${isEditing ? 'bg-gray-50 border border-gray-200' : 'bg-gray-50'}`}>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateMember(index, { name: e.target.value })}
                        placeholder="Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => removeMember(index)}
                        className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={member.age || ''}
                        onChange={(e) => updateMember(index, {
                          age: e.target.value ? parseInt(e.target.value) : undefined,
                          is_adult: e.target.value ? parseInt(e.target.value) >= 18 : true
                        })}
                        placeholder="Age (optional)"
                        className="w-24 px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <label className="flex items-center space-x-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={member.is_adult}
                          onChange={(e) => updateMember(index, { is_adult: e.target.checked })}
                          className="rounded"
                        />
                        <span>Adult</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                      {member.age && <p className="text-sm text-gray-600">{member.age} years old</p>}
                      {member.dietary_restrictions && member.dietary_restrictions.length > 0 && (
                        <p className="text-sm text-blue-600">
                          Dietary: {member.dietary_restrictions.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Food Preferences */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Food Preferences</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Favorite Cuisines</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.favorite_cuisines.map((cuisine, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center space-x-1">
                    <span>{cuisine}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeCuisine(cuisine)}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {profile.favorite_cuisines.length === 0 && (
                  <span className="text-gray-500 text-sm">None specified</span>
                )}
              </div>
              {isEditing && (
                <input
                  type="text"
                  placeholder="Add cuisine (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCuisine(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Dislikes</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {profile.dislikes.map((dislike, index) => (
                  <span key={index} className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full flex items-center space-x-1">
                    <span>{dislike}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeDislike(dislike)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {profile.dislikes.length === 0 && (
                  <span className="text-gray-500 text-sm">None specified</span>
                )}
              </div>
              {isEditing && (
                <input
                  type="text"
                  placeholder="Add dislike (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addDislike(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}