const express = require("express");

const {
  bookSession,
  completeSession,
  cancelSession,
  getMySessions,
  downloadReceipt,
} = require("../controllers/session.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authenticate, bookSession);
router.get("/my", authenticate, getMySessions);
router.patch("/:id/complete", authenticate, completeSession);
router.patch("/:id/cancel", authenticate, cancelSession);
router.get("/:id/receipt", authenticate, downloadReceipt);

module.exports = router;
