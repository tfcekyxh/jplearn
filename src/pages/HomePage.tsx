import { useNavigate } from 'react-router-dom'

interface Entry {
  path: string
  title: string
  desc: string
  icon: string
}

const entries: Entry[] = [
  {
    path: '/cards',
    title: '卡片学习',
    desc: '翻看五十音假名卡片，听发音，记口诀',
    icon: 'あ',
  },
  {
    path: '/quiz',
    title: '假名测验',
    desc: '随机出题，输入罗马音，检验学习成果',
    icon: '✎',
  },
  {
    path: '/read',
    title: '拼读练习',
    desc: '拼读完整单词，标记会与不会',
    icon: '読',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="h-full bg-white flex flex-col">
      <header className="pt-12 pb-6 text-center">
        <h1 className="text-3xl font-bold tracking-wide text-gray-900">
          五十音速成
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          从零开始，轻松掌握日语假名
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center gap-4 px-5 pb-8">
        {entries.map(({ path, title, desc, icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full max-w-sm bg-gray-50 rounded-2xl p-5 text-left
                       shadow-sm active:scale-[0.98] transition-transform
                       flex items-center gap-4"
          >
            <span className="w-12 h-12 rounded-xl bg-white flex items-center justify-center
                             text-xl shadow-sm border border-gray-100 shrink-0">
              {icon}
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-400 mt-0.5">{desc}</p>
            </div>
          </button>
        ))}
      </main>

      <footer className="text-center py-4 text-xs text-gray-300">
        离线可用 · 数据不上传
      </footer>
    </div>
  )
}
