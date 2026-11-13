const bcrypt = require('bcryptjs');
const {
  findUserByEmail,
  findUserById,
  createUser,
  getStudentProfile,
  getCompanyProfile,
} = require('../models/userModel');
const { signToken } = require('../utils/jwt');
const { success, error } = require('../utils/response');
const { getPool, sql } = require('../config/db');

// ============================
// POST /api/auth/register
// ============================
async function register(req, res) {
  try {
    const { email, password, role, fullName, companyName, deptId, rollNumber, cgpa, graduationYear } = req.body;

    // Validation
    if (!email || !password || !role) {
      return error(res, 'email, password, and role are required', 400);
    }
    if (!['student', 'company'].includes(role)) {
      return error(res, 'Role must be student or company', 400);
    }
    if (password.length < 6) {
      return error(res, 'Password must be at least 6 characters', 400);
    }

    // Check duplicate email
    const existing = await findUserByEmail(email);
    if (existing) return error(res, 'Email already registered', 409);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await createUser({ email, passwordHash, role });

    // Create role-specific profile
    const pool = await getPool();

    if (role === 'student') {
      if (!fullName || !rollNumber || !deptId || !graduationYear) {
        // Rollback user creation
        await pool.request()
          .input('userId', sql.Int, newUser.user_id)
          .query('DELETE FROM users WHERE user_id = @userId');
        return error(res, 'Student requires fullName, rollNumber, deptId, graduationYear', 400);
      }

      await pool.request()
        .input('userId', sql.Int, newUser.user_id)
        .input('rollNumber', sql.NVarChar, rollNumber)
        .input('fullName', sql.NVarChar, fullName)
        .input('deptId', sql.Int, deptId)
        .input('cgpa', sql.Decimal(4, 2), cgpa || 0)
        .input('graduationYear', sql.Int, graduationYear)
        .query(`
          INSERT INTO students (user_id, roll_number, full_name, dept_id, cgpa, graduation_year)
          VALUES (@userId, @rollNumber, @fullName, @deptId, @cgpa, @graduationYear)
        `);
    } else {
      if (!companyName) {
        await pool.request()
          .input('userId', sql.Int, newUser.user_id)
          .query('DELETE FROM users WHERE user_id = @userId');
        return error(res, 'Company requires companyName', 400);
      }

      await pool.request()
        .input('userId', sql.Int, newUser.user_id)
        .input('companyName', sql.NVarChar, companyName)
        .query(`
          INSERT INTO companies (user_id, company_name)
          VALUES (@userId, @companyName)
        `);
    }

    // Sign JWT
    const token = signToken({
      user_id: newUser.user_id,
      email: newUser.email,
      role: newUser.role,
    });

    return success(res, {
      token,
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        role: newUser.role,
      },
    }, 'Registration successful', 201);
  } catch (err) {
    console.error('Register error:', err);
    return error(res, err.message, 500);
  }
}

// ============================
// POST /api/auth/login
// ============================
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return error(res, 'email and password are required', 400);
    }

    const user = await findUserByEmail(email);
    if (!user) return error(res, 'Invalid credentials', 401);
    if (!user.is_active) return error(res, 'Account is disabled', 403);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return error(res, 'Invalid credentials', 401);

    // Get role-specific profile
    let profile = null;
    if (user.role === 'student') profile = await getStudentProfile(user.user_id);
    if (user.role === 'company') profile = await getCompanyProfile(user.user_id);

    const token = signToken({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    return success(res, {
      token,
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        profile,
      },
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    return error(res, err.message, 500);
  }
}

// ============================
// GET /api/auth/me
// ============================
async function getMe(req, res) {
  try {
    const user = await findUserById(req.user.user_id);
    if (!user) return error(res, 'User not found', 404);

    let profile = null;
    if (user.role === 'student') profile = await getStudentProfile(user.user_id);
    if (user.role === 'company') profile = await getCompanyProfile(user.user_id);

    return success(res, {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      profile,
    }, 'User profile fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = { register, login, getMe };