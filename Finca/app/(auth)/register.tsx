import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
	Alert,
	Button,
	Platform,
	StyleSheet,
	TextInput,
	View,
} from 'react-native' // Import Platform

// --- Define API URL ---
// Determine the base URL based on the platform
// --- !!! ВАЖЛИВО: ЗАМІНІТЬ ЦЕ НА ВАШУ ЛОКАЛЬНУ IP-АДРЕСУ !!! ---
// Знайдіть IP-адресу вашого комп'ютера (ipconfig/ifconfig)
// Переконайтеся, що ваш iPhone та комп'ютер знаходяться в одній Wi-Fi мережі.
const YOUR_COMPUTER_IP = '172.16.198.76' // <--- ЗАМІНІТЬ ЦЕ ЗНАЧЕННЯ!
// ------------------------------------------------------------------

const getApiUrl = () => {
	const port = 3001 // Порт вашого бекенд сервера

	if (Platform.OS === 'web') {
		// Для веб-версії відносний шлях або проксі
		return '/api'
	} else if (Platform.OS === 'android') {
		// Використовуйте 10.0.2.2 для емулятора Android
		// Для фізичного пристрою Android використовуйте YOUR_COMPUTER_IP
		// return `http://10.0.2.2:${port}/api`; // Для емулятора
		return `http://${YOUR_COMPUTER_IP}:${port}/api` // Для фізичного пристрою Android
	} else {
		// iOS та інші
		// Використовуйте localhost для симулятора iOS
		// Для фізичного пристрою iOS використовуйте YOUR_COMPUTER_IP
		// return `http://localhost:${port}/api`; // Для симулятора
		return `http://${YOUR_COMPUTER_IP}:${port}/api` // Для фізичного пристрою iOS
	}
}

const API_URL = getApiUrl()

// --- API Call Function ---
async function callRegisterApi(
	name: string | null,
	email: string,
	password: string
) {
	const response = await fetch(`${API_URL}/auth/register`, {
		// Use the defined API_URL
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, email, password }),
	})
	const responseBody = await response.json() // Always try to parse JSON
	if (!response.ok) {
		// Use message from backend response if available, otherwise use default
		throw new Error(
			responseBody.message || `HTTP error! status: ${response.status}`
		)
	}
	return responseBody // Contains { message: '...', user: {...} } on success
}

export default function RegisterScreen() {
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const router = useRouter()
	// const { signUp } = useAuth(); // Example using context

	const handleRegister = async () => {
		if (password !== confirmPassword) {
			Alert.alert('Помилка', 'Паролі не співпадають.')
			return
		}
		console.log('Attempting registration for:', email)

		try {
			// --- Replace Placeholder Logic with API Call ---
			console.log(
				`Calling registration API at ${API_URL}/auth/register...` // Log the actual URL being used
			)
			const result = await callRegisterApi(name || null, email, password) // Pass name correctly
			console.log('Registration API successful:', result)
			Alert.alert(
				'Успіх',
				result.message ||
					'Реєстрація пройшла успішно! Тепер ви можете увійти.'
			)
			router.replace('/(auth)/login') // Redirect to login after successful registration
			// --- End API Call ---
		} catch (error: any) {
			console.error('Registration error:', error)
			// Add more specific error logging if possible
			if (error.message.includes('Network request failed')) {
				Alert.alert(
					'Помилка мережі',
					`Не вдалося підключитися до сервера за адресою ${API_URL}. Перевірте IP-адресу (${YOUR_COMPUTER_IP}), чи запущено сервер, чи пристрої в одній мережі, та налаштування брандмауера.`
				)
			} else {
				Alert.alert(
					'Помилка реєстрації',
					error.message || 'Під час реєстрації сталася помилка.' // Show backend error message if available
				)
			}
		}
	}

	return (
		<ThemedView style={styles.container}>
			<ThemedText type='title'>Реєстрація</ThemedText>
			<TextInput
				style={styles.input}
				placeholder="Ім'я (необов'язково)" // Clarify optional
				value={name}
				onChangeText={setName}
				autoCapitalize='words'
			/>
			<TextInput
				style={styles.input}
				placeholder='Email'
				value={email}
				onChangeText={setEmail}
				keyboardType='email-address'
				autoCapitalize='none'
			/>
			<TextInput
				style={styles.input}
				placeholder='Пароль'
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<TextInput
				style={styles.input}
				placeholder='Підтвердіть Пароль'
				value={confirmPassword}
				onChangeText={setConfirmPassword}
				secureTextEntry
			/>
			<Button title='Зареєструватися' onPress={handleRegister} />
			<View style={styles.linkContainer}>
				<Link href='/(auth)/login'>
					<ThemedText type='link'>
						Вже маєте акаунт? Увійти
					</ThemedText>
				</Link>
			</View>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
	},
	input: {
		height: 40,
		width: '100%',
		borderColor: 'gray',
		borderWidth: 1,
		borderRadius: 5,
		marginBottom: 15,
		paddingHorizontal: 10,
		backgroundColor: 'white', // Ensure input is visible
	},
	linkContainer: {
		marginTop: 20,
		alignItems: 'center',
	},
})
