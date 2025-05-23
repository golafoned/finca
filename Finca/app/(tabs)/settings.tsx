import React, { useCallback, useEffect, useState } from 'react'
import {
	ActivityIndicator,
	Alert,
	Button,
	ScrollView,
	StyleSheet,
	Switch,
	TextInput,
	View,
} from 'react-native'

import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { API_PORT, YOUR_COMPUTER_IP } from '@/constants/apiConfig'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { useColorScheme } from '@/hooks/useColorScheme'

interface UserSettings {
	name: string
	email: string
	notifications_enabled: boolean
	default_currency: string
}

export default function SettingsTabScreen() {
	const { userToken, signOut } = useAuth()
	const colorScheme = useColorScheme() ?? 'light'
	const themeColors = Colors[colorScheme]
	const API_BASE_URL = `http://${YOUR_COMPUTER_IP}:${API_PORT}`

	const [settings, setSettings] = useState<Partial<UserSettings>>({})
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchSettings = useCallback(async () => {
		if (!userToken) return
		setIsLoading(true)
		setError(null)
		try {
			const response = await fetch(`${API_BASE_URL}/api/settings`, {
				headers: { Authorization: `Bearer ${userToken}` },
			})
			if (!response.ok) {
				const errData = await response.json()
				throw new Error(
					errData.message || 'Не вдалося завантажити налаштування'
				)
			}
			const data: UserSettings = await response.json()
			setSettings(data)
		} catch (e: any) {
			setError(e.message)
			console.error('Не вдалося завантажити налаштування:', e)
		} finally {
			setIsLoading(false)
		}
	}, [userToken, API_BASE_URL])

	useEffect(() => {
		fetchSettings()
	}, [fetchSettings])

	const handleLogout = async () => {
		console.log('Запит на вихід з системи')
		await signOut()
	}

	const handleSaveChanges = async () => {
		if (!userToken) return
		setIsSaving(true)
		setError(null)
		try {
			const response = await fetch(`${API_BASE_URL}/api/settings`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${userToken}`,
				},
				body: JSON.stringify(settings),
			})
			if (!response.ok) {
				const errData = await response.json()
				throw new Error(
					errData.message || 'Не вдалося зберегти налаштування'
				)
			}
			Alert.alert('Успіх', 'Налаштування успішно збережено!')
			const updatedSettings = await response.json()
			setSettings(updatedSettings.settings) // Припускаємо, що сервер повертає { settings: UserSettings }
		} catch (e: any) {
			setError(e.message)
			Alert.alert(
				'Помилка',
				e.message || 'Не вдалося зберегти налаштування.'
			)
			console.error('Не вдалося зберегти налаштування:', e)
		} finally {
			setIsSaving(false)
		}
	}

	const handleInputChange = (key: keyof UserSettings, value: any) => {
		setSettings((prev) => ({ ...prev, [key]: value }))
	}

	if (isLoading) {
		return (
			<ThemedView style={styles.centeredContainer}>
				<ActivityIndicator size='large' color={themeColors.tint} />
				<ThemedText style={{ marginTop: 10 }}>
					Завантаження налаштувань...
				</ThemedText>
			</ThemedView>
		)
	}

	return (
		<ThemedView style={styles.outerContainer}>
			<ScrollView contentContainerStyle={styles.container}>
				<ThemedText type='title' style={styles.title}>
					Налаштування
				</ThemedText>

				{error && (
					<View style={styles.errorContainer}>
						<ThemedText style={{ color: themeColors.errorText }}>
							Помилка: {error}
						</ThemedText>
						<Button
							title='Спробувати знову'
							onPress={fetchSettings}
							color={themeColors.tint}
						/>
					</View>
				)}

				<View style={styles.section}>
					<ThemedText style={styles.label}>Ім'я</ThemedText>
					<TextInput
						style={[
							styles.input,
							{
								color: themeColors.text,
								borderColor: themeColors.border,
								backgroundColor: themeColors.inputBackground,
							},
						]}
						value={settings.name || ''}
						onChangeText={(text) => handleInputChange('name', text)}
						placeholder="Ваше ім'я"
						placeholderTextColor={themeColors.placeholder}
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>Email</ThemedText>
					<TextInput
						style={[
							styles.input,
							{
								color: themeColors.text,
								borderColor: themeColors.border,
								backgroundColor: themeColors.inputBackground,
								opacity: 0.7, // Зробити email не зовсім активним
							},
						]}
						value={settings.email || ''}
						editable={false} // Email не редагується
						placeholder='Ваш email'
						placeholderTextColor={themeColors.placeholder}
					/>
				</View>

				<View style={styles.sectionRow}>
					<ThemedText style={styles.label}>
						Увімкнути сповіщення
					</ThemedText>
					<Switch
						trackColor={{
							false: themeColors.icon,
							true: themeColors.tint,
						}}
						thumbColor={
							settings.notifications_enabled
								? themeColors.primary
								: themeColors.icon
						}
						ios_backgroundColor={themeColors.icon}
						onValueChange={(value) =>
							handleInputChange('notifications_enabled', value)
						}
						value={settings.notifications_enabled || false}
					/>
				</View>

				<View style={styles.section}>
					<ThemedText style={styles.label}>
						Валюта за замовчуванням
					</ThemedText>
					<TextInput
						style={[
							styles.input,
							{
								color: themeColors.text,
								borderColor: themeColors.border,
								backgroundColor: themeColors.inputBackground,
							},
						]}
						value={settings.default_currency || ''}
						onChangeText={(text) =>
							handleInputChange(
								'default_currency',
								text.toUpperCase()
							)
						}
						placeholder='USD, EUR, UAH'
						placeholderTextColor={themeColors.placeholder}
						maxLength={3}
					/>
				</View>

				<View style={styles.buttonContainer}>
					<Button
						title={isSaving ? 'Збереження...' : 'Зберегти зміни'}
						onPress={handleSaveChanges}
						color={themeColors.tint}
						disabled={isSaving}
					/>
				</View>

				<View style={styles.logoutButtonContainer}>
					<Button
						title='Вийти'
						color={themeColors.error}
						onPress={handleLogout}
					/>
				</View>
			</ScrollView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	outerContainer: {
		flex: 1,
	},
	container: {
		flexGrow: 1,
		padding: 20,
	},
	centeredContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		marginBottom: 25,
		textAlign: 'center',
	},
	section: {
		marginBottom: 20,
	},
	sectionRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
		paddingVertical: 10, // Додано відступ для кращої зони натискання
	},
	label: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 8,
	},
	input: {
		height: 50,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 15,
		fontSize: 16,
	},
	buttonContainer: {
		marginTop: 20,
		marginBottom: 15,
	},
	logoutButtonContainer: {
		marginTop: 10,
	},
	errorContainer: {
		backgroundColor: Colors.light.errorText, // Використовувати статичний фон помилки або темізувати
		padding: 15,
		borderRadius: 8,
		marginBottom: 20,
		alignItems: 'center',
	},
})
