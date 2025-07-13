export const isImageFile = (mimeType: string): boolean => {
  return mimeType.startsWith('image/') && 
         ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
};

export const generateThumbnail = async (
  imageFile: Blob, 
  maxWidth: number = 300, 
  maxHeight: number = 300,
  quality: number = 0.8
): Promise<Blob> => {
  console.log(`[Thumbnail] Processing image: ${imageFile.type}, size: ${imageFile.size}`);
  
  return new Blob([await imageFile.arrayBuffer()], { type: imageFile.type });
};

export const getImageDimensions = async (imageFile: Blob): Promise<{ width: number; height: number } | null> => {
  try {
    const buffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    if (imageFile.type === 'image/png') {
      if (bytes.length >= 24) {
        const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
        const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
        return { width, height };
      }
    } else if (imageFile.type === 'image/jpeg') {
      let i = 2;
      while (i < bytes.length - 8) {
        if (bytes[i] === 0xFF && bytes[i + 1] === 0xC0) {
          const height = (bytes[i + 5] << 8) | bytes[i + 6];
          const width = (bytes[i + 7] << 8) | bytes[i + 8];
          return { width, height };
        }
        i++;
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

export const calculateChecksum = async (file: Blob): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};