import { ref } from 'vue'

export interface Notification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  timestamp: Date
}

const notifications = ref<Notification[]>([])
let notificationId = 0

export function useNotifications() {
  const addNotification = ({
    type = 'info',
    title,
    message,
    duration = 5000,
  }: {
    type?: Notification['type']
    title: string
    message?: string
    duration?: number
  }) => {
    const id = ++notificationId
    const notification: Notification = {
      id,
      type,
      title,
      message,
      timestamp: new Date(),
    }

    notifications.value.push(notification)

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }

    return id
  }

  const removeNotification = (id: number) => {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAll = () => {
    notifications.value = []
  }

  // Convenience helpers
  const success = (title: string, message?: string, duration?: number) =>
    addNotification({ type: 'success', title, message, duration })

  const error = (title: string, message?: string, duration?: number) =>
    addNotification({ type: 'error', title, message, duration })

  const warning = (title: string, message?: string, duration?: number) =>
    addNotification({ type: 'warning', title, message, duration })

  const info = (title: string, message?: string, duration?: number) =>
    addNotification({ type: 'info', title, message, duration })

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    success,
    error,
    warning,
    info,
  }
} 