import { createFileRoute } from '@tanstack/react-router'
import { Text } from '@gnome-ui/react/components/Text'

export const Route = createFileRoute('/_authenticated/following')({
  component: Following,
})

function Following() {
  return <Text variant="body" color="dim">En construcción</Text>
}
