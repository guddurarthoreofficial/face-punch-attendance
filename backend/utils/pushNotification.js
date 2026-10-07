const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// ==========================================
// SEND ONE PUSH NOTIFICATION
// ==========================================

const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));

    return {
      success: true,
    };
  } catch (error) {
    console.error("Push Notification Error:", error.message);

    return {
      success: false,
      error,
    };
  }
};

// ==========================================
// SEND PUSH TO USER
// ==========================================

const sendPushNotificationToUser = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({
      user: userId,
    });

    if (subscriptions.length === 0) {
      return {
        success: false,
        message: "No push subscription found",
      };
    }

    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        };

        const result = await sendPushNotification(pushSubscription, payload);

        // Remove expired subscription
        if (!result.success) {
          const statusCode = result.error?.statusCode;

          if (statusCode === 404 || statusCode === 410) {
            await PushSubscription.deleteOne({
              _id: subscription._id,
            });
          }
        }

        return result.success;
      }),
    );

    return {
      success: results.some(Boolean),
    };
  } catch (error) {
    console.error("Send User Push Error:", error);

    return {
      success: false,
      message: "Failed to send user notification",
    };
  }
};

module.exports = {
  sendPushNotification,
  sendPushNotificationToUser,
};
