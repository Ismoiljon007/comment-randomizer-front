<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

const siteName = 'Comment Randomizer'
const description = 'Generate, filter and bulk-copy randomized comments by category and sentiment.'

useHead({
  titleTemplate: title => title ? `${title} · ${siteName}` : siteName,
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', href: '/favicon.ico', sizes: '32x32' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  description,
  ogType: 'website',
  ogSiteName: siteName,
  ogTitle: siteName,
  ogDescription: description,
  twitterCard: 'summary',
  twitterTitle: siteName,
  twitterDescription: description
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
