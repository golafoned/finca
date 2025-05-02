import React, { useState } from 'react'
import {
	Button,
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native'

// Placeholder data type
interface Transaction {
	id: string
	type: 'income' | 'expense'
	amount: number
	date: string
	category: string
	notes?: string
}

const TransactionListScreen = () => {
	// State for transactions, filters, search, sorting
	const [transactions, setTransactions] = useState<Transaction[]>([
		// Example Data - Replace with fetched data
		{
			id: '1',
			type: 'expense',
			amount: 50.25,
			date: '2024-07-28',
			category: 'Groceries',
			notes: 'Weekly shopping',
		},
		{
			id: '2',
			type: 'income',
			amount: 2000,
			date: '2024-07-27',
			category: 'Salary',
		},
		{
			id: '3',
			type: 'expense',
			amount: 15.0,
			date: '2024-07-26',
			category: 'Transport',
		},
	])
	const [searchQuery, setSearchQuery] = useState('')
	const [filterOptions, setFilterOptions] = useState({
		dateRange: null,
		category: null,
	}) // Add state for filters
	const [sortOption, setSortOption] = useState('date_desc') // Add state for sorting

	// Placeholder functions for actions
	const handleSearch = (query: string) => {
		setSearchQuery(query)
		// Implement search logic
	}

	const handleFilter = () => {
		// Implement filter logic based on filterOptions
		console.log('Apply filters:', filterOptions)
	}

	const handleSort = (option: string) => {
		setSortOption(option)
		// Implement sorting logic
		console.log('Sort by:', option)
	}

	const handleEditTransaction = (id: string) => {
		// Navigate to Edit Transaction Screen or show modal
		console.log('Edit transaction:', id)
	}

	const handleDeleteTransaction = (id: string) => {
		// Show confirmation and delete transaction
		console.log('Delete transaction:', id)
		// Example: setTransactions(prev => prev.filter(t => t.id !== id));
	}

	// Filtered and sorted transactions (implement actual logic)
	const displayedTransactions = transactions.filter((t) =>
		// Basic search example (improve as needed)
		JSON.stringify(t).toLowerCase().includes(searchQuery.toLowerCase())
	)
	// Add filtering and sorting logic here based on filterOptions and sortOption

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Список транзакцій</Text>

			{/* Search Bar */}
			<TextInput
				style={styles.searchInput}
				placeholder='Пошук транзакцій...'
				value={searchQuery}
				onChangeText={handleSearch}
			/>

			{/* Filter and Sort Controls */}
			<View style={styles.controlsContainer}>
				{/* Add Date Range Picker, Category Picker components here */}
				<Button title='Фільтрувати' onPress={handleFilter} />
				{/* Add Sorting Dropdown/Buttons here */}
				<Button
					title={`Сортувати (${sortOption})`}
					onPress={() => handleSort('amount_asc')}
				/>
				{/* Example sort toggle */}
			</View>

			{/* Transaction List */}
			<FlatList
				data={displayedTransactions}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.transactionItem}>
						<View style={styles.transactionDetails}>
							<Text style={styles.categoryText}>
								{item.category}
							</Text>
							<Text>{item.notes || 'Немає нотаток'}</Text>
							<Text>{item.date}</Text>
						</View>
						<View style={styles.transactionAmountActions}>
							<Text
								style={[
									styles.amountText,
									{
										color:
											item.type === 'expense'
												? 'red'
												: 'green',
									},
								]}
							>
								{item.type === 'expense' ? '-' : '+'}$
								{item.amount.toFixed(2)}
							</Text>
							<View style={styles.actions}>
								<TouchableOpacity
									onPress={() =>
										handleEditTransaction(item.id)
									}
								>
									<Text style={styles.actionText}>Ред.</Text>
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() =>
										handleDeleteTransaction(item.id)
									}
								>
									<Text style={styles.actionText}>Вид.</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
				ListEmptyComponent={<Text>Не знайдено транзакцій.</Text>}
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
	searchInput: {
		height: 40,
		borderColor: 'gray',
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginBottom: 10,
	},
	controlsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 15,
	},
	transactionItem: {
		backgroundColor: '#f9f9f9',
		padding: 15,
		borderRadius: 8,
		marginBottom: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	transactionDetails: {
		flex: 1,
		marginRight: 10,
	},
	categoryText: {
		fontWeight: 'bold',
	},
	transactionAmountActions: {
		alignItems: 'flex-end',
	},
	amountText: {
		fontSize: 16,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	actions: {
		flexDirection: 'row',
		gap: 10,
	},
	actionText: {
		color: 'blue',
	},
})

export default TransactionListScreen
