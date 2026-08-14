import { Card, CardContentFirst } from '@/components/ui/card'
import { emailAddress } from '@/lib/loc'

export default function Page() {
  return (
    <div className='space-y-4 px-10'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-semibold'>Dashboard</h1>
      </div>
      <Card>
        <CardContentFirst>
          <p>Welcome. Use the sidebar to manage your registration.</p>
          <p>If you encounter any issues or have any questions, contact us at <a href={`mailto:${emailAddress}`}>{emailAddress}</a>.</p>
        </CardContentFirst>
      </Card>
    </div>
  )
}
