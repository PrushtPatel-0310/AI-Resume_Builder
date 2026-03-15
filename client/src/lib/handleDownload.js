const parseFileNameFromDisposition = (headerValue = "") => {
  if (!headerValue) return "";

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/['"]/g, "").trim();
    } catch {
      return utf8Match[1].replace(/['"]/g, "").trim();
    }
  }

  const asciiMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1]?.trim() || "";
};

const inferExtensionFromMimeType = (mimeType = "") => {
  const type = String(mimeType).toLowerCase();
  if (type.includes("pdf")) return ".pdf";
  if (type.includes("json")) return ".json";
  if (type.includes("msword") || type.includes("wordprocessingml")) return ".docx";
  if (type.includes("text/plain")) return ".txt";
  return "";
};

const ensureFileName = (fileName, mimeType) => {
  const trimmed = String(fileName || "").trim();
  if (trimmed) return trimmed;

  const ext = inferExtensionFromMimeType(mimeType);
  return `download${ext}`;
};

const triggerBlobDownload = (blob, fileName) => {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};

const normalizeToBlob = (data, mimeType = "application/pdf") => {
  if (data instanceof Blob) return data;
  if (data instanceof ArrayBuffer) return new Blob([data], { type: mimeType });
  if (ArrayBuffer.isView(data)) return new Blob([data.buffer], { type: mimeType });
  if (typeof data === "string") return new Blob([data], { type: mimeType });
  throw new Error("Unsupported download data format");
};

export const handleDownload = async ({
  url,
  data,
  fileName,
  mimeType = "application/pdf",
  fetchOptions = {},
} = {}) => {
  if (url) {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      ...fetchOptions,
    });

    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const dispositionHeader = response.headers.get("content-disposition") || "";
    const nameFromHeader = parseFileNameFromDisposition(dispositionHeader);
    const resolvedName = ensureFileName(
      fileName || nameFromHeader,
      blob.type || mimeType
    );

    triggerBlobDownload(blob, resolvedName);
    return { fileName: resolvedName };
  }

  if (typeof data !== "undefined") {
    const blob = normalizeToBlob(data, mimeType);
    const resolvedName = ensureFileName(fileName, blob.type || mimeType);
    triggerBlobDownload(blob, resolvedName);
    return { fileName: resolvedName };
  }

  throw new Error("Either url or data is required for download");
};
