const toAbsoluteUrl = (value) => {
  if (!value) return value;

  try {
    return new URL(value, window.location.origin).href;
  } catch {
    return value;
  }
};

const absolutizeAssetUrls = (root) => {
  if (!root) return;

  root.querySelectorAll("img").forEach((node) => {
    const src = node.getAttribute("src");
    if (src) {
      node.setAttribute("src", toAbsoluteUrl(src));
    }

    const srcSet = node.getAttribute("srcset");
    if (srcSet) {
      const normalized = srcSet
        .split(",")
        .map((item) => {
          const [url, descriptor] = item.trim().split(/\s+/);
          return `${toAbsoluteUrl(url)}${descriptor ? ` ${descriptor}` : ""}`;
        })
        .join(", ");
      node.setAttribute("srcset", normalized);
    }
  });

  root.querySelectorAll("image").forEach((node) => {
    const href = node.getAttribute("href") || node.getAttribute("xlink:href");
    if (href) {
      const absolute = toAbsoluteUrl(href);
      node.setAttribute("href", absolute);
      node.setAttribute("xlink:href", absolute);
    }
  });
};

const getStylesheetLinks = () => {
  return Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((link) => link.getAttribute("href"))
    .filter(Boolean)
    .map((href) => toAbsoluteUrl(href));
};

const getInlineStyles = () => {
  return Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent || "")
    .join("\n");
};

const PRINT_CSS = `
  @page { size: A4; margin: 0; }

  html, body {
    margin: 0;
    padding: 0;
    width: 1240px;
    min-height: 1754px;
    background: #ffffff;
    font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  *, *::before, *::after { box-sizing: border-box; }

  .pdf-root {
    width: 1240px;
    min-height: 1754px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    margin: 0 auto;
    background: #ffffff;
    overflow: hidden;
  }

  #resume-preview {
    width: 210mm !important;
    min-height: 297mm !important;
    margin: 0 !important;
    transform: none !important;
    position: static !important;
    overflow: visible !important;
    font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
  }

  #resume-preview * {
    font-family: Inter, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }

  .resume-section--experience,
  .resume-section--projects,
  .resume-section--education {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  @media print {
    body { margin: 0; }

    .resume-section--experience,
    .resume-section--projects,
    .resume-section--education {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`;

export const buildPrintableResumeHtml = (previewElement) => {
  if (!previewElement) {
    throw new Error("Resume preview element not found");
  }

  const clonedPreview = previewElement.cloneNode(true);
  absolutizeAssetUrls(clonedPreview);

  const styleLinks = getStylesheetLinks()
    .map((href) => `<link rel="stylesheet" href="${href}" />`)
    .join("\n");

  const inlineStyles = getInlineStyles();

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="${toAbsoluteUrl("/")}" />
    ${styleLinks}
    <style>${inlineStyles}</style>
    <style>${PRINT_CSS}</style>
  </head>
  <body>
    <div class="pdf-root">${clonedPreview.outerHTML}</div>
  </body>
</html>`;
};
