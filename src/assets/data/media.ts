import { mediaBucket, supabase } from '../lib/supabase'

export type UploadedQuestionMedia = {
  mediaName: string
  mediaPath: string
  mediaUrl: string
}

const getSafeFileExtension = (fileName: string) => {
  const extension = fileName.split('.').pop()
  return extension ? extension.toLowerCase() : 'file'
}

export const uploadQuestionMedia = async (file: File): Promise<UploadedQuestionMedia> => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }

  const filePath = `questions/${crypto.randomUUID()}.${getSafeFileExtension(file.name)}`
  const { error } = await supabase.storage.from(mediaBucket).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw error
  }

  const { data } = supabase.storage.from(mediaBucket).getPublicUrl(filePath)

  return {
    mediaName: file.name,
    mediaPath: filePath,
    mediaUrl: data.publicUrl,
  }
}

export const deleteQuestionMedia = async (mediaPath?: string) => {
  if (!mediaPath || !supabase) {
    return
  }

  await supabase.storage.from(mediaBucket).remove([mediaPath])
}
