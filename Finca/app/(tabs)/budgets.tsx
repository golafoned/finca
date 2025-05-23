import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import React, { useCallback, useEffect, useState } from 'react'
import {
	Alert,
	FlatList,
	Keyboard,
	Modal,
	SafeAreaView, // Import SafeAreaView
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	useColorScheme,
	View,
} from 'react-native'

import { ThemedText } from '../../components/ThemedText'
import { API_BASE_URL } from '../../config'
import { Colors } from '../../constants/Colors'
import { useAuth } from '../../context/AuthContext'

export default function BudgetsScreen() {
	const auth = useAuth()
	const [modalVisible, setModalVisible] = useState(false)
	const [budgets, setBudgets] = useState<any[]>([])
	const [categories, setCategories] = useState<any[]>([])
	const [name, setName] = useState('')
	const [amount, setAmount] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<number | null>(
		null
	)
	const [startDate, setStartDate] = useState(new Date())
	const [endDate, setEndDate] = useState(new Date())
	const [budgetType, setBudgetType] = useState<'income' | 'expense'>(
		'expense'
	)
	const [editingBudget, setEditingBudget] = useState<any | null>(null)

	const [showBudgetCategoryPicker, setShowBudgetCategoryPicker] =
		useState(false)
	const [showStartDatePicker, setShowStartDatePicker] = useState(false)
	const [showEndDatePicker, setShowEndDatePicker] = useState(false)

	const colorScheme = useColorScheme() ?? 'light' // Correctly use imported useColorScheme
	const themeColors = Colors[colorScheme] // This should now be correctly typed

	const fetchBudgetsAndCategories = useCallback(async () => {
		if (!auth.userToken || !auth.userId) {
			console.log('User token or userId is not available.')
			setBudgets([]) // Clear data if auth is not available
			setCategories([])
			return
		}
		try {
			// Fetch Budgets
			const budgetsResponse = await fetch(
				`${API_BASE_URL}/budgets?user_id=${auth.userId}`,
				{
					headers: { Authorization: `Bearer ${auth.userToken}` },
				}
			)
			const budgetsResponseText = await budgetsResponse.text()
			if (!budgetsResponse.ok) {
				console.error(
					`Failed to fetch budgets. Status: ${budgetsResponse.status}. Response:`,
					budgetsResponseText
				)
				setBudgets([])
			} else {
				try {
					const budgetsData = JSON.parse(budgetsResponseText)
					setBudgets(budgetsData)
				} catch (parseError) {
					console.error(
						'Failed to parse budgets JSON. Raw response:',
						budgetsResponseText,
						parseError
					)
					setBudgets([])
				}
			}

			// Fetch Categories
			const categoriesResponse = await fetch(
				`${API_BASE_URL}/categories?user_id=${auth.userId}`,
				{
					headers: { Authorization: `Bearer ${auth.userToken}` },
				}
			)
			const categoriesResponseText = await categoriesResponse.text()
			if (!categoriesResponse.ok) {
				console.error(
					`Failed to fetch categories. Status: ${categoriesResponse.status}. Response:`,
					categoriesResponseText
				)
				setCategories([])
			} else {
				try {
					const categoriesData = JSON.parse(categoriesResponseText)
					setCategories(categoriesData)
				} catch (parseError) {
					console.error(
						'Failed to parse categories JSON. Raw response:',
						categoriesResponseText,
						parseError
					)
					setCategories([])
				}
			}
		} catch (error) {
			console.error(
				'Network or other error in fetchBudgetsAndCategories:',
				error
			)
			setBudgets([])
			setCategories([])
		}
	}, [auth.userToken, auth.userId])

	useEffect(() => {
		fetchBudgetsAndCategories()
	}, [fetchBudgetsAndCategories])

	const handleOpenModal = (budget: any | null = null) => {
		if (budget) {
			setEditingBudget(budget.budget_id) // was budget.id
			setName(budget.name || '')
			setAmount(budget.allocated_amount?.toString() || '') // Changed from budget.amount
			setSelectedCategory(budget.category_id || null) // was budget.category
			setStartDate(
				budget.start_date ? new Date(budget.start_date) : new Date()
			)
			setEndDate(budget.end_date ? new Date(budget.end_date) : new Date())
			setBudgetType(budget.budget_type || 'expense')
		} else {
			setEditingBudget(null)
			setName('')
			setAmount('')
			setSelectedCategory(null)
			setStartDate(new Date())
			setEndDate(new Date())
			setBudgetType('expense')
		}
		setShowBudgetCategoryPicker(false)
		setShowStartDatePicker(false)
		setShowEndDatePicker(false)
		setModalVisible(true)
	}

	const handleSaveBudget = async () => {
		if (!auth.userToken || !auth.userId) {
			Alert.alert('Error', 'You must be logged in to save a budget.')
			return
		}
		if (!name || !amount || !selectedCategory) {
			Alert.alert('Error', 'Please fill in all fields.')
			return
		}

		const budgetData = {
			name,
			amount: parseFloat(amount),
			category_id: selectedCategory,
			start_date: startDate.toISOString().split('T')[0],
			end_date: endDate.toISOString().split('T')[0],
			budget_type: budgetType,
			user_id: auth.userId,
		}
		try {
			console.log(
				'Current editingBudget state in handleSaveBudget:',
				JSON.stringify(editingBudget, null, 2)
			) // Log editingBudget state
			const url = editingBudget
				? `${API_BASE_URL}/budgets/${editingBudget}` // editingBudget is now just the budget_id number
				: `${API_BASE_URL}/budgets`
			const method = editingBudget ? 'PUT' : 'POST'

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth.userToken}`,
				},
				body: JSON.stringify(budgetData),
			})

			if (response.ok) {
				Alert.alert(
					'Success',
					`Budget ${
						editingBudget ? 'updated' : 'saved'
					} successfully.`
				)
				setModalVisible(false)
				fetchBudgetsAndCategories()
			} else {
				// First, get the response as text to avoid JSON parse error if it's not JSON
				const errorText = await response.text()
				console.error(
					`Failed to ${
						editingBudget ? 'update' : 'save'
					} budget. Status: ${response.status}. Response:`,
					errorText
				)
				try {
					// Try to parse it as JSON in case the server does send a JSON error object
					const errorData = JSON.parse(errorText)
					Alert.alert(
						'Error',
						errorData.message ||
							`Failed to ${
								editingBudget ? 'update' : 'save'
							} budget. Server responded with: ${errorText.substring(
								0,
								100
							)}` // Show a snippet if no message
					)
				} catch (e) {
					// If JSON parsing fails, it means the error response was not JSON (e.g., HTML)
					Alert.alert(
						'Error',
						`Failed to ${
							editingBudget ? 'update' : 'save'
						} budget. Server responded with: ${errorText.substring(
							0,
							200
						)}...` // Show a snippet of the non-JSON response
					)
				}
			}
		} catch (error) {
			console.error('Error saving budget:', error)
			Alert.alert('Error', 'An unexpected error occurred.')
		}
	}

	const onStartDateChange = (event: any, selectedDate?: Date) => {
		setShowStartDatePicker(false)
		if (selectedDate) {
			setStartDate(selectedDate)
		}
		Keyboard.dismiss()
	}

	const onEndDateChange = (event: any, selectedDate?: Date) => {
		setShowEndDatePicker(false)
		if (selectedDate) {
			setEndDate(selectedDate)
		}
		Keyboard.dismiss()
	}

	const toggleStartDatePicker = () => {
		setShowStartDatePicker((prev) => !prev)
		setShowEndDatePicker(false)
		setShowBudgetCategoryPicker(false)
		Keyboard.dismiss()
	}

	const toggleEndDatePicker = () => {
		setShowEndDatePicker((prev) => !prev)
		setShowStartDatePicker(false)
		setShowBudgetCategoryPicker(false)
		Keyboard.dismiss()
	}

	const toggleCategoryPicker = () => {
		setShowBudgetCategoryPicker((prev) => !prev)
		setShowStartDatePicker(false)
		setShowEndDatePicker(false)
		Keyboard.dismiss()
	}

	const renderBudget = ({ item }: { item: any }) => {
		const category = categories.find(
			(c) => c.category_id === item.category_id
		)

		// Ensure item.allocated_amount and item.spent_amount are numbers for calculation
		const allocatedAmount =
			typeof item.allocated_amount === 'number'
				? item.allocated_amount
				: 0
		const spentAmount =
			typeof item.spent_amount === 'number' ? item.spent_amount : 0
		const remainingAmount = allocatedAmount - spentAmount

		// Handle potential undefined values for display
		const displayAllocatedAmount =
			item.allocated_amount !== undefined
				? allocatedAmount.toFixed(2)
				: 'N/A'
		const displaySpentAmount =
			item.spent_amount !== undefined ? spentAmount.toFixed(2) : 'N/A'
		const displayRemainingAmount =
			item.allocated_amount !== undefined &&
			item.spent_amount !== undefined
				? remainingAmount.toFixed(2)
				: 'N/A'
		const displayBudgetType = item.budget_type || 'N/A'
		const displayCategoryName = category?.name || 'Uncategorized'
		const displayName = item.name || 'Unnamed Budget'
		const displayStartDate = item.start_date
			? new Date(item.start_date).toLocaleDateString()
			: 'N/A'
		const displayEndDate = item.end_date
			? new Date(item.end_date).toLocaleDateString()
			: 'N/A'

		return (
			<TouchableOpacity onPress={() => handleOpenModal(item)}>
				<View
					style={[
						styles.budgetItem,
						{
							backgroundColor: themeColors.card,
							borderColor: themeColors.border,
						},
					]}
				>
					<ThemedText
						style={{
							fontWeight: 'bold',
							fontSize: 16,
							color: themeColors.text,
						}}
					>
						{displayName}
					</ThemedText>
					<ThemedText
						style={{
							color: themeColors.icon,
							marginBottom: 5,
						}}
					>
						Category: {displayCategoryName}
					</ThemedText>
					<ThemedText style={{ color: themeColors.text }}>
						Amount: ${displayAllocatedAmount} ({displayBudgetType})
					</ThemedText>
					<ThemedText style={{ color: themeColors.text }}>
						{item.budget_type === 'income' ? 'Earned' : 'Spent'}: $
						{displaySpentAmount}
					</ThemedText>
					<ThemedText
						style={{
							color:
								item.budget_type === 'income'
									? remainingAmount >= 0
										? 'green'
										: 'red'
									: remainingAmount >= 0
									? 'green'
									: 'red',
							fontWeight: 'bold',
						}}
					>
						Remaining: ${displayRemainingAmount}
					</ThemedText>
					<ThemedText
						style={{
							color: themeColors.icon,
							fontSize: 12,
							marginTop: 5,
						}}
					>
						Period: {displayStartDate} - {displayEndDate}
					</ThemedText>
				</View>
			</TouchableOpacity>
		)
	}

	return (
		<SafeAreaView // Replace View with SafeAreaView
			style={[
				styles.container,
				{ backgroundColor: themeColors.background },
			]}
		>
			<View style={styles.headerContainer}>
				<ThemedText
					style={[styles.headerTitle, { color: themeColors.text }]}
				>
					Budgets
				</ThemedText>
				<TouchableOpacity
					onPress={() => handleOpenModal()}
					style={styles.addButton}
				>
					<Ionicons
						name='add-circle'
						size={30}
						color={themeColors.primary}
					/>
				</TouchableOpacity>
			</View>
			<FlatList
				data={budgets}
				renderItem={renderBudget}
				keyExtractor={
					(item, index) =>
						item?.budget_id?.toString() ?? index.toString() // Changed from item?.id
				} // More robust keyExtractor
				contentContainerStyle={styles.listContentContainer}
				ListEmptyComponent={
					<ThemedText
						style={{
							textAlign: 'center',
							marginTop: 20,
							color: themeColors.text,
						}}
					>
						No budgets found. Add one!
					</ThemedText>
				}
			/>
			<Modal
				animationType='slide'
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => {
					setModalVisible(false)
					setShowStartDatePicker(false)
					setShowEndDatePicker(false)
					setShowBudgetCategoryPicker(false)
				}}
			>
				<ScrollView contentContainerStyle={styles.modalOverlay}>
					<View
						style={[
							styles.modalView,
							{ backgroundColor: themeColors.card },
						]}
					>
						<Text
							style={[
								styles.modalTitle,
								{ color: themeColors.text },
							]}
						>
							{editingBudget ? 'Edit Budget' : 'Add New Budget'}
						</Text>

						<Text
							style={[styles.label, { color: themeColors.text }]}
						>
							Budget Type
						</Text>
						<View style={styles.typeButtonContainer}>
							<TouchableOpacity
								style={[
									styles.typeButton,
									budgetType === 'income'
										? styles.typeButtonActive
										: styles.typeButtonInactive,
									{
										backgroundColor:
											budgetType === 'income'
												? themeColors.primary
												: 'transparent',
										borderColor: themeColors.border,
									},
								]}
								onPress={() => setBudgetType('income')}
							>
								<Text
									style={[
										styles.typeButtonText,
										{
											color:
												budgetType === 'income'
													? themeColors.buttonText
													: themeColors.text,
										},
									]}
								>
									Income
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.typeButton,
									budgetType === 'expense'
										? styles.typeButtonActive
										: styles.typeButtonInactive,
									{
										backgroundColor:
											budgetType === 'expense'
												? themeColors.primary
												: 'transparent',
										borderColor: themeColors.border,
									},
								]}
								onPress={() => setBudgetType('expense')}
							>
								<Text
									style={[
										styles.typeButtonText,
										{
											color:
												budgetType === 'expense'
													? themeColors.buttonText
													: themeColors.text,
										},
									]}
								>
									Expense
								</Text>
							</TouchableOpacity>
						</View>

						<Text
							style={[styles.label, { color: themeColors.text }]}
						>
							Name
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									color: themeColors.text,
									borderColor: themeColors.border,
									backgroundColor:
										themeColors.inputBackground,
								},
							]}
							placeholder='Budget Name'
							placeholderTextColor={themeColors.placeholder}
							value={name}
							onChangeText={setName}
						/>

						<Text
							style={[styles.label, { color: themeColors.text }]}
						>
							Amount
						</Text>
						<TextInput
							style={[
								styles.input,
								{
									color: themeColors.text,
									borderColor: themeColors.border,
									backgroundColor:
										themeColors.inputBackground,
								},
							]}
							placeholder='Amount'
							placeholderTextColor={themeColors.placeholder}
							keyboardType='numeric'
							value={amount}
							onChangeText={setAmount}
						/>

						<Text
							style={[styles.label, { color: themeColors.text }]}
						>
							Category
						</Text>
						<TouchableOpacity
							style={[
								styles.pickerToggleButton,
								{
									borderColor: themeColors.border,
									backgroundColor: 'transparent',
								},
							]}
							onPress={toggleCategoryPicker}
						>
							<Text style={{ color: themeColors.text }}>
								{selectedCategory
									? categories.find(
											(c) =>
												c.category_id ===
												selectedCategory // Changed from c.id
									  )?.name
									: 'Select Category'}
							</Text>
						</TouchableOpacity>
						{showBudgetCategoryPicker && (
							<View
								style={[
									styles.pickerContainer,
									{
										borderColor: themeColors.border,
										backgroundColor:
											themeColors.inputBackground,
									},
								]}
							>
								<Picker
									selectedValue={selectedCategory}
									onValueChange={(itemValue, itemIndex) => {
										console.log(
											`Category Picker Changed: itemValue = ${JSON.stringify(
												itemValue
											)} (type: ${typeof itemValue}), itemIndex = ${itemIndex}`
										)

										let newCategoryValue: number | null =
											null
										if (
											itemValue !== null &&
											itemValue !== undefined
										) {
											if (typeof itemValue === 'number') {
												newCategoryValue = itemValue
											} else if (
												typeof itemValue === 'string'
											) {
												const parsedNum = parseInt(
													itemValue,
													10
												)
												if (!isNaN(parsedNum)) {
													newCategoryValue = parsedNum
												} else {
													console.warn(
														`Received string value that is not a number for category: ${itemValue}`
													)
												}
											} else {
												console.warn(
													`Received unexpected type for category itemValue: ${typeof itemValue}`
												)
											}
										}
										setSelectedCategory(newCategoryValue)
									}}
									style={{ color: themeColors.text }}
									dropdownIconColor={themeColors.text}
								>
									<Picker.Item
										label='Select Category...'
										value={null}
										key='picker-item-placeholder' // Using a descriptive placeholder key
									/>
									{(() => {
										console.log(
											'Categories state before mapping in Picker:',
											JSON.stringify(categories, null, 2)
										)
										const filteredCategories =
											categories.filter(
												(category) =>
													category &&
													category.category_id !=
														null && // Changed from category.id to category.category_id
													category.name != null
											)
										console.log(
											'Filtered categories for Picker:',
											JSON.stringify(
												filteredCategories,
												null,
												2
											)
										)
										return filteredCategories.map(
											(category) => (
												<Picker.Item
													key={`category-item-${category.category_id}`} // Changed from category.id to category.category_id
													label={String(
														category.name
													)}
													value={category.category_id} // Changed from category.id to category.category_id
												/>
											)
										)
									})()}
								</Picker>
							</View>
						)}

						<Text
							style={[styles.label, { color: themeColors.text }]}
						>
							Start Date
						</Text>
						<TouchableOpacity
							style={[
								styles.pickerToggleButton,
								{
									borderColor: themeColors.border,
									backgroundColor: 'transparent',
								},
							]}
							onPress={toggleStartDatePicker}
						>
							<Text style={{ color: themeColors.text }}>
								{startDate.toLocaleDateString()}
							</Text>
						</TouchableOpacity>
						{showStartDatePicker && (
							<DateTimePicker
								value={startDate}
								mode='date'
								display='default'
								onChange={onStartDateChange}
							/>
						)}

						<Text
							style={[styles.label, { color: themeColors.text }]}
						>
							End Date
						</Text>
						<TouchableOpacity
							style={[
								styles.pickerToggleButton,
								{
									borderColor: themeColors.border,
									backgroundColor: 'transparent',
								},
							]}
							onPress={toggleEndDatePicker}
						>
							<Text style={{ color: themeColors.text }}>
								{endDate.toLocaleDateString()}
							</Text>
						</TouchableOpacity>
						{showEndDatePicker && (
							<DateTimePicker
								value={endDate}
								mode='date'
								display='default'
								onChange={onEndDateChange}
							/>
						)}

						<View style={styles.modalButtonContainer}>
							<TouchableOpacity
								style={[
									styles.button,
									styles.saveButton,
									{ backgroundColor: themeColors.primary },
								]}
								onPress={handleSaveBudget}
							>
								<Text
									style={[
										styles.buttonText,
										{ color: themeColors.buttonText },
									]}
								>
									Save
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[
									styles.button,
									styles.cancelButton,
									{ backgroundColor: themeColors.secondary },
								]}
								onPress={() => {
									setModalVisible(false)
									setShowStartDatePicker(false)
									setShowEndDatePicker(false)
									setShowBudgetCategoryPicker(false)
								}}
							>
								<Text
									style={[
										styles.buttonText,
										{ color: themeColors.buttonText },
									]}
								>
									Cancel
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</Modal>
		</SafeAreaView> // End SafeAreaView
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		// padding: 10, // Removed padding to allow header to span full width
	},
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 15, // Adjusted padding
		paddingVertical: 15,
		borderBottomWidth: 1, // Add a border to the bottom of the header
		// borderBottomColor is set dynamically by themeColors.border in the component
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: 'bold',
	},
	addButton: {
		padding: 5,
	},
	listContentContainer: {
		paddingHorizontal: 10, // Add horizontal padding for list items
		paddingBottom: 20,
	},
	budgetItem: {
		padding: 15,
		marginVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		elevation: 3,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	budgetHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 5,
	},
	budgetName: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	budgetCategoryName: {
		fontSize: 14,
		fontStyle: 'italic',
	},
	budgetDetails: {
		fontSize: 14,
		marginTop: 5,
	},
	budgetDates: {
		fontSize: 12,
		color: 'gray',
		marginTop: 5,
	},
	budgetAmounts: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 10,
	},
	amountText: {
		fontSize: 14,
	},
	modalOverlay: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.5)',
	},
	modalView: {
		margin: 20,
		borderRadius: 20,
		padding: 25,
		alignItems: 'stretch',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		width: '90%',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 20,
		textAlign: 'center',
	},
	label: {
		fontSize: 16,
		marginBottom: 8,
		marginTop: 12,
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 15,
		marginBottom: 15,
		fontSize: 16,
	},
	pickerToggleButton: {
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 15,
		justifyContent: 'center',
		marginBottom: 15,
	},
	pickerContainer: {
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 15,
	},
	typeButtonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 20,
	},
	typeButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		borderWidth: 1,
		alignItems: 'center',
		marginHorizontal: 5,
	},
	typeButtonActive: {},
	typeButtonInactive: {},
	typeButtonText: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	modalButtonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 25,
	},
	button: {
		borderRadius: 8,
		paddingVertical: 12,
		paddingHorizontal: 25,
		elevation: 2,
		minWidth: 120,
		alignItems: 'center',
	},
	saveButton: {},
	cancelButton: {},
	buttonText: {
		fontWeight: 'bold',
		fontSize: 16,
	},
})
