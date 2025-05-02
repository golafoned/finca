import bcrypt from 'bcrypt';
import dotenv from 'dotenv'; // Import dotenv to access JWT_SECRET
import jwt from 'jsonwebtoken'; // Import jsonwebtoken
import pool from './db';

dotenv.config() // Load .env variables

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
	console.error('FATAL ERROR: JWT_SECRET is not defined in .env file')
	process.exit(1)
}

interface User {
	user_id: number
	email: string
	name: string | null
	// Add other relevant user fields from schema.sql if needed
}

// Interface for the data returned on successful login, including the token
interface LoginResponse {
	user: Omit<User, 'password_hash'>
	token: string
}

/**
 * Registers a new user in the database.
 * @param name - User's name (optional).
 * @param email - User's email.
 * @param password - User's plain text password.
 * @returns The newly created user object (without password hash).
 * @throws Error if email already exists or database error occurs.
 */
export async function registerUser(
	name: string | null,
	email: string,
	password: string
): Promise<Omit<User, 'password_hash'>> {
	const client = await pool.connect()
	try {
		// Check if user already exists
		const existingUser = await client.query(
			'SELECT 1 FROM Users WHERE email = $1',
			[email]
		)
		if (existingUser.rowCount && existingUser.rowCount > 0) {
			throw new Error('Email already registered.')
		}

		// Hash the password
		const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

		// Insert new user
		const result = await client.query(
			`INSERT INTO Users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, name`,
			[name, email, passwordHash]
		)

		if (result.rows.length === 0) {
			throw new Error('Failed to register user.')
		}

		return result.rows[0]
	} catch (error) {
		console.error('Error registering user:', error)
		// Re-throw specific errors or a generic one
		throw error instanceof Error ? error : new Error('Registration failed.')
	} finally {
		client.release()
	}
}

/**
 * Authenticates a user based on email and password.
 * @param email - User's email.
 * @param password - User's plain text password.
 * @returns An object containing user data and a JWT token, or null if authentication fails.
 * @throws Error if database error occurs or JWT signing fails.
 */
export async function loginUser(
	email: string,
	password: string
): Promise<LoginResponse | null> {
	const client = await pool.connect()
	try {
		const result = await client.query(
			'SELECT user_id, email, name, password_hash FROM Users WHERE email = $1',
			[email]
		)

		if (result.rows.length === 0) {
			console.log(`Login attempt failed: Email not found (${email})`)
			return null // User not found
		}

		const user = result.rows[0]
		const match = await bcrypt.compare(password, user.password_hash)

		if (match) {
			// Passwords match - login successful
			console.log(`Login successful for user: ${email}`)
			const { password_hash, ...userData } = user

			// Generate JWT token
			const token = jwt.sign(
				{ userId: userData.user_id, email: userData.email }, // Payload
				JWT_SECRET!, // Secret key (non-null assertion as we checked at startup)
				{ expiresIn: '1h' } // Token expiration time (e.g., 1 hour)
			)

			return { user: userData, token } // Return user data and token
		} else {
			// Passwords don't match
			console.log(`Login attempt failed: Invalid password for ${email}`)
			return null
		}
	} catch (error) {
		console.error('Error logging in user:', error)
		// Check if the error is from JWT signing
		if (error instanceof jwt.JsonWebTokenError) {
			throw new Error('Failed to generate authentication token.')
		}
		throw new Error('Login failed due to a server error.')
	} finally {
		client.release()
	}
}
