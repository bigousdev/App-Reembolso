import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { CATEGORY_LABELS, PAYMENT_METHOD_LABELS, type Category, type Closing, type Entry, type ProjectWithPolicy } from '../types';
import { formatCurrency, formatDate } from './format';
import { readReceiptAsBase64 } from './receiptStorage';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mimeTypeFor(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'heic') return 'image/heic';
  return 'image/jpeg';
}

async function toDataUri(uri: string): Promise<string | null> {
  const base64 = await readReceiptAsBase64(uri);
  if (!base64) return null;
  return `data:${mimeTypeFor(uri)};base64,${base64}`;
}

const BASE_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0F172A; padding: 24px; }
  h1 { font-size: 20px; margin-bottom: 2px; }
  .subtitle { color: #64748B; font-size: 12px; margin-bottom: 18px; }
  .meta { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 18px; font-size: 12px; }
  .meta div { background: #F1F5F9; padding: 6px 10px; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  th, td { text-align: left; padding: 8px; border-bottom: 1px solid #E2E8F0; font-size: 12px; }
  th { background: #0F766E; color: #fff; }
  tr:nth-child(even) td { background: #F8FAFC; }
  .total-row td { font-weight: 700; border-top: 2px solid #0F172A; }
  .section-title { font-size: 15px; font-weight: 700; margin: 22px 0 10px; color: #0F766E; }
  .receipt { page-break-inside: avoid; margin-bottom: 16px; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; }
  .receipt-title { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
  .receipt img { max-width: 100%; max-height: 480px; border-radius: 6px; }
  .no-receipt { font-size: 11px; color: #94A3B8; font-style: italic; }
  .footer { margin-top: 24px; font-size: 10px; color: #94A3B8; }
`;

function headerHtml(project: ProjectWithPolicy, closing: Closing, title: string): string {
  return `
    <h1>${escapeHtml(title)}</h1>
    <div class="subtitle">${escapeHtml(project.name)}${project.client ? ' · ' + escapeHtml(project.client) : ''}</div>
    <div class="meta">
      <div><strong>Período:</strong> ${formatDate(closing.startDate)} – ${formatDate(closing.endDate)}</div>
      ${project.costCenter ? `<div><strong>Centro de custo:</strong> ${escapeHtml(project.costCenter)}</div>` : ''}
      <div><strong>Fechamento:</strong> ${escapeHtml(closing.label)}</div>
    </div>
  `;
}

function entriesTableHtml(entries: Entry[], currency: string): string {
  const total = entries.reduce((sum, e) => sum + e.value, 0);
  const rows = entries
    .map(
      (entry) => `
        <tr>
          <td>${formatDate(entry.date)}</td>
          <td>${escapeHtml(entry.description || '-')}</td>
          <td>${escapeHtml(PAYMENT_METHOD_LABELS[entry.paymentMethod])}</td>
          <td>${entry.photoUri ? 'Sim' : 'Não'}</td>
          <td style="text-align:right">${formatCurrency(entry.value, currency)}</td>
        </tr>`
    )
    .join('');
  return `
    <table>
      <thead>
        <tr><th>Data</th><th>Descrição</th><th>Pagamento</th><th>Nota anexada</th><th style="text-align:right">Valor</th></tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row"><td colspan="4">Total</td><td style="text-align:right">${formatCurrency(total, currency)}</td></tr>
      </tbody>
    </table>
  `;
}

async function receiptsHtml(entries: Entry[], currency: string): Promise<string> {
  const withPhotos = entries.filter((e) => e.photoUri);
  if (withPhotos.length === 0) {
    return '<p class="no-receipt">Nenhuma nota fotografada neste relatório.</p>';
  }
  const blocks = await Promise.all(
    withPhotos.map(async (entry) => {
      const dataUri = entry.photoUri ? await toDataUri(entry.photoUri) : null;
      if (!dataUri) return '';
      return `
        <div class="receipt">
          <div class="receipt-title">${formatDate(entry.date)} · ${escapeHtml(entry.description || CATEGORY_LABELS[entry.category])} · ${formatCurrency(entry.value, currency)}</div>
          <img src="${dataUri}" />
        </div>
      `;
    })
  );
  return blocks.join('');
}

export async function generateCategoryReportHtml(
  project: ProjectWithPolicy,
  closing: Closing,
  category: Category,
  entries: Entry[]
): Promise<string> {
  const categoryEntries = entries.filter((e) => e.category === category);
  const receipts = await receiptsHtml(categoryEntries, project.currency);
  return `
    <html>
      <head><meta charset="utf-8" /><style>${BASE_STYLES}</style></head>
      <body>
        ${headerHtml(project, closing, `Relatório de Reembolso · ${CATEGORY_LABELS[category]}`)}
        ${entriesTableHtml(categoryEntries, project.currency)}
        <div class="section-title">Notas fiscais</div>
        ${receipts}
        <div class="footer">Gerado pelo app Reembolso Viagem em ${new Date().toLocaleString('pt-BR')}</div>
      </body>
    </html>
  `;
}

export async function generateFullReportHtml(
  project: ProjectWithPolicy,
  closing: Closing,
  entries: Entry[]
): Promise<string> {
  const categories = Array.from(new Set(entries.map((e) => e.category)));
  const sections = await Promise.all(
    categories.map(async (category) => {
      const categoryEntries = entries.filter((e) => e.category === category);
      const receipts = await receiptsHtml(categoryEntries, project.currency);
      return `
        <div class="section-title">${CATEGORY_LABELS[category]}</div>
        ${entriesTableHtml(categoryEntries, project.currency)}
        ${receipts}
      `;
    })
  );
  return `
    <html>
      <head><meta charset="utf-8" /><style>${BASE_STYLES}</style></head>
      <body>
        ${headerHtml(project, closing, 'Relatório Completo de Reembolso')}
        <table>
          <tbody>
            <tr><td>Alimentação</td><td style="text-align:right">${formatCurrency(closing.totalAlimentacao, project.currency)}</td></tr>
            <tr><td>Transporte</td><td style="text-align:right">${formatCurrency(closing.totalTransporte, project.currency)}</td></tr>
            <tr><td>Estacionamento</td><td style="text-align:right">${formatCurrency(closing.totalEstacionamento, project.currency)}</td></tr>
            <tr><td>Hospedagem</td><td style="text-align:right">${formatCurrency(closing.totalHospedagem, project.currency)}</td></tr>
            <tr><td>Outros</td><td style="text-align:right">${formatCurrency(closing.totalOutros, project.currency)}</td></tr>
            <tr class="total-row"><td>Total geral</td><td style="text-align:right">${formatCurrency(closing.totalGeral, project.currency)}</td></tr>
          </tbody>
        </table>
        ${sections.join('')}
        <div class="footer">Gerado pelo app Reembolso Viagem em ${new Date().toLocaleString('pt-BR')}</div>
      </body>
    </html>
  `;
}

export async function exportHtmlAsPdf(html: string, dialogTitle: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle, UTI: 'com.adobe.pdf' });
  }
}
