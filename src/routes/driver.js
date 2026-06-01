const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/verifyToken");
const {
  handleDriverLogin,
  handleGetDriverProfile,
  handleGetDriverEntries,
} = require("../controller/driverApp");

// ─────────────────────────────────────────────────────────────
// DRIVER APP ROUTES
// Base path: /api/driver
// ─────────────────────────────────────────────────────────────

// API 1: Driver Login (no token required)
// POST /api/driver/login
// Body: { "mobile": "9XXXXXXXXX" }
router.post("/login", handleDriverLogin);

// API 2: Get Driver Profile (token required)
// GET /api/driver/profile
// Header: Authorization: Bearer <token>
router.get("/profile", verifyToken, handleGetDriverProfile);

// API 3: Get Driver Entries (token required)
// GET /api/driver/entries
// Header: Authorization: Bearer <token>
// Query (optional): page, limit, startDate, endDate, status
router.get("/entries", verifyToken, handleGetDriverEntries);

module.exports = router;
