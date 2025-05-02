import React, { useState } from 'react'
import { Button, StyleSheet, Text, TextInput, View } from 'react-native'
// Import necessary pickers, e.g.:
// import DatePicker from 'react-native-date-picker';
// import DropDownPicker from 'react-native-dropdown-picker';
// import DocumentPicker from 'react-native-document-picker'; // For file attachment

const AddTransactionScreen = () => {
	// State for form fields
	const [transactionType, setTransactionType] = useState<
		'income' | 'expense'
	>('expense')
	const [amount, setAmount] = useState('')
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [selectedCategory, setSelectedCategory] = useState<string | null>(
		null
	)
	const [notes, setNotes] = useState('')
	const [attachment, setAttachment] = useState<any>(null) // State for attached file info

	// Placeholder functions
	const handleSaveTransaction = () => {
		// Validate input
		// Prepare data object
		const transactionData = {
			type: transactionType,
			amount: parseFloat(amount),
			date: selectedDate.toISOString().split('T')[0], // Format date as YYYY-MM-DD
			category: selectedCategory,
			notes: notes,
			attachment: attachment, // Include attachment info if any
		}
		console.log('Saving transaction:', transactionData)
		// Call API or save to local storage
		// Navigate back or show success message
	}

	const handleSelectFile = async () => {
		console.log('Select file action triggered')
		// try {
		//   const res = await DocumentPicker.pick({
		//     type: [DocumentPicker.types.images, DocumentPicker.types.pdf], // Example types
		//   });
		//   console.log('Selected file:', res);
		//   setAttachment(res); // Store file info (URI, name, type, etc.)
		// } catch (err) {
		//   if (DocumentPicker.isCancel(err)) {
		//     // User cancelled the picker
		//   } else {
		//     console.error('Error picking file:', err);
		//   }
		// }
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Додати транзакцію</Text>

			{/* Type Selector (Income/Expense) */}
			<View style={styles.typeSelector}>
				<Button
					title='Витрата'
					onPress={() => setTransactionType('expense')}
					color={transactionType === 'expense' ? 'red' : 'grey'}
				/>
				<Button
					title='Дохід'
					onPress={() => setTransactionType('income')}
					color={transactionType === 'income' ? 'green' : 'grey'}
				/>
				{/* Consider using SegmentedControl or Radio buttons for better UX */}
			</View>

			{/* Amount Input */}
			<TextInput
				style={styles.input}
				placeholder='Сума'
				keyboardType='numeric'
				value={amount}
				onChangeText={setAmount}
			/>

			{/* Date Picker */}
			<View style={styles.pickerContainer}>
				<Text>Дата: {selectedDate.toLocaleDateString()}</Text>
				{/* Add Date Picker Component Here */}
				{/* Example: <DatePicker date={selectedDate} onDateChange={setSelectedDate} mode="date" /> */}
				<Button
					title='Обрати дату'
					onPress={() => {
						/* Show Date Picker Modal */
					}}
				/>
			</View>

			{/* Category Picker */}
			<View style={styles.pickerContainer}>
				<Text>Категорія: {selectedCategory || 'Не обрано'}</Text>
				{/* Add DropDown Picker Component Here */}
				{/* Example: <DropDownPicker items={categories} setValue={setSelectedCategory} ... /> */}
				<Button
					title='Обрати категорію'
					onPress={() => {
						/* Show Category Picker Modal */
					}}
				/>
			</View>

			{/* Notes Input */}
			<TextInput
				style={[styles.input, styles.notesInput]}
				placeholder="Нотатки (необов'язково)"
				value={notes}
				onChangeText={setNotes}
				multiline
			/>

			{/* File Attachment */}
			<View style={styles.attachmentContainer}>
				<Button title='Прикріпити файл' onPress={handleSelectFile} />
				{attachment && (
					<Text>Прикріплено: {/* Display attachment name */}</Text>
				)}
			</View>

			{/* Save Button */}
			<Button title='Зберегти' onPress={handleSaveTransaction} />
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
		textAlign: 'center',
	},
	typeSelector: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		marginBottom: 15,
	},
	input: {
		height: 40,
		borderColor: 'gray',
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginBottom: 15,
	},
	notesInput: {
		height: 80,
		textAlignVertical: 'top', // Align text to top for multiline
	},
	pickerContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 15,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	attachmentContainer: {
		marginBottom: 20,
		alignItems: 'center',
	},
})

export default AddTransactionScreen
