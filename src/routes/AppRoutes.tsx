import { Routes, Route } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Dashboard from '../pages/Dashboard'
import PlaceholderPage from '../pages/PlaceholderPage'
import AuthTest from '../pages/AuthTest'
import Login from '../pages/Login'
import Register from '../pages/Register'
import ForgotPassword from '../pages/ForgotPassword'
import ProtectedRoute from './ProtectedRoute'
import Websites from '../pages/Websites'
import WebsiteDetails from '../pages/WebsiteDetails'
import WorkspaceSettings from '../pages/WorkspaceSettings'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/clients" element={<PlaceholderPage title="Clients" description="Manage relationships, contacts, communication history, and client information." />} />
          <Route path="/projects" element={<PlaceholderPage title="Projects" description="Track projects, milestones, progress, ownership, deadlines, and delivery." />} />

          <Route path="/websites" element={<Websites />} />
          <Route path="/websites/:websiteId" element={<WebsiteDetails />} />

          <Route path="/tasks" element={<PlaceholderPage title="Tasks" description="Manage priorities, assignments, deadlines, recurring work, and execution." />} />
          <Route path="/calendar" element={<PlaceholderPage title="Calendar" description="Centralize meetings, deadlines, events, and important business dates." />} />
          <Route path="/finance" element={<PlaceholderPage title="Finance" description="Track revenue, expenses, transactions, financial health, and reporting." />} />
          <Route path="/ideas" element={<PlaceholderPage title="Ideas" description="Capture, organize, evaluate, and develop ideas without losing them." />} />
          <Route path="/documents" element={<PlaceholderPage title="Documents" description="Organize important business documents and knowledge." />} />
          <Route path="/analytics" element={<PlaceholderPage title="Analytics" description="Turn business activity into useful insights and decision-making signals." />} />
          <Route path="/settings" element={<WorkspaceSettings />} />
          <Route path="/auth-test" element={<AuthTest />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
