<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import type { Comment, Sentiment } from '~/types/api'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

useHead({ title: 'Comments' })

const toast = useToast()

const { list: listComments, stats: getStats } = useComments()
const { list: listCategories } = useCategories()

// Filters / pagination (server-driven).
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const categoryFilter = ref('all')
const sentimentFilter = ref('all')

const rowSelection = ref<Record<string, boolean>>({})

// Reset to the first page whenever a filter changes.
watch([debouncedSearch, categoryFilter, sentimentFilter], () => {
  page.value = 1
})

const hasActiveFilters = computed(() =>
  !!search.value || categoryFilter.value !== 'all' || sentimentFilter.value !== 'all'
)

function resetFilters() {
  search.value = ''
  categoryFilter.value = 'all'
  sentimentFilter.value = 'all'
}

// Fetch every category for the filter dropdown (categories are paginated now).
const { data: categoriesData } = await useAsyncData('categories', () => listCategories({ pageSize: 1000 }))

const categoryItems = computed(() => [
  { label: 'All categories', value: 'all' },
  ...(categoriesData.value?.data ?? []).map(c => ({
    label: `${c.name} (${c.commentCount})`,
    value: c.id
  }))
])

const categoryOptions = computed(() =>
  (categoriesData.value?.data ?? []).map(c => ({ label: c.name, value: c.id }))
)

const sentimentItems = [
  { label: 'All sentiments', value: 'all' },
  { label: 'Positive', value: 'POSITIVE' },
  { label: 'Funny', value: 'FUNNY' },
  { label: 'Critical', value: 'CRITICAL' }
]

const { data, status, refresh } = await useAsyncData(
  'comments',
  () => listComments({
    page: page.value,
    pageSize: pageSize.value,
    q: debouncedSearch.value || undefined,
    categoryId: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
    sentiment: sentimentFilter.value === 'all' ? undefined : (sentimentFilter.value as Sentiment)
  }),
  {
    lazy: true,
    watch: [page, pageSize, debouncedSearch, categoryFilter, sentimentFilter]
  }
)

// Stats follow the same filters (total_comments is filtered, total_categories is global).
const { data: statsData } = await useAsyncData(
  'comments-stats',
  () => getStats({
    q: debouncedSearch.value || undefined,
    categoryId: categoryFilter.value === 'all' ? undefined : categoryFilter.value,
    sentiment: sentimentFilter.value === 'all' ? undefined : (sentimentFilter.value as Sentiment)
  }),
  {
    lazy: true,
    watch: [debouncedSearch, categoryFilter, sentimentFilter]
  }
)

// Edit / delete modal state.
const addOpen = ref(false)
const editOpen = ref(false)
const editComment = ref<Comment | null>(null)
const deleteOpen = ref(false)
const deleteIds = ref<string[]>([])

function openEdit(comment: Comment) {
  editComment.value = comment
  editOpen.value = true
}

function openDelete(ids: string[]) {
  deleteIds.value = ids
  deleteOpen.value = true
}

// With `get-row-id` set to the comment id, the selection keys are comment ids.
const selectedIds = computed<string[]>(() =>
  Object.keys(rowSelection.value).filter(id => rowSelection.value[id])
)

function onSaved() {
  refresh()
}

function onDeleted() {
  rowSelection.value = {}
  refresh()
}

const sentimentColor: Record<Sentiment, 'success' | 'warning' | 'error'> = {
  POSITIVE: 'success',
  FUNNY: 'warning',
  CRITICAL: 'error'
}

function getRowItems(row: Row<Comment>) {
  return [
    { type: 'label' as const, label: 'Actions' },
    {
      label: 'Copy text',
      icon: 'i-lucide-clipboard',
      onSelect() {
        navigator.clipboard.writeText(row.original.text)
        toast.add({ title: 'Copied to clipboard' })
      }
    },
    {
      label: 'Copy comment ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id)
        toast.add({ title: 'Comment ID copied to clipboard' })
      }
    },
    { type: 'separator' as const },
    {
      label: 'Edit',
      icon: 'i-lucide-pencil',
      onSelect() {
        openEdit(row.original)
      }
    },
    {
      label: 'Delete',
      icon: 'i-lucide-trash',
      color: 'error' as const,
      onSelect() {
        openDelete([row.original.id])
      }
    }
  ]
}

const columns: TableColumn<Comment>[] = [
  {
    id: 'select',
    header: ({ table }) =>
      h(UCheckbox, {
        'modelValue': table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'ariaLabel': 'Select all'
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        'modelValue': row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'ariaLabel': 'Select row'
      })
  },
  {
    accessorKey: 'text',
    header: 'Comment',
    cell: ({ row }) => h('p', { class: 'max-w-md truncate text-highlighted' }, row.original.text)
  },
  {
    accessorKey: 'sentiment',
    header: 'Sentiment',
    cell: ({ row }) =>
      h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color: sentimentColor[row.original.sentiment]
      }, () => row.original.sentiment.toLowerCase())
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => row.original.category?.name ?? '—'
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString()
  },
  {
    id: 'actions',
    cell: ({ row }) =>
      h('div', { class: 'text-right' },
        h(UDropdownMenu, {
          content: { align: 'end' },
          items: getRowItems(row)
        }, () =>
          h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            class: 'ml-auto'
          })
        )
      )
  }
]
</script>

<template>
  <UDashboardPanel id="comments">
    <template #header>
      <UDashboardNavbar title="Comments">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CommentsBulkCopyModal
            :categories="categoryOptions"
            :default-category-id="categoryFilter"
            :default-sentiment="sentimentFilter"
          >
            <UButton
              label="Bulk copy"
              icon="i-lucide-clipboard-copy"
              color="neutral"
              variant="outline"
            />
          </CommentsBulkCopyModal>

          <CommentsAddModal
            v-model:open="addOpen"
            :categories="categoryOptions"
            @saved="onSaved"
          >
            <UButton label="New comment" icon="i-lucide-plus" />
          </CommentsAddModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-2 gap-4 sm:max-w-md">
        <div class="flex flex-col gap-1 rounded-lg border border-default bg-elevated/25 p-4">
          <div class="flex items-center gap-2 text-muted">
            <UIcon name="i-lucide-message-square" class="size-4" />
            <span class="text-xs uppercase">Comments</span>
          </div>
          <span class="text-2xl font-semibold text-highlighted">
            {{ (statsData?.data.total_comments ?? 0).toLocaleString() }}
          </span>
        </div>

        <div class="flex flex-col gap-1 rounded-lg border border-default bg-elevated/25 p-4">
          <div class="flex items-center gap-2 text-muted">
            <UIcon name="i-lucide-folder" class="size-4" />
            <span class="text-xs uppercase">Categories</span>
          </div>
          <span class="text-2xl font-semibold text-highlighted">
            {{ (statsData?.data.total_categories ?? 0).toLocaleString() }}
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search comments..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            v-if="selectedIds.length"
            label="Delete"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            @click="openDelete(selectedIds)"
          >
            <template #trailing>
              <UKbd>{{ selectedIds.length }}</UKbd>
            </template>
          </UButton>

          <USelect
            v-model="categoryFilter"
            :items="categoryItems"
            placeholder="Category"
            class="min-w-40"
          />

          <USelect
            v-model="sentimentFilter"
            :items="sentimentItems"
            placeholder="Sentiment"
            class="min-w-36"
          />

          <UButton
            v-if="hasActiveFilters"
            label="Reset filter"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="resetFilters"
          />
        </div>
      </div>

      <UTable
        v-model:row-selection="rowSelection"
        :data="data?.data"
        :columns="columns"
        :loading="status === 'pending'"
        :get-row-id="(row: Comment) => row.id"
        class="shrink-0"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      />

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ data?.pagination?.total_items ?? 0 }} comment(s) total.
        </div>

        <UPagination
          v-model:page="page"
          show-edges
          :items-per-page="pageSize"
          :total="data?.pagination?.total_items ?? 0"
        />
      </div>

      <!-- Page-level edit & delete modals driven by row actions -->
      <CommentsAddModal
        v-model:open="editOpen"
        :comment="editComment"
        :categories="categoryOptions"
        @saved="onSaved"
      />

      <CommentsDeleteModal
        v-model:open="deleteOpen"
        :ids="deleteIds"
        @deleted="onDeleted"
      />
    </template>
  </UDashboardPanel>
</template>
