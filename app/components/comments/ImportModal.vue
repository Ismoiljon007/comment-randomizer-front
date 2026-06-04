<script setup lang="ts">
import type { ApiError, CommentImportResult } from '~/types/api'

const emit = defineEmits<{ imported: [] }>()

const open = defineModel<boolean>('open', { default: false })

const { upload, templateUrl } = useComments()
const toast = useToast()

const file = ref<File | null>(null)
const loading = ref(false)
const result = ref<CommentImportResult | null>(null)

// Reset state every time the modal opens.
watch(open, (isOpen) => {
  if (!isOpen) return
  file.value = null
  result.value = null
})

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  file.value = target.files?.[0] ?? null
}

function downloadTemplate() {
  window.open(templateUrl(), '_blank')
}

async function onUpload() {
  if (!file.value) return
  loading.value = true
  try {
    const res = await upload(file.value)
    result.value = res.data
    toast.add({
      title: `Imported ${res.data.created_comments} comment${res.data.created_comments === 1 ? '' : 's'}`,
      description: res.data.skipped ? `${res.data.skipped} row(s) skipped` : undefined,
      icon: 'i-lucide-file-check',
      color: 'success'
    })
    emit('imported')
  } catch (error) {
    const apiError = (error as { data?: ApiError })?.data
    toast.add({
      title: 'Import failed',
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
    title="Import comments"
    description="Upload an .xlsx or .csv file. Missing categories are created automatically."
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-3 rounded-lg border border-default p-3">
          <div class="text-sm">
            <p class="font-medium text-highlighted">
              Need the format?
            </p>
            <p class="text-muted">
              Download the template with the correct headers.
            </p>
          </div>
          <UButton
            label="Template"
            icon="i-lucide-download"
            color="neutral"
            variant="subtle"
            @click="downloadTemplate"
          />
        </div>

        <UFormField label="File" description="Columns: category, text, sentiment. .xlsx or .csv, max 4 MB.">
          <input
            type="file"
            accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            class="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-elevated file:px-3 file:py-1.5 file:text-default hover:file:bg-accented"
            @change="onFileChange"
          >
        </UFormField>

        <!-- Import summary -->
        <div v-if="result" class="space-y-3 rounded-lg border border-default p-3">
          <div class="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>
              <p class="text-muted text-xs uppercase">
                Rows
              </p>
              <p class="font-semibold text-highlighted">
                {{ result.total_rows }}
              </p>
            </div>
            <div>
              <p class="text-muted text-xs uppercase">
                Comments
              </p>
              <p class="font-semibold text-success">
                {{ result.created_comments }}
              </p>
            </div>
            <div>
              <p class="text-muted text-xs uppercase">
                Categories
              </p>
              <p class="font-semibold text-highlighted">
                {{ result.created_categories }}
              </p>
            </div>
            <div>
              <p class="text-muted text-xs uppercase">
                Skipped
              </p>
              <p class="font-semibold" :class="result.skipped ? 'text-warning' : 'text-highlighted'">
                {{ result.skipped }}
              </p>
            </div>
          </div>

          <div v-if="result.errors.length" class="space-y-1">
            <p class="text-xs font-medium uppercase text-muted">
              Errors
            </p>
            <ul class="max-h-40 space-y-1 overflow-y-auto text-sm">
              <li
                v-for="(err, index) in result.errors"
                :key="index"
                class="flex gap-2 text-muted"
              >
                <UBadge color="error" variant="subtle" size="sm">
                  Row {{ err.row }}
                </UBadge>
                <span>{{ err.message }}</span>
              </li>
            </ul>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            :label="result ? 'Close' : 'Cancel'"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="Upload"
            icon="i-lucide-upload"
            color="primary"
            :loading="loading"
            :disabled="!file"
            @click="onUpload"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
