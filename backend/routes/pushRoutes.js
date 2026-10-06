const express = require("express");

const {
  savePushSubscription,
  removePushSubscription,
} = require("../controllers/pushController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Save browser push subscription
router.post(
  "/subscribe",
  protect,
  savePushSubscription
);

// Remove browser push subscription
router.delete(
  "/unsubscribe",
  protect,
  removePushSubscription
);

module.exports = router;