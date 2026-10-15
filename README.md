# CodeKid

Plataforma web de programación para estudiantes de **9 a 16 años** (4.º de primaria a 3.º de secundaria). El alumno empieza moviendo personajes con bloques visuales y termina escribiendo JavaScript y Python reales.

> Estado: **Hito 1 completado** (base, sistema de diseño, auth y esquema de datos).

## Ruta de aprendizaje

| Nivel | Tema |
|---|---|
| 1 | Secuencias |
| 2 | Bucles |
| 3 | Condicionales |
| 4 | Funciones |
| 5 | Variables y operadores |
| 6 | Listas y datos |
| 7 | Lógica avanzada |
| 8 | Transición de bloques a texto |
| 9 | JavaScript / Python real |
| 10 | Proyectos finales |

## Funciones previstas

- **Estudiantes:** mapa de aventura, editor dual de bloques y código, depurador paso a paso, pistas, logros, avatar, modo creativo y galería de proyectos.
- **Docentes:** aulas, panel de progreso, asignación de tareas, constructor de retos y planes de clase.
- **Familias y admin:** seguimiento semanal, moderación y planes de suscripción.
- **Accesibilidad:** WCAG 2.2 AA, teclado completo, modo daltónico y fuente para dislexia.
- **Privacidad:** diseñado para menores (COPPA / GDPR-K), sin publicidad.

## Stack

Next.js · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Blockly · Monaco · Phaser · Vercel

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # rellena las claves de Supabase
npm run dev                  # http://localhost:3000
npm run lint && npm run typecheck && npm test
```

El esquema está en `supabase/migrations/` y ya está aplicado al proyecto Supabase **CodeKid** (`fomdxwpxydxtqkbjtozl`).

## Hitos

1. ✅ Base, autenticación y sistema de diseño
2. Motor de juego e intérprete de bloques
3. Niveles 1-4 jugables
4. Panel docente y aulas
5. Niveles 5-10 y editor de texto
6. Logros, avatar, galería y modo creativo
7. Pagos, PWA, accesibilidad y pulido

## Licencia

Por definir.
