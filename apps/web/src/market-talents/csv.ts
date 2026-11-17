export const csvHeaders = ['Name','Tags','Facebook Page','Facebook Follower Count','TikTok Channel','TikTok Follower Count','YouTube Channel','YouTube Follower Count'];

export function parseCsv(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], value = '', quoted = false;
  const text = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else if (quoted || !value) quoted = !quoted;
      else throw new Error(`Unexpected quote in row ${rows.length + 1}`);
    } else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(value); if (row.some(cell => cell.trim())) rows.push(row);
      row = []; value = '';
    } else value += char;
  }
  if (quoted) throw new Error('CSV has an unclosed quoted field');
  row.push(value); if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

export function sampleCsv() {
  return `${csvHeaders.join(',')}\n"Sample Creator","LIFESTYLE;FOOD_VLOGGER","https://facebook.com/example",12000,"https://tiktok.com/@example",15000,"https://youtube.com/@example",3000\n`;
}
