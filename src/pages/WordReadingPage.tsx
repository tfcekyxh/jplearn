import { useNavigate } from 'react-router-dom'

export default function WordReadingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
      <p className="text-gray-400 mb-4">拼读练习</p>
      <p className="text-xs text-gray-300 mb-8">即将在阶段 5 实现</p>
      <button
        onClick={() => navigate('/')}
        className="text-sm text-blue-500 underline underline-offset-2"
      >
        返回首页
      </button>
    </div>
  )
}
