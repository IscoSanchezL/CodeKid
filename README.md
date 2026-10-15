# CodeKid

Plataforma web de programación para estudiantes de **9 a 16 años** (4.º de primaria a 3.º de secundaria). El alumno empieza moviendo personajes con bloques visuales y termina escribiendo JavaScript y Python reales.

> Estado: **Hitos 1-3** (base, motor de juego, niveles 1-2, acceso por clase, monedas y tienda de trajes).

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

## Cómo funciona por dentro

- **Acceso por clase:** el docente crea la clase (código propio, p. ej. `KID1A`, y clave opcional, p. ej. `1A`); los alumnos escriben el código, tocan su nombre y la clave. Función `class-access`.
- **Monedas:** solo se ganan al superar retos. La función `submit-result` vuelve a ejecutar el programa en el servidor con el mismo motor del juego y, si es válido, llama a `award_progress`. 10 monedas por reto nuevo, 5 por cada estrella nueva y un bono diario.
- **Tienda:** catálogo en `src/shop/catalog.ts` (y en la tabla `shop_items`; un test comprueba que coinciden). Comprar y vestirse pasan por `buy_item` / `equip_item`, que validan saldo y propiedad.
- **Al añadir niveles:** ejecuta `node scripts/sync-edge-engine.mjs` y vuelve a desplegar `submit-result`; un test avisa si se te olvida.

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
