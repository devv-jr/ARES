import { API_URL } from "./constants"

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      detail = body.detail || body.error || detail
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail))
  }

  if (res.status === 204) return null
  return res.json()
}

/** Crea una conversación nueva. */
export async function createConversation({ title, mode, provider, model } = {}) {
  return request("/conversations", {
    method: "POST",
    body: JSON.stringify({ title, mode, provider, model }),
  })
}

/** Lista todas las conversaciones (resumen). */
export async function getConversations() {
  return request("/conversations")
}

/** Obtiene una conversación completa con mensajes. */
export async function getConversation(id) {
  return request(`/conversations/${id}`)
}

/** Solo los mensajes de una conversación. */
export async function getMessages(id) {
  const data = await request(`/conversations/${id}/messages`)
  return data.messages || []
}

/** Elimina una conversación. */
export async function deleteConversation(id) {
  return request(`/conversations/${id}`, { method: "DELETE" })
}

/** Renombra (o actualiza meta) una conversación. */
export async function renameConversation(id, title) {
  return request(`/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  })
}

/**
 * Auto-guarda un mensaje en la conversación.
 * @param {string} id
 * @param {{ role: 'user'|'assistant'|'system', content: string }} message
 */
export async function sendMessage(id, message) {
  return request(`/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(message),
  })
}

/**
 * Guarda un intercambio completo (user + assistant) tras el stream.
 * Dispara auto-título en el backend si es el primer par.
 */
export async function persistExchange(id, userContent, assistantContent) {
  const messages = []
  if (userContent) messages.push({ role: "user", content: userContent })
  if (assistantContent) messages.push({ role: "assistant", content: assistantContent })
  if (!messages.length) {
    throw new Error("persistExchange requiere al menos un mensaje")
  }
  return request(`/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ messages }),
  })
}

/**
 * Carga el historial en la memoria del agente.
 * Usa el mismo id como session_id en /chat/stream.
 */
export async function activateConversation(id) {
  return request(`/conversations/${id}/activate`, { method: "POST" })
}
