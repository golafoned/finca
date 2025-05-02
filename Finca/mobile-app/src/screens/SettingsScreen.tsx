import React, { useState } from 'react'
import { Button, StyleSheet, Switch, Text, TextInput, View } from 'react-native'

const SettingsScreen = () => {
	// State for settings values
	const [userName, setUserName] = useState('Поточний Користувач') // Placeholder
	const [userEmail, setUserEmail] = useState('user@example.com') // Placeholder
	// Add state for profile picture URI if needed
	const [transactionReminders, setTransactionReminders] = useState(false)
	const [budgetAlerts, setBudgetAlerts] = useState(true) // Example notification setting

	// Placeholder functions
	const handleSaveChanges = () => {
		console.log('Saving profile changes:', { userName, userEmail })
		// Call API to update profile
	}
	const handleChangePassword = () => {
		/* Navigate to Change Password Screen or show modal */
		console.log('Change password action')
	}
	const handleSetupSecurity = () => {
		/* Navigate to Biometrics/2FA setup screen */
		console.log('Setup security action')
	}
	const handleChangeCurrency = () => {
		/* Show currency selection modal */
		console.log('Change currency action')
	}
	const handleChangeTheme = () => {
		/* Show theme selection modal (Light/Dark/System) */
		console.log('Change theme action')
	}
	const handleChangeLanguage = () => {
		/* Show language selection modal */
		console.log('Change language action')
	}
	const handleLogout = () => {
		/* Clear user token, navigate to AuthNavigator */
		console.log('Logout action')
	}

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Налаштування</Text>

			{/* Profile Management Section */}
			<Text style={styles.sectionTitle}>Профіль</Text>
			{/* Add Image component for profile picture */}
			<TextInput
				style={styles.input}
				value={userName}
				onChangeText={setUserName}
				placeholder="Ім'я"
			/>
			<TextInput
				style={styles.input}
				value={userEmail}
				onChangeText={setUserEmail}
				placeholder='Email'
				keyboardType='email-address'
				editable={false} // Typically email is not editable directly
			/>
			<Button
				title='Зберегти зміни профілю'
				onPress={handleSaveChanges}
			/>

			{/* Notification Settings Section */}
			<Text style={styles.sectionTitle}>Сповіщення</Text>
			<View style={styles.switchContainer}>
				<Text>Нагадування про транзакції</Text>
				<Switch
					value={transactionReminders}
					onValueChange={setTransactionReminders}
				/>
			</View>
			<View style={styles.switchContainer}>
				<Text>Попередження про бюджет</Text>
				<Switch value={budgetAlerts} onValueChange={setBudgetAlerts} />
			</View>

			{/* Security Section */}
			<Text style={styles.sectionTitle}>Безпека</Text>
			<Button title='Змінити пароль' onPress={handleChangePassword} />
			<Button
				title='Налаштувати біометрію/2FA'
				onPress={handleSetupSecurity}
			/>

			{/* App Settings Section */}
			<Text style={styles.sectionTitle}>Додаток</Text>
			<Button title='Валюта (USD)' onPress={handleChangeCurrency} />
			<Button title='Тема (Світла)' onPress={handleChangeTheme} />
			<Button title='Мова (Українська)' onPress={handleChangeLanguage} />

			{/* Logout Button */}
			<View style={styles.logoutButtonContainer}>
				<Button title='Вийти' color='red' onPress={handleLogout} />
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
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginTop: 20,
		marginBottom: 10,
	},
	input: {
		height: 40,
		borderColor: 'gray',
		borderWidth: 1,
		borderRadius: 5,
		paddingHorizontal: 10,
		marginBottom: 10,
	},
	switchContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
	},
	logoutButtonContainer: {
		marginTop: 30,
	},
	// Add other styles as needed
})

export default SettingsScreen
