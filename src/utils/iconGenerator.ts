export const generateAppIcon = (size: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#1e40af');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HR', size / 2, size / 2);

  return canvas.toDataURL('image/png');
};

export const initializeAppIcons = async () => {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  for (const size of sizes) {
    const iconData = generateAppIcon(size);
    const blob = await (await fetch(iconData)).blob();

    const link = document.createElement('link');
    link.rel = 'icon';
    link.sizes = `${size}x${size}`;
    link.href = URL.createObjectURL(blob);
    document.head.appendChild(link);
  }
};
