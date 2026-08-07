import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Booths from './pages/Booths'
import BoothAgents from './pages/BoothAgents'
import Voters from './pages/Voters'
import Phases from './pages/Phases'
import Surveys from './pages/Surveys'
import AssignSurveys from './pages/AssignSurveys'
import Responses from './pages/Responses'
import Reports from './pages/Reports'
import KPIManagement from './pages/KPIManagement'
import Users from './pages/Users'
import Settings from './pages/Settings'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="booths" element={<Booths />} />
        <Route path="booth-agents" element={<BoothAgents />} />
        <Route path="voters" element={<Voters />} />
        <Route path="phases" element={<Phases />} />
        <Route path="surveys" element={<Surveys />} />
        <Route path="assign-surveys" element={<AssignSurveys />} />
        <Route path="responses" element={<Responses />} />
        <Route path="reports" element={<Reports />} />
        <Route path="kpi" element={<KPIManagement />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
