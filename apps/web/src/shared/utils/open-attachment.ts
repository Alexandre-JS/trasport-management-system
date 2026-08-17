/** Open stored URLs or base64 data URLs in the browser's image/PDF viewer. */
export function openAttachment(value: string) {
  if (!value.startsWith("data:")) {
    window.open(value, "_blank", "noopener,noreferrer");
    return;
  }

  const separator = value.indexOf(",");
  if (separator < 0) {
    throw new Error("Invalid attachment data");
  }

  const metadata = value.slice(5, separator);
  const encoded = value.slice(separator + 1);
  const base64 = metadata.endsWith(";base64");
  const mimeType = metadata.replace(/;base64$/, "") || "application/octet-stream";
  const binary = base64 ? window.atob(encoded) : decodeURIComponent(encoded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
