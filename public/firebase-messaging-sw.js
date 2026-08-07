/* Auto-generated — do not edit. Run: npm run generate:firebase-sw */
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js");

firebase.initializeApp({"apiKey":"AIzaSyBJ1qYA08WyD6VesCynyjVW-w-tWDHuSF8","authDomain":"inmaculada-music-a391e.firebaseapp.com","projectId":"inmaculada-music-a391e","messagingSenderId":"96819397885","appId":"1:96819397885:web:ab30cdf0728a5b027b2a94"});
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Nueva notificación";
  const body = payload.notification?.body || "Tienes una notificación nueva.";
  const data = payload.data || {};
  self.registration.showNotification(title, { body, data });
});
