import { useRef, useCallback } from 'react'

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = useCallback((url: string) => {
    audioRef.current?.pause()
    const audio = new Audio(url)
    audioRef.current = audio
    audio.play().catch((e) => {
      console.warn('Audio play failed:', e.message)
    })
  }, [])

  return play
}
