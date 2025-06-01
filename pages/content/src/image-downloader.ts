// Content script for image downloading functionality
export const findAllImages = (): string[] => {
  const images = document.querySelectorAll('img');
  const imageUrls: string[] = [];

  images.forEach(img => {
    if (img.src && !img.src.startsWith('data:') && img.src.startsWith('http')) {
      const rect = img.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 50) {
        imageUrls.push(img.src);
      }
    }
  });

  const elementsWithBgImages = document.querySelectorAll('*');
  elementsWithBgImages.forEach(element => {
    const style = window.getComputedStyle(element);
    const bgImage = style.backgroundImage;

    if (bgImage && bgImage !== 'none') {
      const urlMatch = bgImage.match(/url$$['"]?(.*?)['"]?$$/);
      if (urlMatch && urlMatch[1] && urlMatch[1].startsWith('http')) {
        imageUrls.push(urlMatch[1]);
      }
    }
  });

  return [...new Set(imageUrls)];
};

export const getImageInfo = (url: string): Promise<{ width: number; height: number; size: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL();
        const size = Math.round((dataUrl.length * 3) / 4);

        resolve({
          width: img.width,
          height: img.height,
          size: size,
        });
      } else {
        resolve({
          width: img.width,
          height: img.height,
          size: 0,
        });
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
