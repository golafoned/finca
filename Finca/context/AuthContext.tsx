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
	signIn: (token: string) => Promise<void>
	signOut: () => Promise<void>
	userToken: string | null
	isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
	const [userToken, setUserToken] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		// Load the token from storage when the provider mounts
		const loadToken = async () => {
			try {
				const token = await SecureStore.getItemAsync(TOKEN_KEY)
				setUserToken(token)
			} catch (e) {
				console.error('Failed to load auth token', e)
				// Handle error, maybe try to delete corrupted token
			} finally {
				setIsLoading(false)
			}
		}
		loadToken()
	}, [])

	const signIn = async (token: string) => {
		try {
			await SecureStore.setItemAsync(TOKEN_KEY, token)
			setUserToken(token)
		} catch (e) {
			console.error('Failed to save auth token', e)
			// Handle error
		}
	}

	const signOut = async () => {
		try {
			await SecureStore.deleteItemAsync(TOKEN_KEY)
			setUserToken(null)
		} catch (e) {
			console.error('Failed to delete auth token', e)
			// Handle error
		}
	}

	return (
		<AuthContext.Provider value={{ signIn, signOut, userToken, isLoading }}>
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
