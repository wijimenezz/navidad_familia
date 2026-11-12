# Amigo Secreto

Página del amigo secreto navideño de la familia. Next.js (App Router) + Neon (Postgres), lista para Vercel.

## Cómo funciona

1. Cada persona entra al enlace, escribe su nombre y queda inscrita. Su celular la recuerda (cookie), no hay clave.
2. Escribe su lista de deseos y una nota opcional. Puede editarla cuando quiera.
3. Cuando estén todos, el organizador entra a `/organizador`, pone su clave y oprime **Cerrar y sortear**.
4. Cada persona oprime **Sacar mi papelito** y ve a quién le tocó regalarle y la lista de deseos de esa persona.

El sorteo se arma completo en el servidor en el momento del cierre: nadie se sale a sí mismo, todos regalan y todos reciben. El servidor solo le entrega a cada celular su propio amigo secreto; la página del organizador tampoco muestra los resultados.

## Subir a Vercel

1. Crea un proyecto en [Neon](https://neon.tech) y copia la cadena de conexión (la "pooled").
2. Sube esta carpeta a un repositorio de GitHub e impórtalo en Vercel.
3. En Vercel, en *Settings → Environment Variables*, agrega:
   - `DATABASE_URL`: la cadena de conexión de Neon.
   - `ADMIN_KEY`: la clave que usarás en `/organizador`.
4. Despliega. Las tablas se crean solas la primera vez que alguien abre la página.

## Correr en tu computador

```bash
npm install
cp .env.example .env.local   # y pon tus valores
npm run dev
```

## Cambiar textos

En `lib/config.ts` están el nombre de la familia, el año, la fecha de entrega y el mínimo de participantes.

## Cosas que conviene saber

- **Sin clave por persona**: en "Ya me inscribí" cualquiera puede elegir un nombre de la lista. Es un acuerdo de confianza; pide a la familia que cada uno entre solo desde su celular.
- **Quien tenga acceso a la base de datos en Neon puede ver las asignaciones** (columna `asignado_a`). Si organizas y también juegas, no abras esa tabla.
- **Reiniciar sorteo** borra todas las asignaciones y vuelve a abrir la inscripción. Sirve para hacer pruebas antes del sorteo real.
- Si alguien se inscribe mal (nombre repetido, prueba), el organizador puede quitarlo antes del sorteo.
