import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import LoginScreen from '../screens/Auth/LoginScreen'
import RegisterScreen from '../screens/Auth/RegisterScreen'

// This assumes you have installed @react-navigation/native-stack
// npm install @react-navigation/native-stack
// or yarn add @react-navigation/native-stack

const Stack = createNativeStackNavigator()

const AuthNavigator = () => {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name='Login' component={LoginScreen} />
			<Stack.Screen name='Register' component={RegisterScreen} />
			{/* Add Forgot Password screen if needed */}
		</Stack.Navigator>
	)
}

export default AuthNavigator
