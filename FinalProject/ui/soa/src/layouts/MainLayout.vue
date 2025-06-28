<template>
  <!-- Drawer wrapper -->
  <div class="drawer lg:drawer-open">
    <!-- Mobile toggle -->
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />

    <!-- MAIN CONTENT -->
    <div class="drawer-content flex flex-col h-screen">
      <!-- Navbar -->
      <div class="navbar bg-base-200 px-4 shadow-md">
        <div class="flex-none lg:hidden">
          <label for="drawer-toggle" class="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
        </div>
        <div class="flex-1">
          <a class="btn btn-ghost normal-case text-xl">SOA Monitor</a>
        </div>
        <!-- Right side actions placeholder (Auth state) -->
        <div class="flex-none gap-2">
          <slot name="navbar-actions" />
        </div>
      </div>

      <!-- Routed page content -->
      <main class="flex-1 overflow-hidden">
        <RouterView />
      </main>
    </div>

    <!-- SIDE DRAWER -->
    <div class="drawer-side z-40">
      <label for="drawer-toggle" class="drawer-overlay"></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-300 text-base-content gap-2">
        <CommandDrawer />
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import CommandDrawer from '@/components/CommandDrawer.vue'
</script>

<style scoped>
/* Ninguno por ahora */
</style> 