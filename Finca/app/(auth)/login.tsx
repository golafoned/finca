import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { API_PORT, YOUR_COMPUTER_IP } from '@/constants/apiConfig'
import { useAuth } from '@/context/AuthContext' // Import useAuth
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
// Reuse the same logic as in register.tsx
// --- !!! ВАЖЛИВО: ЗАМІНІТЬ ЦЕ НА ВАШУ ЛОКАЛЬНУ IP-АДРЕСУ !!! ---
// const YOUR_COMPUTER_IP = '192.168.0.101' // <--- ПЕРЕВІРТЕ/ЗАМІНІТЬ ЦЕ ЗНАЧЕННЯ!
// ------------------------------------------------------------------

const getApiUrl = () => {
	const port = API_PORT // Порт вашого бекенд сервера

	if (Platform.OS === 'web') {
		return '/api'
	} else if (Platform.OS === 'android') {
		// return `http://10.0.2.2:${port}/api`; // Для емулятора
		return `http://${YOUR_COMPUTER_IP}:${port}/api` // Для фізичного пристрою Android
	} else {
		// iOS та інші
		// return `http://localhost:${port}/api`; // Для симулятора
		return `http://${YOUR_COMPUTER_IP}:${port}/api` // Для фізичного пристрою iOS
	}
}

const API_URL = getApiUrl()

// --- API Call Function ---
async function callLoginApi(email: string, password: string) {
	const response = await fetch(`${API_URL}/auth/login`, {
		// Use the defined API_URL
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
	})
	const responseBody = await response.json() // Always try to parse JSON
	if (!response.ok) {
		// Use message from backend response if available, otherwise use default
		throw new Error(
			responseBody.message || `HTTP error! status: ${response.status}`
		)
	}
	return responseBody // Should return { message: '...', user: {...}, token: "..." } on success
}

export default function LoginScreen() {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const router = useRouter() // Keep router if needed for other navigation, though auth handles redirect
	const { signIn } = useAuth() // Get signIn from context

	const handleLogin = async () => {
		console.log('Attempting login with:', email)
		try {
			// --- Replace Placeholder Logic with API Call ---
			console.log(`Calling login API at ${API_URL}/auth/login...`)
			const loginResponse = await callLoginApi(email, password)

			if (
				loginResponse &&
				loginResponse.token &&
				loginResponse.user &&
				loginResponse.user.user_id // Changed from loginResponse.user.id
			) {
				console.log('Login API successful, received token and user ID.')
				await signIn(loginResponse.token, loginResponse.user.user_id) // Changed from loginResponse.user.id
				// Navigation should happen automatically via the effect in _layout.tsx
				// You might not need router.replace here if the context handles it.
			} else {
				// This case might not happen if API throws error on failure, but good for robustness
				// The backend should return 401 which is handled in the catch block
				console.warn(
					'Login response did not contain a token:',
					loginResponse
				)
				Alert.alert(
					'Помилка входу',
					'Не вдалося отримати токен автентифікації.'
				)
			}
			// --- End API Call ---

			// --- Placeholder Logic (REMOVE or COMMENT OUT) ---
			// if (email === 'test@test.com' && password === 'password') {
			// 	console.log('Placeholder Login successful')
			// 	const fakeToken = 'fake-jwt-token-from-placeholder'
			// 	await signIn(fakeToken)
			// } else {
			// 	Alert.alert('Login Failed', 'Invalid credentials (Placeholder)')
			// }
			// --- End Placeholder Logic ---
		} catch (error: any) {
			console.error('Login error:', error)
			if (error.message.includes('Network request failed')) {
				Alert.alert(
					'Помилка мережі',
					`Не вдалося підключитися до сервера за адресою ${API_URL}. Перевірте IP-адресу (${YOUR_COMPUTER_IP}), чи запущено сервер, чи пристрої в одній мережі, та налаштування брандмауера.`
				)
			} else if (error.message.includes('Invalid email or password')) {
				// Handle specific 401 error message from backend
				Alert.alert('Помилка входу', 'Неправильний email або пароль.')
			} else {
				Alert.alert(
					'Помилка входу',
					error.message || 'Під час входу сталася помилка.' // Show backend error message if available
				)
			}
		}
	}

	return (
		<ThemedView style={styles.container}>
			<ThemedText type='title'>Вхід</ThemedText>
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
			<Button title='Увійти' onPress={handleLogin} />
			<View style={styles.linkContainer}>
				<Link href='/(auth)/register'>
					<ThemedText type='link'>
						Немає акаунту? Зареєструватися
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
		backgroundColor: 'white', // Ensure input is visible in dark mode too
	},
	linkContainer: {
		marginTop: 20,
		alignItems: 'center',
	},
})
