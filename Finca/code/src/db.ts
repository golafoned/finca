import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config() // Load environment variables from .env file

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASSWORD,
	port: parseInt(process.env.DB_PORT || '5432'),
})

// Function to test the database connection
const testConnection = async () => {
	let client
	try {
		client = await pool.connect()
		console.log('Successfully acquired client from pool.')
		const res = await client.query('SELECT NOW()')
		console.log('Database connection test successful. Current time from DB:', res.rows[0].now)
	} catch (err) {
		console.error('Database connection test failed:', err)
	} finally {
		if (client) {
			client.release()
			console.log('Client released back to the pool.')
		}
	}
}

// Test the connection immediately after setting up the pool
testConnection()

pool.on('connect', () => {
	console.log('Connected to the database')
})

pool.on('error', (err) => {
	console.error('Unexpected error on idle client', err)
	process.exit(-1)
})

export default pool
