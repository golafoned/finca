import React from 'react'
import {
	Button,
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native'
// Import a progress bar component if needed, e.g., from 'react-native-progress'
// import * as Progress from 'react-native-progress';

const BudgetScreen = () => {
	// Placeholder data
	const budgets = [
		{
			id: '1',
			category: 'Продукти',
			budget: 500,
			spent: 250,
			currency: '$',
		},
		{
			id: '2',
			category: 'Комунальні',
			budget: 150,
			spent: 100,
			currency: '$',
		},
		{
			id: '3',
			category: 'Розваги',
			budget: 200,
			spent: 210,
			currency: '$',
		}, // Example over budget
	]

	const handleAddBudget = () => {
		/* Show add/edit budget modal/screen */
		console.log('Add budget')
	}

	const handleEditBudget = (id: string) => {
		/* Show add/edit budget modal/screen with existing data */
		console.log('Edit budget:', id)
	}

	const handleDeleteBudget = (id: string) => {
		/* Show confirmation and delete budget */
		console.log('Delete budget:', id)
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Бюджет</Text>
			<Button title='Додати бюджет' onPress={handleAddBudget} />
			<FlatList
				data={budgets}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => {
					const progress =
						item.budget > 0 ? item.spent / item.budget : 0
					const overBudget = item.spent > item.budget
					return (
						<View style={styles.budgetItem}>
							<View style={styles.budgetInfo}>
								<Text style={styles.categoryText}>
									{item.category}
								</Text>
								<Text
									style={
										overBudget
											? styles.overBudgetText
											: null
									}
								>
									Витрачено: {item.currency}
									{item.spent.toFixed(2)} / Бюджет:{' '}
									{item.currency}
									{item.budget.toFixed(2)}
								</Text>
							</View>
							{/* Add Progress Bar */}
							<View style={styles.progressBarContainer}>
								{/* Placeholder for Progress Bar Component */}
								{/* Example using react-native-progress:
                                <Progress.Bar
                                    progress={progress}
                                    width={null} // Use null for full width within container
                                    color={overBudget ? 'orange' : (progress > 0.8 ? 'red' : 'green')}
                                    unfilledColor="#e0e0e0"
                                    borderWidth={0}
                                    height={10}
                                />
                                */}
								<View
									style={[
										styles.progressBarPlaceholder,
										{
											width: `${Math.min(
												progress * 100,
												100
											)}%`,
										},
										overBudget
											? styles.progressBarOver
											: progress > 0.8
											? styles.progressBarWarning
											: styles.progressBarNormal,
									]}
								/>
							</View>
							{/* Add Edit/Delete buttons */}
							<View style={styles.actions}>
								<TouchableOpacity
									onPress={() => handleEditBudget(item.id)}
								>
									<Text style={styles.actionText}>Ред.</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => handleDeleteBudget(item.id)}
								>
									<Text style={styles.actionText}>Вид.</Text>
								</TouchableOpacity>
							</View>
						</View>
					)
				}}
				ListEmptyComponent={<Text>Немає встановлених бюджетів.</Text>}
			/>
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
		marginBottom: 15,
	},
	budgetItem: {
		backgroundColor: '#f9f9f9',
		padding: 15,
		borderRadius: 8,
		marginBottom: 10,
	},
	budgetInfo: {
		marginBottom: 10,
	},
	categoryText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	overBudgetText: {
		color: 'red',
		fontWeight: 'bold',
	},
	progressBarContainer: {
		height: 10,
		backgroundColor: '#e0e0e0',
		borderRadius: 5,
		overflow: 'hidden',
		marginBottom: 10,
	},
	progressBarPlaceholder: {
		height: '100%',
		borderRadius: 5,
	},
	progressBarNormal: {
		backgroundColor: 'green',
	},
	progressBarWarning: {
		backgroundColor: 'orange',
	},
	progressBarOver: {
		backgroundColor: 'red',
		width: '100%', // Show full red bar if over budget
	},
	actions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 15, // Add space between buttons
	},
	actionText: {
		color: 'blue',
	},
})

export default BudgetScreen
