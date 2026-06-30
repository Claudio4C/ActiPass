import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'

import { api } from './api'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId && vapidKey,
)

const getFirebaseApp = () => {
  if (!isFirebaseConfigured) { return null }
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export const registerPushToken = async (): Promise<boolean> => {
  if (!isFirebaseConfigured) { return false }
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) { return false }

  const supported = await isSupported().catch(() => false)
  if (!supported) { return false }

  const app = getFirebaseApp()
  if (!app) { return false }

  try {
    const swParams = new URLSearchParams({
      apiKey: firebaseConfig.apiKey || '',
      projectId: firebaseConfig.projectId || '',
      messagingSenderId: firebaseConfig.messagingSenderId || '',
      appId: firebaseConfig.appId || '',
    })
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${swParams.toString()}`,
    )
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    })
    if (!token) { return false }

    await api.post('/users/me/fcm-token', { token })
    return true
  } catch (e) {
    console.error('Push registration failed:', e)
    return false
  }
}

export const unregisterPushToken = async (): Promise<void> => {
  if (!isFirebaseConfigured) { return }
  const app = getFirebaseApp()
  if (!app) { return }
  const supported = await isSupported().catch(() => false)
  if (!supported) { return }
  try {
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey }).catch(() => null)
    if (token) {
      await api.post('/users/me/fcm-token/remove', { token })
    }
  } catch { /* silently ignore */ }
}

export const requestPushPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) { return false }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') { return false }

  return registerPushToken()
}

export const isPushSupportedAndConfigured = (): boolean =>
  isFirebaseConfigured && typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator

let foregroundListenerActive = false

export const listenForegroundMessages = (): void => {
  if (foregroundListenerActive || !isFirebaseConfigured) { return }
  if (typeof window === 'undefined' || !('Notification' in window)) { return }

  isSupported().then((supported) => {
    if (!supported) { return }
    const app = getFirebaseApp()
    if (!app) { return }
    const messaging = getMessaging(app)
    foregroundListenerActive = true
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'Actipass'
      const body  = payload.notification?.body  ?? ''
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/vite.svg' })
      }
    })
  }).catch(() => {})
}
