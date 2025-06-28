import { ref } from 'vue'

const showCommandPanel = ref(false)
const selectedRaspberry = ref<string | null>(null)
const showFaceVerification = ref(false)
const pendingCriticalCommand = ref<any>(null) // podemos tipar mejor si tenemos interfaz

export function useCommandPanel() {
  const openCommandPanel = (raspberryId: string) => {
    selectedRaspberry.value = raspberryId
    showCommandPanel.value = true
  }

  const closeCommandPanel = () => {
    showCommandPanel.value = false
    selectedRaspberry.value = null
  }

  const handleCriticalCommand = (command: any) => {
    pendingCriticalCommand.value = command
    showFaceVerification.value = true
  }

  const handleFaceVerified = () => {
    if (pendingCriticalCommand.value) {
      //TODO: Aquí deberíamos invocar la lógica real de ejecución
      console.log('Executing critical command:', pendingCriticalCommand.value)
      // Reset
      pendingCriticalCommand.value = null
      showFaceVerification.value = false
    }
  }

  const closeFaceVerification = () => {
    showFaceVerification.value = false
    pendingCriticalCommand.value = null
  }

  return {
    showCommandPanel,
    selectedRaspberry,
    showFaceVerification,
    pendingCriticalCommand,
    openCommandPanel,
    closeCommandPanel,
    handleCriticalCommand,
    handleFaceVerified,
    closeFaceVerification,
  }
} 