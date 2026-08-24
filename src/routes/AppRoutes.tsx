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
import Invitations from '../pages/Invitations'
import MemberApprovals from '../pages/MemberApprovals'
import MemberDetails from '../pages/MemberDetails'
import WorkspaceSettings from '../pages/WorkspaceSettings'
import AccessControl from '../pages/AccessControl'
import Finance from '../pages/Finance'
import Calendar from '../pages/Calendar'

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
          <Route element={<ProtectedRoute requiredPermission="workspace.view" />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="clients.view" />}>
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:clientId" element={<ClientDetails />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="projects.view" />}>
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="websites.view" />}>
            <Route path="/websites" element={<Websites />} />
            <Route path="/websites/:websiteId" element={<WebsiteDetails />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="tasks.view" />}>
            <Route path="/tasks" element={<Tasks />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="members.view" />}>
            <Route path="/team" element={<Team />} />
            <Route path="/team/:userId" element={<MemberDetails />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="members.approve" />}>
            <Route path="/team/invitations" element={<Invitations />} />
            <Route path="/team/approvals" element={<MemberApprovals />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="calendar.view" />}>
            <Route path="/calendar" element={<Calendar />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="finance.view" />}>
            <Route path="/finance" element={<Finance />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="ideas.view" />}>
            <Route path="/ideas" element={<PlaceholderPage title="Ideas" description="Capture, organize, evaluate, and develop ideas without losing them." />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="documents.view" />}>
            <Route path="/documents" element={<PlaceholderPage title="Documents" description="Organize important business documents and knowledge." />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="analytics.view" />}>
            <Route path="/analytics" element={<PlaceholderPage title="Analytics" description="Turn business activity into useful insights and decision-making signals." />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="settings.manage" />}>
            <Route path="/settings" element={<WorkspaceSettings />} />
          </Route>
          <Route element={<ProtectedRoute requiredPermission="access.manage" />}>
            <Route path="/settings/access-control" element={<AccessControl />} />
          </Route>
          <Route path="/auth-test" element={<AuthTest />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default AppRoutes
