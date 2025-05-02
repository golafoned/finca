import { StyleSheet } from 'react-native'

// import TransactionListScreen from '@/mobile-app/src/screens/TransactionListScreen'; // Adjust path if needed
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import React, { useEffect } from 'react' // Import useEffect

export default function TransactionsTabScreen() {
	useEffect(() => {
		// **API Call Placeholder:**
		// Fetch the list of transactions (potentially with filters/sorting) from your backend API here.
		// Example:
		// const fetchTransactions = async () => {
		//   try {
		//     const response = await fetch('YOUR_BACKEND_API/transactions?sort=date_desc&limit=20');
		//     const data = await response.json();
		//     // Update state with fetched transactions
		//   } catch (error) {
		//     console.error("Failed to fetch transactions:", error);
		//   }
		// };
		// fetchTransactions();
		console.log('Transactions screen mounted - fetch data here')
	}, [])

	return (
		<ThemedView style={styles.container}>
			<ThemedText type='title'>Транзакції</ThemedText>
			{/* Placeholder: You can import and render your actual TransactionListScreen component here */}
			{/* <TransactionListScreen /> */}
			<ThemedText>Тут буде список транзакцій.</ThemedText>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerImage: {
		// Remove if not used
		color: '#808080',
		bottom: -90,
		left: -35,
		position: 'absolute',
	},
	titleContainer: {
		// Remove if not used
		flexDirection: 'row',
		gap: 8,
	},
})
