import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/following')({
  component: Following,
})

function Following() {
  return (
    <main>
      <h1>Following</h1>
    </main>
  )
}
