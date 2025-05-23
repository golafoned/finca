import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useEffect, useState } from 'react'
import {
	ActivityIndicator,
	Dimensions,
	Platform,
	SafeAreaView,
	ScrollView,
	StyleSheet,
	View,
} from 'react-native'
import { BarChart } from 'react-native-chart-kit'

import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'
import { API_PORT, YOUR_COMPUTER_IP } from '@/constants/apiConfig'
import { Colors } from '@/constants/Colors'
import { useAuth } from '@/context/AuthContext'
import { useColorScheme } from '@/hooks/useColorScheme'

// Interfaces (should match backend)
interface ExpenseByCategory {
	category_id: number
	category_name: string
	total_amount: string
}

interface IncomeBySource {
	category_id: number
	category_name: string
	total_amount: string
}

interface ApiReportSummary {
	total_income: number
	total_expenses: number
	expenses_by_category: ExpenseByCategory[]
	income_by_source: IncomeBySource[]
}

const screenWidth = Dimensions.get('window').width

export default function ReportsTabScreen() {
	const [reportData, setReportData] = useState<ApiReportSummary | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const auth = useAuth()
	const colorScheme = useColorScheme() ?? 'light'
	const themeColors = Colors[colorScheme]

	const API_BASE_URL = `http://${YOUR_COMPUTER_IP}:${API_PORT}`

	const fetchReportData = useCallback(async () => {
		if (!auth.userToken) {
			setError('User not authenticated.')
			setIsLoading(false)
			return
		}
		setIsLoading(true)
		try {
			const response = await fetch(
				`${API_BASE_URL}/api/reports/summary`,
				{
					headers: {
						Authorization: `Bearer ${auth.userToken}`,
					},
				}
			)
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(
					errorData.message || 'Failed to fetch report data'
				)
			}
			const data: ApiReportSummary = await response.json()
			setReportData(data)
			setError(null)
		} catch (e: any) {
			setError(e.message || 'An unexpected error occurred.')
			console.error('Fetch report data error:', e)
		} finally {
			setIsLoading(false)
		}
	}, [auth.userToken, API_BASE_URL])

	useEffect(() => {
		fetchReportData()
	}, [fetchReportData])

	const chartConfig = {
		backgroundGradientFrom: themeColors.background,
		backgroundGradientTo: themeColors.background,
		decimalPlaces: 2,
		color: (opacity = 1) => themeColors.tint,
		labelColor: (opacity = 1) => themeColors.text,
		style: {
			borderRadius: 16,
		},
		propsForDots: {
			r: '6',
			strokeWidth: '2',
			stroke: themeColors.tint,
		},
		barPercentage: 0.7,
	}

	if (isLoading) {
		return (
			<ThemedView style={[styles.container, styles.centered]}>
				<ActivityIndicator size='large' color={themeColors.tint} />
				<ThemedText style={{ marginTop: 10 }}>
					Loading reports...
				</ThemedText>
			</ThemedView>
		)
	}

	if (error) {
		return (
			<ThemedView style={[styles.container, styles.centered]}>
				<Ionicons
					name='alert-circle-outline'
					size={50}
					color={themeColors.errorText}
				/>
				<ThemedText
					type='subtitle'
					style={{ color: themeColors.errorText, marginTop: 10 }}
				>
					Error loading reports
				</ThemedText>
				<ThemedText
					style={{
						color: themeColors.textMuted,
						textAlign: 'center',
						marginTop: 5,
					}}
				>
					{error}
				</ThemedText>
			</ThemedView>
		)
	}

	if (!reportData) {
		return (
			<ThemedView style={[styles.container, styles.centered]}>
				<Ionicons
					name='information-circle-outline'
					size={50}
					color={themeColors.textMuted}
				/>
				<ThemedText
					type='subtitle'
					style={{ color: themeColors.textMuted, marginTop: 10 }}
				>
					No report data available.
				</ThemedText>
			</ThemedView>
		)
	}

	const formatChartData = (
		items: ExpenseByCategory[] | IncomeBySource[],
		maxItems = 5
	) => {
		const sortedItems = [...items].sort(
			(a, b) => parseFloat(b.total_amount) - parseFloat(a.total_amount)
		)
		const topItems = sortedItems.slice(0, maxItems)
		return {
			labels: topItems.map(
				(item) =>
					item.category_name.substring(0, 10) +
					(item.category_name.length > 10 ? '...' : '')
			),
			datasets: [
				{
					data: topItems.map((item) => parseFloat(item.total_amount)),
				},
			],
		}
	}

	const expensesChartData = formatChartData(reportData.expenses_by_category)
	const incomeChartData = formatChartData(reportData.income_by_source)
	return (
		<SafeAreaView
			style={[
				styles.safeArea,
				{ backgroundColor: themeColors.background },
			]}
		>
			<ScrollView contentContainerStyle={styles.container}>
				<ThemedView
					style={[
						styles.headerContainer,
						{ borderBottomColor: themeColors.border },
					]}
				>
					<ThemedText
						type='title'
						style={{ color: themeColors.text }}
					>
						Reports Summary
					</ThemedText>
				</ThemedView>
				<View
					style={[
						styles.summaryCard,
						{ backgroundColor: themeColors.card },
					]}
				>
					<ThemedText style={styles.summaryTitle}>
						Financial Overview
					</ThemedText>
					<View style={styles.summaryRow}>
						<ThemedText style={styles.summaryLabel}>
							Total Income:
						</ThemedText>
						<ThemedText
							style={[
								styles.summaryValue,
								{ color: themeColors.success },
							]}
						>
							${reportData.total_income.toFixed(2)}
						</ThemedText>
					</View>
					<View style={styles.summaryRow}>
						<ThemedText style={styles.summaryLabel}>
							Total Expenses:
						</ThemedText>
						<ThemedText
							style={[
								styles.summaryValue,
								{ color: themeColors.error },
							]}
						>
							${reportData.total_expenses.toFixed(2)}
						</ThemedText>
					</View>
					<View style={styles.summaryRow}>
						<ThemedText
							style={[
								styles.summaryLabel,
								styles.netBalanceLabel,
							]}
						>
							Net Balance:
						</ThemedText>
						<ThemedText
							style={[
								styles.summaryValue,
								styles.netBalanceValue,
								{
									color:
										reportData.total_income -
											reportData.total_expenses >=
										0
											? themeColors.success
											: themeColors.error,
								},
							]}
						>
							$
							{(
								reportData.total_income -
								reportData.total_expenses
							).toFixed(2)}{' '}
						</ThemedText>
					</View>
				</View>

				{reportData.expenses_by_category.length > 0 && (
					<View
						style={[
							styles.chartContainer,
							{ backgroundColor: themeColors.card },
						]}
					>
						<ThemedText type='subtitle' style={styles.chartTitle}>
							Top Expenses by Category
						</ThemedText>
						<BarChart
							data={expensesChartData}
							width={screenWidth - 64} // Reduced width for better padding
							height={220}
							yAxisLabel='$'
							yAxisSuffix=''
							chartConfig={chartConfig}
							verticalLabelRotation={
								Platform.OS === 'ios' ? 0 : 30
							}
							fromZero
							showValuesOnTopOfBars
							style={styles.chartStyle}
						/>
					</View>
				)}
				{reportData.income_by_source.length > 0 && (
					<View
						style={[
							styles.chartContainer,
							{ backgroundColor: themeColors.card },
						]}
					>
						<ThemedText type='subtitle' style={styles.chartTitle}>
							Top Income by Source
						</ThemedText>
						<BarChart
							data={incomeChartData}
							width={screenWidth - 64} // Reduced width for better padding
							height={220}
							yAxisLabel='$'
							yAxisSuffix=''
							chartConfig={chartConfig}
							verticalLabelRotation={
								Platform.OS === 'ios' ? 0 : 30
							}
							fromZero
							showValuesOnTopOfBars
							style={styles.chartStyle}
						/>
					</View>
				)}
				{reportData.expenses_by_category.length === 0 &&
					reportData.income_by_source.length === 0 && (
						<View style={styles.centeredMessageContainer}>
							<Ionicons
								name='analytics-outline'
								size={60}
								color={themeColors.textMuted}
							/>
							<ThemedText
								style={[
									styles.noDataText,
									{ color: themeColors.textMuted },
								]}
							>
								No transaction data yet to display charts.
							</ThemedText>
							<ThemedText
								style={[
									styles.noDataSubText,
									{ color: themeColors.textMuted },
								]}
							>
								Start adding transactions to see your financial
								reports.
							</ThemedText>
						</View>
					)}
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	container: {
		flexGrow: 1,
		paddingBottom: 20,
	},
	centered: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	headerContainer: {
		paddingHorizontal: 20,
		paddingTop: Platform.OS === 'android' ? 20 : 10,
		paddingBottom: 15,
		borderBottomWidth: 1,
	},
	summaryCard: {
		margin: 16,
		padding: 20,
		borderRadius: 12,
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	summaryTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 15,
		textAlign: 'center',
	},
	summaryRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
		paddingVertical: 4,
	},
	summaryLabel: {
		fontSize: 16,
		flex: 1,
	},
	summaryValue: {
		fontSize: 17,
		fontWeight: '600',
		textAlign: 'right',
	},
	netBalanceLabel: {
		fontWeight: 'bold',
		fontSize: 17,
	},
	netBalanceValue: {
		fontWeight: 'bold',
		fontSize: 18,
	},
	chartContainer: {
		marginHorizontal: 16,
		marginBottom: 20,
		padding: 16,
		borderRadius: 12,
		elevation: 2,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
	},
	chartTitle: {
		fontSize: 17,
		fontWeight: '600',
		marginBottom: 15,
		textAlign: 'center',
	},
	chartStyle: {
		marginVertical: 8,
		borderRadius: 16,
	},
	centeredMessageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 40,
		marginTop: 50,
	},
	noDataText: {
		fontSize: 18,
		fontWeight: 'bold',
		textAlign: 'center',
		marginTop: 15,
	},
	noDataSubText: {
		fontSize: 14,
		textAlign: 'center',
		marginTop: 8,
		lineHeight: 20,
	},
})
