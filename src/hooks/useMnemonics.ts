import { useState, useEffect, useCallback } from 'react'
import { getAllMnemonics, saveMnemonic } from '../db/db'
import { generateAllMnemonics, regenerateOneMnemonic } from '../lib/glm'

export function useMnemonics() {
  const [mnemonics, setMnemonics] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 挂载时加载已有口诀
  useEffect(() => {
    getAllMnemonics().then(setMnemonics).catch(() => {})
  }, [])

  // 批量生成全部口诀
  const generateAll = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    try {
      const generated = await generateAllMnemonics()
      // 逐条存 IndexedDB
      for (const [romaji, mnemonic] of Object.entries(generated)) {
        await saveMnemonic(romaji, mnemonic)
      }
      setMnemonics(generated)
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // 重新生成单个假名的口诀
  const regenerateOne = useCallback(
    async (romaji: string, hiragana: string, katakana: string) => {
      setIsGenerating(true)
      setError(null)
      try {
        const mnemonic = await regenerateOneMnemonic(romaji, hiragana, katakana)
        await saveMnemonic(romaji, mnemonic)
        setMnemonics((prev) => ({ ...prev, [romaji]: mnemonic }))
      } catch (e) {
        setError(e instanceof Error ? e.message : '生成失败，请重试')
      } finally {
        setIsGenerating(false)
      }
    },
    [],
  )

  const clearError = useCallback(() => setError(null), [])

  return { mnemonics, isGenerating, error, generateAll, regenerateOne, clearError }
}
