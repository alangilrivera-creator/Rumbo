-- Esquema de la base de datos de Rumbo para Neon (PostgreSQL).
-- Ejecuta este archivo una sola vez en tu base de datos de Neon
-- (panel de Neon -> SQL Editor -> pega esto -> Run).

CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  subject      TEXT NOT NULL,
  difficulty   SMALLINT NOT NULL CHECK (difficulty IN (1,2,3)),
  status       TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','progreso','completado')),
  important    BOOLEAN NOT NULL DEFAULT false,
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Acelera "ORDER BY created_at" al listar tareas (el uso más frecuente).
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at);

-- Ejemplos de las consultas con GROUP BY y HAVING que mencionaste,
-- ya funcionando sobre esta misma tabla:

-- ¿Cuántas tareas hay por materia?
-- SELECT subject, COUNT(*) AS total
-- FROM tasks
-- GROUP BY subject;

-- ¿Qué materias tienen más de 2 tareas pendientes? (GROUP BY + HAVING)
-- SELECT subject, COUNT(*) AS pendientes
-- FROM tasks
-- WHERE status <> 'completado'
-- GROUP BY subject
-- HAVING COUNT(*) > 2;
