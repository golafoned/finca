import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'
import { useFocusEffect } from '@react-navigation/native' // Added useFocusEffect
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { API_PORT, YOUR_COMPUTER_IP } from '../../constants/apiConfig'
import { useAuth } from '../../context/AuthContext'

// TODO: Перенести в constants/apiConfig.ts або подібне
const API_BASE_URL = 'http://localhost:3001' // Замініть на ваш реальний API URL

// Типи для даних (приклад)
interface Transaction {
	id: string
	description: string
	amount: number
	date: string
	type: 'income' | 'expense' // Додано поле type
}

interface BudgetStatus {
	category: string
	spent: number
	total: number
}

interface DashboardData {
	balance: number | null
	recentTransactions: Transaction[]
	budgetOverview: BudgetStatus[]
}

export default function DashboardTabScreen() {
	const [balance, setBalance] = useState<number | null>(null)
	const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
		[]
	)
	const [budgetOverview, setBudgetOverview] = useState<BudgetStatus[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const colorScheme = useColorScheme()
	const authContext = useAuth()

	const fetchDashboardData = useCallback(async () => {
		if (authContext.isLoading) {
			return
		}

		if (!authContext.userToken) {
			setError('Користувач не авторизований.')
			setIsLoading(false)
			setBalance(null)
			setRecentTransactions([])
			setBudgetOverview([])
			return
		}

		setIsLoading(true)
		setError(null)
		try {
			const apiUrl = `http://${YOUR_COMPUTER_IP}:${API_PORT}/api/dashboard/summary`
			const response = await fetch(apiUrl, {
				headers: {
					Authorization: `Bearer ${authContext.userToken}`,
					'Content-Type': 'application/json',
				},
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(
					errorData.message || `Помилка API: ${response.status}`
				)
			}

			const data: DashboardData = await response.json()
			setBalance(data.balance)
			setRecentTransactions(data.recentTransactions || [])
			setBudgetOverview(data.budgetOverview || [])
		} catch (e: any) {
			console.error('Failed to fetch dashboard data:', e)
			setError(e.message || 'Не вдалося завантажити дані.')
			setBalance(null)
			setRecentTransactions([])
			setBudgetOverview([])
		} finally {
			setIsLoading(false)
		}
	}, [authContext.isLoading, authContext.userToken]) // Correct dependencies for useCallback

	// Fetch data when auth context changes (e.g., login/logout)
	useEffect(() => {
		fetchDashboardData()
	}, [fetchDashboardData])

	// Fetch data when the screen comes into focus
	useFocusEffect(
		useCallback(() => {
			fetchDashboardData()
		}, [fetchDashboardData])
	)

	if (isLoading) {
		return (
			<ThemedView style={[styles.container, styles.centered]}>
				<ActivityIndicator
					size='large'
					color={Colors[colorScheme ?? 'light'].tint}
				/>
				<ThemedText style={{ marginTop: 10 }}>
					Завантаження даних...
				</ThemedText>
			</ThemedView>
		)
	}

	if (error) {
		return (
			<ThemedView style={[styles.container, styles.centered]}>
				<ThemedText type='subtitle' style={{ color: 'red' }}>
					Помилка
				</ThemedText>
				<ThemedText style={{ textAlign: 'center', marginTop: 5 }}>
					{error}
				</ThemedText>
				{/* Можна додати кнопку "Повторити" */}
			</ThemedView>
		)
	}

	return (
		<ThemedView style={styles.container}>
			<ThemedText type='title' style={styles.title}>
				Панель управління
			</ThemedText>

			{/* Секція Балансу */}
			<ThemedView
				style={[
					styles.section,
					{ backgroundColor: Colors[colorScheme ?? 'light'].tint },
				]}
			>
				<ThemedText
					type='subtitle'
					style={{ color: Colors[colorScheme ?? 'light'].background }}
				>
					Загальний баланс
				</ThemedText>
				<ThemedText
					style={[
						styles.balanceText,
						{ color: Colors[colorScheme ?? 'light'].background },
					]}
				>
					{balance !== null
						? `${balance.toFixed(2)} ₴`
						: 'Дані про баланс відсутні'}
				</ThemedText>
			</ThemedView>

			{/* Секція Останніх Транзакцій */}
			<ThemedView
				style={[
					styles.section,
					{ backgroundColor: Colors[colorScheme ?? 'light'].tint },
				]}
			>
				<ThemedText
					type='subtitle'
					style={{ color: Colors[colorScheme ?? 'light'].background }}
				>
					Останні транзакції
				</ThemedText>
				{recentTransactions.length > 0 ? (
					recentTransactions.map((tx) => (
						<View
							key={tx.id}
							style={[
								styles.transactionItem,
								{
									borderBottomColor:
										Colors[colorScheme ?? 'light']
											.background,
								},
							]}
						>
							<ThemedText
								style={{
									color: Colors[colorScheme ?? 'light']
										.background,
								}}
							>
								{tx.description}
							</ThemedText>
							<ThemedText
								style={{
									color:
										tx.type === 'income'
											? '#69db7c' // Зелений для доходу
											: tx.type === 'expense'
											? '#ff6b6b' // Червоний для витрат
											: Colors[colorScheme ?? 'light']
													.text, // Колір за замовчуванням
									fontWeight: 'bold',
								}}
							>
								{tx.amount.toFixed(2)} ₴
							</ThemedText>
						</View>
					))
				) : (
					<ThemedText
						style={{
							color: Colors[colorScheme ?? 'light'].background,
							textAlign: 'center',
							paddingVertical: 10,
						}}
					>
						Немає останніх транзакцій.
					</ThemedText>
				)}
			</ThemedView>

			{/* Секція Огляду Бюджету */}
			<ThemedView
				style={[
					styles.section,
					{ backgroundColor: Colors[colorScheme ?? 'light'].tint },
				]}
			>
				<ThemedText
					type='subtitle'
					style={{ color: Colors[colorScheme ?? 'light'].background }}
				>
					Огляд бюджетів
				</ThemedText>
				{budgetOverview.length > 0 ? (
					budgetOverview.map((budget) => (
						<View key={budget.category} style={styles.budgetItem}>
							<ThemedText
								style={{
									color: Colors[colorScheme ?? 'light']
										.background,
								}}
							>
								{budget.category}: {budget.spent.toFixed(2)} /{' '}
								{budget.total.toFixed(2)} ₴
							</ThemedText>
							{/* Тут можна додати ProgressBar */}
						</View>
					))
				) : (
					<ThemedText
						style={{
							color: Colors[colorScheme ?? 'light'].background,
							textAlign: 'center',
							paddingVertical: 10,
						}}
					>
						Інформація про бюджети відсутня.
					</ThemedText>
				)}
			</ThemedView>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		paddingTop: 50,
	},
	centered: {
		// Стиль для центрування вмісту (для завантаження/помилки)
		justifyContent: 'center',
		alignItems: 'center',
	},
	title: {
		marginBottom: 20,
		textAlign: 'center',
	},
	section: {
		marginBottom: 20,
		padding: 15,
		borderRadius: 10,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.23,
		shadowRadius: 2.62,
		elevation: 4,
	},
	balanceText: {
		fontSize: 28,
		fontWeight: 'bold',
		marginTop: 8,
		textAlign: 'center',
		paddingVertical: 10,
	},
	transactionItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: 10,
		borderBottomWidth: 1,
	},
	budgetItem: {
		paddingVertical: 6,
	},
})
