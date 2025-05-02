import React from 'react'
import { Button, Text, TextInput, View } from 'react-native'

const LoginScreen = () => {
	return (
		<View>
			<Text>Finca Logo</Text>
			<TextInput placeholder='Email/Username' />
			<TextInput placeholder='Password' secureTextEntry />
			<Button
				title='Увійти'
				onPress={() => {
					/* Handle login */
				}}
			/>
			<Button
				title='Зареєструватися'
				onPress={() => {
					/* Navigate to Register */
				}}
			/>
			<Button
				title='Забули пароль?'
				onPress={() => {
					/* Handle forgot password */
				}}
			/>
		</View>
	)
}

export default LoginScreen
