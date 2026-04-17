import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { QuotePdf } from '@/components/pdf/QuotePdf'
import type { QuoteWithLineItems } from '@/types/database'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, companies(id,name,email,address,contact_person), quote_line_items(*)')
    .eq('id', id)
    .single()

  if (error || !quote) {
    return new Response('Quote not found', { status: 404 })
  }

  const pdfBuffer = await renderToBuffer(
    <QuotePdf quote={quote as QuoteWithLineItems & {
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
      'Content-Disposition': `attachment; filename="quote-${quote.quote_number}.pdf"`,
    },
  })
}
