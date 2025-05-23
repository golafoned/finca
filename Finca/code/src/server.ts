import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, RequestHandler, Response } from 'express'; // Import RequestHandler
import jwt from 'jsonwebtoken'; // Added for JWT verification
import { loginUser, registerUser } from './auth'; // Import auth functions
import pool from './db'; // Import pool to potentially close it gracefully

dotenv.config()

const app = express()
const port = process.env.PORT || 3001 // Use a different port than the frontend dev server

// Middleware
app.use(cors()) // Enable Cross-Origin Resource Sharing
app.use(express.json()) // Parse JSON request bodies

// JWT Secret - ideally from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key'; // Replace with a strong secret, ideally from .env

// Interface to extend Express Request
interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string }; // Or whatever user details you store in the token
}

// Middleware to verify JWT
const verifyToken: RequestHandler = (req: AuthenticatedRequest, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7, authHeader.length); // Extract token from "Bearer <token>"
    jwt.verify(token, JWT_SECRET, (err: any, decodedPayload: any) => { // Changed 'user' to 'decodedPayload' for clarity
      if (err) {
        console.error('JWT verification error:', err.message);
        // Differentiate between expired token and invalid token for better client-side handling
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ message: 'Token expired. Please log in again.' });
        }
        return res.status(403).json({ message: 'Invalid or malformed token.' }); // Forbidden
      }

      console.log('Decoded token payload in verifyToken:', decodedPayload); // Added log
      const userIdFromToken = decodedPayload.id || decodedPayload.user_id || decodedPayload.sub || decodedPayload.userId;
      console.log('Extracted userIdFromToken in verifyToken:', userIdFromToken); // Added log

      if (!userIdFromToken) {
        console.error('JWT payload does not contain a recognized user ID field (id, user_id, or sub). Payload:', decodedPayload);
        return res.status(403).json({ message: 'Invalid token: User identifier not found in token.' });
      }

      req.user = { id: userIdFromToken.toString(), email: decodedPayload.email };
      console.log('Set req.user in verifyToken:', req.user); // Added log
      next();
    });
  } else {
    res.status(401).json({ message: 'Access token is required.' }); // Unauthorized
  }
};

// --- API Routes ---

// Registration Endpoint
// Explicitly type the handler as RequestHandler
const registerHandler: RequestHandler = async (req, res, next) => {
	const { name, email, password } = req.body

	// Basic validation
	if (!name || !email || !password) {
		res.status(400).json({ message: 'Name, email, and password are required.' });
		return;
	}

	try {
		const newUser = await registerUser(name, email, password);
		res.status(201).json({
			message: 'User registered successfully',
			user: { id: newUser.user_id, name: newUser.name, email: newUser.email }
		});
	} catch (error: any) {
		console.error('Registration error:', error);
		if (error.message.includes('already exists') || error.code === '23505') {
			res.status(409).json({ message: 'User with this email already exists.' });
		} else {
			res.status(500).json({ message: 'Registration failed. Please try again.' });
		}
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

// Dashboard Summary Endpoint
interface Transaction {
	id: string;
	description: string;
	amount: number;
	date: string;
  type: 'income' | 'expense'; // Added type for better display
  category?: string; // Optional category
}

interface BudgetStatus {
	category: string;
	spent: number;
	total: number;
  id: string;
}

interface DashboardData {
	balance: number | null;
	recentTransactions: Transaction[];
	budgetOverview: BudgetStatus[];
}

const dashboardSummaryHandler: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => { // Explicitly type return as Promise<void>
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return; // Ensure void return
  }
  const userId = req.user.id;

  try {
    // 1. Get Total Balance
    const balanceResult = await pool.query(
      `SELECT SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as total_balance
         FROM transactions
         WHERE user_id = $1`,
      [userId]
    );
    // Ensure balance is a number, default to 0 if null or undefined
    const balance = parseFloat(balanceResult.rows[0]?.total_balance) || 0;

    // 2. Get Recent Transactions (e.g., last 5)
    // Joins with categories to get category name
    const transactionsResult = await pool.query(
      `SELECT t.transaction_id as id, t.notes as description, t.amount, t.transaction_date as date, t.type, c.name as category
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = $1
         ORDER BY t.transaction_date DESC
         LIMIT 5`,
      [userId]
    );
    const recentTransactions: Transaction[] = transactionsResult.rows.map(row => ({
      ...row,
      amount: parseFloat(row.amount), // Ensure amount is a number
      date: new Date(row.date).toISOString(), 
    }));

    // 3. Get Budget Overview
    // Joins with categories to get category name, and transactions to sum spent amount
    const budgetsResult = await pool.query(
      `SELECT 
            b.budget_id as id, 
            c.name as category, 
            b.amount as total, 
            COALESCE(SUM(t.amount), 0) as spent
         FROM budgets b
         JOIN categories c ON b.category_id = c.category_id
         LEFT JOIN transactions t ON b.category_id = t.category_id 
                                AND t.user_id = b.user_id 
                                AND t.type = 'expense' 
                                AND t.transaction_date >= b.period_start_date 
                                AND t.transaction_date <= b.period_end_date
         WHERE b.user_id = $1
         GROUP BY b.budget_id, c.name, b.amount -- Include all non-aggregated selected columns in GROUP BY
         ORDER BY c.name
         LIMIT 3`,
      [userId]
    );
    const budgetOverview: BudgetStatus[] = budgetsResult.rows.map(row => ({
        ...row,
        total: parseFloat(row.total), // Ensure total is a number
        spent: parseFloat(row.spent)  // Ensure spent is a number
    }));

    const dashboardData: DashboardData = {
      balance: balance, // Already a number
      recentTransactions,
      budgetOverview,
    };

    res.status(200).json(dashboardData);
    return; // Ensure void return
  } catch (error: any) {
    console.error('Dashboard Summary API error:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard summary.',
      error: error.message || 'Internal Server Error',
    });
    return; // Ensure void return
  }
};

app.get('/api/dashboard/summary', verifyToken, dashboardSummaryHandler);

// --- Transactions API Endpoints ---

// Interface for Transaction data from/to API
interface ApiTransaction {
  transaction_id?: number; // Optional for new transactions
  user_id?: number; // Will be set from token
  category_id: number;
  amount: string; // Using string for numeric to handle precision, convert to/from number in backend
  type: 'income' | 'expense';
  transaction_date: string; // ISO date string e.g., YYYY-MM-DD
  notes?: string;
  attachment_url?: string;
  category_name?: string; // For sending to client
  created_at?: string;
  updated_at?: string;
}

// GET all transactions for the authenticated user
app.get('/api/transactions', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.*, c.name as category_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.user_id = $1
       ORDER BY t.transaction_date DESC, t.created_at DESC`,
      [userId]
    );
    const transactions: ApiTransaction[] = result.rows.map(row => ({
      ...row,
      amount: row.amount.toString(), // Ensure amount is string
      transaction_date: new Date(row.transaction_date).toISOString().split('T')[0], // Format as YYYY-MM-DD
    }));
    res.status(200).json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions.', error: error.message });
  }
});

// POST a new transaction
app.post('/api/transactions', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('Inside POST /api/transactions, req.user:', req.user);
  if (!req.user || !req.user.id) {
    res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    return;
  }
  const userIdString = req.user.id; // userId from token is a string
  console.log('Using userId string for transaction:', userIdString);
  const { category_id, amount, type, transaction_date, notes, attachment_url } = req.body as ApiTransaction;

  if (!category_id || !amount || !type || !transaction_date) {
    res.status(400).json({ message: 'Missing required transaction fields: category_id, amount, type, transaction_date.' });
    return;
  }

  try {
    const userId = parseInt(userIdString, 10); // Parse to integer
    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID format.' });
      return;
    }

    const query = `
      INSERT INTO transactions (user_id, category_id, amount, type, transaction_date, notes, attachment_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [userId, category_id, parseFloat(amount), type, transaction_date, notes || null, attachment_url || null];
    
    console.log('Executing query:', query, 'with values:', values);
    const result = await pool.query(query, values);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding transaction:', error); // Full error object
    console.error('Error details:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({ 
      message: 'Failed to add transaction.', 
      error: error.message, 
      detail: error.detail, // Include detail from pg error
      code: error.code 
    });
  }
});

// PUT (update) an existing transaction
app.put('/api/transactions/:transactionId', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }
  const userId = req.user.id;
  const { transactionId } = req.params;
  const { category_id, amount, type, transaction_date, notes, attachment_url } = req.body as ApiTransaction;

  if (!transactionId) {
    res.status(400).json({ message: 'Transaction ID is required.' });
    return;
  }
  if (!category_id || !amount || !type || !transaction_date) {
    res.status(400).json({ message: 'Missing required fields: category_id, amount, type, transaction_date.' });
    return;
  }

  try {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      res.status(400).json({ message: 'Invalid amount format.' });
      return;
    }

    const result = await pool.query(
      `UPDATE transactions
       SET category_id = $1, amount = $2, type = $3, transaction_date = $4, notes = $5, attachment_url = $6, updated_at = CURRENT_TIMESTAMP
       WHERE transaction_id = $7 AND user_id = $8
       RETURNING *`,
      [category_id, numericAmount, type, transaction_date, notes || null, attachment_url || null, parseInt(transactionId), userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Transaction not found or user not authorized to update.' });
      return;
    }
    
    const updatedTransactionRow = result.rows[0];
    const categoryResult = await pool.query('SELECT name FROM categories WHERE category_id = $1', [updatedTransactionRow.category_id]);
    const category_name = categoryResult.rows[0]?.name;

    const updatedTransaction: ApiTransaction = {
        ...updatedTransactionRow,
        amount: updatedTransactionRow.amount.toString(),
        transaction_date: new Date(updatedTransactionRow.transaction_date).toISOString().split('T')[0],
        category_name: category_name
    };
    res.status(200).json(updatedTransaction);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    if (error.code === '23503') {
        res.status(400).json({ message: 'Invalid category ID or other reference.', error: error.message });
        return;
    }
    res.status(500).json({ message: 'Failed to update transaction.', error: error.message });
  }
});

// DELETE a transaction
app.delete('/api/transactions/:transactionId', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }
  const userId = req.user.id;
  const { transactionId } = req.params;

  if (!transactionId) {
    res.status(400).json({ message: 'Transaction ID is required.' });
    return;
  }

  try {
    const deleteQuery = 'DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(deleteQuery, [transactionId, userId]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Transaction not found or user not authorized.' });
      return;
    }
    res.status(200).json({ message: 'Transaction deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ message: 'Failed to delete transaction.', error: error.message });
  }
});

// --- Budgets API Endpoint ---

// Interface for Budget data returned by the API
interface ApiBudgetEntry {
  budget_id: number;
  name: string; // Added name
  category_id: number; // Added category_id for client-side reference
  category_name: string;
  allocated_amount: number;
  spent_amount: number; // Represents "achieved" for income budgets
  start_date: string;
  end_date: string;
  budget_type: 'income' | 'expense'; // Renamed from type
}

// GET all budgets for the authenticated user
const getBudgetsHandler: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    return;
  }
  const userId = req.user.id;

  try {
    const query = `
      SELECT
          b.budget_id,
          b.name, -- Added name
          b.category_id, -- Added category_id
          c.name AS category_name,
          b.amount AS allocated_amount,
          b.budget_type, -- Changed from b.type
          COALESCE(SUM(t.amount::decimal) FILTER (
              WHERE t.type = b.budget_type -- Ensure this matches the budget's type (income for income, expense for expense)
              AND t.transaction_date >= b.period_start_date
              AND t.transaction_date <= b.period_end_date
          ), 0.00) AS spent_amount, 
          TO_CHAR(b.period_start_date, 'YYYY-MM-DD') AS start_date,
          TO_CHAR(b.period_end_date, 'YYYY-MM-DD') AS end_date
      FROM
          budgets b
      JOIN
          categories c ON b.category_id = c.category_id
      LEFT JOIN
          transactions t ON t.category_id = b.category_id 
                       AND t.user_id = b.user_id 
      WHERE
          b.user_id = $1
      GROUP BY
          b.budget_id, b.name, b.category_id, c.name, b.amount, b.budget_type, b.period_start_date, b.period_end_date -- Added b.name, b.category_id and changed b.type to b.budget_type
      ORDER BY
          b.period_start_date DESC, c.name;
    `;
    const result = await pool.query(query, [userId]);
    const budgets: ApiBudgetEntry[] = result.rows.map(row => ({
      budget_id: row.budget_id,
      name: row.name,
      category_id: row.category_id,
      category_name: row.category_name,
      allocated_amount: parseFloat(row.allocated_amount),
      spent_amount: parseFloat(row.spent_amount),
      start_date: row.start_date,
      end_date: row.end_date,
      budget_type: row.budget_type // Changed from type: row.type
    }));
    res.status(200).json(budgets);
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ message: 'Failed to fetch budgets.', error: error.message });
  }
};

app.get('/api/budgets', verifyToken, getBudgetsHandler);

// Interface for creating a new budget
interface NewApiBudget {
  name: string; // Added name
  category_id: number;
  amount: number;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  budget_type: 'income' | 'expense'; // Renamed from type to budget_type
}

// POST a new budget for the authenticated user
const createBudgetHandler: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    return;
  }
  const userId = req.user.id;
  const { name, category_id, amount, start_date, end_date, budget_type } = req.body as NewApiBudget;

  if (!name || !category_id || amount === undefined || !start_date || !end_date || !budget_type) {
    res.status(400).json({ message: 'Missing required fields: name, category_id, amount, start_date, end_date, budget_type.' });
    return;
  }

  try {
    const query = `
      INSERT INTO budgets (user_id, category_id, name, amount, period_start_date, period_end_date, budget_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING budget_id, user_id, category_id, name, amount, 
                TO_CHAR(period_start_date, 'YYYY-MM-DD') AS start_date, 
                TO_CHAR(period_end_date, 'YYYY-MM-DD') AS end_date, 
                budget_type, created_at, updated_at;
    `;
    const values = [userId, category_id, name, amount, start_date, end_date, budget_type];
    
    console.log('Executing create budget query:', query, 'with values:', values);
    const result = await pool.query(query, values);
    const newBudget = result.rows[0];

    // Fetch category name to include in the response
    const categoryResult = await pool.query('SELECT name FROM categories WHERE category_id = $1', [newBudget.category_id]);
    const category_name = categoryResult.rows[0]?.name;

    res.status(201).json({
      ...newBudget,
      category_name: category_name,
      allocated_amount: parseFloat(newBudget.amount), // Match ApiBudgetEntry
      spent_amount: 0, // New budget has 0 spent
      // start_date and end_date are already formatted by the query
    });
  } catch (error: any) {
    console.error('Error creating budget:', error);
    if (error.code === '23505') { // unique_violation
        res.status(409).json({ message: 'A budget with these details (e.g., user, category, start date) already exists.', error: error.detail });
    } else if (error.code === '23503') { // foreign_key_violation
        res.status(400).json({ message: 'Invalid category ID.', error: error.detail });
    } else {
        res.status(500).json({ message: 'Failed to create budget.', error: error.message });
    }
  }
};

app.post('/api/budgets', verifyToken, createBudgetHandler);

// Interface for updating an existing budget
interface UpdateApiBudget {
  name?: string;
  category_id?: number;
  amount?: number;
  start_date?: string; // YYYY-MM-DD
  end_date?: string;   // YYYY-MM-DD
  budget_type?: 'income' | 'expense';
}

// PUT (update) an existing budget
const updateBudgetHandler: RequestHandler = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ message: 'User not authenticated or user ID missing.' });
    return;
  }
  const userId = req.user.id;
  const { budgetId } = req.params;
  const updates = req.body as UpdateApiBudget;

  if (!budgetId) {
    res.status(400).json({ message: 'Budget ID is required in the URL path.' });
    return;
  }

  const numericBudgetId = parseInt(budgetId, 10);
  if (isNaN(numericBudgetId)) {
    res.status(400).json({ message: 'Invalid Budget ID format.' });
    return;
  }

  // Build the update query dynamically based on provided fields
  const setClauses: string[] = [];
  const values: any[] = [];
  let queryIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${queryIndex++}`);
    values.push(updates.name);
  }
  if (updates.category_id !== undefined) {
    setClauses.push(`category_id = $${queryIndex++}`);
    values.push(updates.category_id);
  }
  if (updates.amount !== undefined) {
    setClauses.push(`amount = $${queryIndex++}`);
    values.push(updates.amount);
  }
  if (updates.start_date !== undefined) {
    setClauses.push(`period_start_date = $${queryIndex++}`);
    values.push(updates.start_date);
  }
  if (updates.end_date !== undefined) {
    setClauses.push(`period_end_date = $${queryIndex++}`);
    values.push(updates.end_date);
  }
  if (updates.budget_type !== undefined) {
    setClauses.push(`budget_type = $${queryIndex++}`);
    values.push(updates.budget_type);
  }

  if (setClauses.length === 0) {
    res.status(400).json({ message: 'No fields provided for update.' });
    return;
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`); // Always update this

  values.push(numericBudgetId);
  values.push(userId); // For WHERE clause

  const query = `
    UPDATE budgets
    SET ${setClauses.join(', ')}
    WHERE budget_id = $${queryIndex++} AND user_id = $${queryIndex++}
    RETURNING budget_id, user_id, category_id, name, amount, 
              TO_CHAR(period_start_date, 'YYYY-MM-DD') AS start_date, 
              TO_CHAR(period_end_date, 'YYYY-MM-DD') AS end_date, 
              budget_type, created_at, updated_at;
  `;
  
  console.log('Executing update budget query:', query, 'with values:', values);

  try {
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Budget not found or user not authorized to update.' });
      return;
    }
    const updatedBudget = result.rows[0];

    // Fetch category name and spent amount to return the full ApiBudgetEntry structure
    const categoryResult = await pool.query('SELECT name FROM categories WHERE category_id = $1', [updatedBudget.category_id]);
    const category_name = categoryResult.rows[0]?.name;
    
    // Recalculate spent_amount (or achieved_amount for income)
    // This logic should mirror the one in getBudgetsHandler
    const spentAmountQuery = `
        SELECT COALESCE(SUM(t.amount::decimal) FILTER (
            WHERE t.type = $1 -- budget_type
            AND t.transaction_date >= $2 -- period_start_date
            AND t.transaction_date <= $3 -- period_end_date
        ), 0.00) AS spent_amount
        FROM transactions t
        WHERE t.user_id = $4 AND t.category_id = $5;
    `;
    const spentAmountResult = await pool.query(spentAmountQuery, [
        updatedBudget.budget_type, 
        updatedBudget.start_date, // Use the formatted start_date from RETURNING
        updatedBudget.end_date,   // Use the formatted end_date from RETURNING
        updatedBudget.user_id, 
        updatedBudget.category_id
    ]);
    const spent_amount = parseFloat(spentAmountResult.rows[0]?.spent_amount || '0');


    res.status(200).json({
      budget_id: updatedBudget.budget_id,
      category_name: category_name,
      allocated_amount: parseFloat(updatedBudget.amount),
      spent_amount: spent_amount,
      start_date: updatedBudget.start_date,
      end_date: updatedBudget.end_date,
      type: updatedBudget.budget_type, // Ensure this matches ApiBudgetEntry 'type' field
    });

  } catch (error: any) {
    console.error('Error updating budget:', error);
    if (error.code === '23505') { // unique_violation
        res.status(409).json({ message: 'Update would cause a duplicate budget (e.g., user, category, start date).', error: error.detail });
    } else if (error.code === '23503') { // foreign_key_violation
        res.status(400).json({ message: 'Invalid category ID provided for update.', error: error.detail });
    } else {
        res.status(500).json({ message: 'Failed to update budget.', error: error.message });
    }
  }
};

app.put('/api/budgets/:budgetId', verifyToken, updateBudgetHandler);

// DELETE a budget
app.delete('/api/budgets/:budgetId', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }
  const userId = req.user.id;
  const { budgetId } = req.params;

  if (!budgetId) {
    res.status(400).json({ message: 'Budget ID is required.' });
    return;
  }

  try {
    const deleteQuery = 'DELETE FROM budgets WHERE budget_id = $1 AND user_id = $2 RETURNING *';
    const result = await pool.query(deleteQuery, [budgetId, userId]);

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Budget not found or user not authorized.' });
      return;
    }
    res.status(200).json({ message: 'Budget deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting budget:', error);
    res.status(500).json({ message: 'Failed to delete budget.', error: error.message });
  }
});

// --- Categories API Endpoint ---
interface ApiCategory {
  category_id: number;
  name: string;
  type: 'income' | 'expense';
  user_id?: number | null; // Can be global (null) or user-specific
}

// GET all categories (global and user-specific)
app.get('/api/categories', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT category_id, name, type, user_id
       FROM categories
       WHERE user_id IS NULL OR user_id = $1
       ORDER BY type, name`,
      [userId]
    );
    const categories: ApiCategory[] = result.rows;
    res.status(200).json(categories);
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories.', error: error.message });
  }
});

// --- User Settings API Endpoints ---

interface UserSettings {
  name: string;
  email: string;
  notifications_enabled: boolean;
  default_currency: string;
}

// GET user settings
app.get('/api/settings', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT name, email, notifications_enabled, default_currency FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const settings: UserSettings = result.rows[0];
    res.json(settings);
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Failed to fetch user settings', error: error.message });
  }
});

// PUT (update) user settings
app.put('/api/settings', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const userId = req.user.id;
  const { name, notifications_enabled, default_currency } = req.body as Partial<UserSettings>;

  // Basic validation
  if (name === undefined && notifications_enabled === undefined && default_currency === undefined) {
    res.status(400).json({ message: 'No settings provided to update.' });
    return;
  }
  if (name !== undefined && typeof name !== 'string') {
    res.status(400).json({ message: 'Invalid name format.' });
    return;
  }
  if (notifications_enabled !== undefined && typeof notifications_enabled !== 'boolean') {
    res.status(400).json({ message: 'Invalid notifications_enabled format.' });
    return;
  }
  if (default_currency !== undefined && (typeof default_currency !== 'string' || default_currency.length > 3)) {
    res.status(400).json({ message: 'Invalid default_currency format.' });
    return;
  }


  try {
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let queryIndex = 1;

    if (name !== undefined) {
      fieldsToUpdate.push(`name = $${queryIndex++}`);
      values.push(name);
    }
    if (notifications_enabled !== undefined) {
      fieldsToUpdate.push(`notifications_enabled = $${queryIndex++}`);
      values.push(notifications_enabled);
    }
    if (default_currency !== undefined) {
      fieldsToUpdate.push(`default_currency = $${queryIndex++}`);
      values.push(default_currency);
    }

    if (fieldsToUpdate.length === 0) {
      res.status(400).json({ message: 'No valid fields to update.' });
      return;
    }

    values.push(userId); // For the WHERE clause

    const updateQuery = `UPDATE users SET ${fieldsToUpdate.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $${queryIndex} RETURNING name, email, notifications_enabled, default_currency`;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'User not found or update failed' });
      return;
    }

    res.json({ message: 'Settings updated successfully', settings: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Failed to update user settings', error: error.message });
  }
});


// --- Reports API Endpoint ---

interface ExpenseByCategory {
  category_id: number;
  category_name: string;
  total_amount: string; // Keep as string to match transaction amount type
}

interface IncomeBySource {
  category_id: number;
  category_name: string;
  total_amount: string; // Keep as string to match transaction amount type
}

interface ApiReportSummary {
  total_income: number;
  total_expenses: number;
  expenses_by_category: ExpenseByCategory[];
  income_by_source: IncomeBySource[];
  // We could add date range parameters later if needed
}

// GET report summary for the authenticated user
app.get('/api/reports/summary', verifyToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  // Ensure userId is parsed to an integer
  const userId = parseInt(req.user.id, 10);
  if (isNaN(userId)) {
    res.status(400).json({ message: 'Invalid user ID format.' });
    return;
  }

  try {
    // Calculate total income
    const totalIncomeResult = await pool.query(
      "SELECT SUM(amount::numeric) AS total FROM transactions WHERE user_id = $1 AND type = 'income'",
      [userId]
    );
    const total_income = parseFloat(totalIncomeResult.rows[0]?.total) || 0;

    // Calculate total expenses
    const totalExpensesResult = await pool.query(
      "SELECT SUM(amount::numeric) AS total FROM transactions WHERE user_id = $1 AND type = 'expense'",
      [userId]
    );
    const total_expenses = parseFloat(totalExpensesResult.rows[0]?.total) || 0;

    // Get expenses by category
    const expensesByCategoryResult = await pool.query(
      `SELECT
          t.category_id,
          c.name AS category_name,
          SUM(t.amount::numeric) AS total_amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.category_id
        WHERE t.user_id = $1 AND t.type = 'expense'
        GROUP BY t.category_id, c.name
        ORDER BY total_amount DESC`,
      [userId]
    );
    const expenses_by_category: ExpenseByCategory[] = expensesByCategoryResult.rows.map(row => ({
      ...row,
      total_amount: row.total_amount.toString() // Ensure string format
    }));

    // Get income by source (category)
    const incomeBySourceResult = await pool.query(
      `SELECT
          t.category_id,
          c.name AS category_name,
          SUM(t.amount::numeric) AS total_amount
        FROM transactions t
        JOIN categories c ON t.category_id = c.category_id
        WHERE t.user_id = $1 AND t.type = 'income'
        GROUP BY t.category_id, c.name
        ORDER BY total_amount DESC`,
      [userId]
    );
    const income_by_source: IncomeBySource[] = incomeBySourceResult.rows.map(row => ({
      ...row,
      total_amount: row.total_amount.toString() // Ensure string format
    }));

    const reportSummary: ApiReportSummary = {
      total_income,
      total_expenses,
      expenses_by_category,
      income_by_source,
    };

    res.status(200).json(reportSummary);
  } catch (error: any) {
    console.error('Error fetching report summary:', error);
    res.status(500).json({ message: 'Error fetching report summary', error: error.message });
  }
});

// Basic root route (optional) - Keep only one definition
app.get('/', (req: Request, res: Response) => {
	res.send('Finca Backend API is running!')
})

// --- Start Server ---
const portNumber = typeof port === 'string' ? parseInt(port, 10) : port;

const server = app.listen(portNumber, '0.0.0.0', () => {
  console.log(`Backend server listening on http://localhost:${portNumber} and on your network IP at port ${portNumber}`)
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
