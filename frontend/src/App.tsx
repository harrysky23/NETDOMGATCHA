import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useSession } from './hooks/useSession'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { TableSelectPage } from './pages/TableSelectPage'
import { TableHomePage } from './pages/TableHomePage'
import { QuestionSubmitPage } from './pages/QuestionSubmitPage'
import { GachaPage } from './pages/GachaPage'
import { HistoryPage } from './pages/HistoryPage'
import { NotFoundPage } from './pages/NotFoundPage'

function RequireNickname() {
  const { nickname } = useSession()
  return nickname ? <Outlet /> : <Navigate to="/" replace />
}

function RequireTable() {
  const { session } = useSession()
  return session ? <Outlet /> : <Navigate to="/tables" replace />
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route element={<RequireNickname />}>
          <Route path="tables" element={<TableSelectPage />} />
          <Route element={<RequireTable />}>
            <Route path="table" element={<TableHomePage />} />
            <Route path="questions" element={<QuestionSubmitPage />} />
            <Route path="gacha" element={<GachaPage />} />
            <Route path="history" element={<HistoryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
