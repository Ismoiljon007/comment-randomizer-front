<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { ApiError } from '~/types/api'

definePageMeta({
  layout: false
})

useHead({ title: 'Sign in' })

const { login } = useAuth()
const toast = useToast()

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: '',
  password: ''
})

const loading = ref(false)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true
  try {
    await login(event.data.email, event.data.password)
    await navigateTo('/')
  } catch (error) {
    const apiError = (error as { data?: ApiError })?.data
    toast.add({
      title: 'Login failed',
      description: apiError?.message || 'Invalid email or password',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-muted">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="flex flex-col items-center gap-1 text-center">
          <UIcon name="i-lucide-lock" class="size-8 text-primary" />
          <h1 class="text-lg font-semibold text-highlighted">
            Sign in
          </h1>
          <p class="text-sm text-muted">
            Enter your credentials to access the dashboard
          </p>
        </div>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Email" name="email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="admin@example.com"
            icon="i-lucide-mail"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="state.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
            autocomplete="current-password"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          label="Sign in"
          block
          :loading="loading"
        />
      </UForm>
    </UCard>
  </div>
</template>
