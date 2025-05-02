import { StyleSheet } from 'react-native'

// import ReportsScreen from '@/mobile-app/src/screens/ReportsScreen'; // Adjust path if needed
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

export default function ReportsTabScreen() {
	return (
		<ThemedView style={styles.container}>
			<ThemedText type='title'>Звіти</ThemedText>
			{/* Placeholder: You can import and render your actual ReportsScreen component here */}
			{/* <ReportsScreen /> */}
			<ThemedText>Тут буде екран звітів.</ThemedText>
		</ThemedView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
})
