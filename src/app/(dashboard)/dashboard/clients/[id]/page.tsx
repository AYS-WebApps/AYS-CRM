import { notFound } from 'next/navigation'
import { getClient } from './actions'
import { getProjectsByClient, getStages } from './project-actions'
import { getNotesByClient } from './note-actions'
import ClientDetail from '@/components/clients/ClientDetail'

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ edit?: string }>
}) {
  const { id } = await params
  const { edit } = await searchParams

  const [client, projects, stages, notes] = await Promise.all([
    getClient(id),
    getProjectsByClient(id),
    getStages(),
    getNotesByClient(id),
  ])

  if (!client) notFound()

  return (
    <ClientDetail
      client={client}
      initialMode={edit === '1' ? 'edit' : 'view'}
      projects={projects}
      stages={stages}
      notes={notes}
    />
  )
}
