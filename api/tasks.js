// /api/tasks
// GET    -> devuelve todas las tareas
// POST   -> crea una tarea nueva
// DELETE -> borra TODAS las tareas (lo usa el botón "Borrar todas mis tareas")

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

function toApi(row) {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject,
    difficulty: row.difficulty,
    status: row.status,
    important: row.important,
    dueDate: row.due_date ? new Date(row.due_date).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    notes: row.notes || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM tasks ORDER BY created_at ASC`;
      return res.status(200).json(rows.map(toApi));
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.id || !b.title || !b.subject || !b.difficulty || !b.status) {
        return res.status(400).json({ error: 'Faltan campos requeridos (id, title, subject, difficulty, status).' });
      }
      const rows = await sql`
        INSERT INTO tasks (id, title, subject, difficulty, status, important, due_date, completed_at, notes)
        VALUES (
          ${b.id}, ${b.title}, ${b.subject}, ${b.difficulty}, ${b.status},
          ${!!b.important}, ${b.dueDate || null}, ${b.completedAt || null}, ${b.notes || null}
        )
        RETURNING *`;
      return res.status(201).json(toApi(rows[0]));
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM tasks`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en /api/tasks:', err);
    return res.status(500).json({ error: 'Error del servidor al hablar con la base de datos.' });
  }
};
