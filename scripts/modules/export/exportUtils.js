export function getDownloadLink(content, mimeType) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'export';
  link.addEventListener('click', () => {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, { once: true });
  document.body.append(link);
  return link;
}
