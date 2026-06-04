<script setup lang="ts">
import type { ApiError, Sentiment } from '~/types/api'

const props = defineProps<{
  categories: { label: string, value: string }[]
  defaultCategoryId?: string
  defaultSentiment?: string
}>()

const open = defineModel<boolean>('open', { default: false })

const { bulkCopy } = useComments()
const toast = useToast()

const categoryItems = computed(() => [
  { label: 'All categories', value: 'all' },
  ...props.categories
])

const sentimentItems = [
  { label: 'All sentiments', value: 'all' },
  { label: 'Positive', value: 'POSITIVE' },
  { label: 'Funny', value: 'FUNNY' },
  { label: 'Critical', value: 'CRITICAL' }
]

const state = reactive({
  categoryId: 'all',
  sentiment: 'all',
  limit: 1000,
  random: true
})

// Reset to the current page filters each time the modal opens.
watch(open, (isOpen) => {
  if (!isOpen) return
  state.categoryId = props.defaultCategoryId ?? 'all'
  state.sentiment = props.defaultSentiment ?? 'all'
  state.limit = 1000
  state.random = true
})

const loading = ref(false)

async function onCopy() {
  loading.value = true
  try {
    const res = await bulkCopy({
      categoryId: state.categoryId === 'all' ? undefined : state.categoryId,
      sentiment: state.sentiment === 'all' ? undefined : (state.sentiment as Sentiment),
      limit: state.limit,
      random: state.random
    })

    await navigator.clipboard.writeText(res.data.text)

    toast.add({
      title: `Copied ${res.data.count} comment${res.data.count === 1 ? '' : 's'}`,
      description: `${res.data.total} matched the filters`,
      icon: 'i-lucide-clipboard-check',
      color: 'success'
    })
    open.value = false
  } catch (error) {
    const apiError = (error as { data?: ApiError })?.data
    toast.add({
      title: 'Bulk copy failed',
      description: apiError?.message || 'Something went wrong',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Bulk copy comments"
    description="Copy many comment texts to your clipboard, joined by new lines."
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <UFormField label="Category">
          <USelect
            v-model="state.categoryId"
            :items="categoryItems"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Sentiment">
          <USelect
            v-model="state.sentiment"
            :items="sentimentItems"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Limit" description="How many comments to copy (1–50000).">
          <UInputNumber
            v-model="state.limit"
            :min="1"
            :max="50000"
            class="w-full"
          />
        </UFormField>

        <UFormField>
          <USwitch
            v-model="state.random"
            label="Random order"
            description="Pick comments randomly instead of newest first."
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="Copy to clipboard"
            icon="i-lucide-clipboard-copy"
            color="primary"
            :loading="loading"
            @click="onCopy"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
