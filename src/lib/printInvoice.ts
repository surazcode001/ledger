import type { Invoice, InvoiceItem } from '../types/database'

export interface BusinessInfo {
  name: string
  address: string
  pan: string
  email: string
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n)

export function printInvoice(invoice: Invoice & { items: InvoiceItem[] }, business: BusinessInfo) {
  const itemRows = invoice.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${item.quantity}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(item.unit_price)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:500">${fmt(item.amount)}</td>
    </tr>`).join('')

  const statusColor = invoice.status === 'paid' ? '#16a34a' : invoice.status === 'sent' ? '#2563eb' : '#6b7280'

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0 }
    body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 13px; color: #1e293b; background: #fff; padding: 40px }
    @media print {
      body { padding: 0 }
      @page { margin: 20mm; size: A4 }
    }
  </style>
</head>
<body>
  <div style="max-width:720px;margin:0 auto">

    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px">
      <div>
        <h1 style="font-size:24px;font-weight:700;color:#4f46e5;margin-bottom:4px">${business.name || 'Your Business'}</h1>
        ${business.address ? `<p style="color:#64748b;white-space:pre-line">${business.address}</p>` : ''}
        ${business.email ? `<p style="color:#64748b">${business.email}</p>` : ''}
        ${business.pan ? `<p style="color:#64748b;margin-top:4px"><strong>PAN:</strong> ${business.pan}</p>` : ''}
      </div>
      <div style="text-align:right">
        <h2 style="font-size:28px;font-weight:700;color:#1e293b;letter-spacing:-0.5px">INVOICE</h2>
        <p style="font-size:16px;color:#4f46e5;font-weight:600;margin-top:4px">${invoice.invoice_number}</p>
        <span style="display:inline-block;margin-top:8px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;background:${statusColor}20;color:${statusColor}">${invoice.status}</span>
      </div>
    </div>

    <!-- Divider -->
    <div style="height:2px;background:linear-gradient(90deg,#4f46e5,#818cf8);border-radius:2px;margin-bottom:32px"></div>

    <!-- Bill To & Dates -->
    <div style="display:flex;justify-content:space-between;margin-bottom:32px">
      <div>
        <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px;margin-bottom:8px">Bill To</p>
        <p style="font-weight:600;font-size:15px;color:#0f172a">${invoice.client_name}</p>
        ${invoice.client_email ? `<p style="color:#64748b;margin-top:2px">${invoice.client_email}</p>` : ''}
        ${invoice.client_address ? `<p style="color:#64748b;margin-top:2px;white-space:pre-line">${invoice.client_address}</p>` : ''}
        ${invoice.client_pan ? `<p style="color:#64748b;margin-top:6px"><strong>PAN:</strong> ${invoice.client_pan}</p>` : ''}
      </div>
      <div style="text-align:right">
        <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px;margin-bottom:8px">Details</p>
        <table style="margin-left:auto;border-collapse:collapse">
          <tr><td style="color:#64748b;padding:2px 0;padding-right:16px">Invoice Date</td><td style="font-weight:500">${new Date(invoice.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
          <tr><td style="color:#64748b;padding:2px 0;padding-right:16px">Due Date</td><td style="font-weight:500">${new Date(invoice.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
        </table>
      </div>
    </div>

    <!-- Items table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0">Description</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0">Rate</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <!-- Totals -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
      <table style="border-collapse:collapse;min-width:260px">
        <tr>
          <td style="padding:6px 16px;color:#64748b">Subtotal</td>
          <td style="padding:6px 16px;text-align:right">${fmt(invoice.subtotal)}</td>
        </tr>
        ${invoice.tax_rate > 0 ? `<tr>
          <td style="padding:6px 16px;color:#64748b">Tax (${invoice.tax_rate}%)</td>
          <td style="padding:6px 16px;text-align:right">${fmt(invoice.tax_amount)}</td>
        </tr>` : ''}
        <tr style="border-top:2px solid #e2e8f0">
          <td style="padding:10px 16px;font-weight:700;font-size:15px">Total</td>
          <td style="padding:10px 16px;text-align:right;font-weight:700;font-size:15px;color:#4f46e5">${fmt(invoice.total)}</td>
        </tr>
      </table>
    </div>

    ${invoice.notes ? `
    <!-- Notes -->
    <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:32px">
      <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#94a3b8;margin-bottom:6px">Notes</p>
      <p style="color:#475569">${invoice.notes}</p>
    </div>` : ''}

    <!-- Footer -->
    <div style="border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;color:#94a3b8;font-size:11px">
      Thank you for your business
    </div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=800,height=900')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onload = () => win.print()
}
