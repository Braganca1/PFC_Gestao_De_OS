"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Anexo } from "@/lib/types";

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ehImagem(mime: string): boolean {
  return mime.startsWith("image/");
}

interface Props {
  osId: number;
  anexos: Anexo[];
  onChange: () => void;
}

export function AnexosSection({ osId, anexos, onChange }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function enviar(file: File) {
    setEnviando(true);
    setErro(null);
    try {
      await api.uploadAnexo(osId, file);
      onChange();
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao enviar arquivo");
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id: number) {
    if (!confirm("Remover este anexo?")) return;
    try {
      await api.removerAnexo(id);
      onChange();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover");
    }
  }

  return (
    <section className="border border-[#1e2838] bg-[#161c26] rounded-xl p-5 space-y-3">
      <h2 className="text-sm font-semibold text-white">Anexos</h2>

      {erro && (
        <div className="bg-red-500/10 text-red-300 border border-red-500/20 px-3 py-2 rounded text-sm">
          {erro}
        </div>
      )}

      {anexos.length === 0 ? (
        <p className="text-sm text-[#546278]">Nenhum anexo enviado.</p>
      ) : (
        <ul className="space-y-2">
          {anexos.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 border border-[#1e2838] rounded-lg px-3 py-2"
            >
              <div className="w-12 h-12 shrink-0 rounded bg-[#0f1319] border border-[#1e2838] flex items-center justify-center overflow-hidden">
                {ehImagem(a.tipoMime) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={api.urlAnexo(a.id)}
                    alt={a.nomeArquivo}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-[#7a8c3a]">
                    PDF
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">
                  {a.nomeArquivo}
                </div>
                <div className="text-[11px] text-[#546278]">
                  {formatarTamanho(a.tamanho)} •{" "}
                  {new Date(a.dataUpload).toLocaleString("pt-BR")}
                </div>
              </div>
              <a
                href={api.urlAnexo(a.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#c8d67a] hover:underline"
              >
                baixar
              </a>
              <button
                type="button"
                onClick={() => remover(a.id)}
                className="text-[#546278] hover:text-red-400 text-base leading-none px-1"
                aria-label="Remover"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-[#1e2838]">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif,application/pdf"
          disabled={enviando}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) enviar(f);
          }}
          className="text-xs text-[#bcc4d0] file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#7a8c3a] file:text-[#0f1319] file:text-xs file:font-semibold hover:file:bg-[#8fa042] file:cursor-pointer"
        />
        {enviando && (
          <span className="text-xs text-[#546278]">Enviando…</span>
        )}
      </div>
      <p className="text-[11px] text-[#546278]">
        Tipos aceitos: imagens (JPG, PNG, WEBP, GIF, HEIC) e PDF. Tamanho
        máximo: 10 MB. Fotos HEIC (iPhone) são convertidas para JPG
        automaticamente.
      </p>
    </section>
  );
}
