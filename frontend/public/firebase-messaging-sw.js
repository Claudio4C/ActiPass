/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCXtZAmbqOmEAB2hmGlJLcuuf5m0sPxRHw',
  projectId: 'actipass-dev',
  messagingSenderId: '22313889835',
  appId: '1:22313889835:web:85858171800c503e12ba6e',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Actipass'
  const body  = payload.notification?.body  || ''
  const link  = payload.fcmOptions?.link || payload.data?.link || '/'

  self.registration.showNotification(title, {
    body,
    icon: '/vite.svg',
    data: { link },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link || '/'
  event.waitUntil(self.clients.openWindow(link))
})
