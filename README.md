# Rumbo — versión con base de datos (Vercel + Neon)

Esta es la misma app de Rumbo, pero en vez de guardar las tareas en el
navegador, las guarda en una base de datos PostgreSQL real (Neon) a través de
dos funciones serverless desplegadas en Vercel.

```
rumbo-vercel/
├── index.html          <- la app (interfaz + lógica del cliente)
├── api/
│   ├── tasks.js         <- GET (listar), POST (crear), DELETE (borrar todas)
│   └── tasks/[id].js     <- PATCH (actualizar una), DELETE (borrar una)
├── schema.sql            <- crea la tabla "tasks" en Neon
├── package.json           <- dependencia: @neondatabase/serverless
└── .env.example
```

## 1. Crear la base de datos en Neon

1. Entra a [neon.tech](https://neon.tech) y crea una cuenta (tiene un plan
   gratuito, suficiente para este proyecto).
2. Crea un proyecto nuevo. Neon te da una base de datos lista para usar.
3. En el panel de tu proyecto, abre **SQL Editor**.
4. Pega el contenido de `schema.sql` (está en esta carpeta) y ejecútalo. Esto
   crea la tabla `tasks`.
5. Ve a **Dashboard** → busca **Connection string** → copia la que dice
   *pooled connection* (termina en `?sslmode=require`). La vas a necesitar en
   el paso 3.

## 2. Subir el proyecto a GitHub (recomendado)

Vercel despliega mejor desde un repositorio. Si ya usas GitHub:

```bash
cd rumbo-vercel
git init
git add .
git commit -m "Rumbo con Neon"
git remote add origin https://github.com/tu-usuario/rumbo.git
git push -u origin main
```

(Si prefieres no usar GitHub, también puedes desplegar directo desde tu
computadora con `vercel` — ver la alternativa al final.)

## 3. Desplegar en Vercel

1. Entra a [vercel.com](https://vercel.com) y crea una cuenta (puedes
   entrar con tu cuenta de GitHub).
2. **Add New... → Project** → elige el repositorio que acabas de subir.
3. Vercel detecta que no hay framework (es HTML + funciones en `/api`) — no
   necesitas cambiar nada en la configuración de build.
4. Antes de darle a "Deploy", abre **Environment Variables** y agrega:
   - Nombre: `DATABASE_URL`
   - Valor: la cadena de conexión que copiaste de Neon en el paso 1.
5. Dale a **Deploy**. En un minuto tendrás una URL pública como
   `https://rumbo-tuusuario.vercel.app`.

## 4. Probarlo

Abre la URL que te dio Vercel. Agrega una tarea, refresca la página — debe
seguir ahí. Si algo falla, la app muestra un aviso abajo en el menú lateral
explicando qué pasó (por ejemplo, si `DATABASE_URL` no quedó bien
configurada).

## Alternativa: desplegar desde tu computadora (sin GitHub)

```bash
npm install -g vercel
cd rumbo-vercel
vercel          # sigue las instrucciones, crea el proyecto
vercel env add DATABASE_URL   # pega tu cadena de conexión de Neon cuando te la pida
vercel --prod   # despliega a producción
```

## Notas técnicas para tu documentación

- Las funciones en `/api` corren en Node.js sobre Vercel (Serverless
  Functions), usan el driver oficial `@neondatabase/serverless`, que habla
  con Neon por HTTP (por eso funciona bien en un entorno serverless, sin
  mantener una conexión abierta).
- El esquema (`schema.sql`) incluye, comentados, un ejemplo de `GROUP BY` y
  uno de `GROUP BY` + `HAVING` sobre la misma tabla `tasks` — útiles como
  evidencia de consultas reales funcionando sobre los datos del sistema.
- La tabla es intencionalmente simple (una fila por tarea, columnas planas)
  para que las consultas de ejemplo sean fáciles de razonar y de ampliar.
