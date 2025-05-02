import { Tabs } from 'expo-router'
import React from 'react'
import { Platform } from 'react-native'

import { HapticTab } from '@/components/HapticTab'
import { IconSymbol } from '@/components/ui/IconSymbol'
import TabBarBackground from '@/components/ui/TabBarBackground'
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

export default function TabLayout() {
	const colorScheme = useColorScheme()

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: Platform.select({
					ios: {
						// Use a transparent background on iOS to show the blur effect
					},
					default: {},
				}),
			}}
		>
			<Tabs.Screen
				name='index'
				options={{
					title: 'Панель',
					tabBarIcon: ({ color }) => (
						<IconSymbol size={28} name='house.fill' color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name='transactions'
				options={{
					title: 'Транзакції',
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name='list.bullet'
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='budgets'
				options={{
					title: 'Бюджети',
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name='creditcard.fill'
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='reports'
				options={{
					title: 'Звіти',
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name='chart.pie.fill'
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name='settings'
				options={{
					title: 'Налаштування',
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name='gearshape.fill'
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	)
}
