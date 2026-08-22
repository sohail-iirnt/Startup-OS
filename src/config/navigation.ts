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
} from 'lucide-react'

export type NavigationItem = {
  label: string
  path: string
  icon: LucideIcon
}

export type NavigationSection = {
  label: string
  items: NavigationItem[]
}

export const navigationSections: NavigationSection[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        path: '/',
        icon: Gauge,
      },
    ],
  },
  {
    label: 'Business',
    items: [
      {
        label: 'Clients',
        path: '/clients',
        icon: Users,
      },
      {
        label: 'Projects',
        path: '/projects',
        icon: BriefcaseBusiness,
      },
		{
		  label: 'Websites & Apps',
		  path: '/websites',
		  icon: Globe,
		},
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Tasks',
        path: '/tasks',
        icon: CheckSquare,
      },
      {
        label: 'Calendar',
        path: '/calendar',
        icon: CalendarDays,
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Finance',
        path: '/finance',
        icon: CircleDollarSign,
      },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      {
        label: 'Ideas',
        path: '/ideas',
        icon: Lightbulb,
      },
      {
        label: 'Documents',
        path: '/documents',
        icon: FileText,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        label: 'Analytics',
        path: '/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'System',
    items: [
      {
        label: 'Settings',
        path: '/settings',
        icon: Settings,
      },
    ],
  },
]