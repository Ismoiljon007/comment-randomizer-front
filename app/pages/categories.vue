<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import type { Category } from '~/types/api'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

useHead({ title: 'Categories' })

const toast = useToast()

const { list: listCategories } = useCategories()

// Filters / pagination (server-driven).
const page = ref(1)
const pageSize = ref(20)
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
const rowSelection = ref<Record<string, boolean>>({})

// Reset to the first page whenever the search changes.
watch(debouncedSearch, () => {
  page.value = 1
})

const { data, status, refresh } = await useAsyncData(
  'categories-list',
  () => listCategories({
    page: page.value,
    pageSize: pageSize.value,
    q: debouncedSearch.value || undefined
  }),
  {
    lazy: true,
    watch: [page, pageSize, debouncedSearch]
  }
)

// Modal state.
const addOpen = ref(false)
const editOpen = ref(false)
const editCategory = ref<Category | null>(null)
const deleteOpen = ref(false)
const deleteIds = ref<string[]>([])

function openEdit(category: Category) {
  editCategory.value = category
  editOpen.value = true
}

function openDelete(ids: string[]) {
  deleteIds.value = ids
  deleteOpen.value = true
}

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

function getRowItems(row: Row<Category>) {
  return [
    { type: 'label' as const, label: 'Actions' },
    {
      label: 'Copy category ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id)
        toast.add({ title: 'Category ID copied to clipboard' })
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

const columns: TableColumn<Category>[] = [
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
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => h('p', { class: 'font-medium text-highlighted' }, row.original.name)
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => h(UBadge, { variant: 'subtle', color: 'neutral' }, () => row.original.slug)
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) =>
      h('p', { class: 'max-w-sm truncate text-muted' }, row.original.description || '—')
  },
  {
    accessorKey: 'commentCount',
    header: 'Comments',
    cell: ({ row }) => row.original.commentCount.toLocaleString()
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
  <UDashboardPanel id="categories">
    <template #header>
      <UDashboardNavbar title="Categories">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <CategoriesAddModal
            v-model:open="addOpen"
            @saved="onSaved"
          >
            <UButton label="New category" icon="i-lucide-plus" />
          </CategoriesAddModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search categories..."
        />

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
      </div>

      <UTable
        v-model:row-selection="rowSelection"
        :data="data?.data"
        :columns="columns"
        :loading="status === 'pending'"
        :get-row-id="(row: Category) => row.id"
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
          {{ data?.pagination?.total_items ?? 0 }} categor{{ (data?.pagination?.total_items ?? 0) === 1 ? 'y' : 'ies' }}.
        </div>

        <UPagination
          v-model:page="page"
          :items-per-page="pageSize"
          :total="data?.pagination?.total_items ?? 0"
        />
      </div>

      <!-- Page-level edit & delete modals driven by row actions -->
      <CategoriesAddModal
        v-model:open="editOpen"
        :category="editCategory"
        @saved="onSaved"
      />

      <CategoriesDeleteModal
        v-model:open="deleteOpen"
        :ids="deleteIds"
        @deleted="onDeleted"
      />
    </template>
  </UDashboardPanel>
</template>
