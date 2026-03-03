export const localBlobCache = new Map<string, string>();

export const getAttachmentSrc = (attachment: { filename: string; size: number; url: string }) => {
  const cacheKey = `${attachment.filename}-${String(attachment.size)}`;
  return localBlobCache.get(cacheKey) || attachment.url;
};
