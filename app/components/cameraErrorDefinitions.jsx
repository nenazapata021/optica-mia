// Define camera error configurations
export const cameraErrorDefinitions = {
  permisos: {
    titulo: "Permiso de cámara denegado",
    detalle: "Bloqueaste el acceso a la cámara. Ve a la configuración de tu navegador, permite el acceso a la cámara para este sitio y recarga la página.",
    icono: "🔒",
  },
  "no-encontrada": {
    titulo: "No se encontró ninguna cámara",
    detalle: "Tu dispositivo no tiene cámara disponible o no está conectada correctamente. Puedes subir una foto en su lugar.",
    icono: "📷",
  },
  "en-uso": {
    titulo: "Cámara ocupada por otra aplicación",
    detalle: "La cámara está siendo usada por otro programa (videollamada, otra pestaña, etc.). Ciérralo e inténtalo de nuevo.",
    icono: "⚠️",
  },
  configuracion: {
    titulo: "Configuración de cámara no compatible",
    detalle: "Tu cámara no admite la resolución requerida. Intenta de nuevo; usaremos una resolución más baja.",
    icono: "⚙️",
  },
  desconocido: {
    titulo: "No se pudo activar la cámara",
    detalle: "Ocurrió un error inesperado al intentar acceder a la cámara. Revisa los permisos del navegador o sube una foto en su lugar.",
    icono: "🚫",
  },
};
