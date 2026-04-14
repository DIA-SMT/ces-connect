import { supabase } from './supabase';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ── Fetch all relevant data from Supabase ────────────────────────────────────

async function fetchDatabaseContext(): Promise<string> {
  const [categoriesRes, meetingsRes, participantsRes, contributionsRes, debateRes, meetingParticipantsRes] =
    await Promise.all([
      supabase.from('categories').select('id, title, description'),
      supabase.from('meetings').select('id, title, date, status, category, summary, key_points, outcome_notes, progress_level').order('date', { ascending: true }),
      supabase.from('participants').select('id, name, role, organization'),
      supabase.from('contributions').select('meeting_id, participant_name, content, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('debate_messages').select('meeting_id, author_name, content, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('meeting_participants').select('meeting_id, participant_id'),
    ]);

  const categories = categoriesRes.data ?? [];
  const meetings = meetingsRes.data ?? [];
  const participants = participantsRes.data ?? [];
  const contributions = contributionsRes.data ?? [];
  const debateMessages = debateRes.data ?? [];
  const meetingParticipants = meetingParticipantsRes.data ?? [];

  const today = new Date().toISOString().split('T')[0];

  // Build a lookup map for participants
  const participantMap: Record<string, string> = {};
  participants.forEach((p) => { participantMap[p.id] = p.name; });

  // Map meetings with their participants
  const meetingsWithParticipants = meetings.map((m) => {
    const participantIds = meetingParticipants
      .filter((mp) => mp.meeting_id === m.id)
      .map((mp) => participantMap[mp.participant_id] ?? mp.participant_id);
    return { ...m, participants: participantIds };
  });

  // Build context string
  let context = `FECHA DE HOY: ${today}\n\n`;

  // Categories / Comisiones
  context += `## COMISIONES (${categories.length} en total)\n`;
  categories.forEach((c) => {
    context += `- [${c.id}] ${c.title}: ${c.description ?? 'Sin descripción'}\n`;
  });

  // Meetings
  const upcoming = meetingsWithParticipants.filter((m) => m.status === 'upcoming' && m.date >= today);
  const completed = meetingsWithParticipants.filter((m) => m.status === 'completed' || m.date < today);

  context += `\n## PRÓXIMAS REUNIONES (${upcoming.length})\n`;
  upcoming.forEach((m) => {
    const cat = categories.find((c) => c.id === m.category);
    context += `- "${m.title}" — Fecha: ${m.date} | Comisión: ${cat?.title ?? m.category}`;
    if (m.participants?.length) context += ` | Participantes: ${m.participants.join(', ')}`;
    if (m.summary) context += `\n  Resumen: ${m.summary}`;
    context += '\n';
  });

  context += `\n## REUNIONES COMPLETADAS (${completed.length})\n`;
  completed.forEach((m) => {
    const cat = categories.find((c) => c.id === m.category);
    context += `- "${m.title}" — Fecha: ${m.date} | Comisión: ${cat?.title ?? m.category}`;
    if (m.participants?.length) context += ` | Participantes: ${m.participants.join(', ')}`;
    if (m.summary) context += `\n  Resumen: ${m.summary}`;
    if (m.key_points?.length) context += `\n  Puntos clave: ${(m.key_points as string[]).join('; ')}`;
    if (m.outcome_notes) context += `\n  Conclusiones: ${m.outcome_notes}`;
    context += '\n';
  });

  // Participants
  context += `\n## PARTICIPANTES (${participants.length} en total)\n`;
  participants.forEach((p) => {
    context += `- ${p.name} | Rol: ${p.role ?? 'Sin rol'} | Organización: ${p.organization ?? 'Sin organización'}\n`;
  });

  // Contributions (debate content)
  if (contributions.length > 0) {
    context += `\n## CONTRIBUCIONES RECIENTES EN DEBATES\n`;
    contributions.forEach((c) => {
      const meeting = meetings.find((m) => m.id === c.meeting_id);
      context += `- [Reunión: "${meeting?.title ?? c.meeting_id}"] ${c.participant_name}: ${c.content}\n`;
    });
  }

  // Debate messages
  if (debateMessages.length > 0) {
    context += `\n## MENSAJES DE DEBATE RECIENTES\n`;
    debateMessages.forEach((d) => {
      const meeting = meetings.find((m) => m.id === d.meeting_id);
      context += `- [Reunión: "${meeting?.title ?? d.meeting_id}"] ${d.author_name}: ${d.content}\n`;
    });
  }

  return context;
}

// ── Build the system prompt ───────────────────────────────────────────────────

function buildSystemPrompt(dbContext: string): string {
  return `Sos el asistente virtual de CES Connect, el sistema de gestión de comisiones, reuniones y participantes del CES (Consejo de Educación Superior o similar). Respondés en español, de manera clara, concisa y amigable.

Tu objetivo es ayudar a los usuarios a consultar información sobre comisiones, reuniones, participantes y debates almacenada en la base de datos del sistema.

A continuación te damos el contexto actualizado de la base de datos:

${dbContext}

INSTRUCCIONES IMPORTANTES:
- Respondé SIEMPRE en español
- Usá los datos del contexto para dar respuestas precisas
- Si el usuario pregunta por la próxima reunión, buscá las reuniones con status "upcoming" con la fecha más próxima a hoy
- Si el usuario pregunta por reuniones completadas o pasadas, usá las de status "completed" o fecha anterior a hoy
- Si no tenés información suficiente para responder, decilo claramente
- Sé conciso pero informativo
- No inventes datos que no estén en el contexto
- Podés mencionar la cantidad de comisiones, participantes, reuniones, etc. usando los datos del contexto`;
}

// ── Call OpenRouter API ───────────────────────────────────────────────────────

export async function askAssistant(
  userMessage: string,
  history: Message[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string;
  const model = (import.meta.env.VITE_OPENROUTER_MODEL as string) || 'openai/gpt-4o-mini';

  if (!apiKey) {
    throw new Error('Falta la variable de entorno VITE_OPENROUTER_API_KEY');
  }

  // Fetch fresh context from DB each time
  const dbContext = await fetchDatabaseContext();
  const systemPrompt = buildSystemPrompt(dbContext);

  // Build messages array for the API
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'CES Connect Assistant',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error al consultar el asistente: ${err}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('El asistente no devolvió una respuesta válida.');
  }

  return content;
}
