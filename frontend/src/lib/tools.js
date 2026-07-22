/**
 * Cliente HTTP de Herramientas ARES (sin UI).
 * Conecta la sección "Herramientas" del frontend a /tools/*.
 *
 * Uso:
 *   import { listTools, decodeValue, generateHashes, searchLinux, searchWindows } from "../lib/tools"
 */
import { API_URL } from "./constants"

async function _json(res) {
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail || body.error || detail
    } catch {}
    throw new Error(detail)
  }
  return res.json()
}

/** GET /tools — catálogo [{ id, title, status, endpoints, ... }] */
export async function listTools() {
  const res = await fetch(`${API_URL}/tools`)
  return _json(res)
}

/**
 * POST /tools/decode
 * @param {string} value - ej. "SGVsbG8="
 * @param {"auto"|"base64"|"hex"|"url"} [encoding="auto"]
 * @returns {{ ok, encoding, input, output, output_encoding, raw_hex, bytes_length, error? }}
 */
export async function decodeValue(value, encoding = "auto") {
  const res = await fetch(`${API_URL}/tools/decode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value, encoding }),
  })
  return _json(res)
}

/**
 * POST /tools/hash
 * @param {string} value - texto plano
 * @param {Array<"md5"|"sha1"|"sha256"|"sha512">} [algorithms]
 * @returns {{ ok, input, input_bytes, hashes: { md5, sha1, sha256 }, error? }}
 */
export async function generateHashes(value, algorithms) {
  const body = { value }
  if (algorithms?.length) body.algorithms = algorithms
  const res = await fetch(`${API_URL}/tools/hash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return _json(res)
}

/**
 * GET /tools/cheatsheets/linux?q=
 * @param {string} [q]
 * @param {{ category?: string, limit?: number }} [opts]
 */
export async function searchLinux(q, opts = {}) {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (opts.category) params.set("category", opts.category)
  if (opts.limit) params.set("limit", String(opts.limit))
  const qs = params.toString()
  const res = await fetch(`${API_URL}/tools/cheatsheets/linux${qs ? `?${qs}` : ""}`)
  return _json(res)
}

/**
 * GET /tools/cheatsheets/windows?q=
 */
export async function searchWindows(q, opts = {}) {
  const params = new URLSearchParams()
  if (q) params.set("q", q)
  if (opts.category) params.set("category", opts.category)
  if (opts.limit) params.set("limit", String(opts.limit))
  const qs = params.toString()
  const res = await fetch(`${API_URL}/tools/cheatsheets/windows${qs ? `?${qs}` : ""}`)
  return _json(res)
}

/** GET /tools/cheatsheets/{os}/{entryId} */
export async function getCheatsheetEntry(os, entryId) {
  const res = await fetch(`${API_URL}/tools/cheatsheets/${os}/${encodeURIComponent(entryId)}`)
  return _json(res)
}

export const getLinuxEntry = (id) => getCheatsheetEntry("linux", id)
export const getWindowsEntry = (id) => getCheatsheetEntry("windows", id)
