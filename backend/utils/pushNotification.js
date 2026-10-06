const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Send push notification
const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Push Notification Error:",
      error.message
    );

    return {
      success: false,
      error,
    };
  }
};

module.exports = {
  sendPushNotification,
};