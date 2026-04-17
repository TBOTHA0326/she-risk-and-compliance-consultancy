import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { InvoicePdf } from '@/components/pdf/InvoicePdf'
import type { InvoiceWithLineItems } from '@/types/database'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, companies(id,name,email,address,contact_person), invoice_line_items(*)')
    .eq('id', id)
    .single()

  if (error || !invoice) {
    return new Response('Invoice not found', { status: 404 })
  }

  const pdfBuffer = await renderToBuffer(
    <InvoicePdf invoice={invoice as InvoiceWithLineItems & {
      companies: {
        id: string
        name: string | null
        email: string | null
        address: string | null
        contact_person: string | null
      } | null
    }} />
  )

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
    },
  })
}
