// /api/reports
// GET /api/reports
//   Sin parámetros -> lee directo de las 3 vistas creadas en Neon (Fase 3):
//     vw_resumen_tareas_asignatura, vw_resumen_estado_tareas,
//     vw_tareas_pendientes_asignatura
//   Estos son los números que se comparan 1 a 1 contra el SQL Editor de Neon
//   (Paso 9 de la guía de Fase 4).
//
//   Con ?subject=&status=&difficulty= -> las vistas NO aceptan parámetros y
//   no deben modificarse, así que el filtrado se resuelve aquí: se trae
//   "tasks" completa y se recalculan los mismos tres reportes en el
//   servidor, reproduciendo exactamente la misma lógica de cada vista.

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const VALID_STATUS = ['pendiente', 'progreso', 'completado'];
const VALID_DIFFICULTY = ['1', '2', '3'];

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Recalcula, en JavaScript, los mismos 3 reportes que dan las vistas de
// Neon, pero sobre un subconjunto ya filtrado de tareas.
function aggregate(tasks) {
  const bySubject = new Map();
  const byStatus = new Map();
  const pendingBySubject = new Map();

  for (const t of tasks) {
    const s = bySubject.get(t.subject) || { total: 0, sumDiff: 0 };
    s.total += 1;
    s.sumDiff += Number(t.difficulty);
    bySubject.set(t.subject, s);

    byStatus.set(t.status, (byStatus.get(t.status) || 0) + 1);

    if (t.status === 'pendiente') {
      pendingBySubject.set(t.subject, (pendingBySubject.get(t.subject) || 0) + 1);
    }
  }

  const porAsignatura = Array.from(bySubject.entries())
    .map(([subject, v]) => ({
      subject,
      total_tareas: v.total,
      dificultad_promedio: round2(v.sumDiff / v.total),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'es'));

  const porEstado = Array.from(byStatus.entries())
    .map(([status, total_tareas]) => ({ status, total_tareas }))
    .sort((a, b) => a.status.localeCompare(b.status, 'es'));

  const pendientesPorAsignatura = Array.from(pendingBySubject.entries())
    .map(([subject, tareas_pendientes]) => ({ subject, tareas_pendientes }))
    .sort((a, b) => a.subject.localeCompare(b.subject, 'es'));

  return { porAsignatura, porEstado, pendientesPorAsignatura, totalTareas: tasks.length };
}

module.exports = async function handler(req, res) {
  try {
    const { subject, status, difficulty } = req.query;

    if (status && !VALID_STATUS.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido.' });
    }
    if (difficulty && !VALID_DIFFICULTY.includes(String(difficulty))) {
      return res.status(400).json({ error: 'Dificultad inválida.' });
    }

    const hasFilters = Boolean(subject) || Boolean(status) || Boolean(difficulty);

    if (!hasFilters) {
      const [porAsignatura, porEstado, pendientesPorAsignatura, totalRows] = await Promise.all([
        sql`SELECT subject, total_tareas, dificultad_promedio FROM vw_resumen_tareas_asignatura ORDER BY subject`,
        sql`SELECT status, total_tareas FROM vw_resumen_estado_tareas ORDER BY status`,
        sql`SELECT subject, tareas_pendientes FROM vw_tareas_pendientes_asignatura ORDER BY subject`,
        sql`SELECT COUNT(*) AS total FROM tasks`,
      ]);
      return res.status(200).json({
        filtered: false,
        porAsignatura,
        porEstado,
        pendientesPorAsignatura,
        totalTareas: Number(totalRows[0].total),
      });
    }

    // Con filtros: se trae la tabla base (sin tocar las vistas) y se agrega en JS.
    const rows = await sql`SELECT subject, status, difficulty FROM tasks`;
    const filtered = rows.filter(
      (t) =>
        (!subject || t.subject === subject) &&
        (!status || t.status === status) &&
        (!difficulty || String(t.difficulty) === String(difficulty))
    );

    return res.status(200).json({ filtered: true, ...aggregate(filtered) });
  } catch (err) {
    console.error('Error en /api/reports:', err);
    return res.status(500).json({ error: 'Error del servidor al generar los reportes.' });
  }
};
