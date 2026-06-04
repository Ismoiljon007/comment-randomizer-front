<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ApiError, Category } from '~/types/api'

const props = defineProps<{
  category?: Category | null
}>()

const emit = defineEmits<{ saved: [] }>()

const open = defineModel<boolean>('open', { default: false })

const isEdit = computed(() => !!props.category)

const { create, update } = useCategories()
const toast = useToast()

const schema = z.object({
  name: z.string().min(2, 'Too short').max(80, 'Too long'),
  description: z.string().max(500, 'Too long').optional()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  name: '',
  description: ''
})

watch(open, (isOpen) => {
  if (!isOpen) return
  state.name = props.category?.name ?? ''
  state.description = props.category?.description ?? ''
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    if (props.category) {
      await update(props.category.id, {
        name: event.data.name,
        description: event.data.description || null
      })
      toast.add({ title: 'Category updated', color: 'success' })
    } else {
      await create({
        name: event.data.name,
        description: event.data.description || undefined
      })
      toast.add({ title: 'Category created', color: 'success' })
    }
    open.value = false
    emit('saved')
  } catch (error) {
    const apiError = (error as { data?: ApiError })?.data
    toast.add({
      title: isEdit.value ? 'Failed to update category' : 'Failed to create category',
      description: apiError?.message || 'Something went wrong',
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? 'Edit category' : 'New category'"
    :description="isEdit ? 'Update the category details' : 'Add a new category'"
  >
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Name" name="name">
          <UInput
            v-model="state.name"
            placeholder="e.g. GTA 6"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea
            v-model="state.description"
            :rows="3"
            placeholder="Optional description..."
            class="w-full"
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
            :label="isEdit ? 'Save' : 'Create'"
            color="primary"
            variant="solid"
            type="submit"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
