/** Descarga un data URL como archivo en el navegador (solo web). */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  if (typeof document === 'undefined') return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** true si el navegador soporta compartir archivos vía Web Share API (principalmente móvil). */
export function canShareFiles(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'canShare' in navigator &&
    typeof navigator.canShare === 'function'
  );
}

export async function shareDataUrl(dataUrl: string, filename: string, title?: string): Promise<boolean> {
  if (!canShareFiles()) return false;
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], filename, { type: blob.type });
  if (!navigator.canShare({ files: [file] })) return false;
  await navigator.share({ files: [file], title });
  return true;
}
