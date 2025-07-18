<template>
  <div class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-2 animate-pulse"></div>
      <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-64 animate-pulse"></div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Dispositivo
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Estado
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Ubicación
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Última Conexión
            </th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="i in 3" :key="i" class="animate-pulse">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-28"></div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <div class="h-4 bg-gray-300 dark:bg-gray-600 rounded w-8 ml-auto"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template> 