import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, RequestHandler, Response } from 'express'; // Import RequestHandler
import { loginUser, registerUser } from './auth'; // Import auth functions
import pool from './db'; // Import pool to potentially close it gracefully

dotenv.config()

const app = express()
const port = process.env.PORT || 3001 // Use a different port than the frontend dev server

// Middleware
app.use(cors()) // Enable Cross-Origin Resource Sharing
app.use(express.json()) // Parse JSON request bodies

// --- API Routes ---

// Registration Endpoint
// Explicitly type the handler as RequestHandler
const registerHandler: RequestHandler = async (req, res, next) => {
	const { name, email, password } = req.body

	// Basic validation
	if (!email || !password) {
		res.status(400).json({ message: 'Email and password are required.' });
		return; // Explicitly return void
	}

	try {
		const newUser = await registerUser(name || null, email, password)
		// Don't send password hash back
		res.status(201).json({
			message: 'User registered successfully.',
			user: newUser,
		})
	} catch (error: any) {
		console.error('Registration API error:', error)
		console.error('Registration API error:', error)
		// Handle specific errors (like duplicate email)
		if (error.message === 'Email already registered.') {
			res.status(409).json({ message: error.message }); // 409 Conflict
			return; // Explicitly return void
		}
		// Add the missing response for general errors
		res.status(500).json({
			error: error.message || 'Internal Server Error',
		})
		// Optionally call next(error) if you have a centralized error handler
	}
};

app.post('/api/auth/register', registerHandler); // Use the typed handler

// Login Endpoint
// Explicitly type the handler as RequestHandler
const loginHandler: RequestHandler = async (req, res, next) => {
	const { email, password } = req.body

	// Keep only one validation block
	if (!email || !password) {
		res.status(400).json({ message: 'Email and password are required.' });
		return; // Explicitly return void after sending response
	}

	try {
		const loginResult = await loginUser(email, password)

		if (loginResult) {
			// Send back user info and the token
			res.status(200).json({
				message: 'Login successful.',
				user: loginResult.user,
				token: loginResult.token,
			})
		} else {
			// Authentication failed (wrong email or password)
			// Add the missing response for authentication failure
			res.status(401).json({ message: 'Invalid email or password.' }) // 401 Unauthorized
		}
	} catch (error: any) {
		console.error('Login API error:', error)
		// Add the missing response for general errors
		res.status(500).json({
			message: 'Login failed.',
			error: error.message || 'Internal Server Error',
		})
		// Optionally call next(error)
	}
};

app.post('/api/auth/login', loginHandler); // Use the typed handler

// Basic root route (optional) - Keep only one definition
app.get('/', (req: Request, res: Response) => {
	res.send('Finca Backend API is running!')
})

// --- Start Server ---
const server = app.listen(port, () => {
	console.log(`Backend server listening on http://localhost:${port}`)
})

// Graceful shutdown (optional but recommended)
process.on('SIGTERM', () => {
	console.log('SIGTERM signal received: closing HTTP server')
	server.close(() => {
		console.log('HTTP server closed')
		pool.end(() => {
			console.log('Database pool closed')
			process.exit(0)
		})
	})
})

process.on('SIGINT', () => {
	console.log('SIGINT signal received: closing HTTP server')
	server.close(() => {
		console.log('HTTP server closed')
		pool.end(() => {
			console.log('Database pool closed')
			process.exit(0)
		})
	})
})
