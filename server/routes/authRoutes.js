const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

module.exports = router;

const { verifyToken, authorizeRoles } = require("../middleware/authMiddleware");

router.get(
  "/student-dashboard",
  verifyToken,
  authorizeRoles("student"),
  (req, res) => {
    res.json({ message: "Welcome Student Dashboard" });
  }
);