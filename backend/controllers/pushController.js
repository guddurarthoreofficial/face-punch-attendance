const PushSubscription = require("../models/PushSubscription");
const { sendPushNotification } = require("../utils/pushNotification");

// ==========================================
// SAVE PUSH SUBSCRIPTION
// ==========================================
const savePushSubscription = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription data",
      });
    }

    const subscription = await PushSubscription.findOneAndUpdate(
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
      },
    );

    res.status(200).json({
      success: true,
      message: "Push subscription saved successfully",
      subscriptionId: subscription._id,
    });
  } catch (error) {
    console.error("Save Push Subscription Error:", error);

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
    console.error("Remove Push Subscription Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// SEND TEST PUSH NOTIFICATION
// ==========================================
const sendTestPushNotification = async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find({
      user: req.user._id,
    });

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No push subscription found",
      });
    }

    const payload = {
      title: "🏫 School Attendance",
      body: "Push notifications are working successfully! 🔔",
      url: "/employee/profile",
    };

    const results = [];

    for (const subscription of subscriptions) {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      const result = await sendPushNotification(pushSubscription, payload);

      // Remove expired/invalid subscription
      if (!result.success) {
        const statusCode = result.error?.statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await PushSubscription.deleteOne({
            _id: subscription._id,
          });
        }
      }

      results.push(result.success);
    }

    const sent = results.some(Boolean);

    return res.status(sent ? 200 : 500).json({
      success: sent,
      message: sent
        ? "Test push notification sent successfully"
        : "Failed to send push notification",
    });
  } catch (error) {
    console.error("Test Push Notification Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  savePushSubscription,
  removePushSubscription,
  sendTestPushNotification,
};
