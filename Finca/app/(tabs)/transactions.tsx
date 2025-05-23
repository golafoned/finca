import { Ionicons } from '@expo/vector-icons' // For icons
import DateTimePicker from '@react-native-community/datetimepicker' // For date picking
import { Picker } from '@react-native-picker/picker' // For category selection
import { useCallback, useEffect, useState } from 'react'
import {
	ActivityIndicator,
	Alert, // Added
	Button, // Added
	FlatList,
	Keyboard,
	Modal,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet, // Added
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native'
import { ThemedText } from '../../components/ThemedText' // Adjust path as needed
import { API_PORT, YOUR_COMPUTER_IP } from '../../constants/apiConfig' // Adjust path as needed
import { Colors } from '../../constants/Colors' // Adjust path as needed
import { useAuth } from '../../context/AuthContext' // Adjust path as needed
import { useColorScheme } from '../../hooks/useColorScheme' // Adjust path as needed

// Interfaces (should match backend ApiTransaction and ApiCategory)
interface ApiTransaction {
	transaction_id?: number
	user_id?: number
	category_id: number
	amount: string
	type: 'income' | 'expense'
	transaction_date: string // YYYY-MM-DD
	notes?: string
	attachment_url?: string
	category_name?: string
	created_at?: string
	updated_at?: string
}

interface ApiCategory {
	category_id: number
	name: string
	type: 'income' | 'expense'
	user_id?: number | null
}

const TransactionsTabScreen = () => {
	const [transactions, setTransactions] = useState<ApiTransaction[]>([])
	const [categories, setCategories] = useState<ApiCategory[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [modalVisible, setModalVisible] = useState(false)
	const [isEditMode, setIsEditMode] = useState(false)
	const [currentTransaction, setCurrentTransaction] =
		useState<Partial<ApiTransaction> | null>(null)

	// Form state
	const [amount, setAmount] = useState('')
	const [selectedCategoryId, setSelectedCategoryId] = useState<
		number | undefined
	>(undefined)
	const [transactionType, setTransactionType] = useState<
		'income' | 'expense'
	>('expense')
	const [date, setDate] = useState(new Date())
	const [notes, setNotes] = useState('')
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [showCategoryPicker, setShowCategoryPicker] = useState(false) // New state for category picker

	const auth = useAuth()
	const colorScheme = useColorScheme() ?? 'light'
	const themeColors = Colors[colorScheme] // This correctly fetches light/dark theme object

	const API_BASE_URL = `http://${YOUR_COMPUTER_IP}:${API_PORT}`

	// Fetch transactions and categories
	const fetchData = useCallback(async () => {
		if (!auth.userToken) {
			setError('User not authenticated.')
			setIsLoading(false)
			return
		}
		setIsLoading(true)
		setError(null)
		try {
			const [transRes, catRes] = await Promise.all([
				fetch(`${API_BASE_URL}/api/transactions`, {
					headers: { Authorization: `Bearer ${auth.userToken}` },
				}),
				fetch(`${API_BASE_URL}/api/categories`, {
					headers: { Authorization: `Bearer ${auth.userToken}` },
				}),
			])

			if (!transRes.ok) {
				const errorText = await transRes.text()
				console.error(
					'Failed to fetch transactions, status:',
					transRes.status,
					'Response:',
					errorText
				)
				try {
					const errData = JSON.parse(errorText)
					throw new Error(
						errData.message ||
							`Failed to fetch transactions (status ${transRes.status})`
					)
				} catch (parseError) {
					throw new Error(
						`Failed to fetch transactions. Server responded with status ${
							transRes.status
						} and non-JSON body: ${errorText.substring(0, 200)}...`
					)
				}
			}
			if (!catRes.ok) {
				const errorText = await catRes.text()
				console.error(
					'Failed to fetch categories, status:',
					catRes.status,
					'Response:',
					errorText
				)
				try {
					const errData = JSON.parse(errorText)
					throw new Error(
						errData.message ||
							`Failed to fetch categories (status ${catRes.status})`
					)
				} catch (parseError) {
					throw new Error(
						`Failed to fetch categories. Server responded with status ${
							catRes.status
						} and non-JSON body: ${errorText.substring(0, 200)}...`
					)
				}
			}

			const transData: ApiTransaction[] = await transRes.json()
			const catData: ApiCategory[] = await catRes.json()

			setTransactions(transData)
			setCategories(catData)
			if (catData.length > 0 && !selectedCategoryId) {
				// Pre-select first category of 'expense' type if available
				const defaultCategory =
					catData.find((c) => c.type === 'expense') || catData[0]
				setSelectedCategoryId(defaultCategory.category_id)
				setTransactionType(defaultCategory.type)
			}
		} catch (e: any) {
			console.error('Fetch data error:', e)
			setError(e.message || 'Failed to load data.')
		} finally {
			setIsLoading(false)
		}
	}, [auth.userToken, API_BASE_URL])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	const handleOpenModal = (transaction?: ApiTransaction) => {
		if (transaction) {
			setIsEditMode(true)
			setCurrentTransaction(transaction)
			setAmount(transaction.amount.toString())
			setSelectedCategoryId(transaction.category_id)
			setTransactionType(transaction.type)
			setDate(new Date(transaction.transaction_date))
			setNotes(transaction.notes || '')
		} else {
			setIsEditMode(false)
			setCurrentTransaction({}) // Reset to empty object for new transaction
			setAmount('')
			// Reset date to current date for new transactions
			setDate(new Date())
			setNotes('')
			// Set default category based on current transaction type or first available
			let defaultCategory = undefined
			if (Array.isArray(categories)) {
				defaultCategory =
					categories.find((c) => c.type === 'expense') ||
					(categories.length > 0 ? categories[0] : undefined)
			}

			if (defaultCategory) {
				setSelectedCategoryId(defaultCategory.category_id)
			} else {
				setSelectedCategoryId(undefined) // Or handle no categories available
			}
		}
		setModalVisible(true)
	}

	const handleSaveTransaction = async () => {
		if (!selectedCategoryId || !amount || !transactionType || !date) {
			Alert.alert('Error', 'Please fill all required fields.')
			return
		}

		const transactionData: Omit<
			ApiTransaction,
			| 'transaction_id'
			| 'user_id'
			| 'created_at'
			| 'updated_at'
			| 'category_name'
		> = {
			category_id: selectedCategoryId,
			amount: amount,
			type: transactionType,
			transaction_date: date.toISOString().split('T')[0], // YYYY-MM-DD
			notes: notes,
		}

		const url =
			isEditMode && currentTransaction?.transaction_id
				? `${API_BASE_URL}/api/transactions/${currentTransaction.transaction_id}`
				: `${API_BASE_URL}/api/transactions`
		const method = isEditMode ? 'PUT' : 'POST'

		try {
			const response = await fetch(url, {
				method: method,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${auth.userToken}`,
				},
				body: JSON.stringify(transactionData),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(
					errorData.message || 'Failed to save transaction'
				)
			}
			await fetchData() // Refresh data
			setModalVisible(false)
		} catch (e: any) {
			console.error('Save transaction error:', e)
			Alert.alert('Error', e.message || 'Could not save transaction.')
		}
	}

	const handleDeleteTransaction = async (transactionId: number) => {
		Alert.alert(
			'Confirm Delete',
			'Are you sure you want to delete this transaction?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							const response = await fetch(
								`${API_BASE_URL}/api/transactions/${transactionId}`,
								{
									method: 'DELETE',
									headers: {
										Authorization: `Bearer ${auth.userToken}`,
									},
								}
							)
							if (!response.ok) {
								const errorData = await response.json()
								throw new Error(
									errorData.message ||
										'Failed to delete transaction'
								)
							}
							await fetchData() // Refresh data
						} catch (e: any) {
							console.error('Delete transaction error:', e)
							Alert.alert(
								'Error',
								e.message || 'Could not delete transaction.'
							)
						}
					},
				},
			]
		)
	}

	const onDateChange = (event: any, selectedDate?: Date) => {
		if (selectedDate) {
			setDate(selectedDate) // Always update the date if one is selected
		}

		// For Android, the native dialog closes itself after interaction.
		// We need to update our state to reflect this.
		if (Platform.OS === 'android') {
			// event.type could be 'set' (date picked) or 'dismissed' (dialog cancelled)
			setShowDatePicker(false)
		}
		// For iOS (using spinner), we do NOT hide the picker here when a date is changed.
		// It will stay open, and the user will close it using the toggle button.
		// This makes its behavior similar to the category picker.
		// An explicit dismissal event could also hide it if necessary, e.g.:
		// else if (event.type === 'dismissed' && Platform.OS === 'ios') {
		//  setShowDatePicker(false);
		// }
	}

	// Variable to control DateTimePicker display mode, especially for iOS
	const displayMode = Platform.OS === 'ios' ? 'spinner' : 'default'

	const renderTransactionItem = ({ item }: { item: ApiTransaction }) => (
		<View
			style={[
				styles.transactionItem,
				{
					backgroundColor: themeColors.background,
					borderColor: themeColors.icon, // Use theme icon color for border
					shadowColor: themeColors.text,
				},
			]}
		>
			<View style={styles.transactionDetails}>
				<ThemedText
					style={[
						styles.transactionCategoryName,
						{ color: themeColors.text },
					]}
				>
					{item.category_name || 'N/A'}
				</ThemedText>
				{item.notes && (
					<ThemedText
						style={[
							styles.transactionNotes,
							{ color: themeColors.icon }, // Use a less prominent color for notes
						]}
						numberOfLines={1} // Ensure notes don't take too much space
						ellipsizeMode='tail'
					>
						{item.notes}
					</ThemedText>
				)}
				<ThemedText
					style={[
						styles.transactionDate,
						{ color: themeColors.icon }, // Use a less prominent color for date
					]}
				>
					{new Date(item.transaction_date).toLocaleDateString()}
				</ThemedText>
			</View>
			<View style={styles.transactionAmountContainer}>
				<ThemedText
					style={[
						styles.transactionAmount,
						{
							color:
								item.type === 'income'
									? themeColors.success // Use themed success color
									: themeColors.error, // Use themed error color
						},
					]}
				>
					{item.type === 'income' ? '+' : '-'}
					{`$${parseFloat(item.amount).toFixed(2)}`}
				</ThemedText>
				<View style={styles.transactionActions}>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={() => handleOpenModal(item)}
					>
						<Ionicons
							name='pencil-outline'
							size={20}
							color={themeColors.icon}
						/>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.actionButton}
						onPress={() =>
							item.transaction_id &&
							handleDeleteTransaction(item.transaction_id)
						}
					>
						<Ionicons
							name='trash-outline'
							size={20}
							color={themeColors.error} // Use themed error color for delete
						/>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	)

	if (isLoading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator size='large' color={themeColors.tint} />
				<ThemedText>Loading transactions...</ThemedText>
			</View>
		)
	}

	if (error) {
		return (
			<View style={styles.centered}>
				<ThemedText style={{ color: '#D32F2F' }}>
					Error: {error}
				</ThemedText>
				<Button
					title='Retry'
					onPress={fetchData}
					color={themeColors.tint}
				/>
			</View>
		)
	}

	return (
		<SafeAreaView
			style={[
				styles.container,
				{ backgroundColor: themeColors.background },
			]}
		>
			{/* Header */}
			<View
				style={[
					styles.headerContainer,
					{ borderBottomColor: themeColors.icon },
				]}
			>
				<ThemedText type='title' style={{ color: themeColors.text }}>
					Transactions
				</ThemedText>
				<TouchableOpacity
					style={[
						styles.addButton,
						{ backgroundColor: themeColors.tint },
					]}
					onPress={() => handleOpenModal()}
				>
					<Ionicons
						name='add-circle-outline'
						size={22}
						color={themeColors.background} // Changed from themeColors.text to themeColors.background for better contrast on tint
					/>
					<ThemedText
						style={[
							styles.addButtonText,
							{ color: themeColors.background }, // Changed from themeColors.text
						]}
					>
						Add New
					</ThemedText>
				</TouchableOpacity>
			</View>

			{transactions.length === 0 && !isLoading ? (
				<View style={styles.centered}>
					<ThemedText style={{ color: themeColors.text }}>
						No transactions yet. Add one to get started!
					</ThemedText>
				</View>
			) : (
				<FlatList
					data={transactions}
					renderItem={renderTransactionItem}
					keyExtractor={(item: ApiTransaction) =>
						item.transaction_id!.toString()
					} // Added ApiTransaction type for item
					contentContainerStyle={styles.listContentContainer}
				/>
			)}

			{/* Add/Edit Transaction Modal */}
			<Modal
				animationType='slide'
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => {
					setModalVisible(!modalVisible)
					// Reset date picker visibility when modal closes
					if (showDatePicker) {
						// Simplified condition
						setShowDatePicker(false)
					}
				}}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<View style={styles.modalOverlay}>
						<View
							style={[
								styles.modalContent,
								{
									backgroundColor: themeColors.background,
								},
							]}
						>
							<ScrollView
								keyboardShouldPersistTaps='handled'
								style={{ flexGrow: 1 }} // Changed from flex: 1 to ensure it grows
								contentContainerStyle={{
									paddingBottom: 20,
								}}
							>
								<ThemedText
									type='subtitle'
									style={[
										styles.modalTitle,
										{ color: themeColors.text },
									]}
								>
									{isEditMode
										? 'Edit Transaction'
										: 'Add New Transaction'}
								</ThemedText>

								{/* Amount Input */}
								<ThemedText style={styles.label}>
									Amount
								</ThemedText>
								<TextInput
									style={[
										styles.input,
										{
											color: themeColors.text,
											borderColor: themeColors.icon,
										},
									]}
									placeholder='Enter amount'
									placeholderTextColor={themeColors.icon}
									keyboardType='numeric'
									value={amount}
									onChangeText={setAmount}
								/>

								{/* Transaction Type Buttons */}
								<ThemedText style={styles.label}>
									Type
								</ThemedText>
								<View style={styles.typeButtonContainer}>
									<TouchableOpacity
										style={[
											styles.typeButton,
											transactionType === 'expense'
												? styles.typeButtonActive // This style object in StyleSheet will be modified
												: styles.typeButtonInactive,
											transactionType === 'expense' && {
												backgroundColor:
													themeColors.tint,
												borderColor: themeColors.tint, // Added borderColor here
											},
											transactionType !== 'expense' && {
												borderColor: themeColors.icon,
											},
										]}
										onPress={() => {
											setTransactionType('expense')
											const defaultCategoryForType =
												categories.find(
													(c) => c.type === 'expense'
												)
											if (defaultCategoryForType) {
												setSelectedCategoryId(
													defaultCategoryForType.category_id
												)
											}
										}}
									>
										<ThemedText
											style={[
												styles.typeButtonText,
												transactionType === 'expense'
													? {
															color: themeColors.background,
													  } // Directly apply active color
													: {
															color: themeColors.text,
													  },
											]}
										>
											Expense
										</ThemedText>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.typeButton,
											transactionType === 'income'
												? styles.typeButtonActive // This style object in StyleSheet will be modified
												: styles.typeButtonInactive,
											transactionType === 'income' && {
												backgroundColor:
													themeColors.tint,
												borderColor: themeColors.tint, // Added borderColor here
											},
											transactionType !== 'income' && {
												borderColor: themeColors.icon,
											},
										]}
										onPress={() => {
											setTransactionType('income')
											const defaultCategoryForType =
												categories.find(
													(c) => c.type === 'income'
												)
											if (defaultCategoryForType) {
												setSelectedCategoryId(
													defaultCategoryForType.category_id
												)
											}
										}}
									>
										<ThemedText
											style={[
												styles.typeButtonText,
												transactionType === 'income'
													? {
															color: themeColors.background,
													  } // Directly apply active color
													: {
															color: themeColors.text,
													  },
											]}
										>
											Income
										</ThemedText>
									</TouchableOpacity>
								</View>

								{/* Category Picker - Collapsible */}
								<ThemedText style={styles.label}>
									Category
								</ThemedText>
								<TouchableOpacity
									style={[
										styles.pickerToggleButton,
										{ borderColor: themeColors.icon },
									]}
									onPress={() =>
										setShowCategoryPicker(
											!showCategoryPicker
										)
									}
								>
									<ThemedText
										style={{ color: themeColors.text }}
									>
										{selectedCategoryId
											? Array.isArray(categories)
												? categories.find(
														(c) =>
															c.category_id ===
															selectedCategoryId
												  )?.name
												: 'Loading...'
											: 'Select Category'}
									</ThemedText>
									<Ionicons
										name={
											showCategoryPicker
												? 'chevron-up-outline'
												: 'chevron-down-outline'
										}
										size={20}
										color={themeColors.icon}
									/>
								</TouchableOpacity>

								{showCategoryPicker &&
									Array.isArray(categories) &&
									categories.filter(
										(cat) => cat.type === transactionType
									).length > 0 && (
										<View
											style={[
												styles.pickerContainer,
												{
													borderColor:
														themeColors.icon,
												},
											]}
										>
											<Picker
												selectedValue={
													selectedCategoryId
												}
												onValueChange={(itemValue) => {
													setSelectedCategoryId(
														itemValue
													)
													// setShowCategoryPicker(false); // Optionally hide after selection
												}}
												style={[
													styles.picker,
													{
														color: themeColors.text,
													},
												]}
												enabled={
													Array.isArray(categories) &&
													categories.length > 0
												}
												dropdownIconColor={
													themeColors.icon
												}
											>
												{categories // Already checked Array.isArray(categories) and filtered for type and length > 0
													.filter(
														(cat) =>
															cat.type ===
															transactionType
													)
													.map((cat) => (
														<Picker.Item
															key={
																cat.category_id
															}
															label={cat.name}
															value={
																cat.category_id
															}
														/>
													))}
											</Picker>
										</View>
									)}
								{showCategoryPicker &&
									(!Array.isArray(categories) ||
										categories.filter(
											(cat) =>
												cat.type === transactionType
										).length === 0) && (
										<ThemedText
											style={{
												color: themeColors.icon,
												fontSize: 12,
												marginBottom: 10,
												marginTop: 5, // Added some top margin for spacing
											}}
										>
											No categories available for selected
											type. Please create one in Settings.
										</ThemedText>
									)}

								{/* Date Picker */}
								<ThemedText style={styles.label}>
									Date
								</ThemedText>
								<TouchableOpacity
									onPress={() =>
										setShowDatePicker(!showDatePicker)
									} // Changed to toggle visibility
									style={[
										styles.datePickerButton, // Defined in StyleSheet
										{ borderColor: themeColors.icon },
									]}
								>
									<ThemedText
										style={{ color: themeColors.text }}
									>
										{date.toLocaleDateString()}
									</ThemedText>
									<Ionicons
										name='calendar-outline'
										size={20}
										color={themeColors.icon}
									/>
								</TouchableOpacity>

								{showDatePicker && (
									<DateTimePicker
										value={date}
										mode='date'
										display={displayMode}
										onChange={onDateChange}
									/>
								)}

								{/* Notes Input */}
								<ThemedText style={styles.label}>
									Notes (Optional)
								</ThemedText>
								<TextInput
									style={[
										styles.input,
										styles.notesInput, // Defined in StyleSheet
										{
											color: themeColors.text,
											borderColor: themeColors.icon,
										},
									]}
									placeholder='Enter notes'
									placeholderTextColor={themeColors.icon}
									multiline
									numberOfLines={3}
									value={notes}
									onChangeText={setNotes}
								/>

								{/* Action Buttons */}
								<View style={styles.modalActions}>
									<TouchableOpacity
										style={[
											styles.modalButton, // Defined in StyleSheet
											styles.saveButton,
											{
												backgroundColor:
													themeColors.tint,
											},
										]}
										onPress={handleSaveTransaction}
									>
										<Ionicons
											name='save-outline'
											size={18}
											color={themeColors.background}
										/>
										<ThemedText
											style={[
												styles.modalButtonText, // Defined in StyleSheet
												{
													color: themeColors.background,
												},
											]}
										>
											Save
										</ThemedText>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.modalButton, // Defined in StyleSheet
											styles.cancelButton,
											{
												backgroundColor:
													themeColors.icon,
											},
										]}
										onPress={() => setModalVisible(false)}
									>
										<Ionicons
											name='close-circle-outline'
											size={18}
											color={themeColors.background}
										/>
										<ThemedText
											style={[
												styles.modalButtonText, // Defined in StyleSheet
												{
													color: themeColors.background,
												},
											]}
										>
											Cancel
										</ThemedText>
									</TouchableOpacity>
								</View>
							</ScrollView>
						</View>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingTop: Platform.OS === 'android' ? 25 : 10, // Keep platform-specific padding
		paddingBottom: 10,
		borderBottomWidth: 1,
		// borderBottomColor will be applied inline using themeColors.icon
	},
	headerTitle: {
		// fontSize: 24, // Handled by ThemedText type="title"
		// fontWeight: 'bold', // Handled by ThemedText type="title"
	},
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
	},
	addButtonText: {
		marginLeft: 6,
		fontSize: 16,
		fontWeight: '600',
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	listContentContainer: {
		padding: 16,
		paddingBottom: 80, // Add padding to bottom to avoid overlap with potential tab bar
	},
	transactionItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center', // Align items vertically
		padding: 15,
		borderRadius: 10, // Slightly more rounded corners
		marginBottom: 12, // Increased margin
		elevation: 3, // Slightly increased elevation for a bit more depth
		shadowOffset: { width: 0, height: 2 }, // Adjusted shadow
		shadowOpacity: 0.15, // Adjusted shadow
		shadowRadius: 3,
		borderWidth: 1, // Add a subtle border
		// borderColor will be set dynamically based on theme
	},
	transactionDetails: {
		flex: 1,
		marginRight: 10, // Add some space between details and amount/actions
	},
	transactionCategoryName: {
		fontSize: 17, // Slightly larger category name
		fontWeight: 'bold',
		marginBottom: 5, // Adjusted spacing
	},
	transactionNotes: {
		fontSize: 14,
		marginBottom: 5, // Adjusted spacing
		fontStyle: 'italic', // Italicize notes for distinction
	},
	transactionDate: {
		fontSize: 12,
	},
	transactionAmountContainer: {
		alignItems: 'flex-end',
		// justifyContent: 'space-between', // Removed as actions are now below amount
	},
	transactionAmount: {
		fontSize: 19, // Slightly larger amount
		fontWeight: 'bold',
		marginBottom: 8, // Space between amount and actions
	},
	transactionActions: {
		flexDirection: 'row',
		marginTop: 4, // Add a little space above action buttons
	},
	actionButton: {
		marginLeft: 18, // Increased spacing between action buttons
		padding: 6, // Slightly larger touch area
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.6)', // Darken overlay slightly
	},
	modalContent: {
		width: '90%',
		maxHeight: '85%', // Set a max height for the modal
		padding: 20,
		borderRadius: 12, // More rounded corners for modal
		elevation: 10, // Higher elevation for modal
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
	},
	modalTitle: {
		marginBottom: 25, // Increased margin below title
		textAlign: 'center',
		fontSize: 22, // Larger modal title
		fontWeight: 'bold',
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderRadius: 8, // More rounded inputs
		paddingHorizontal: 15, // Increased padding
		paddingVertical: 10,
		fontSize: 16,
	},
	textArea: {
		height: 100,
		textAlignVertical: 'top',
		paddingTop: 15, // Increased padding
	},
	label: {
		fontSize: 16,
		fontWeight: '600', // Bolder labels
		marginBottom: 8, // Increased margin
		// color will be applied inline using themeColors.text
	},
	pickerContainer: {
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 15,
		justifyContent: 'center',
	},
	picker: {
		// height: 50, // Removed to allow picker to expand and push content
	},
	datePickerButton: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 15,
		paddingVertical: 15,
		// borderWidth: 1, // Duplicate removed
		// borderRadius: 8, // Duplicate removed
		marginBottom: 15,
		borderWidth: 1, // Added back for pickerToggleButton and datePickerButton
		borderRadius: 8, // Added back for pickerToggleButton and datePickerButton
	},
	modalActions: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginTop: 20,
	},
	modalButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
		minWidth: 120, // Give buttons a minimum width
		justifyContent: 'center',
	},
	modalButtonText: {
		marginLeft: 8,
		fontSize: 16,
		fontWeight: 'bold',
	},
	saveButton: {
		// Specific styles for save button if needed, e.g., marginRight: 10
	},
	cancelButton: {
		// flex: 1, // Removed to allow buttons to size based on content or minWidth
	},
	notesInput: {
		height: 80, // For multiline
		textAlignVertical: 'top', // For multiline
	},
	typeButtonContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 15,
	},
	typeButton: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 8,
		borderWidth: 1,
		alignItems: 'center',
		justifyContent: 'center',
		marginHorizontal: 5,
	},
	typeButtonActive: {
		// All theme-dependent styles (backgroundColor, borderColor) are applied inline in the JSX.
		// This object can be empty or contain only theme-independent styles if any.
	},
	typeButtonInactive: {
		backgroundColor: 'transparent',
		// borderColor is set inline using themeColors.icon in the JSX
	},
	typeButtonText: {
		fontWeight: 'bold',
		fontSize: 16,
	},
	typeButtonTextActive: {
		// All theme-dependent styles (color) are applied inline in the JSX.
		// This object can be empty or contain only theme-independent styles if any.
	},
	pickerToggleButton: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 15,
		paddingVertical: 15,
		borderWidth: 1,
		borderRadius: 8,
		marginBottom: 10, // Space before the actual picker if shown
	},
})

export default TransactionsTabScreen

// Removed commented-out dynamic style assignments as they are handled inline now.
