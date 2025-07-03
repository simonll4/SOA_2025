import { faceHttp } from './http'
import { useAuthHeaders } from './useAuthHeaders'

export async function recognizeFace(formData: FormData) {
  const headers = useAuthHeaders({
    'Content-Type': 'multipart/form-data',
  })

  return faceHttp.post('/face/recognize', formData, { headers })
}
