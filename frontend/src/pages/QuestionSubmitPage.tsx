import { Navigate } from 'react-router-dom'
export function QuestionSubmitPage() {
  return <Navigate to="/" state={{ openQuestionSheet: true }} replace />
}
