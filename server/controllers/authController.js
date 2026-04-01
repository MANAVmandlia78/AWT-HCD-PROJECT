const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      gender,
      enrollment_no,
      college_id,
      department_id
    } = req.body;

    // check if user already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // insert user
      const sql = `
        INSERT INTO users 
        (name, email, password, role, gender, enrollment_no, college_id, department_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [
          name,
          email,
          hashedPassword,
          role,
          gender || null,
          enrollment_no || null,
          college_id,
          department_id
        ],
        (err, result) => {
          if (err) return res.status(500).json(err);

          res.status(201).json({
            message: "User registered successfully"
          });
        }
      );
    });

  } catch (error) {
    res.status(500).json(error);
  }
};

const jwt = require("jsonwebtoken");

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = result[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // generate token
const token = jwt.sign(
  {
    id: user.id,
    role: user.role,
    department_id: user.department_id // 🔥 ADD THIS
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
};