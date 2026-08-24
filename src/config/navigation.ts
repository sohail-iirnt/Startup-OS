import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  FileText,
  Gauge,
  Lightbulb,
  Settings,
  Users,
  Globe,
  MailPlus,
} from 'lucide-react'
import type { WorkspacePermission } from '../types/permissions'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
  permission?: WorkspacePermission
}

export type NavigationSection = {
  label: string
  items: NavigationItem[]
}

export const navigationSections: NavigationSection[] = [
  { label: 'Overview', items: [{ label: 'Dashboard', path: '/', icon: Gauge, permission: 'workspace.view' }] },
  { label: 'Business', items: [
    { label: 'Clients', path: '/clients', icon: Users, permission: 'clients.view' },
    { label: 'Projects', path: '/projects', icon: BriefcaseBusiness, permission: 'projects.view' },
    { label: 'Websites & Apps', path: '/websites', icon: Globe, permission: 'websites.view' },
  ] },
  { label: 'Operations', items: [
    { label: 'Tasks', path: '/tasks', icon: CheckSquare, permission: 'tasks.view' },
    { label: 'Team', path: '/team', icon: Users, permission: 'members.view' },
    { label: 'Invitations', path: '/team/invitations', icon: MailPlus, permission: 'members.approve' },
    { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  ] },
  { label: 'Finance', items: [{ label: 'Finance', path: '/finance', icon: CircleDollarSign, permission: 'finance.view' }] },
  { label: 'Knowledge', items: [
    { label: 'Ideas', path: '/ideas', icon: Lightbulb },
    { label: 'Documents', path: '/documents', icon: FileText },
  ] },
  { label: 'Insights', items: [{ label: 'Analytics', path: '/analytics', icon: BarChart3 }] },
  { label: 'System', items: [{ label: 'Settings', path: '/settings', icon: Settings, permission: 'settings.manage' }] },
]
