export async function sha256ArrayBuffer(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return '0x' + Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256String(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  return sha256ArrayBuffer(enc.buffer);
}

export async function fileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return file.arrayBuffer();
}
