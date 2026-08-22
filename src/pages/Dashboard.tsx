import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckSquare,
  CircleDollarSign,
  Plus,
  Users,
} from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import EmptyState from '../components/ui/EmptyState'
import SectionHeader from '../components/ui/SectionHeader'
import StatCard from '../components/ui/StatCard'

function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <section className="mb-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--os-accent)]">
              Friday, August 14, 2026
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-[var(--os-text)] sm:text-4xl">
              Good morning, Sohail.
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--os-text-secondary)] sm:text-base">
              Here's your command center. Keep an eye on what matters
              and move the business forward.
            </p>
          </div>

          <Button>
            <Plus size={17} />
            Quick action
          </Button>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly Revenue"
          value="₹0"
          description="No transactions yet"
          icon={<CircleDollarSign size={19} />}
        />

        <StatCard
          label="Active Projects"
          value="0"
          description="Projects in progress"
          icon={<BriefcaseBusiness size={19} />}
        />

        <StatCard
          label="Pending Tasks"
          value="0"
          description="Tasks awaiting action"
          icon={<CheckSquare size={19} />}
        />

        <StatCard
          label="Clients"
          value="0"
          description="Active relationships"
          icon={<Users size={19} />}
        />
      </section>

      {/* Main Dashboard */}
      <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        {/* Business Overview */}
        <Card className="min-h-[390px] p-6">
          <SectionHeader
            title="Business Overview"
            description="A high-level view of your startup's activity."
            action={
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--os-accent)] transition-colors hover:text-[var(--os-text)]"
              >
                View analytics
                <ArrowUpRight size={13} />
              </button>
            }
          />

          <div className="mt-6 flex min-h-[270px] items-center justify-center rounded-2xl border border-dashed border-[var(--os-border)] bg-[var(--os-surface-raised)]">
            <EmptyState
              title="Your business overview is waiting"
              description="Revenue, projects, clients, and other activity will appear here once you start using Startup OS."
            />
          </div>
        </Card>

        {/* Today's Focus */}
        <Card className="min-h-[390px] p-6">
          <SectionHeader
            title="Today's Focus"
            description="Things that need your attention."
          />

          <div className="mt-5">
            <EmptyState
              icon={<CheckSquare size={20} />}
              title="Nothing competing for your attention"
              description="Once you create tasks and deadlines, your most important items will appear here."
              action={
                <Button variant="secondary" size="sm">
                  <Plus size={15} />
                  Create task
                </Button>
              }
            />
          </div>
        </Card>
      </section>

      {/* Lower Dashboard */}
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="p-6">
          <SectionHeader
            title="Recent Activity"
            description="A timeline of important changes across your workspace."
          />

          <EmptyState
            title="No activity yet"
            description="Your workspace activity will appear here as you create projects, tasks, clients, and other records."
          />
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <SectionHeader
            title="Quick Actions"
            description="Jump directly into common workflows."
          />

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              {
                label: 'Create project',
                description: 'Start a new project',
                icon: <BriefcaseBusiness size={17} />,
              },
              {
                label: 'Add client',
                description: 'Create a relationship',
                icon: <Users size={17} />,
              },
              {
                label: 'Create task',
                description: 'Add something to execute',
                icon: <CheckSquare size={17} />,
              },
              {
                label: 'Record transaction',
                description: 'Add financial activity',
                icon: <CircleDollarSign size={17} />,
              },
            ].map((action) => (
              <button
                key={action.label}
                type="button"
                className="group flex items-center gap-3 rounded-xl border border-[var(--os-border)] bg-[var(--os-surface-raised)] p-4 text-left transition-all duration-200 hover:border-[var(--os-border-strong)] hover:bg-[var(--os-surface-hover)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--os-accent-soft)] text-[var(--os-accent)] transition-transform duration-200 group-hover:scale-105">
                  {action.icon}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--os-text)]">
                    {action.label}
                  </span>

                  <span className="mt-0.5 block text-xs text-[var(--os-text-muted)]">
                    {action.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard