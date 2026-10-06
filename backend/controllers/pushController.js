const PushSubscription = require("../models/PushSubscription");

// ==========================================
// SAVE PUSH SUBSCRIPTION
// ==========================================
const savePushSubscription = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (
      !endpoint ||
      !keys ||
      !keys.p256dh ||
      !keys.auth
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription data",
      });
    }

    const subscription =
      await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
          user: req.user._id,
          endpoint,
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );

    res.status(200).json({
      success: true,
      message: "Push subscription saved successfully",
      subscriptionId: subscription._id,
    });
  } catch (error) {
    console.error(
      "Save Push Subscription Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// REMOVE PUSH SUBSCRIPTION
// ==========================================
const removePushSubscription = async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: "Endpoint is required",
      });
    }

    await PushSubscription.deleteOne({
      endpoint,
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      message: "Push subscription removed",
    });
  } catch (error) {
    console.error(
      "Remove Push Subscription Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  savePushSubscription,
  removePushSubscription,
};