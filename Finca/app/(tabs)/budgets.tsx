import { StyleSheet } from 'react-native'

// import BudgetScreen from '@/mobile-app/src/screens/BudgetScreen'; // Adjust path if needed
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import React, { useEffect } from 'react' // Import useEffect

export default function BudgetsTabScreen() {
	useEffect(() => {
		// **API Call Placeholder:**
		// Fetch the list of budgets and their current spending from your backend API here.
		// Example:
		// const fetchBudgets = async () => {
		//   try {
		//     const response = await fetch('YOUR_BACKEND_API/budgets');
		//     const data = await response.json();
		//     // Update state with fetched budgets
		//   } catch (error) {
		//     console.error("Failed to fetch budgets:", error);
		//   }
		// };
		// fetchBudgets();
		console.log('Budgets screen mounted - fetch data here')
	}, [])

	return (
		<ThemedView style={styles.container}>
			<ThemedText type='title'>Бюджети</ThemedText>
			{/* Placeholder: You can import and render your actual BudgetScreen component here */}
			{/* <BudgetScreen /> */}
			<ThemedText>Тут буде екран бюджетів.</ThemedText>
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
