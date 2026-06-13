import { useRef, useCallback } from 'react'

// 预加载语音列表，查找日语语音
function getVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  // 优先日语
  const ja = voices.find((v) => v.lang.startsWith('ja'))
  if (ja) return ja
  // 其次中文
  const zh = voices.find((v) => v.lang.startsWith('zh'))
  if (zh) return zh
  // 随便来一个
  return voices[0] || null
}

export function useSpeech() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9

    // 有日语用日语，否则用系统可用语音
    const voice = getVoice()
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }

    utteranceRef.current = utterance
    utterance.onend = () => { utteranceRef.current = null }
    utterance.onerror = () => { utteranceRef.current = null }

    speechSynthesis.speak(utterance)
  }, [])

  return speak
}
