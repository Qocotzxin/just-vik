# Mis Ventas BA

Mis Ventas BA es un sistema muy simple pensado para pequeños/as emprendedores/as dentro del rubro comercial.
La idea principal es que cualquier persona que se dedique a la venta minorista de productos pueda utilizar la
plataforma para cargar sus productos, registrar las ventas y visualizar algunos reportes gráficos básicos.
El único requisito para poder utilizar la aplicación es tener una cuenta de Gmail.

Inicialmente la aplicación fue pensada como reemplazo de una tabla excel pero que pueda simplificar la carga
y la visualización de datos para una persona, pero decidí dejarla pública por si le puede ser de utilidad a
alguien más.

Esta es la versión 1.2.0 pero con el tiempo se irán agregando cosas nuevas dependiendo del uso que tenga.

## Stack y librerías destacables

- Angular 11
- Angular Material 11
- Firebase 8
- Angular Fire 6
- Rxjs 6
- Ag Grid 24
- Date Fns 2
- Lodash 4

## Insight

- Esta Web App no tiene backend, sino que está conectada directamente a Firebase, donde se alojan los datos que cargue el usuario.

- Por el momento existent únicamente 2 entidades (Producto y Venta) en base a las cuales se obtiene la información para generar los gráficos.

- La configuración de Firestore está habilitada para que cualquier usuario logueado pueda modificar datos. Por el momento esto no se va a restringir al menos que se super el cupo diario de operaciones. En tal caso se analizará la situación para proceder con el menor impacto posible.
