import { Routes, Route } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import Dashboard from '../pages/Dashboard'
import PlaceholderPage from '../pages/PlaceholderPage'
import AuthTest from '../pages/AuthTest'
import Login from '../pages/Login'
import RegisterWorkspace from '../pages/RegisterWorkspace'
import ForgotPassword from '../pages/ForgotPassword'
import PendingApproval from '../pages/PendingApproval'
import ProtectedRoute from './ProtectedRoute'
import Websites from '../pages/Websites'
import WebsiteDetails from '../pages/WebsiteDetails'
import Clients from '../pages/Clients'
import ClientDetails from '../pages/ClientDetails'
import Projects from '../pages/Projects'
import ProjectDetails from '../pages/ProjectDetails'
import Tasks from '../pages/Tasks'
import Team from '../pages/Team'
import WorkspaceSettings from '../pages/WorkspaceSettings'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterWorkspace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<ProtectedRoute allowPendingApproval />}>
        <Route path="/pending-approval" element={<PendingApproval />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:clientId" element={<ClientDetails />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/websites" element={<Websites />} />
          <Route path="/websites/:websiteId" element={<WebsiteDetails />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/team" element={<Team />} />
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
