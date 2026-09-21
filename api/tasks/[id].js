// /api/tasks/:id
// PATCH  -> actualiza uno o más campos de una tarea
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

// Mapa de campos que el frontend puede enviar -> nombre real de la columna en SQL.
const FIELD_MAP = {
  title: 'title',
  subject: 'subject',
  difficulty: 'difficulty',
  status: 'status',
  important: 'important',
  dueDate: 'due_date',
  completedAt: 'completed_at',
  notes: 'notes',
};

module.exports = async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'PATCH') {
      const b = req.body || {};
      const columns = [];
      const values = [];

      // Solo se actualizan los campos que el cliente realmente envió, para no
      // pisar por accidente el resto de la fila con NULL.
      for (const key of Object.keys(FIELD_MAP)) {
        if (Object.prototype.hasOwnProperty.call(b, key)) {
          columns.push(FIELD_MAP[key]);
          values.push(b[key]);
        }
      }
      if (columns.length === 0) {
        return res.status(400).json({ error: 'No enviaste ningún campo para actualizar.' });
      }

      // $1 = id, $2.. = valores en el mismo orden que "columns"
      const setClause = columns.map((col, i) => `${col} = $${i + 2}`).join(', ');
      const rows = await sql.query(
        `UPDATE tasks SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      if (!rows[0]) return res.status(404).json({ error: 'Tarea no encontrada.' });
      return res.status(200).json(toApi(rows[0]));
    }

    if (req.method === 'DELETE') {
      await sql.query('DELETE FROM tasks WHERE id = $1', [id]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'PATCH, DELETE');
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    console.error('Error en /api/tasks/[id]:', err);
    return res.status(500).json({ error: 'Error del servidor al hablar con la base de datos.' });
  }
};
