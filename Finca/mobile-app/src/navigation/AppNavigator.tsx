import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'

import AddTransactionScreen from '../screens/AddTransactionScreen'
import BudgetScreen from '../screens/BudgetScreen'
import DashboardScreen from '../screens/DashboardScreen'
import ReportsScreen from '../screens/ReportsScreen'
import SettingsScreen from '../screens/SettingsScreen'
import TransactionListScreen from '../screens/TransactionListScreen'

// This assumes you have installed @react-navigation/bottom-tabs
// npm install @react-navigation/bottom-tabs
// or yarn add @react-navigation/bottom-tabs

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator() // For screens opened from tabs, like AddTransaction

// Stack navigator for screens related to Transactions tab
const TransactionStack = () => (
	<Stack.Navigator>
		<Stack.Screen
			name='TransactionList'
			component={TransactionListScreen}
			options={{ title: 'Транзакції' }}
		/>
		<Stack.Screen
			name='AddTransaction'
			component={AddTransactionScreen}
			options={{ title: 'Додати транзакцію' }}
		/>
		{/* Add EditTransaction screen here */}
	</Stack.Navigator>
)

// Main Tab Navigator
const AppNavigator = () => {
	return (
		<Tab.Navigator screenOptions={{ headerShown: false }}>
			<Tab.Screen
				name='Dashboard'
				component={DashboardScreen}
				options={{ title: 'Панель' }}
			/>
			<Tab.Screen
				name='Transactions'
				component={TransactionStack}
				options={{ title: 'Транзакції' }}
			/>
			<Tab.Screen
				name='Budgets'
				component={BudgetScreen}
				options={{ title: 'Бюджети' }}
			/>
			<Tab.Screen
				name='Reports'
				component={ReportsScreen}
				options={{ title: 'Звіти' }}
			/>
			<Tab.Screen
				name='Settings'
				component={SettingsScreen}
				options={{ title: 'Налаштування' }}
			/>
		</Tab.Navigator>
	)
}

export default AppNavigator
