// /api/tasks/:id
// PATCH  -> actualiza una tarea (cambio de estado, o edición completa desde el formulario)
// DELETE -> elimina una sola tarea

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
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Falta el id en la URL' });
  }

  try {
    if (req.method === 'PATCH') {
      const b = req.body || {};

      if (Object.prototype.hasOwnProperty.call(b, 'status')) {
        const rows = await sql`
          UPDATE tasks
          SET status = ${b.status}, completed_at = ${b.completedAt ?? null}
          WHERE id = ${id}
          RETURNING *`;
        if (!rows[0]) return res.status(404).json({ error: 'Tarea no encontrada.' });
        return res.status(200).json(toApi(rows[0]));
      }

      if (Object.prototype.hasOwnProperty.call(b, 'title')) {
        const rows = await sql`
          UPDATE tasks
          SET title = ${b.title},
              subject = ${b.subject},
              difficulty = ${b.difficulty},
              due_date = ${b.dueDate ?? null},
              notes = ${b.notes ?? null},
              important = ${!!b.important}
          WHERE id = ${id}
          RETURNING *`;
        if (!rows[0]) return res.status(404).json({ error: 'Tarea no encontrada.' });
        return res.status(200).json(toApi(rows[0]));
      }

      return res.status(400).json({ error: 'No se reconocieron los campos enviados para actualizar.' });
    }

    if (req.method === 'DELETE') {
      await sql`DELETE FROM tasks WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'PATCH, DELETE');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en /api/tasks/[id]:', err);
    return res.status(500).json({
      error: 'Error del servidor al hablar con la base de datos.',
      detail: err && err.message ? err.message : String(err),
    });
  }
};
