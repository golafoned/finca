import React from 'react'
import { Button, FlatList, StyleSheet, Text, View } from 'react-native'

const DashboardScreen = () => {
	// Placeholder data for recent transactions
	const recentTransactions = [
		{
			id: '1',
			description: 'Groceries',
			amount: -50.25,
			date: '2024-07-28',
		},
		{ id: '2', description: 'Salary', amount: 2000, date: '2024-07-27' },
		// Add more transactions
	]

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Панель управління</Text>

			{/* Financial Overview Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Огляд фінансового стану</Text>
				<Text>Загальний баланс: {/* Display balance */}$XXXX.XX</Text>
				{/* Add more overview details if needed */}
			</View>

			{/* Charts/Graphs Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Візуалізація</Text>
				{/* Placeholder for Charts/Graphs */}
				<View style={styles.chartPlaceholder}>
					<Text>Графік/Діаграма тут</Text>
				</View>
			</View>

			{/* Quick Access Buttons */}
			<View style={styles.buttonContainer}>
				<Button
					title='Додати транзакцію'
					onPress={() => {
						/* Navigate to Add Transaction Screen */
						console.log('Navigate to Add Transaction')
					}}
				/>
				<Button
					title='Переглянути бюджети'
					onPress={() => {
						/* Navigate to Budgets Screen */
						console.log('Navigate to Budgets')
					}}
				/>
				<Button
					title='Звіти'
					onPress={() => {
						/* Navigate to Reports Screen */
						console.log('Navigate to Reports')
					}}
				/>
				<Button
					title='Список транзакцій'
					onPress={() => {
						/* Navigate to Transaction List Screen */
						console.log('Navigate to Transaction List')
					}}
				/>
			</View>

			{/* Recent Transactions Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Останні транзакції</Text>
				<FlatList
					data={recentTransactions}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<View style={styles.transactionItem}>
							<Text>{item.description}</Text>
							<Text>{item.date}</Text>
							<Text
								style={{
									color: item.amount < 0 ? 'red' : 'green',
								}}
							>
								{item.amount.toFixed(2)}
							</Text>
						</View>
					)}
					ListEmptyComponent={<Text>Немає останніх транзакцій.</Text>}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 15,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 20,
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	chartPlaceholder: {
		height: 150,
		backgroundColor: '#e0e0e0',
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 8,
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
		flexWrap: 'wrap', // Allow buttons to wrap on smaller screens
		gap: 10, // Add gap between buttons
	},
	transactionItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#ccc',
	},
})

export default DashboardScreen
