/* Auto-generated — do not edit. Run: npm run generate:firebase-sw */
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

firebase.initializeApp({"apiKey":"","authDomain":"","projectId":"","messagingSenderId":"","appId":""});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Nueva notificación";
  const body = payload.notification?.body || "Tienes una notificación nueva.";
  const data = payload.data || {};
  self.registration.showNotification(title, { body, data });
});
