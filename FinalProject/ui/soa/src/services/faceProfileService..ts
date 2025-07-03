import { faceHttp } from './http'
import { useAuthHeaders } from './useAuthHeaders'

export async function uploadProfileImage(formData: FormData) {
  const headers = useAuthHeaders({
    'Content-Type': 'multipart/form-data',
  })

  return faceHttp.post('/profile/upload', formData, { headers })
}
