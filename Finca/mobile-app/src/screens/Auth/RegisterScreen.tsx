import React from 'react'
import { Button, Text, TextInput, View } from 'react-native'

const RegisterScreen = () => {
	return (
		<View>
			<Text>Реєстрація</Text>
			<TextInput placeholder='Email' />
			<TextInput placeholder='Password' secureTextEntry />
			<TextInput placeholder='Confirm Password' secureTextEntry />
			<Button
				title='Зареєструватися'
				onPress={() => {
					/* Handle registration */
				}}
			/>
			<Button
				title='Назад до Входу'
				onPress={() => {
					/* Navigate back to Login */
				}}
			/>
		</View>
	)
}

export default RegisterScreen
