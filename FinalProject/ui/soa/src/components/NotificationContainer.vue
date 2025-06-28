<template>
  <div class="fixed top-4 right-4 z-50 space-y-3 max-w-md">
    <transition-group name="notification" tag="div" class="space-y-3">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          'w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 hover:scale-105',
          notification.type === 'success' ? 'border-l-4 border-green-500' : '',
          notification.type === 'error' ? 'border-l-4 border-red-500' : '',
          notification.type === 'warning' ? 'border-l-4 border-yellow-500' : '',
          notification.type === 'info' ? 'border-l-4 border-blue-500' : ''
        ]"
      >
        <div class="p-4">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 mt-0.5">
              <div :class="[
                'w-8 h-8 rounded-full flex items-center justify-center',
                notification.type === 'success' ? 'bg-green-100 dark:bg-green-900' : '',
                notification.type === 'error' ? 'bg-red-100 dark:bg-red-900' : '',
                notification.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' : '',
                notification.type === 'info' ? 'bg-blue-100 dark:bg-blue-900' : ''
              ]">
                <svg v-if="notification.type === 'success'" class="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="notification.type === 'error'" class="h-4 w-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else-if="notification.type === 'warning'" class="h-4 w-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01" />
                </svg>
                <svg v-else class="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01" />
                </svg>
              </div>
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white leading-5">
                    {{ notification.title }}
                  </p>
                  <p v-if="notification.message" class="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words">
                    {{ notification.message }}
                  </p>
                </div>
                
                <button 
                  @click="removeNotification(notification.id)" 
                  class="ml-3 flex-shrink-0 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Progress bar for auto-dismiss -->
          <div class="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              :class="[
                'h-full rounded-full transition-all duration-75 ease-linear progress-bar',
                notification.type === 'success' ? 'bg-green-500' : '',
                notification.type === 'error' ? 'bg-red-500' : '',
                notification.type === 'warning' ? 'bg-yellow-500' : '',
                notification.type === 'info' ? 'bg-blue-500' : ''
              ]"
              style="animation: progress 5s linear forwards;"
            ></div>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'

const { notifications, removeNotification } = useNotifications()
</script>

<style scoped>
.notification-enter-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0.055, 0.675, 0.19);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.notification-move {
  transition: transform 0.3s ease;
}

@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.progress-bar {
  width: 100%;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .fixed.top-4.right-4 {
    top: 1rem;
    right: 1rem;
    left: 1rem;
    max-width: none;
  }
}
</style> 