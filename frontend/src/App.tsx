import { Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { Layout } from './components/Layout'
import { GachaPage } from './pages/GachaPage'
import { HistoryPage } from './pages/HistoryPage'
import { AdminPage } from './pages/AdminPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { QuestionListPage } from './pages/QuestionListPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { Loading } from './components/Feedback'

export function App() {
  const { session, profile, ready } = useSession()
  if (!ready)
    return (
      <div className="identity-screen">
        <Loading label="입장 정보를 확인하고 있어요." />
      </div>
    )
  if (!profile) return <OnboardingPage />
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<GachaPage />} />
        <Route path="profile" element={<OnboardingPage editing />} />
        <Route path="questions/list" element={<QuestionListPage />} />
        <Route
          path="questions"
          element={
            <Navigate to="/" state={{ openQuestionSheet: true }} replace />
          }
        />
        <Route path="admin" element={<AdminPage />} />
        <Route
          path="history"
          element={session ? <HistoryPage /> : <Navigate to="/" replace />}
        />
        <Route path="gacha" element={<Navigate to="/" replace />} />
        <Route path="table" element={<Navigate to="/" replace />} />
        <Route path="tables" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
