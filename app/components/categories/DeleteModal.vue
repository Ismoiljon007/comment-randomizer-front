<script setup lang="ts">
import type { ApiError } from '~/types/api'

const props = defineProps<{
  ids: string[]
}>()

const emit = defineEmits<{ deleted: [] }>()

const open = defineModel<boolean>('open', { default: false })

const { remove } = useCategories()
const toast = useToast()

const count = computed(() => props.ids.length)

async function onSubmit() {
  try {
    await Promise.all(props.ids.map(id => remove(id)))
    toast.add({
      title: `Deleted ${count.value} categor${count.value > 1 ? 'ies' : 'y'}`,
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
    :title="`Delete ${count} categor${count > 1 ? 'ies' : 'y'}`"
    description="This also deletes every comment in the category. This action cannot be undone."
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
