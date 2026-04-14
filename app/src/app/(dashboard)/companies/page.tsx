import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { companyStatusBadge } from '@/components/ui/Badge'
import { Building2, ChevronRight } from 'lucide-react'

export default async function CompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        subtitle={`${companies?.length ?? 0} companies`}
        action={<Link href="/companies/new"><Button>+ New Company</Button></Link>}
      />

      <Card>
        {!companies?.length ? (
          <EmptyState message="No companies yet. Add your first client." icon={<Building2 className="w-10 h-10" />} />
        ) : (
          <div className="divide-y divide-gray-50">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{company.name}</p>
                    <p className="text-xs text-gray-400">
                      {company.contact_person ?? company.email ?? company.industry_type ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {companyStatusBadge(company.status)}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
