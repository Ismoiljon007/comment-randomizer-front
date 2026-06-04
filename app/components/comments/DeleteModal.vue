<script setup lang="ts">
import type { ApiError } from '~/types/api'

const props = defineProps<{
  ids: string[]
}>()

const emit = defineEmits<{ deleted: [] }>()

const open = defineModel<boolean>('open', { default: false })

const { remove } = useComments()
const toast = useToast()

const count = computed(() => props.ids.length)

async function onSubmit() {
  try {
    await Promise.all(props.ids.map(id => remove(id)))
    toast.add({
      title: `Deleted ${count.value} comment${count.value > 1 ? 's' : ''}`,
      color: 'success'
    })
    open.value = false
    emit('deleted')
  } catch (error) {
    const apiError = (error as { data?: ApiError })?.data
    toast.add({
      title: 'Failed to delete',
      description: apiError?.message || 'Something went wrong',
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Delete ${count} comment${count > 1 ? 's' : ''}`"
    description="Are you sure? This action cannot be undone."
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          label="Delete"
          color="error"
          variant="solid"
          loading-auto
          @click="onSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
