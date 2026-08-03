export type ModelId = 'juggernaut-xl' | 'instant-id' | 'liveportrait' | 'wan2-1-uncensored'
export type MediaType = 'image' | 'video'

export interface ModelConfig {
  id: ModelId
  name: string
  description: string
  mediaType: MediaType
  needsPrompt: boolean
  needsNegativePrompt: boolean
  needsFaceImage: boolean
  needsDrivingVideo: boolean
  promptPlaceholder?: string
  negativePromptPlaceholder?: string
}

// Configuración completa de los modelos
export const MODELS: ModelConfig[] = [
  {
    id: 'juggernaut-xl',
    name: 'Juggernaut XL',
    description: 'Imágenes ultra realistas y de alta calidad a partir de una descripción de texto.',
    mediaType: 'image',
    needsPrompt: true,
    needsNegativePrompt: true,
    needsFaceImage: false,
    needsDrivingVideo: false,
    promptPlaceholder: 'Ej: retrato cinematográfico, luz dorada, ultra realista, 8k...',
    negativePromptPlaceholder: 'Ej: borroso, baja calidad, deformado, dedos extra...',
  },
  {
    id: 'instant-id',
    name: 'InstantID',
    description: 'Genera imágenes conservando el rostro de una foto de referencia.',
    mediaType: 'image',
    needsPrompt: true,
    needsNegativePrompt: true,
    needsFaceImage: true,
    needsDrivingVideo: false,
    promptPlaceholder: 'Ej: la misma persona como modelo de revista, luz de estudio...',
    negativePromptPlaceholder: 'Ej: borroso, baja calidad, deformado, dedos extra...',
  },
  {
    id: 'liveportrait',
    name: 'LivePortrait Video',
    description: 'Anima una foto de rostro usando un video guía de referencia.',
    mediaType: 'video',
    needsPrompt: false,
    needsNegativePrompt: false,
    needsFaceImage: true,
    needsDrivingVideo: true,
  },
  {
    id: 'wan2-1-uncensored',
    name: 'Wan2.1 Sin Censura',
    description: 'Genera videos realistas sin restricciones a partir de una descripción.',
    mediaType: 'video',
    needsPrompt: true,
    needsNegativePrompt: false,
    needsFaceImage: false,
    needsDrivingVideo: false,
    promptPlaceholder: 'Ej: escena natural, movimiento fluido, alta definición...',
  }
]

export function getModel(id: string): ModelConfig | undefined {
  return MODELS.find((m) => m.id === id)
}

