import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CardLearningPage from './pages/CardLearningPage'
import QuizPage from './pages/QuizPage'
import WordReadingPage from './pages/WordReadingPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cards" element={<CardLearningPage />} />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="/read" element={<WordReadingPage />} />
    </Routes>
  )
}
