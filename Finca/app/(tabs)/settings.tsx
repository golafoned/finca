import { StyleSheet } from 'react-native'

// import SettingsScreen from '@/mobile-app/src/screens/SettingsScreen'; // Adjust path if needed
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { useAuth } from '@/context/AuthContext' // Import useAuth
import React, { useEffect } from 'react' // Import useEffect
import { Button } from 'react-native' // Import Button

export default function SettingsTabScreen() {
	const { signOut } = useAuth() // Get signOut from context

	useEffect(() => {
		// **API Call Placeholder:**
		// Fetch current user settings (name, email, preferences) from your backend API here.
		// Example:
		// const fetchSettings = async () => {
		//   try {
		//     const response = await fetch('YOUR_BACKEND_API/settings');
		//     const data = await response.json();
		//     // Update state with fetched settings
		//   } catch (error) {
		//     console.error("Failed to fetch settings:", error);
		//   }
		// };
		// fetchSettings();
		console.log('Settings screen mounted - fetch data here')
	}, [])

	const handleLogout = async () => {
		console.log('Logout requested')
		// **API Call Placeholder (Optional):**
		// You might want to invalidate the token on the backend.
		// await fetch('YOUR_BACKEND_API/logout', { method: 'POST' });

		// Clear local token/state via context
		await signOut()
		// Navigation will happen automatically via _layout.tsx effect
	}

	const handleSaveChanges = () => {
		console.log('Save settings requested')
		// **API Call Placeholder:**
		// Send updated settings data (name, preferences) to your backend API.
		// Example:
		// await fetch('YOUR_BACKEND_API/settings', {
		//   method: 'PUT',
		//   headers: { 'Content-Type': 'application/json' },
		//   body: JSON.stringify({ name: newName, language: newLang, ... }),
		// });
	}

	return (
		<ThemedView style={styles.container}>
			<ThemedText type='title'>Налаштування</ThemedText>
			{/* Placeholder: You can import and render your actual SettingsScreen component here */}
			{/* <SettingsScreen /> */}
			<ThemedText>Тут буде екран налаштувань.</ThemedText>
			{/* Add buttons for Save Changes and Logout */}
			{/* <Button title="Зберегти" onPress={handleSaveChanges} /> */}
			<Button title='Вийти' color='red' onPress={handleLogout} />
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
})
