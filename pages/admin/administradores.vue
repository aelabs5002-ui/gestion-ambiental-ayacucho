<script setup lang="ts">
import { Plus, Power, KeyRound, X, CheckCircle2 } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const { data, refresh } = await useFetch<any>('/api/admin/administradores')
const administradores = computed(() => data.value?.administradores || [])

const modalCrear = ref(false)
const toast = ref('')
const errorMsg = ref('')

const form = reactive({
  nombre: '',
  cedula: '',
  correo: '',
  telefono: '0414-7100000',
  password: '',
  rol: 'admin' as 'admin' | 'supervisor'
})

const crear = async () => {
  errorMsg.value = ''
  try {
    await $fetch('/api/admin/administradores', { method: 'POST', body: form })
    modalCrear.value = false
    form.nombre = ''
    form.cedula = ''
    form.correo = ''
    form.password = ''
    toast.value = 'Administrador creado correctamente.'
    setTimeout(() => (toast.value = ''), 3500)
    await refresh()
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || 'No se pudo crear.'
  }
}

const toggleEstado = async (a: any) => {
  const nuevo = a.estado === 'activo' ? 'inactivo' : 'activo'
  await $fetch(`/api/admin/administradores/${a.id}`, {
    method: 'PUT',
    body: { estado: nuevo }
  })
  toast.value = `Estado de ${a.nombre} actualizado a ${nuevo}.`
  setTimeout(() => (toast.value = ''), 3000)
  await refresh()
}

const restablecerPass = async (a: any) => {
  await $fetch(`/api/admin/administradores/${a.id}`, {
    method: 'PUT',
    body: { nuevaPassword: 'TempAyacucho2026*' }
  })
  toast.value = `Contraseña temporal restablecida para ${a.correo} (TempAyacucho2026*).`
  setTimeout(() => (toast.value = ''), 4500)
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-[#1A1A1A]">Gestión de Administradores</h1>
        <p class="text-sm text-[#616161]">Administra los usuarios con rol Administrador y Supervisor Municipal.</p>
      </div>
      <button class="btn-primary" @click="modalCrear = true">
        <Plus class="w-4 h-4" />
        Crear Administrador
      </button>
    </div>

    <div v-if="toast" class="rounded-lg bg-[#E8F5E9] px-4 py-3 text-sm text-[#2E7D32] flex items-center gap-2">
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ toast }}</span>
    </div>

    <div class="card-surface p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr class="bg-[#F5F7FA] text-xs font-semibold uppercase text-[#616161]">
              <th class="py-3 px-4">Nombre</th>
              <th class="py-3 px-4">Cédula</th>
              <th class="py-3 px-4">Correo</th>
              <th class="py-3 px-4">Rol</th>
              <th class="py-3 px-4">Estado</th>
              <th class="py-3 px-4">Último acceso</th>
              <th class="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#EEEEEE] text-sm">
            <tr v-for="a in administradores" :key="a.id" class="hover:bg-[#FAFAFA]">
              <td class="py-3.5 px-4 font-medium text-[#1A1A1A]">{{ a.nombre }}</td>
              <td class="py-3.5 px-4 text-[#616161]">{{ a.cedula }}</td>
              <td class="py-3.5 px-4 text-[#616161]">{{ a.correo }}</td>
              <td class="py-3.5 px-4 capitalize">
                <span class="badge-neutro">{{ a.rol === 'admin' ? 'Administrador' : 'Supervisor' }}</span>
              </td>
              <td class="py-3.5 px-4"><StatusBadge :status="a.estado" /></td>
              <td class="py-3.5 px-4 text-xs text-[#616161]">
                {{ a.ultimoAcceso ? new Date(a.ultimoAcceso).toLocaleString('es-VE') : 'Sin ingresos' }}
              </td>
              <td class="py-3.5 px-4">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="p-1.5 rounded-lg text-[#1565C0] hover:bg-[#1565C0]/10"
                    title="Restablecer contraseña"
                    @click="restablecerPass(a)"
                  >
                    <KeyRound class="w-4 h-4" />
                  </button>
                  <button
                    class="p-1.5 rounded-lg hover:bg-[#FFEBEE]"
                    :class="a.estado === 'activo' ? 'text-[#C62828]' : 'text-[#2E7D32]'"
                    :title="a.estado === 'activo' ? 'Desactivar' : 'Activar'"
                    @click="toggleEstado(a)"
                  >
                    <Power class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal crear -->
    <Teleport to="body">
      <div v-if="modalCrear" class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" @click.self="modalCrear = false">
        <div class="bg-white rounded-xl shadow-modal w-full max-w-md p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Crear Administrador / Supervisor</h3>
            <button class="p-1 rounded hover:bg-[#F5F7FA]" @click="modalCrear = false">
              <X class="w-5 h-5" />
            </button>
          </div>
          <div v-if="errorMsg" class="rounded-lg bg-[#FFEBEE] p-3 text-xs text-[#C62828]">{{ errorMsg }}</div>
          <form class="space-y-3" @submit.prevent="crear">
            <div>
              <label class="block text-xs font-medium mb-1">Nombre completo</label>
              <input v-model="form.nombre" required class="input-field" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium mb-1">Cédula</label>
                <input v-model="form.cedula" required class="input-field" placeholder="V-15000000" />
              </div>
              <div>
                <label class="block text-xs font-medium mb-1">Rol</label>
                <select v-model="form.rol" class="input-field">
                  <option value="admin">Administrador</option>
                  <option value="supervisor">Supervisor (solo lectura)</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Correo electrónico</label>
              <input v-model="form.correo" type="email" required class="input-field" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1">Contraseña temporal</label>
              <input v-model="form.password" type="password" minlength="6" required class="input-field" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" class="btn-ghost" @click="modalCrear = false">Cancelar</button>
              <button type="submit" class="btn-primary">Crear usuario</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
