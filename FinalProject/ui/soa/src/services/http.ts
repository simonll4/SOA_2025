import axios from 'axios'

export const mqttHttp = axios.create({
  baseURL: import.meta.env.VITE_COMMANDS_API_URL,
})

export const profileHttp = axios.create({
  baseURL: import.meta.env.VITE_PROFILE_API_URL,
})

export const faceHttp = axios.create({
  baseURL: import.meta.env.VITE_FACE_RECOGNITION_API_URL,
})
