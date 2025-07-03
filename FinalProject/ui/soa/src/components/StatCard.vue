<script setup lang="ts">
const props = defineProps<{ title: string; value: number; iconBg: string; iconPath: string }>()
</script>

<template>
  <div class="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
    <div class="p-5">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div
            :class="
              ['w-8', 'h-8', iconBg, 'rounded-md', 'flex', 'items-center', 'justify-center'].join(
                ' ',
              )
            "
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconPath" />
            </svg>
          </div>
        </div>
        <div class="ml-5 w-0 flex-1">
          <dl>
            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {{ title }}
            </dt>
            <dd class="text-lg font-medium text-gray-900 dark:text-white">{{ value }}</dd>
          </dl>
        </div>
      </div>
    </div>
  </div>
</template>
