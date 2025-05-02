import { StyleSheet } from 'react-native'

// import DashboardScreen from '@/mobile-app/src/screens/DashboardScreen'; // Adjust path if needed
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import React, { useEffect } from 'react' // Import useEffect

export default function DashboardTabScreen() {
	useEffect(() => {
		// **API Call Placeholder:**
		// Fetch dashboard summary data (balance, recent transactions, budget overview) from your backend API here.
		// Example:
		// const fetchData = async () => {
		//   try {
		//     const response = await fetch('YOUR_BACKEND_API/dashboard');
		//     const data = await response.json();
		//     // Update state with fetched data
		//   } catch (error) {
		//     console.error("Failed to fetch dashboard data:", error);
		//   }
		// };
		// fetchData();
		console.log('Dashboard screen mounted - fetch data here')
	}, [])

	return (
		<ThemedView style={styles.container}>
			<ThemedText type='title'>Панель управління</ThemedText>
			{/* Placeholder: You can import and render your actual DashboardScreen component here */}
			{/* <DashboardScreen /> */}
			<ThemedText>Тут буде вміст панелі управління.</ThemedText>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	titleContainer: {
		// Remove if not used
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	stepContainer: {
		// Remove if not used
		gap: 8,
		marginBottom: 8,
	},
	reactLogo: {
		// Remove if not used
		height: 178,
		width: 290,
		bottom: 0,
		left: 0,
		position: 'absolute',
	},
})
