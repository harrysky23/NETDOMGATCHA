import { Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { Layout } from './components/Layout'
import { GachaPage } from './pages/GachaPage'
import { HistoryPage } from './pages/HistoryPage'
import { AdminPage } from './pages/AdminPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  const { session } = useSession()
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<GachaPage />} />
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
