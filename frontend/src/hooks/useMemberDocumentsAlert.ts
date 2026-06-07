import { useRequiredDocuments } from './useRequiredDocuments'
import { useMemberDocuments } from './useMemberDocuments'

export const useMemberDocumentsAlert = (orgId: string | undefined) => {
  const { items: required } = useRequiredDocuments(orgId)
  const { items: myDocs }   = useMemberDocuments(orgId, 'mine')

  const alertCount = required.filter((rd) => {
    if (!rd.required) { return false }
    const approved = myDocs.find(
      (d) =>
        d.required_document_id === rd.id &&
        d.status === 'approved' &&
        (!d.expires_at || new Date(d.expires_at) > new Date()),
    )
    return !approved
  }).length

  return { alertCount }
}
