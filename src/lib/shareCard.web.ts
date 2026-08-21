import { colors } from '@/theme';
import type { ShareCardData, ShareCardFormat } from '@/types/domain';
import { SHARE_CARD_DIMENSIONS } from '@/types/domain';

/** Carga una imagen para dibujarla en canvas sin "mancharlo" (CORS). Si falla, resuelve null en vez de rechazar. */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawCircleCrop(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cx: number, cy: number, r: number) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

const STAT_COLUMNS = [
  { key: 'played', label: 'PJ' },
  { key: 'points', label: 'PTS' },
  { key: 'goalsFor', label: 'GF' },
  { key: 'goalsAgainst', label: 'GC' },
  { key: 'goalDifference', label: 'DG' },
  { key: 'yellowCards', label: 'TA' },
  { key: 'redCards', label: 'TR' },
] as const;

export async function generateShareCardImage(
  data: ShareCardData,
  format: ShareCardFormat
): Promise<{ uri: string }> {
  const { width, height } = SHARE_CARD_DIMENSIONS[format];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No pudimos preparar el lienzo para generar la imagen');

  const scale = width / 1080;
  const pad = 64 * scale;
  const posColWidth = 60 * scale;
  const statColWidth = 62 * scale;
  const tablePadX = 32 * scale;
  const teamColWidth = width - pad * 2 - tablePadX * 2 - posColWidth - statColWidth * STAT_COLUMNS.length;

  const [championshipLogo, rowLogos] = await Promise.all([
    data.championshipLogoUrl ? loadImage(data.championshipLogoUrl) : Promise.resolve(null),
    Promise.all(data.rows.map((row) => (row.logoUrl ? loadImage(row.logoUrl) : Promise.resolve(null)))),
  ]);

  // Fondo: degradado verde de marca.
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, colors.primaryDark);
  bg.addColorStop(1, colors.primary);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Marca Pentagolazo + campeonato.
  let cursorY = pad;
  ctx.fillStyle = colors.textInverse;
  ctx.textAlign = 'left';
  ctx.font = `700 ${28 * scale}px sans-serif`;
  ctx.fillText('PENTAGOLAZO', pad, cursorY + 28 * scale);
  cursorY += 72 * scale;

  const championshipLogoSize = 44 * scale;
  if (championshipLogo) {
    drawCircleCrop(ctx, championshipLogo, pad + championshipLogoSize, cursorY + championshipLogoSize, championshipLogoSize);
  }
  ctx.font = `800 ${44 * scale}px sans-serif`;
  ctx.fillText(
    data.championshipName,
    pad + (championshipLogo ? championshipLogoSize * 2 + 20 * scale : 0),
    cursorY + championshipLogoSize + 14 * scale
  );
  cursorY += championshipLogoSize * 2 + 30 * scale;

  ctx.font = `600 ${32 * scale}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(data.title, pad, cursorY + 32 * scale);
  cursorY += 90 * scale;

  // Panel blanco con la tabla.
  const panelY = cursorY;
  const panelHeight = height - panelY - pad;
  ctx.fillStyle = colors.card;
  drawRoundedRect(ctx, pad, panelY, width - pad * 2, panelHeight, 24 * scale);
  ctx.fill();

  const headerY = panelY + 48 * scale;
  ctx.font = `700 ${20 * scale}px sans-serif`;
  ctx.fillStyle = colors.textMuted;
  let x = pad + tablePadX;
  ctx.textAlign = 'center';
  ctx.fillText('#', x + posColWidth / 2, headerY);
  x += posColWidth;
  ctx.textAlign = 'left';
  ctx.fillText('EQUIPO', x, headerY);
  x += teamColWidth;
  ctx.textAlign = 'center';
  for (const col of STAT_COLUMNS) {
    ctx.fillText(col.label, x + statColWidth / 2, headerY);
    x += statColWidth;
  }

  const rowHeight = Math.min(72 * scale, (panelHeight - 100 * scale) / Math.max(data.rows.length, 1));
  let rowY = headerY + 40 * scale;

  data.rows.forEach((row, index) => {
    if (rowY + rowHeight > panelY + panelHeight - 20 * scale) return;

    if (index % 2 === 1) {
      ctx.fillStyle = colors.surface;
      ctx.fillRect(pad, rowY, width - pad * 2, rowHeight);
    }

    const rowCenterY = rowY + rowHeight / 2;
    let cx = pad + tablePadX;

    ctx.fillStyle = colors.textPrimary;
    ctx.font = `700 ${22 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(String(index + 1), cx + posColWidth / 2, rowCenterY + 8 * scale);
    cx += posColWidth;

    const crest = rowLogos[index];
    const crestRadius = 18 * scale;
    let nameX = cx;
    if (crest) {
      drawCircleCrop(ctx, crest, cx + crestRadius, rowCenterY, crestRadius);
      nameX = cx + crestRadius * 2 + 12 * scale;
    }
    ctx.textAlign = 'left';
    ctx.font = `700 ${24 * scale}px sans-serif`;
    const teamLabel = row.shortName || row.name;
    ctx.fillText(teamLabel, nameX, rowCenterY + 8 * scale, teamColWidth - (nameX - cx) - 16 * scale);
    cx += teamColWidth;

    ctx.font = `500 ${22 * scale}px sans-serif`;
    ctx.textAlign = 'center';
    const values: (string | number)[] = [
      row.played,
      row.points,
      row.goalsFor,
      row.goalsAgainst,
      row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference,
      row.yellowCards,
      row.redCards,
    ];
    for (const value of values) {
      ctx.fillText(String(value), cx + statColWidth / 2, rowCenterY + 8 * scale);
      cx += statColWidth;
    }

    rowY += rowHeight;
  });

  // Pie de página.
  ctx.textAlign = 'center';
  ctx.font = `500 ${20 * scale}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(`pentagolazo.app · ${data.generatedAt}`, width / 2, height - pad / 2);

  return { uri: canvas.toDataURL('image/png') };
}
