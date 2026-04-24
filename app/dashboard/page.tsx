import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Fetch application counts
  const { data: applications } = await supabase
    .from('applications')
    .select('id, status, created_at, company_name, job_title, tailored_output_id')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const total     = applications?.length ?? 0
  const applied   = applications?.filter(a => a.status === 'applied').length ?? 0
  const interview = applications?.filter(a => a.status === 'interview').length ?? 0
  const offer     = applications?.filter(a => a.status === 'offer').length ?? 0

  // Free tier limit
  const PLAN_LIMITS = { free: 3, starter: 20, pro: Infinity }
  const plan       = profile?.package_tier ?? 'free'
  const limit      = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]
  const used       = profile?.apps_used ?? 0
  const remaining  = Math.max(0, limit - used)

  const emailName  = user?.email?.split('@')[0] ?? 'there'
  const firstName  = profile?.full_name?.split(' ')[0] ?? emailName
  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">{greeting}, {firstName} 👋</h1>
        <p className="text-gray-500 mt-1">Here's where your job search stands.</p>
      </div>

      {/* Usage banner */}
      {(plan === 'free' || plan === 'starter') && (
        <div className="relative overflow-hidden rounded-2xl mb-8 bg-gradient-to-r from-brand to-blue-500 p-6 text-white">
          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wide mb-2 inline-block">{plan === 'free' ? 'Free' : 'Starter'} plan</span>
              <p className="text-lg font-black mt-2">Upgrade to unlock more Applimatic</p>
              <p className="text-white/70 text-sm mt-1">Pro gives you unlimited applications + priority support.</p>
            </div>
            <Link href="/dashboard/upgrade" className="bg-white text-brand font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex-shrink-0">See plans →</Link>
          </div>
        </div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Applications', value: total,     color: 'text-gray-900' },
          { label: 'Applied',            value: applied,   color: 'text-brand' },
          { label: 'Interviews',         value: interview, color: 'text-accent' },
          { label: 'Offers',             value: offer,     color: 'text-yellow-600' },
        ].map(stat => (
          <div key={stat.label} className="card p-5">
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Link href="/dashboard/search" className="card p-5 hover:shadow-md transition-shadow border-t-4 border-t-brand group">
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="font-bold text-gray-900 group-hover:text-brand transition-colors">Search for Jobs</h3>
          <p className="text-gray-500 text-sm mt-1">Find opportunities across all platforms.</p>
        </Link>
        <Link href="/dashboard/tailor" className="card p-5 hover:shadow-md transition-shadow border-t-4 border-t-brand group">
          <div className="text-2xl mb-2">✨</div>
          <h3 className="font-bold text-gray-900 group-hover:text-brand transition-colors">Applimatic a New Application</h3>
          <p className="text-gray-500 text-sm mt-1">Paste a job description to get started.</p>
        </Link>
        <Link href="/dashboard/resume" className="card p-5 hover:shadow-md transition-shadow border-t-4 border-t-accent group">
          <div className="text-2xl mb-2">📄</div>
          <h3 className="font-bold text-gray-900 group-hover:text-accent transition-colors">Upload master resume</h3>
          <p className="text-gray-500 text-sm mt-1">The foundation for every tailored application.</p>
        </Link>
        <Link href="/dashboard/profile" className="card p-5 hover:shadow-md transition-shadow border-t-4 border-t-gray-200 group">
          <div className="text-2xl mb-2">👤</div>
          <h3 className="font-bold text-gray-900 group-hover:text-gray-700 transition-colors">Complete your profile</h3>
          <p className="text-gray-500 text-sm mt-1">Helps the AI personalize your applications.</p>
        </Link>
      </div>

      {/* Recent applications */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Recent Applications</h3>
          {total > 0 && (
            <Link href="/dashboard/applications" className="text-sm text-brand hover:underline">View all →</Link>
          )}
        </div>
        {total === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-gray-500 text-sm">No applications yet.</p>
            <Link href="/dashboard/tailor" className="inline-block mt-3 text-sm text-brand font-semibold hover:underline">
              Tailor your first application →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {applications?.slice(0, 5).map(app => (
              <Link
                key={app.id}
                href={`/dashboard/applications/${app.id}`}
                className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-brand transition-colors">{app.company_name}</p>
                  <p className="text-xs text-gray-400">{app.job_title}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="w-20 flex justify-end">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      app.status === 'offer'     ? 'bg-yellow-100 text-yellow-700' :
                      app.status === 'interview' ? 'bg-green-100 text-green-700' :
                      app.status === 'applied'   ? 'bg-blue-100 text-brand' :
                      app.status === 'rejected'  ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-xs text-brand font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {(app as any).tailored_output_id ? 'View results →' : 'View →'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
