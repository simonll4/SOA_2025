import { ref } from 'vue'

import { uploadProfileImage } from '@/services/faceProfileService.'

interface UploadStatus {
  name: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  message?: string
}

export function useProfileUpload() {
  const uploads = ref<UploadStatus[]>([])
  const isLoading = ref(false)
  const successMessage = ref('')
  const errorMessage = ref('')

  const handleFileChange = (files: File[], userId: string) => {
    uploads.value = files.map((file) => ({
      name: file.name,
      file,
      status: 'pending',
      message: '',
      preview: URL.createObjectURL(file),
    }))

    successMessage.value = ''
    errorMessage.value = ''
  }

  const uploadFiles = async (userId: string) => {
    isLoading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    let successCount = 0
    let errorCount = 0

    for (const upload of uploads.value) {
      upload.status = 'uploading'
      upload.message = ''

      const formData = new FormData()
      formData.append('file', upload.file)
      formData.append('user_id', userId)
      try {
        await uploadProfileImage(formData)
        upload.status = 'success'
        successCount++
      } catch (error: any) {
        upload.status = 'error'
        upload.message = error?.response?.data?.message || 'Error al subir imagen'
        errorCount++
      }
    }

    if (successCount > 0) {
      successMessage.value = `${successCount} imagen(es) registradas correctamente`
    }

    if (errorCount > 0) {
      errorMessage.value = `${errorCount} imagen(es) fallaron al registrarse`
    }

    isLoading.value = false
  }

  return {
    uploads,
    isLoading,
    successMessage,
    errorMessage,
    handleFileChange,
    uploadFiles,
  }
}
