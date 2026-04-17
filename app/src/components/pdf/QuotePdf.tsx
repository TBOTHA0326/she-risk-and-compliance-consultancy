import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { QuoteWithLineItems } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  quote: QuoteWithLineItems & {
    companies: {
      id: string
      name: string | null
      email: string | null
      address: string | null
      contact_person: string | null
    } | null
  }
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#222222',
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  company: {
    fontSize: 10,
    lineHeight: 1.6,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  cell: {
    flex: 1,
  },
  cellRight: {
    flex: 1,
    textAlign: 'right',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderStyle: 'solid',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCellDescription: {
    flex: 4,
  },
  tableCellSmall: {
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  terms: {
    fontSize: 9,
    lineHeight: 1.5,
  },
})

export function QuotePdf({ quote }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Quote</Text>
          <Text style={styles.company}>M C Fourie</Text>
          <Text style={styles.company}>6 Blignaut Street, Vanderbijlpark, 1911</Text>
          <Text style={styles.company}>REG NO. 2022/863818/07 | VAT REG NO. 9069397285</Text>
          <Text style={styles.company}>charlottefourie11@gmail.com | 082 561 2236</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <View style={[styles.cell, { paddingRight: 10 }]}> 
              <Text style={styles.sectionHeading}>Quote For</Text>
              <Text>{quote.companies?.name ?? '—'}</Text>
              {quote.companies?.contact_person && <Text>{quote.companies.contact_person}</Text>}
              {quote.companies?.email && <Text>{quote.companies.email}</Text>}
              {quote.companies?.address && <Text>{quote.companies.address}</Text>}
            </View>
            <View style={[styles.cell, { flex: 1.6 }]}> 
              <Text style={styles.sectionHeading}>Quote details</Text>
              <View style={styles.row}>
                <Text>Quote #</Text>
                <Text style={styles.cellRight}>{quote.quote_number}</Text>
              </View>
              <View style={styles.row}>
                <Text>Issue Date</Text>
                <Text style={styles.cellRight}>{formatDate(quote.issue_date)}</Text>
              </View>
              <View style={styles.row}>
                <Text>Valid Until</Text>
                <Text style={styles.cellRight}>{formatDate(quote.valid_until)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.table, { marginBottom: 16 }]}> 
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 4 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>
          {quote.quote_line_items.map((lineItem) => (
            <View style={styles.tableRow} key={lineItem.id} wrap={false}>
              <Text style={styles.tableCellDescription}>{lineItem.description}</Text>
              <Text style={styles.tableCellSmall}>{lineItem.quantity}</Text>
              <Text style={styles.tableCellSmall}>{formatCurrency(lineItem.unit_price)}</Text>
              <Text style={styles.tableCellSmall}>{formatCurrency(lineItem.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.cell} />
            <View style={[styles.cell, { flex: 1.5 }]}> 
              <View style={styles.row}>
                <Text>Subtotal</Text>
                <Text style={styles.cellRight}>{formatCurrency(quote.subtotal)}</Text>
              </View>
              {quote.vat_enabled && (
                <View style={styles.row}>
                  <Text>VAT ({quote.vat_rate}%)</Text>
                  <Text style={styles.cellRight}>{formatCurrency(quote.vat_amount)}</Text>
                </View>
              )}
              <View style={[styles.row, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E5E7EB' }]}> 
                <Text style={{ fontSize: 11, fontWeight: 'bold' }}>Total Estimate</Text>
                <Text style={[styles.cellRight, { fontSize: 11, fontWeight: 'bold' }]}>{formatCurrency(quote.total)}</Text>
              </View>
            </View>
          </View>
        </View>

        {quote.notes && (
          <View style={[styles.section, { padding: 10, backgroundColor: '#F8FAFC', borderRadius: 6 }]}> 
            <Text style={styles.sectionHeading}>Notes</Text>
            <Text>{quote.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.sectionHeading}>Terms & Conditions</Text>
          <Text style={styles.terms}>This quote is valid until the date specified above.</Text>
          <Text style={styles.terms}>ABSA Bank – SHE Risk & Compliance Consultancy</Text>
          <Text style={styles.terms}>Acc. No.: 4107691637 | Branch Code: 632005</Text>
        </View>
      </Page>
    </Document>
  )
}
