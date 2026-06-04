<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ApiError, Comment } from '~/types/api'

const props = defineProps<{
  comment?: Comment | null
  categories: { label: string, value: string }[]
}>()

const emit = defineEmits<{ saved: [] }>()

const open = defineModel<boolean>('open', { default: false })

const isEdit = computed(() => !!props.comment)

const { create, update } = useComments()
const toast = useToast()

const schema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  text: z.string().min(1, 'Text is required').max(1000, 'Too long'),
  sentiment: z.enum(['POSITIVE', 'FUNNY', 'CRITICAL'])
})

type Schema = z.output<typeof schema>

const sentiments = [
  { label: 'Positive', value: 'POSITIVE' },
  { label: 'Funny', value: 'FUNNY' },
  { label: 'Critical', value: 'CRITICAL' }
]

const state = reactive<Partial<Schema>>({
  categoryId: undefined,
  text: '',
  sentiment: 'POSITIVE'
})

// Populate the form whenever the modal opens (create vs edit).
watch(open, (isOpen) => {
  if (!isOpen) return
  state.categoryId = props.comment?.categoryId ?? props.categories[0]?.value
  state.text = props.comment?.text ?? ''
  state.sentiment = props.comment?.sentiment ?? 'POSITIVE'
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  try {
    if (props.comment) {
      await update(props.comment.id, event.data)
      toast.add({ title: 'Comment updated', color: 'success' })
    } else {
      await create(event.data)
      toast.add({ title: 'Comment created', color: 'success' })
    }
    open.value = false
    emit('saved')
  } catch (error) {
    const apiError = (error as { data?: ApiError })?.data
    toast.add({
      title: isEdit.value ? 'Failed to update comment' : 'Failed to create comment',
      description: apiError?.message || 'Something went wrong',
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? 'Edit comment' : 'New comment'"
    :description="isEdit ? 'Update the comment details' : 'Add a new comment'"
  >
    <slot />

    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Category" name="categoryId">
          <USelect
            v-model="state.categoryId"
            :items="categories"
            placeholder="Select a category"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Sentiment" name="sentiment">
          <USelect
            v-model="state.sentiment"
            :items="sentiments"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Text" name="text">
          <UTextarea
            v-model="state.text"
            :rows="4"
            placeholder="Write the comment..."
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
