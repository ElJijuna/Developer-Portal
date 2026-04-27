import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/my-apps')({
  component: MyApps,
})

function MyApps() {
  return (
    <main>
      <h1>My Apps</h1>
    </main>
  )
}
