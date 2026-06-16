<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Comments',
  icon: 'i-lucide-message-square',
  to: '/comments',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Categories',
  icon: 'i-lucide-folder',
  to: '/categories',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][]

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accept',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Opt out',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default-wide"
      v-model:open="open"
      collapsible
      resizable
      :min-size="16"
      :default-size="18"
      :max-size="24"
      :collapsed-size="4.5"
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default', header: 'w-full px-5' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-semibold text-highlighted"
        >
          <span class="inline-flex items-center justify-center size-8 rounded-lg bg-primary text-inverted shrink-0">
            <UIcon name="i-lucide-message-square-text" class="size-5" />
          </span>
          <span v-if="!collapsed" class="truncate">Comment Randomizer</span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
          :ui="{
            link: 'p-2.5 gap-2.5',
            linkLeadingIcon: 'size-5'
          }"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
