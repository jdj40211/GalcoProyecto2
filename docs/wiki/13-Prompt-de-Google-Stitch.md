# 13 · Prompts de Google Stitch

> Prompts listos para copiar y pegar. Generan el rediseño completo de la aplicación GALCO en escritorio y móvil, respetando estrictamente el [[12 Manual de marca y diseno|manual de marca]].

---

## Cómo usarlos

1. Abre [Google Stitch](https://stitch.withgoogle.com) y crea un proyecto nuevo llamado **GALCO Plataforma Interna**.
2. Pega **primero** el `PROMPT 0` (sistema de diseño). Es el que fija colores, tipografía y componentes.
3. Luego pega **una pantalla a la vez**, en el mismo hilo, para que Stitch mantenga la consistencia visual.
4. Genera cada pantalla en **Desktop** y repite en **Mobile** con el bloque de ajuste móvil.
5. Sube el logo oficial de GALCO como referencia de imagen si la herramienta lo permite.

**Recomendación:** usa el modo experimental de Stitch para las pantallas complejas (dashboard, cotizador, bandeja de aprobación) y el modo estándar para las simples.

---

# PROMPT 0 · Sistema de diseño (pegar primero, siempre)

```
Eres un diseñador de producto senior especializado en software empresarial B2B industrial.
Vas a diseñar una plataforma interna llamada GALCO. Antes de generar cualquier pantalla,
adopta este sistema de diseño y NO te desvíes de él en ninguna pantalla posterior.

CONTEXTO DE MARCA
GALCO S.A.S. es una empresa colombiana metalmecánica de Itagüí, Antioquia, con 26 años
en el mercado. Fabrica bandejas portacable, postes metálicos, perfilería estructural y
presta servicio de galvanizado en caliente. Su eslogan es "Trabajo bien Hecho!".
La marca transmite solidez industrial, confiabilidad y trabajo bien ejecutado.
NO transmite tendencia, ni startup, ni tecnología llamativa.

PALETA DE COLOR — usa EXCLUSIVAMENTE estos valores hexadecimales:
Azul GALCO primario:      #0053A1
Azul oscuro (pressed):    #003D78
Azul hover:               #1A6BB8
Azul claro (selección):   #D6E6F5
Azul muy claro (fondo):   #F0F6FC
Verde GALCO acento:       #7DB928
Verde oscuro (texto):     #5F8F1E
Verde claro (chip):       #EBF5DC
Texto principal:          #111827
Texto secundario:         #4B5563
Texto deshabilitado:      #9CA3AF
Bordes y divisores:       #E5E7EB
Fondo de aplicación:      #F7F9FB
Superficies (tarjetas):   #FFFFFF
Advertencia:              #D97706 sobre fondo #FEF3C7
Error:                    #DC2626 sobre fondo #FEE2E2

PROHIBIDO ABSOLUTAMENTE: gradientes, glassmorphism, neón, sombras de color,
modo oscuro, ilustraciones 3D, degradados de fondo, y cualquier color que no
esté en la lista de arriba.

TIPOGRAFÍA
Fuente única: Inter (o Poppins si Inter no está disponible).
Display 32px/700 · H1 24px/700 · H2 20px/600 · Cuerpo 16px/400 ·
Tabla 14px/400 · Etiqueta 12px/500 en MAYÚSCULAS con letter-spacing 0.04em.

LAYOUT
Espaciado en múltiplos de 8px. Radio de esquina: 8px en botones e inputs,
12px en tarjetas y modales. Sombra de tarjeta: 0 1px 3px rgba(0,0,0,0.08).
Barra lateral de escritorio: 260px de ancho. Barra superior: 64px de alto.
Ancho máximo de contenido: 1440px centrado.

COMPONENTES OBLIGATORIOS

Barra lateral (escritorio): fondo sólido #0053A1 a altura completa. Logotipo
GALCO en blanco en la parte superior. Ítems de menú en blanco al 85% de opacidad.
El ítem activo va en blanco 100% con una barra vertical verde #7DB928 de 3px
pegada al borde izquierdo. Al fondo de la barra: "Perfil" y "Salir".

Botones: primario fondo #0053A1 con texto blanco. Secundario fondo blanco con
borde 1px #0053A1 y texto #0053A1. Confirmar/Aprobar fondo #7DB928 con texto
blanco. Rechazar fondo blanco con borde 1px #DC2626 y texto #DC2626.
Todos con radio 8px, altura 40px en escritorio y 48px en móvil.

Tablas: encabezado con fondo #F7F9FB, texto 12px mayúsculas #4B5563.
Filas blancas separadas por línea inferior 1px #E5E7EB. Hover de fila #F0F6FC.
Sin bordes verticales. Columna de estado con chip de color.

Chips de estado: radio completo, 12px mayúsculas, con punto de 6px a la izquierda.
Aprobada/Activo → fondo #EBF5DC, texto #5F8F1E.
Enviada/En proceso → fondo #D6E6F5, texto #003D78.
Pendiente/Borrador → fondo #FEF3C7, texto #92400E.
Rechazada/Vencida → fondo #FEE2E2, texto #991B1B.

Tarjetas KPI: fondo blanco, radio 12px, sombra suave. Etiqueta arriba 12px
mayúsculas #4B5563. Cifra grande 32px/700 #111827. Variación abajo 14px en
verde #7DB928 si sube o rojo #DC2626 si baja. Ícono lineal #0053A1 arriba a la derecha.

Íconos: exclusivamente lineales, trazo 1.5px, nunca rellenos ni multicolor.

PRINCIPIO RECTOR
El usuario final incluye personal de planta y de obra con poco manejo digital.
Ninguna tarea puede tomar más de 3 pasos. Los botones deben ser grandes y las
etiquetas literales, en español de Colombia. Si una pantalla necesitara un manual
para entenderse, está mal diseñada.

Todos los textos de la interfaz van en ESPAÑOL.

Confirma que adoptaste el sistema y espera mi primera pantalla.
```

---

# PANTALLAS TRANSVERSALES

## 1 · Login

```
Diseña la pantalla de INICIO DE SESIÓN de GALCO, escritorio 1440x900.

Composición de dos columnas.
Columna izquierda (55%): fondo sólido azul #0053A1. Centrado, el logotipo GALCO
en blanco a gran tamaño, y debajo el eslogan "Trabajo bien Hecho!" en tipografía
manuscrita blanca. En la esquina inferior izquierda, texto pequeño blanco al 70%:
"Plataforma interna · Cotizaciones, Hojas de vida y Viáticos".

Columna derecha (45%): fondo blanco. Tarjeta centrada de 400px con:
- Título "Iniciar sesión" en 24px/700
- Subtítulo "Ingresa con tu cuenta corporativa" en 16px #4B5563
- Campo "Correo corporativo" con ícono de sobre
- Campo "Contraseña" con ícono de candado y botón de mostrar/ocultar
- Enlace "¿Olvidaste tu contraseña?" en #0053A1 alineado a la derecha
- Botón primario ancho completo "Ingresar" en #0053A1
- Al pie, texto 12px #9CA3AF: "GALCO S.A.S. · Itagüí, Antioquia"
```

## 2 · Dashboard general

```
Diseña el DASHBOARD PRINCIPAL de GALCO, escritorio 1440x900.

Barra lateral azul #0053A1 de 260px con logo GALCO blanco arriba y menú:
Inicio (activo), Cotizador, Hojas de vida, Viáticos, Reportes, Administración.
Abajo: Perfil y Salir.

Barra superior blanca de 64px: título "Inicio", buscador global al centro,
ícono de campana con punto verde #7DB928 de notificación, y avatar circular
con el nombre "Juan David S." y el rol "Comercial" en 12px #4B5563.

Contenido sobre fondo #F7F9FB:

Fila 1 — cuatro tarjetas KPI en grilla de 4 columnas:
- "COTIZACIONES DEL MES" · 47 · "+12% vs mes anterior" en verde
- "VALOR COTIZADO" · $284.5M · "+8% vs mes anterior" en verde
- "CANDIDATOS ACTIVOS" · 23 · "5 procesos abiertos" en gris
- "VIÁTICOS PENDIENTES" · 8 · "3 vencen hoy" en naranja #D97706

Fila 2 — dos columnas:
Izquierda (65%): tarjeta "Cotizaciones recientes" con tabla de columnas
N.º, Cliente, Producto, Valor, Estado, Fecha. Seis filas de ejemplo con datos
reales del negocio: "COT-2026-0184 · Constructora Antioquia · Bandeja portacable
tipo escalera 20x8cm · $12.450.000 · chip Enviada · 03/08/2026". Incluye filas
con chips Aprobada, Borrador, En negociación y Vencida.
Un enlace "Ver todas" en #0053A1 en la esquina superior derecha de la tarjeta.

Derecha (35%): tarjeta "Pendientes de tu aprobación" con lista de 4 solicitudes
de viáticos, cada una con avatar, nombre del empleado, destino ("Obra Bello",
"Cliente Rionegro"), monto y dos botones pequeños: Aprobar en verde #7DB928
y Rechazar con borde rojo.
```

## 3 · Notificaciones

```
Diseña la pantalla de NOTIFICACIONES de GALCO, escritorio 1440x900.
Mantén barra lateral y barra superior.

Título "Notificaciones" con contador "12 sin leer" y botón secundario
"Marcar todas como leídas".

Pestañas: Todas · Cotizaciones · Hojas de vida · Viáticos.

Lista vertical de notificaciones en tarjeta blanca. Cada ítem con:
ícono lineal circular a la izquierda coloreado según el módulo
(azul #0053A1 cotizaciones, azul cotizaciones, verde #7DB928 aprobaciones,
naranja #D97706 vencimientos), título en 16px/600, descripción en 14px #4B5563,
y marca de tiempo en 12px #9CA3AF a la derecha.
Las no leídas llevan fondo #F0F6FC y un punto azul de 8px al inicio.

Ejemplos de contenido:
- "Cotización COT-2026-0181 aprobada por Constructora Antioquia" · hace 12 min
- "La cotización COT-2026-0177 vence en 2 días" · hace 1 hora
- "Nueva hoja de vida recibida: Soldador certificado" · hace 3 horas
- "Tu solicitud de viático a Obra Bello fue aprobada" · ayer
```

## 4 · Perfil de usuario

```
Diseña la pantalla de PERFIL DE USUARIO de GALCO, escritorio 1440x900.

Encabezado de tarjeta con avatar circular grande de 96px, nombre
"Juan David Sierra", cargo "Ejecutivo comercial", área "Comercial",
y chip verde "Activo". Botón secundario "Editar perfil" a la derecha.

Debajo, dos columnas:
Izquierda: tarjeta "Información personal" con campos en solo lectura
(Documento, Correo corporativo, Teléfono, Ciudad, Fecha de ingreso).
Tarjeta "Hoja de vida" con el archivo adjunto, fecha de última actualización
y botón secundario "Actualizar mi hoja de vida".

Derecha: tarjeta "Accesos" listando los módulos habilitados para su rol
con chips: Cotizador (Acceso completo), Viáticos (Solicitante),
Hojas de vida (Sin acceso, en gris).
Tarjeta "Seguridad" con "Cambiar contraseña" y "Cerrar sesión en todos
los dispositivos".
```

## 5 · Administración de usuarios y roles

```
Diseña la pantalla de ADMINISTRACIÓN DE USUARIOS de GALCO, escritorio 1440x900.

Título "Usuarios y roles", botón primario "+ Nuevo usuario" a la derecha.
Fila de filtros: buscador, selector de Área, selector de Rol, selector de Estado.

Tabla con columnas: Usuario (avatar + nombre + correo), Área, Rol, Módulos,
Estado, Último acceso, Acciones.
La columna Módulos muestra chips pequeños azules: Cotizador, HV, Viáticos.
La columna Estado usa chip verde "Activo" o gris "Inactivo".
Acciones con íconos lineales de editar y desactivar.

Ocho filas de ejemplo con áreas reales: Comercial, Recursos Humanos,
Contabilidad, Producción, Galvanizado, Gerencia.

Al pie, paginación "Mostrando 8 de 34 usuarios".
```

---

# MÓDULO COTIZADOR

## 6 · Listado de cotizaciones

```
Diseña la pantalla LISTADO DE COTIZACIONES de GALCO, escritorio 1440x900.
Ítem "Cotizador" activo en la barra lateral.

Título "Cotizaciones" y botón primario "+ Nueva cotización".

Fila de cuatro mini KPI en línea: Total del mes 47 · Aprobadas 18 ·
En negociación 12 · Por vencer 5 (esta última en naranja).

Barra de filtros: buscador por número o cliente, selector de Estado,
selector de rango de fechas, selector de Comercial, botón secundario
"Exportar" con ícono de descarga.

Tabla de columnas: N.º, Cliente, Productos, Valor total, Estado, Vigencia,
Comercial, Acciones.
Diez filas con datos reales del negocio metalmecánico:
- COT-2026-0184 · Constructora Antioquia S.A. · "Bandeja escalera 20x8 + accesorios (3 ítems)" · $12.450.000 · chip Enviada · vence 18/08/2026
- COT-2026-0183 · Ingeniería Eléctrica del Norte · "Galvanizado en caliente 2.400 kg" · $8.900.000 · chip Aprobada
- COT-2026-0182 · Municipio de Sabaneta · "Postes para luminarias (12 und)" · $34.200.000 · chip En negociación
- COT-2026-0180 · Montajes Industriales SAS · "Canaleta perforada + soportes" · $5.320.000 · chip Vencida
Incluye también filas con chip Borrador y Rechazada.
Acciones con íconos lineales: ver, duplicar, descargar PDF.

Paginación al pie.
```

## 7 · Crear cotización · paso 1: cliente

```
Diseña CREAR COTIZACIÓN PASO 1 de GALCO, escritorio 1440x900.

Encabezado con enlace de regreso "← Cotizaciones" y título "Nueva cotización".

Indicador de progreso horizontal de 3 pasos bien visible en la parte superior:
"1 Cliente" (activo, círculo azul #0053A1 relleno con número blanco),
"2 Productos" (pendiente, círculo con borde gris),
"3 Resumen" (pendiente). Línea conectora entre los círculos.

Contenido centrado a 800px, tarjeta blanca:
- Título "¿Para qué cliente es esta cotización?"
- Buscador grande con ícono de lupa: "Buscar cliente por nombre o NIT"
- Debajo, lista de 4 resultados sugeridos en tarjetas seleccionables, cada una
  con nombre de empresa, NIT, ciudad y última cotización. Una aparece seleccionada
  con borde azul #0053A1 de 2px y fondo #F0F6FC.
- Panel que aparece al seleccionar, con los datos autocompletados en solo lectura:
  NIT, contacto, correo, teléfono, dirección, condiciones de pago pactadas
  ("30 días"), descuento comercial vigente ("5%").
- Enlace secundario "+ Registrar cliente nuevo"

Barra inferior fija con botón terciario "Cancelar" a la izquierda y botón
primario "Continuar a productos →" a la derecha.
```

## 8 · Crear cotización · paso 2: productos

```
Diseña CREAR COTIZACIÓN PASO 2 de GALCO, escritorio 1440x900.
Indicador de progreso con el paso 2 activo y el paso 1 marcado con check verde #7DB928.

Layout de dos columnas.

Izquierda (60%) — "Catálogo de productos":
Buscador con lupa y pestañas de categoría: Bandejas portacable · Canaletas ·
Perfilería · Soportes · Postes · Galvanizado.
Grilla de tarjetas de producto (2 columnas). Cada tarjeta:
miniatura del producto, referencia en 12px #9CA3AF, nombre en 16px/600,
especificación técnica en 14px #4B5563, precio en 20px/700 #111827 con la
unidad al lado ("/ und", "/ m", "/ kg"), y botón "+ Agregar" en #0053A1.
Ejemplos reales:
- "BPE-2008-24 · Bandeja portacable tipo escalera · 20 x 8 cm x 2,40 m · Galvanizada · $186.400 / und"
- "BPM-3010 · Bandeja tipo malla GALCOFIL · 30 x 10 cm · $142.900 / m"
- "CAN-1005-P · Canaleta perforada · 10 x 5 cm x 2,40 m · $74.200 / und"
- "GAL-INM · Galvanizado en caliente por inmersión · $3.850 / kg"
- "PST-LUM-8 · Poste para luminaria 8 m · $2.480.000 / und"

Derecha (40%) — panel fijo "Cotización en curso":
Cliente seleccionado arriba en tarjeta compacta.
Lista de ítems agregados, cada uno con nombre, control de cantidad (- N +),
precio unitario, subtotal de línea e ícono de eliminar.
Al pie del panel, desglose: Subtotal, Descuento comercial 5%, IVA 19%,
y TOTAL en 24px/700 #0053A1.
Botón primario ancho completo "Continuar al resumen →".
```

## 9 · Crear cotización · paso 3: resumen

```
Diseña CREAR COTIZACIÓN PASO 3 de GALCO, escritorio 1440x900.
Indicador de progreso con paso 3 activo y pasos 1 y 2 con check verde #7DB928.

Contenido centrado a 900px:

Tarjeta "Resumen de la cotización":
- Encabezado con número consecutivo generado "COT-2026-0185" en 24px/700,
  fecha de emisión y campo editable "Vigencia" (por defecto 15 días).
- Bloque de dos columnas con Datos del cliente y Datos del comercial.
- Tabla de ítems: Referencia, Descripción, Cantidad, Unidad, Vr. unitario, Subtotal.
- Bloque de totales alineado a la derecha: Subtotal, Descuento comercial,
  Base gravable, IVA 19%, y TOTAL en 28px/700 #0053A1 sobre fondo #F0F6FC.
- Campo de texto "Observaciones y condiciones" con texto por defecto:
  "Precios sujetos a disponibilidad. Tiempo de entrega: 15 días hábiles.
  Forma de pago: 30 días."

Barra inferior fija con: "← Volver", botón secundario "Guardar como borrador"
y botón primario "Generar cotización" en #0053A1.
```

## 10 · Catálogo de productos

```
Diseña la pantalla CATÁLOGO DE PRODUCTOS de GALCO, escritorio 1440x900.

Título "Catálogo" con subtítulo "Precios actualizados al 04/08/2026" y
botón primario "+ Nuevo producto" (visible solo para rol administrador).

Barra lateral de filtros a la izquierda del contenido (240px):
Categoría con checkboxes (Bandejas portacable, Bandejas tipo malla, Canaletas,
Perfilería estructural, Soportes, Postes y brazos, Galvanizado),
Acabado (Galvanizado en caliente, Pintura electrostática, Natural),
rango de precio, y estado de disponibilidad.

Área principal: control de vista grilla/lista, ordenamiento, y grilla de
tarjetas de producto en 3 columnas. Cada tarjeta con imagen del producto,
chip de categoría, referencia, nombre, dimensiones, precio grande y
fecha de última actualización de precio en 12px #9CA3AF.
Un chip verde "Precio actualizado" en los productos modificados esta semana.
```

## 11 · Detalle de producto

```
Diseña la pantalla DETALLE DE PRODUCTO de GALCO, escritorio 1440x900.

Enlace de regreso "← Catálogo".

Dos columnas.
Izquierda (45%): imagen grande del producto (bandeja portacable tipo escalera
galvanizada) con miniaturas debajo.

Derecha (55%):
- Chip de categoría "Bandejas portacable"
- Referencia "BPE-2008-24" en 14px #9CA3AF
- Nombre "Bandeja portacable tipo escalera" en 32px/700
- Precio "$186.400" en 32px/700 #0053A1 con "/ unidad" al lado
- Chip verde "Disponible" y texto "Actualizado el 01/08/2026"
- Tabla de ficha técnica: Ancho 20 cm · Alto 8 cm · Longitud 2,40 m ·
  Calibre lámina 18 · Acabado Galvanizado en caliente · Peso 8,4 kg ·
  Norma NTC 2050
- Botón primario "Agregar a cotización" y secundario "Descargar ficha técnica"

Debajo, pestañas: Descripción · Accesorios compatibles · Historial de precio.
La pestaña de historial muestra una tabla simple de fecha y valor.
```

## 12 · Vista previa y envío al cliente

```
Diseña la pantalla ENVIAR COTIZACIÓN AL CLIENTE de GALCO, escritorio 1440x900.

Dos columnas.

Izquierda (55%) — vista previa del PDF dentro de un marco con sombra:
documento en tamaño carta con el logotipo GALCO arriba a la izquierda en azul
#0053A1, los datos de la empresa (NIT, dirección Itagüí, teléfono) a la derecha,
una franja azul con "COTIZACIÓN COT-2026-0185", los datos del cliente,
la tabla de productos, el bloque de totales, las condiciones comerciales,
y al pie el eslogan "Trabajo bien Hecho!" en azul.
Controles de zoom y "Descargar PDF" sobre la vista previa.

Derecha (45%) — tarjeta "Enviar al cliente":
- Campo "Para" con chip del correo del contacto ya cargado
- Campo "Copia a" vacío con placeholder
- Campo "Asunto" prellenado: "Cotización COT-2026-0185 · GALCO S.A.S."
- Área de mensaje con texto prellenado editable, cordial y formal
- Casilla marcada "Adjuntar cotización en PDF"
- Casilla "Notificarme cuando el cliente la abra"
- Botón primario ancho completo "Enviar cotización"
- Botón secundario "Enviar por WhatsApp" con ícono
- Nota al pie en 12px #9CA3AF: "Quedará registro del envío con fecha y hora."
```

## 13 · Seguimiento de estado de cotización

```
Diseña la pantalla SEGUIMIENTO DE COTIZACIÓN de GALCO, escritorio 1440x900.

Encabezado: "COT-2026-0185" en 32px/700, chip azul "Enviada",
cliente "Constructora Antioquia S.A.", valor "$12.450.000",
y botones secundarios "Descargar PDF", "Duplicar" y "Reenviar".

Línea de tiempo vertical prominente a la izquierda (40%) titulada
"Historial de la cotización". Cada hito con círculo conector:
los completados en verde #7DB928 con check blanco, el actual en azul #0053A1
con anillo, los futuros en gris con borde. Hitos:
- "Creada · Juan David Sierra · 03/08/2026 09:14" (completado)
- "Enviada al cliente · 03/08/2026 10:02" (completado)
- "Abierta por el cliente · 03/08/2026 15:40" (completado)
- "En negociación" (actual)
- "Aprobada / Rechazada" (pendiente)

Derecha (60%): tarjeta con el resumen de ítems de la cotización,
tarjeta "Vigencia" con una barra de progreso y el texto "Vence en 14 días
(18/08/2026)", y tarjeta "Notas internas" con un hilo de comentarios del
equipo comercial y un campo para agregar nota.

Botones de acción al pie: "Marcar como aprobada" en verde #7DB928 y
"Marcar como rechazada" con borde rojo.
```

---

# MÓDULO HOJAS DE VIDA

## 14 · Listado de candidatos

```
Diseña la pantalla LISTADO DE CANDIDATOS de GALCO, escritorio 1440x900.
Ítem "Hojas de vida" activo en la barra lateral.

Título "Hojas de vida" y botón primario "+ Registrar candidato".

Cuatro mini KPI: Candidatos en base 248 · Procesos abiertos 5 ·
En evaluación 12 · Contratados este mes 3.

Barra de filtros: buscador por nombre o cargo, selector de Cargo aspirado,
selector de Estado del proceso, selector de Área, selector de Ciudad.

Tabla de columnas: Candidato (avatar con iniciales + nombre + documento),
Cargo aspirado, Experiencia, Formación, Ciudad, Estado, Fecha de registro,
Acciones.
Diez filas con perfiles reales del sector metalmecánico:
- "Soldador certificado 6G · 8 años · Técnico SENA · Itagüí · chip En evaluación"
- "Ingeniero de producción · 5 años · Ingeniería Mecánica · Medellín · chip Entrevista"
- "Operario de galvanizado · 3 años · Bachiller técnico · Sabaneta · chip Nuevo"
- "Ejecutivo comercial · 6 años · Administración · Envigado · chip Contratado"
Incluye también chips Descartado y En banco de talento.
Acciones: ver ficha, descargar HV.
```

## 15 · Registrar candidato

```
Diseña la pantalla REGISTRAR CANDIDATO de GALCO, escritorio 1440x900.

Enlace "← Hojas de vida" y título "Registrar candidato".

Indicador de progreso de 4 secciones en la parte superior:
"1 Datos personales" (activo) · "2 Formación" · "3 Experiencia" · "4 Documentos".

Formulario centrado a 900px sobre tarjeta blanca, sección 1 visible:
- Zona de carga de foto circular a la izquierda con texto "Subir foto (opcional)"
- Campos en grilla de 2 columnas: Tipo de documento (selector),
  Número de documento, Nombres, Apellidos, Fecha de nacimiento,
  Correo electrónico, Teléfono, Ciudad de residencia, Dirección.
- Selector destacado "Cargo al que aspira" con opciones reales:
  Soldador, Operario de galvanizado, Operario de producción, Pintor industrial,
  Ingeniero de producción, Ejecutivo comercial, Auxiliar administrativo.
- Selector "Área" y campo "Aspiración salarial".
- Casilla obligatoria con texto legal: "El candidato autoriza el tratamiento de
  sus datos personales conforme a la Ley 1581 de 2012."

Barra inferior fija: "Cancelar", "Guardar borrador" y botón primario
"Continuar a formación →".

Muestra al costado derecho un panel lateral colapsable de 280px titulado
"Consejo" con fondo #F0F6FC y borde izquierdo azul, texto:
"Diligencia todos los campos para que este candidato pueda compararse
con otros bajo los mismos criterios."
```

## 16 · Ficha del candidato

```
Diseña la pantalla FICHA DEL CANDIDATO de GALCO, escritorio 1440x900.

Encabezado de tarjeta: avatar de 96px, nombre "Carlos Andrés Restrepo" en 32px/700,
cargo aspirado "Soldador certificado 6G", chip azul "En evaluación",
y datos rápidos en línea: 8 años de experiencia · Itagüí · Registrado 12/07/2026.
Botones a la derecha: "Descargar HV", "Programar entrevista" (secundario)
y un selector de estado del proceso.

Dos columnas.
Izquierda (65%), tarjetas apiladas:
- "Formación académica": lista con institución, título, año. Incluye
  "SENA · Técnico en soldadura · 2018" y certificaciones con chips verdes
  ("Certificación 6G vigente hasta 03/2027").
- "Experiencia laboral": línea de tiempo vertical con empresa, cargo,
  período y descripción breve.
- "Documentos adjuntos": lista de archivos con ícono de PDF, nombre,
  peso y botón de descarga (Hoja de vida, Cédula, Certificados, Exámenes).

Derecha (35%), tarjetas:
- "Datos de contacto" con correo, teléfono y dirección.
- "Estado del proceso": línea de tiempo compacta (Recibido → Preselección →
  Entrevista → Prueba técnica → Decisión) con los pasos cumplidos en verde.
- "Notas del proceso": hilo de comentarios de RRHH con avatar y fecha,
  y campo para agregar nota.
```

## 17 · Búsqueda avanzada de candidatos

```
Diseña la pantalla BÚSQUEDA AVANZADA DE CANDIDATOS de GALCO, escritorio 1440x900.

Título "Búsqueda avanzada" con subtítulo "248 candidatos en la base".

Panel de filtros en tarjeta ancha en la parte superior, en grilla de 4 columnas:
- Cargo (multiselección con chips)
- Años de experiencia (control deslizante de rango, 0 a 20)
- Nivel de formación (checkboxes: Bachiller, Técnico, Tecnólogo, Profesional, Posgrado)
- Certificaciones (multiselección: Soldadura 6G, Alturas, Espacios confinados,
  Manejo de montacargas)
- Ciudad, Disponibilidad, Estado del proceso, Rango de aspiración salarial.
Botones: "Limpiar filtros" (terciario) y "Buscar" (primario).

Debajo, fila de chips con los filtros activos, cada uno con una x para quitarlo.
Texto de resultado: "18 candidatos coinciden con tu búsqueda" y botón
secundario "Exportar resultados".

Resultados en grilla de tarjetas de 3 columnas. Cada tarjeta:
avatar, nombre, cargo aspirado, años de experiencia, chips de certificaciones
en verde, ciudad, y botones "Ver ficha" y "Agregar a proceso".
```

## 18 · Directorio de personal activo

```
Diseña la pantalla DIRECTORIO DE PERSONAL de GALCO, escritorio 1440x900.

Título "Personal activo" con subtítulo "94 colaboradores" y botón secundario
"Exportar directorio".

Pestañas por área: Todos · Producción · Galvanizado · Comercial ·
Administración · Recursos Humanos · Contabilidad.

Buscador y selector de sede.

Grilla de tarjetas de personal en 4 columnas. Cada tarjeta:
avatar circular, nombre, cargo en 14px #4B5563, chip de área en azul claro,
antigüedad ("3 años en GALCO"), y al pie íconos lineales de correo y teléfono.
Las tarjetas de quienes tienen una certificación por vencer llevan un chip
naranja "Certificación vence en 30 días".
```

## 19 · Reporte de personal

```
Diseña la pantalla REPORTE DE PERSONAL de GALCO, escritorio 1440x900.

Título "Reporte de personal", selector de período y botón secundario
"Exportar a Excel" con ícono de descarga.

Fila de cuatro KPI: Planta total 94 · Ingresos del mes 3 · Retiros del mes 1 ·
Tiempo promedio de contratación 18 días.

Dos columnas de gráficas (usa colores de la paleta, azul #0053A1 como serie
principal y verde #7DB928 como secundaria):
- Gráfica de barras horizontales "Personal por área"
- Gráfica de dona "Distribución por tipo de contrato"
- Gráfica de líneas "Ingresos y retiros por mes" (últimos 12 meses)
- Gráfica de barras "Tiempo promedio de contratación por cargo"

Al pie, tabla "Certificaciones próximas a vencer" con columnas
Colaborador, Área, Certificación, Vence, Días restantes, con la columna de
días en chip naranja o rojo según urgencia.
```

---

# MÓDULO VIÁTICOS

## 20 · Mis solicitudes de viático

```
Diseña la pantalla MIS SOLICITUDES DE VIÁTICO de GALCO, escritorio 1440x900.
Ítem "Viáticos" activo en la barra lateral.

Título "Mis viáticos" y botón primario "+ Nueva solicitud".

Cuatro KPI: Solicitudes del mes 6 · Aprobadas 4 · Pendientes 2 ·
Total liquidado $2.840.000.

Pestañas: Mis solicitudes · Por aprobar (con contador rojo "3") · Historial.

Barra de filtros: rango de fechas, selector de Estado, selector de Destino.

Tabla de columnas: N.º, Destino, Motivo, Fechas, Monto, Soportes, Estado, Acciones.
Ocho filas con datos reales:
- "VIA-2026-0092 · Obra Bello · Supervisión de montaje · 05-06/08 · $340.000 · chip '3 de 3' en verde · chip Aprobada"
- "VIA-2026-0091 · Cliente Rionegro · Visita comercial · 01/08 · $180.000 · chip '1 de 2' en naranja · chip Pendiente"
- "VIA-2026-0089 · Obra La Ceja · Entrega de estructura · 28-29/07 · $520.000 · chip Liquidada"
- Incluye una fila con chip Rechazada.
La columna Soportes muestra un chip con el conteo de adjuntos,
verde si está completo y naranja si falta alguno.
```

## 21 · Nueva solicitud de viático

```
Diseña la pantalla NUEVA SOLICITUD DE VIÁTICO de GALCO, escritorio 1440x900.
IMPORTANTE: este flujo debe verse extremadamente simple. Es usado por personal
de obra con poco manejo digital.

Enlace "← Mis viáticos" y título "Nueva solicitud".

Formulario centrado a 720px en tarjeta blanca, campos grandes con etiquetas
literales y espaciados:
- "¿A dónde vas?" — selector con opciones: Obra, Cliente, Proveedor, Otro
- "Nombre de la obra o cliente" — campo con autocompletado
- "Ciudad o municipio" — campo con autocompletado (Bello, Rionegro, La Ceja,
  Sabaneta, Caldas, fuera de Antioquia)
- "¿Para qué vas?" — área de texto corta con placeholder
  "Ej: supervisión de montaje de bandeja portacable"
- "¿Cuándo?" — dos selectores de fecha lado a lado, Salida y Regreso
- "¿Cómo te transportas?" — selector: Vehículo de la empresa, Vehículo propio,
  Transporte público, Taxi o aplicación

Sección "¿Cuánto necesitas?" con cuatro campos de moneda en grilla de 2 columnas,
cada uno con ícono lineal: Transporte, Alojamiento, Alimentación, Otros.
Debajo, un bloque destacado con fondo #F0F6FC: "Total solicitado" con la cifra
en 32px/700 #0053A1.

Campo "¿Quién aprueba?" — selector con avatar del jefe inmediato precargado.

Barra inferior fija: "Cancelar" y botón primario grande "Enviar solicitud".

Nota al pie en 14px #4B5563 con ícono de información:
"Después de aprobada podrás adjuntar las fotos de los recibos desde el celular."
```

## 22 · Adjuntar soportes

```
Diseña la pantalla ADJUNTAR SOPORTES DE VIÁTICO de GALCO, escritorio 1440x900.
Esta pantalla también tendrá versión móvil prioritaria.

Encabezado: "VIA-2026-0092 · Obra Bello", chip verde "Aprobada",
monto aprobado "$340.000" y fechas.

Bloque destacado de progreso arriba: barra con "2 de 4 soportes cargados"
en azul #0053A1 y el texto de advertencia en naranja:
"No podrás enviar a liquidación hasta cargar todos los soportes."

Cuatro tarjetas de concepto en grilla de 2 columnas. Cada tarjeta muestra
el concepto (Transporte, Alojamiento, Alimentación, Otros), el monto aprobado,
y su estado:
- Las que ya tienen soporte muestran la miniatura de la foto del recibo,
  el valor real registrado, un chip verde con check "Cargado", y opciones
  Ver y Reemplazar.
- Las que faltan muestran una zona de carga punteada con ícono de cámara,
  el texto "Tomar foto del recibo" y un enlace "o subir archivo",
  con borde punteado naranja #D97706.

Al pie, bloque de conciliación: Monto aprobado, Monto soportado,
Diferencia a favor o en contra (en verde o rojo).
Botón primario "Enviar a liquidación", deshabilitado en gris mientras falten
soportes, con tooltip explicativo.
```

## 23 · Bandeja de aprobación

```
Diseña la pantalla BANDEJA DE APROBACIÓN DE VIÁTICOS de GALCO, escritorio 1440x900.
Usuario con rol Aprobador.

Título "Por aprobar" con contador "8 solicitudes pendientes" y
botón secundario "Aprobar seleccionadas" con contador.

Tres KPI: Pendientes 8 · Monto total pendiente $2.140.000 ·
Vencen hoy 3 (en naranja).

Filtros: selector de Área, selector de Rango de monto, selector de Antigüedad.

Lista de tarjetas expandibles (no tabla), una por solicitud. Cada tarjeta:
- Casilla de selección a la izquierda
- Avatar y nombre del empleado, su área en 12px
- Destino y motivo en 16px/600
- Fechas del viaje
- Monto grande en 20px/700 alineado a la derecha
- Chip con el conteo de soportes
- Etiqueta de antigüedad ("Solicitado hace 2 días"), en naranja si supera 3 días
- Botones a la derecha: "Ver detalle" (terciario), "Rechazar" (borde rojo #DC2626)
  y "Aprobar" (fondo verde #7DB928)

Una de las tarjetas aparece expandida mostrando el desglose por concepto,
las miniaturas de los soportes adjuntos y un campo de comentario del aprobador.
```

## 24 · Reporte contable de viáticos

```
Diseña la pantalla REPORTE CONTABLE DE VIÁTICOS de GALCO, escritorio 1440x900.
Usuario con rol Contabilidad.

Título "Reporte contable de viáticos", selector de período
(por defecto "Agosto 2026") y dos botones: secundario "Exportar a Excel"
y secundario "Enviar a nómina".

Cuatro KPI: Total liquidado $8.940.000 · Solicitudes 34 ·
Promedio por solicitud $263.000 · Pendientes de legalizar 5 (naranja).

Dos gráficas lado a lado usando la paleta:
- Barras "Viáticos por centro de costo" (Producción, Comercial, Galvanizado,
  Montaje, Administración)
- Líneas "Evolución mensual del gasto" (últimos 6 meses)

Tabla detallada con columnas: N.º, Empleado, Centro de costo, Obra o cliente,
Concepto, Monto aprobado, Monto legalizado, Diferencia, Estado, Fecha de liquidación.
La columna Diferencia en verde si es a favor de la empresa y en rojo si está en contra.
Fila de totales al pie de la tabla, con fondo #F0F6FC y texto en negrita.

Al costado, tarjeta pequeña "Integración DIAN" con chip verde "Conectado"
y texto "Última sincronización: hoy 08:14".
```

---

# BLOQUE DE AJUSTE PARA MÓVIL

Después de generar cada pantalla en escritorio, pega este bloque **seguido del nombre de la pantalla** para obtener la versión móvil.

```
Ahora genera la versión MÓVIL de esta misma pantalla, 390x844 (iPhone),
manteniendo idénticos el sistema de diseño, la paleta y el contenido.

Reglas de adaptación móvil:
- Elimina la barra lateral. Reemplázala por una barra de navegación inferior
  fija de 5 ítems con íconos lineales y etiqueta de 10px:
  Inicio · Cotizador · Hojas de vida · Viáticos · Perfil.
  El ítem activo va en azul #0053A1, los inactivos en #9CA3AF.
- Barra superior de 56px con fondo blanco: flecha de regreso a la izquierda,
  título centrado en 18px/600, e ícono de acción a la derecha.
- Todas las tablas se convierten en tarjetas apiladas verticalmente.
  Cada tarjeta muestra el dato principal en 16px/600, dos o tres datos
  secundarios en 14px #4B5563, y el chip de estado en la esquina superior derecha.
- Las tarjetas KPI pasan a un carrusel horizontal deslizable de 2 visibles.
- Los formularios pasan a una sola columna, campos de 48px de alto,
  etiqueta encima del campo.
- Los botones de acción principal van fijos al fondo de la pantalla,
  ancho completo menos 16px de margen, altura 52px.
- Los filtros se agrupan en un botón "Filtros" que abre una hoja inferior
  (bottom sheet) con radio superior de 16px.
- El área táctil mínima es de 48x48px en todo elemento interactivo.
- Los indicadores de progreso de varios pasos pasan a una barra horizontal
  delgada con el texto "Paso 2 de 3" encima.
```

---

# PANTALLAS MÓVILES PRIORITARIAS

Estas tres son las más importantes en móvil, porque se usan en obra. Genéralas con especial cuidado.

## M1 · Nueva solicitud de viático (móvil)

```
Diseña la pantalla NUEVA SOLICITUD DE VIÁTICO en MÓVIL, 390x844.

Esta es la pantalla más crítica del sistema en móvil: la usa personal de obra
con poco manejo digital, muchas veces a la intemperie y con una sola mano.

- Barra superior: flecha de regreso, título "Nueva solicitud".
- Indicador delgado "Paso 1 de 2" con barra de progreso azul #0053A1.
- Campos apilados en una sola columna, de 56px de alto, con etiquetas grandes
  en 16px/600 formuladas como preguntas: "¿A dónde vas?", "¿Para qué vas?",
  "¿Cuándo sales?", "¿Cuándo regresas?".
- Los selectores muestran opciones como botones grandes seleccionables tipo
  chip, no como menú desplegable: Obra · Cliente · Proveedor · Otro.
- La sección de montos usa un teclado numérico visual con formato de moneda
  colombiana automático.
- Bloque fijo sobre la barra inferior con fondo #F0F6FC:
  "Total: $340.000" en 24px/700 #0053A1.
- Botón primario fijo al fondo, ancho completo, 52px de alto: "Enviar solicitud".
- Barra de navegación inferior de 5 ítems con "Viáticos" activo.
```

## M2 · Adjuntar soportes con cámara (móvil)

```
Diseña la pantalla ADJUNTAR SOPORTES en MÓVIL, 390x844.

- Barra superior con regreso y título "Soportes".
- Encabezado compacto: "VIA-2026-0092 · Obra Bello", chip verde "Aprobada",
  monto "$340.000".
- Barra de progreso prominente: "2 de 4 soportes" en azul #0053A1 con
  texto de advertencia debajo en naranja #D97706.
- Cuatro tarjetas apiladas, una por concepto. Las cargadas muestran la
  miniatura de la foto del recibo a la izquierda, el concepto y el valor
  a la derecha, y un check verde #7DB928. Las pendientes muestran una zona
  punteada con ícono de cámara grande y el texto "Tomar foto del recibo",
  ocupando toda la tarjeta y con área táctil generosa.
- Botón flotante circular grande de cámara en azul #0053A1, 64px,
  en la esquina inferior derecha sobre el contenido.
- Botón primario fijo al fondo "Enviar a liquidación", deshabilitado
  mientras falten soportes, con texto de ayuda debajo.
```

## M3 · Bandeja de aprobación (móvil)

```
Diseña la pantalla POR APROBAR en MÓVIL, 390x844.

- Barra superior con título "Por aprobar" y chip contador rojo "8".
- Carrusel horizontal de 2 KPI visibles: Pendientes 8 · Monto $2.140.000.
- Botón "Filtros" que abre hoja inferior.
- Lista de tarjetas de solicitud apiladas. Cada tarjeta:
  fila superior con avatar, nombre del empleado y monto en 20px/700 a la derecha;
  fila media con destino y motivo; fila inferior con fechas, chip de soportes
  y etiqueta de antigüedad.
  Al fondo de la tarjeta, dos botones de ancho igual y 48px de alto:
  "Rechazar" con borde rojo #DC2626 y "Aprobar" con fondo verde #7DB928.
- Gesto sugerido: deslizar la tarjeta a la derecha para aprobar
  (fondo verde revelado) y a la izquierda para rechazar (fondo rojo revelado).
  Muestra una tarjeta a medio deslizar para ilustrarlo.
- Barra de navegación inferior con "Viáticos" activo.
```

---

## Prompt de refuerzo (si Stitch se desvía de la marca)

Si en alguna pantalla Stitch introduce colores o estilos ajenos, pega esto:

```
Corrige la pantalla. Recuerda que el sistema de diseño es obligatorio:
solo azul #0053A1, verde #7DB928, blanco #FFFFFF, gris #F7F9FB de fondo,
texto #111827 y #4B5563, bordes #E5E7EB. Sin gradientes, sin glassmorphism,
sin sombras de color, sin modo oscuro, sin ilustraciones 3D.
Tipografía Inter. Radio 8px en botones y 12px en tarjetas.
Íconos lineales de trazo 1.5px, nunca rellenos.
Todos los textos en español de Colombia.
Regenera manteniendo el mismo contenido pero con el estilo correcto.
```

---

**Anterior:** [[12 Manual de marca y diseno]] · **Volver a:** [[Home]]
