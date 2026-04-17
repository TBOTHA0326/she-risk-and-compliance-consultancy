import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { InvoiceWithLineItems } from '@/types/database'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  invoice: InvoiceWithLineItems & {
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
    color: '#102A43',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: 'black',
    letterSpacing: 2,
    color: '#B91C1C',
    marginBottom: 10,
  },
  companyInfo: {
    fontSize: 9,
    lineHeight: 1.8,
    color: '#475569',
  },
  brand: {
    textAlign: 'right',
  },
  brandLine: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#0F172A',
    lineHeight: 1.1,
  },
  brandSubline: {
    marginTop: 6,
    fontSize: 9,
    color: '#64748B',
  },
  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    color: '#0F172A',
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaSection: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  billTo: {
    flex: 1,
  },
  billLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#B91C1C',
    marginBottom: 6,
  },
  billValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  billDetail: {
    fontSize: 9,
    color: '#475569',
    marginTop: 2,
  },
  invoiceDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  invoiceDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 6,
  },
  invoiceDetailLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748B',
  },
  invoiceDetailValue: {
    fontSize: 9,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tableCellDescription: {
    flex: 4,
    fontSize: 9,
    color: '#334155',
  },
  tableCellSmall: {
    flex: 1,
    fontSize: 9,
    color: '#475569',
    textAlign: 'right',
  },
  totals: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '100%',
    marginBottom: 20,
  },
  totalsBox: {
    width: '100%',
    maxWidth: 250,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    padding: 14,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  totalsLabel: {
    fontSize: 9,
    color: '#64748B',
  },
  totalsValue: {
    fontSize: 9,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  totalFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#0F172A',
  },
  totalLabel: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  notes: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    padding: 14,
    marginBottom: 20,
  },
  notesHeading: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#B91C1C',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#B91C1C',
    paddingTop: 16,
  },
  thankYou: {
    fontSize: 20,
    fontFamily: 'Times-Roman',
    fontStyle: 'italic',
    color: '#0F172A',
  },
  footerDetails: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.6,
  },
  footerHeading: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#B91C1C',
    marginBottom: 4,
  },
})

export function InvoicePdf({ invoice }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.titleColumn}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.companyInfo}>M C Fourie</Text>
            <Text style={styles.companyInfo}>6 Blignaut Street, Vanderbijlpark, 1911</Text>
            <Text style={styles.companyInfo}>REG NO. 2022/863818/07 | VAT REG NO. 9069397285</Text>
            <Text style={styles.companyInfo}>charlottefourie11@gmail.com | 082 561 2236</Text>
          </View>

          <View style={styles.brand}>
            <Text style={styles.brandLine}>SHE RISK &amp;</Text>
            <Text style={styles.brandLine}>COMPLIANCE</Text>
            <Text style={styles.brandLine}>CONSULTANCY</Text>
            <Text style={styles.brandSubline}>M C FOURIE — Nationwide</Text>
            <Text style={styles.statusBadge}>{invoice.status?.toUpperCase() ?? 'DRAFT'}</Text>
          </View>
        </View>

        <View style={styles.metaSection}>
          <View style={styles.billTo}>
            <Text style={styles.billLabel}>Bill To</Text>
            <Text style={styles.billValue}>{invoice.companies?.name ?? '—'}</Text>
            {invoice.companies?.contact_person && <Text style={styles.billDetail}>{invoice.companies.contact_person}</Text>}
            {invoice.companies?.email && <Text style={styles.billDetail}>{invoice.companies.email}</Text>}
            {invoice.companies?.address && <Text style={styles.billDetail}>{invoice.companies.address}</Text>}
          </View>

          <View style={styles.invoiceDetails}>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Invoice #</Text>
              <Text style={styles.invoiceDetailValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.invoiceDetailRow}>
              <Text style={styles.invoiceDetailLabel}>Issue Date</Text>
              <Text style={styles.invoiceDetailValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            <View style={[styles.invoiceDetailRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
              <Text style={styles.invoiceDetailLabel}>Due Date</Text>
              <Text style={styles.invoiceDetailValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 4 }]}>Description</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Qty</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Amount</Text>
          </View>
          {invoice.invoice_line_items.map((lineItem) => (
            <View style={styles.tableRow} key={lineItem.id} wrap={false}>
              <Text style={styles.tableCellDescription}>{lineItem.description}</Text>
              <Text style={styles.tableCellSmall}>{lineItem.quantity}</Text>
              <Text style={styles.tableCellSmall}>{formatCurrency(lineItem.unit_price)}</Text>
              <Text style={styles.tableCellSmall}>{formatCurrency(lineItem.line_total)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.vat_enabled && (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>VAT ({invoice.vat_rate}%)</Text>
                <Text style={styles.totalsValue}>{formatCurrency(invoice.vat_amount)}</Text>
              </View>
            )}
            <View style={styles.totalFinal}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesHeading}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank You</Text>
          <View style={styles.footerDetails}>
            <Text style={styles.footerHeading}>Terms &amp; Conditions</Text>
            <Text>Payment is due upon invoice receipt.</Text>
            <Text style={{ marginTop: 6, fontWeight: 'bold', color: '#0F172A' }}>ABSA Bank</Text>
            <Text>SHE Risk &amp; Compliance Consultancy</Text>
            <Text>Acc. No.: 4107691637</Text>
            <Text>Branch Code: 632005</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
