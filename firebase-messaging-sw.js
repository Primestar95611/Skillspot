importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD7dRYpXukVlyV6ipmCfbCXEJ4kp8t1Gmg",
  authDomain: "gigscourt.firebaseapp.com",
  projectId: "gigscourt",
  storageBucket: "gigscourt.firebasestorage.app",
  messagingSenderId: "1055157379736",
  appId: "1:1055157379736:web:215763c63606c2c5a966ed",
  measurementId: "G-BY1YBSYJHV"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'GigsCourt';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    data: payload.data || {}
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
