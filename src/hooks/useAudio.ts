import { useCallback } from 'react'

export function useAudio() {
  const play = useCallback((url: string) => {
    const audio = new Audio(url)
    audio.play().catch(() => {
      // 用户未交互或文件不存在时静默失败
    })
  }, [])

  return play
}
