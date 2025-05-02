import { NavigationContainer } from '@react-navigation/native'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import AppNavigator from './navigation/AppNavigator'
import AuthNavigator from './navigation/AuthNavigator'

// This assumes you have installed @react-navigation/native
// npm install @react-navigation/native
// or yarn add @react-navigation/native

const App = () => {
	// Placeholder for authentication state logic
	const [isLoading, setIsLoading] = useState(true)
	const [userToken, setUserToken] = useState<string | null>(null) // Example: null if not logged in, token string if logged in

	useEffect(() => {
		// Check for user token (e.g., in AsyncStorage or secure storage)
		const checkAuth = async () => {
			// Replace with actual auth check logic (e.g., reading token from storage)
			await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate loading
			// Example: const token = await AsyncStorage.getItem('userToken');
			// setUserToken(token);
			setUserToken(null) // Default to logged out for now
			setIsLoading(false)
		}
		checkAuth()
	}, [])

	if (isLoading) {
		// We haven't finished checking for the token yet
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
				}}
			>
				<ActivityIndicator size='large' />
			</View>
		)
	}

	return (
		<NavigationContainer>
			{userToken == null ? (
				// No token found, user isn't signed in
				<AuthNavigator />
			) : (
				// User is signed in
				<AppNavigator />
			)}
		</NavigationContainer>
	)
}

export default App
