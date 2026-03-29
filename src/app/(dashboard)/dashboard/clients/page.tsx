import { getClients } from './actions'
import ClientList from '@/components/clients/ClientList'

export default async function ClientsPage() {
  const clients = await getClients()
  return <ClientList clients={clients} />
}
