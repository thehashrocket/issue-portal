import { Suspense } from "react"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { IssueStatus, ClientStatus } from "@prisma/client"
import IssuesTable from "@/components/dashboard/IssuesTable";
import ClientsTable from "@/components/dashboard/ClientsTable";

async function getAssignedIssues() {
  const session = await auth()
  if (!session?.user?.id) return []

  const issues = await prisma.issue.findMany({
    where: {
      assignedToId: session.user.id,
      status: {
        in: [IssueStatus.NEW, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.PENDING, IssueStatus.NEEDS_REVIEW]
      }
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return issues
}

async function getActiveClients() {
  const session = await auth()
  if (!session?.user?.id) return []

  const clients = await prisma.client.findMany({
    where: {
      status: ClientStatus.ACTIVE,
      // If user is not admin, only show their clients
      ...(session.user.role !== "ADMIN" && {
        managerId: session.user.id
      })
    },
    include: {
      _count: {
        select: {
          issues: {
            where: {
              status: {
                in: [IssueStatus.NEW, IssueStatus.ASSIGNED, IssueStatus.IN_PROGRESS, IssueStatus.PENDING, IssueStatus.NEEDS_REVIEW]
              }
            }
          }
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  return clients
}

export default async function DashboardPage() {
  const [issues, clients] = await Promise.all([
    getAssignedIssues(),
    getActiveClients()
  ])

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<div>Loading issues...</div>}>
          <IssuesTable issues={issues} />
        </Suspense>
        <Suspense fallback={<div>Loading clients...</div>}>
          <ClientsTable clients={clients} />
        </Suspense>
      </div>
    </div>
  )
}
