import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FamilyProfile } from './store';

const esc = (s: string) =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const photoBox = (url: string | undefined, fallback: string) =>
  url
    ? `<img src="${esc(url)}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;" />`
    : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#94a3b8;font-size:11px;">${fallback}</div>`;

const renderHtml = (p: FamilyProfile) => {
  const today = new Date().toLocaleDateString('gu-IN');
  const fullName = `${esc(p.name)} ${esc((p as any).surname || 'સાયજા')}`.trim();

  const memberCards = p.members.length
    ? p.members
        .map(
          (m, i) => `
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;display:flex;gap:10px;align-items:center;background:#f8fafc;">
          <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #f59e0b;flex-shrink:0;background:#fff;">
            ${photoBox(m.photo, '📷')}
          </div>
          <div style="flex:1;font-size:12px;line-height:1.5;color:#0f172a;">
            <div style="font-weight:700;font-size:13px;">${i + 1}. ${esc(m.name) || '-'}</div>
            <div><b>સંબંધ:</b> ${esc(m.relation) || '-'} &nbsp; <b>લિંગ:</b> ${esc(m.gender) || '-'}</div>
            <div><b>વ્યવસાય:</b> ${esc(m.occupation) || '-'} &nbsp; <b>ભણતર:</b> ${esc(m.education) || '-'}</div>
            <div><b>મોબાઇલ:</b> ${esc(m.mobile) || '-'}</div>
          </div>
        </div>`,
        )
        .join('')
    : `<div style="text-align:center;color:#64748b;padding:20px;">કોઈ સભ્ય ઉમેર્યો નથી</div>`;

  return `
<div id="pdf-root" style="width:794px;background:#ffffff;color:#0f172a;font-family:'Noto Sans Gujarati','Mukti','Shruti',Arial,sans-serif;padding:30px;box-sizing:border-box;">
  <div style="text-align:center;border-bottom:3px solid #f59e0b;padding-bottom:14px;margin-bottom:18px;">
    <div style="font-size:46px;line-height:1;">🏠</div>
    <div style="font-size:30px;font-weight:800;background:linear-gradient(90deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-top:6px;">સાયજા પરિવાર</div>
    <div style="color:#64748b;font-size:13px;margin-top:4px;">પરિવાર નોંધણી પત્રક &middot; ${today}</div>
  </div>

  <div style="display:flex;gap:16px;margin-bottom:18px;align-items:center;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px;">
    <div style="width:96px;height:96px;border-radius:50%;overflow:hidden;border:3px solid #f59e0b;flex-shrink:0;background:#fff;">
      ${photoBox(p.profilePhoto, '📷')}
    </div>
    <div style="flex:1;font-size:13px;line-height:1.6;">
      <div style="font-size:18px;font-weight:800;">${fullName || '-'}</div>
      <div><b>મોબાઇલ:</b> ${esc(p.mobile)} &nbsp; <b>Email:</b> ${esc(p.email) || '-'}</div>
      <div><b>મૂળ ગામ:</b> ${esc(p.nativeVillage) || '-'} &nbsp; <b>હાલ ગામ:</b> ${esc(p.currentVillage) || '-'}</div>
      <div><b>વ્યવસાય:</b> ${esc(p.occupation) || '-'} &nbsp; <b>ભણતર:</b> ${esc(p.education) || '-'}</div>
      <div><b>કુલ સભ્ય:</b> ${p.totalMembers}</div>
    </div>
  </div>

  <div style="background:#f1f5f9;border-radius:10px;padding:10px 14px;margin-bottom:18px;font-size:13px;">
    <b>એડ્રેસ:</b> ${esc(p.address) || '-'}
  </div>

  <div style="margin-bottom:10px;font-size:16px;font-weight:700;color:#b45309;">👨‍👩‍👧 પરિવારના સભ્યો (${p.members.length})</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
    ${memberCards}
  </div>

  <div style="margin-top:24px;padding-top:14px;border-top:2px dashed #f59e0b;text-align:center;color:#64748b;font-size:12px;">
    Thanks for registration Sayja Parivar 🙏
  </div>
</div>`;
};

const waitForImages = (root: HTMLElement) =>
  Promise.all(
    Array.from(root.querySelectorAll('img')).map(
      img =>
        new Promise<void>(resolve => {
          if ((img as HTMLImageElement).complete) return resolve();
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        }),
    ),
  );

export const generateAndDownloadPdf = async (profile: FamilyProfile) => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.innerHTML = renderHtml(profile);
  document.body.appendChild(host);
  const root = host.querySelector('#pdf-root') as HTMLElement;
  try {
    await waitForImages(root);
    const canvas = await html2canvas(root, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    let y = 0;
    let remaining = imgH;
    // Multi-page slicing
    if (imgH <= pageH) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    } else {
      while (remaining > 0) {
        pdf.addImage(imgData, 'JPEG', 0, y, imgW, imgH);
        remaining -= pageH;
        y -= pageH;
        if (remaining > 0) pdf.addPage();
      }
    }
    const safeName = (profile.name || 'family').replace(/[^a-zA-Z0-9\u0A80-\u0AFF]+/g, '_');
    pdf.save(`Sayja_Parivar_${safeName}_${profile.mobile}.pdf`);
  } finally {
    document.body.removeChild(host);
  }
};
