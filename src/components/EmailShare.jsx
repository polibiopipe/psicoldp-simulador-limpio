import React, { useState } from "react";
import { Clipboard, Download, Mail } from "lucide-react";
import { copyResultsToClipboard, createMailto, downloadResultsTxt } from "../utils/exportResults.js";

export function EmailShare({ report, caseItem, history }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const payload = { report, caseItem, history };

  async function handleCopy() {
    let wasCopied = false;
    try {
      wasCopied = await copyResultsToClipboard(payload);
    } catch {
      wasCopied = false;
    }
    setCopied(wasCopied);
    setCopyFailed(!wasCopied);
    window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 1800);
  }

  return (
    <div className="share-panel">
      <h2>Compartir resultados</h2>
      <div className="share-actions">
        <a className="secondary-action" href={createMailto(payload)}>
          <Mail aria-hidden="true" />
          Compartir por correo
        </a>
        <button className="secondary-action" type="button" onClick={handleCopy}>
          <Clipboard aria-hidden="true" />
          {copied ? "Copiado" : copyFailed ? "No se pudo copiar" : "Copiar resultados"}
        </button>
        <button className="secondary-action" type="button" onClick={() => downloadResultsTxt(payload)}>
          <Download aria-hidden="true" />
          Descargar .txt
        </button>
      </div>
    </div>
  );
}
