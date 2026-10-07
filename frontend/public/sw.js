self.addEventListener("push", (event) => {
  let data = {
    title: "School Attendance",
    body: "You have a new notification.",
    url: "/employee",
  };

  if (event.data) {
    try {
      // Our backend sends JSON
      data = event.data.json();
    } catch (error) {
      // Chrome DevTools test push sends plain text
      data = {
        title: "School Attendance",
        body: event.data.text(),
        url: "/employee",
      };
    }
  }

  const title = data.title || "School Attendance";

  const options = {
    body: data.body || "You have a new notification.",

    icon: data.icon || "/pwa-192x192.png",

    badge: data.badge || "/pwa-192x192.png",

    data: {
      url: data.url || "/employee",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification?.data?.url || "/employee";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      }),
  );
});
