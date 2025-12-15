'use client'

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, User, Mail, Lock } from 'lucide-react'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const [isSignUp, setIsSignUp] = useState(false)
    const [useMagicLink, setUseMagicLink] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [magicLinkSent, setMagicLinkSent] = useState(false)

    const { signUp, signIn, signInWithMagicLink } = useAuth()

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (useMagicLink) {
                // Magic link flow
                const { error } = await signInWithMagicLink(email)
                if (error) {
                    setError(error.message)
                } else {
                    setMagicLinkSent(true)
                }
            } else {
                // Regular password flow
                const { user, error } = isSignUp
                    ? await signUp(email, password)
                    : await signIn(email, password)

                if (error) {
                    setError(error.message)
                } else if (user) {
                    onSuccess()
                    onClose()
                }
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {useMagicLink ? 'Magic Link Sign In' : (isSignUp ? 'Create Account' : 'Sign In')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {magicLinkSent ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 font-medium mb-2">✨ Magic link sent!</p>
                            <p className="text-green-700 text-sm">
                                Check your email for a sign-in link. Click the link to access your account.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setMagicLinkSent(false)
                                setEmail('')
                                onClose()
                            }}
                            className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <div className="flex items-center space-x-2 text-gray-900 mb-2">
                                <User className="w-5 h-5" />
                                <span className="font-medium">Save Your Profile</span>
                            </div>
                            <p className="text-gray-600 text-sm">
                                {useMagicLink
                                    ? 'Get a magic link sent to your email for password-free sign in.'
                                    : 'Create an account to save your household profile and access your meal plans from any device.'
                                }
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            </div>

                            {!useMagicLink && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Loading...' : (useMagicLink ? 'Send Magic Link' : (isSignUp ? 'Create Account' : 'Sign In'))}
                            </button>
                        </form>

                        <div className="mt-6 space-y-3">
                            <div className="text-center">
                                <button
                                    onClick={() => {
                                        setUseMagicLink(!useMagicLink)
                                        setError(null)
                                    }}
                                    className="text-gray-600 hover:text-gray-900 text-sm"
                                >
                                    {useMagicLink ? '← Back to password sign in' : '✨ Sign in with magic link instead'}
                                </button>
                            </div>

                            {!useMagicLink && (
                                <div className="text-center">
                                    <button
                                        onClick={() => setIsSignUp(!isSignUp)}
                                        className="text-gray-600 hover:text-gray-900 text-sm"
                                    >
                                        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
