import * as SecureStore from 'expo-secure-store' // Use secure store for tokens
import React, {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
} from 'react'

const TOKEN_KEY = 'userToken' // Key for storing the token

interface AuthContextType {
	signIn: (token: string, userId: string) => Promise<void> // Modified to include userId
	signOut: () => Promise<void>
	userToken: string | null
	userId: string | null // Added userId
	isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
	const [userToken, setUserToken] = useState<string | null>(null)
	const [userId, setUserId] = useState<string | null>(null) // Added userId state
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		// Load the token and userId from storage when the provider mounts
		const loadAppData = async () => {
			try {
				const token = await SecureStore.getItemAsync(TOKEN_KEY)
				const storedUserId = await SecureStore.getItemAsync('userId') // Assuming userId is stored with key 'userId'
				setUserToken(token)
				setUserId(storedUserId)
			} catch (e) {
				console.error('Failed to load auth data', e)
			} finally {
				setIsLoading(false)
			}
		}
		loadAppData()
	}, [])

	const signIn = async (token: string, newUserId: string | number) => {
		// Modified to accept userId as string or number
		try {
			const userIdString = String(newUserId) // Convert userId to string
			await SecureStore.setItemAsync(TOKEN_KEY, token)
			await SecureStore.setItemAsync('userId', userIdString) // Store userId as string
			setUserToken(token)
			setUserId(userIdString) // Set userId state
		} catch (e) {
			console.error('Failed to save auth data', e)
		}
	}

	const signOut = async () => {
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY)
			await SecureStore.deleteItemAsync('userId') // Remove userId
			setUserToken(null)
			setUserId(null) // Reset userId state
		} catch (e) {
			console.error('Failed to delete auth data', e)
		}
	}

	return (
		<AuthContext.Provider
			value={{ signIn, signOut, userToken, userId, isLoading }}
		>
			{children}
		</AuthContext.Provider>
	)
}

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext)
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
