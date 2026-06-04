<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const { user: authUser, logout } = useAuth()

const user = computed(() => ({
  name: authUser.value?.name ?? 'User',
  avatar: {
    alt: authUser.value?.name ?? 'User'
  }
}))

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar
}], [{
  label: 'Dark mode',
  icon: colorMode.value === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun',
  type: 'checkbox',
  checked: colorMode.value === 'dark',
  onUpdateChecked(checked: boolean) {
    colorMode.preference = checked ? 'dark' : 'light'
  },
  onSelect(e: Event) {
    e.preventDefault()
  }
}], [{
  label: 'Log out',
  icon: 'i-lucide-log-out',
  onSelect() {
    logout()
  }
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
