import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import 'react-native-reanimated'

import { AuthProvider, useAuth } from '@/context/AuthContext'
import { useColorScheme } from '@/hooks/useColorScheme'

function RootLayoutNav() {
	const colorScheme = useColorScheme()
	const segments = useSegments()
	const router = useRouter()
	const { userToken, isLoading } = useAuth()

	useEffect(() => {
		if (isLoading) return // Don't redirect until loading is done

		const inAuthGroup = segments[0] === '(auth)'

		if (
			// If the user is not signed in and the initial segment is not anything in the auth group.
			!userToken &&
			!inAuthGroup
		) {
			// Redirect to the login page.
			router.replace('/(auth)/login')
		} else if (userToken && inAuthGroup) {
			// If the user is signed in and the initial segment is in the auth group.
			// Redirect away from the auth group.
			router.replace('/(tabs)/' as any) // Redirect to the main dashboard (index of tabs)
		}
	}, [userToken, segments, isLoading, router])

	// Show loading indicator or splash screen while checking auth state
	if (isLoading) {
		// You can return a loading spinner or splash screen here
		return null // Or <ActivityIndicator />;
	}

	return (
		<ThemeProvider
			value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
		>
			<Stack>
				{/* Conditionally render based on auth state - Expo Router handles this via redirection */}
				<Stack.Screen name='(tabs)' options={{ headerShown: false }} />
				<Stack.Screen name='(auth)' options={{ headerShown: false }} />
				<Stack.Screen name='+not-found' />
				{/* Add other stack screens outside of tabs/auth if needed */}
			</Stack>
			<StatusBar style='auto' />
		</ThemeProvider>
	)
}

export default function RootLayout() {
	const [loaded] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
	})

	if (!loaded) {
		// Font loading might take time, return null or a loading indicator
		return null
	}

	// Wrap with AuthProvider
	return (
		<AuthProvider>
			<RootLayoutNav />
		</AuthProvider>
	)
}
