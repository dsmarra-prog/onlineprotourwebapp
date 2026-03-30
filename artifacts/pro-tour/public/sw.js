self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "Online Pro Tour", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Online Pro Tour", {
      body: data.body ?? "",
      icon: "/pro-tour/opt-logo.png",
      badge: "/pro-tour/opt-logo.png",
      data: { url: data.url ?? "/pro-tour/" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/pro-tour/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/pro-tour") && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
