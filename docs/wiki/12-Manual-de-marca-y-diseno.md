# 12 · Manual de marca y sistema de diseño

> Colores extraídos directamente del **logo oficial de GALCO** (`galco.com.co/wp-content/themes/galco/images/galco-logo.png`) mediante análisis de píxeles. No son aproximaciones.

---

## Colores oficiales de marca

| Color | Hex | RGB | Uso en el logo |
|---|---|---|---|
| **Azul GALCO** | `#0053A1` | 0, 83, 161 | Isotipo y tipografía "GALCO" |
| **Verde GALCO** | `#7DB928` | 125, 185, 40 | Acento del isotipo (esquina inferior del rombo) |

**Eslogan de marca:** *Trabajo bien Hecho!* (manuscrito, en azul GALCO)

---

## Paleta extendida del sistema

Derivada de los dos colores oficiales. **Ningún color fuera de esta tabla puede aparecer en la interfaz.**

### Primarios

| Token | Hex | Uso |
|---|---|---|
| `azul-700` | `#003D78` | Estado presionado, encabezados sobre fondo claro |
| `azul-600` | **`#0053A1`** | **Color primario.** Barra lateral, botones principales, enlaces |
| `azul-500` | `#1A6BB8` | Hover de botón primario |
| `azul-100` | `#D6E6F5` | Fondo de fila seleccionada, chips informativos |
| `azul-50` | `#F0F6FC` | Fondos sutiles de sección |

### Acento

| Token | Hex | Uso |
|---|---|---|
| `verde-700` | `#5F8F1E` | Texto sobre fondo verde claro |
| `verde-600` | **`#7DB928`** | **Acento.** Estados aprobado, confirmaciones, indicadores positivos |
| `verde-100` | `#EBF5DC` | Fondo de chip "Aprobada" |

### Neutrales

| Token | Hex | Uso |
|---|---|---|
| `gris-900` | `#111827` | Texto principal |
| `gris-600` | `#4B5563` | Texto secundario, etiquetas |
| `gris-400` | `#9CA3AF` | Texto deshabilitado, placeholders |
| `gris-200` | `#E5E7EB` | Bordes, divisores |
| `gris-50` | `#F7F9FB` | Fondo general de la aplicación |
| `blanco` | `#FFFFFF` | Superficies: tarjetas, tablas, modales |

### Semánticos

| Estado | Hex | Chip |
|---|---|---|
| Éxito / Aprobado | `#7DB928` | Fondo `#EBF5DC`, texto `#5F8F1E` |
| Información / En proceso | `#0053A1` | Fondo `#D6E6F5`, texto `#003D78` |
| Advertencia / Pendiente | `#D97706` | Fondo `#FEF3C7`, texto `#92400E` |
| Error / Rechazado | `#DC2626` | Fondo `#FEE2E2`, texto `#991B1B` |

---

## Tipografía

| Rol | Fuente | Justificación |
|---|---|---|
| Interfaz | **Inter** (alternativa: Poppins) | Sans serif geométrica de alta legibilidad en tablas densas y en pantalla pequeña. Coherente con el trazo redondeado del logotipo GALCO. |
| Eslogan | Script manuscrita | Uso exclusivo del eslogan de marca. **Nunca** en la interfaz. |

### Escala tipográfica

| Nivel | Tamaño | Peso | Uso |
|---|---|---|---|
| Display | 32 px | 700 | Título de pantalla principal |
| H1 | 24 px | 700 | Título de sección |
| H2 | 20 px | 600 | Título de tarjeta |
| Cuerpo | 16 px | 400 | Texto general |
| Cuerpo pequeño | 14 px | 400 | Contenido de tabla |
| Etiqueta | 12 px | 500 | Etiquetas de campo, chips (mayúsculas, letter-spacing 0,04 em) |

---

## Reglas de layout

| Regla | Valor |
|---|---|
| Sistema de espaciado | Múltiplos de **8 px** (4, 8, 16, 24, 32, 48) |
| Radio de esquina | Botones e inputs **8 px** · Tarjetas y modales **12 px** |
| Sombra de tarjeta | `0 1px 3px rgba(0,0,0,0.08)` |
| Ancho de barra lateral | Escritorio **260 px** expandida · **72 px** colapsada |
| Altura de barra superior | **64 px** |
| Ancho máximo de contenido | **1440 px**, centrado |
| Altura mínima de área táctil | **48 px** en móvil |

---

## Reglas de componentes

### Barra lateral (escritorio)
Fondo azul `#0053A1` sólido, de borde a borde en altura completa. Logo GALCO en blanco arriba. Ítems de menú en blanco al 85 % de opacidad; el activo va en blanco 100 % con **una barra vertical verde `#7DB928` de 3 px** en el borde izquierdo. Abajo, "Perfil" y "Salir".

### Botones

| Tipo | Fondo | Texto | Borde |
|---|---|---|---|
| Primario | `#0053A1` | Blanco | Ninguno |
| Secundario | Blanco | `#0053A1` | 1 px `#0053A1` |
| Confirmación / Aprobar | `#7DB928` | Blanco | Ninguno |
| Peligro / Rechazar | Blanco | `#DC2626` | 1 px `#DC2626` |
| Terciario | Transparente | `#4B5563` | Ninguno |

### Tablas
Encabezado con fondo `#F7F9FB`, texto `#4B5563` en 12 px mayúsculas. Filas con fondo blanco, divisor inferior `#E5E7EB` de 1 px. Hover de fila `#F0F6FC`. Sin bordes verticales. Chip de estado en la columna correspondiente.

### Tarjetas de indicador (KPI)
Fondo blanco, radio 12 px, sombra suave. Etiqueta arriba en 12 px `#4B5563` mayúsculas. Cifra grande en 32 px peso 700 `#111827`. Variación abajo en 14 px, verde `#7DB928` si sube, rojo `#DC2626` si baja. Ícono lineal en `#0053A1` en la esquina superior derecha.

---

## Reglas de accesibilidad

1. Contraste mínimo **4,5:1** para texto normal.
2. **El verde `#7DB928` nunca se usa como fondo de texto pequeño** (contraste insuficiente con blanco). Solo como fondo de botones con texto de 16 px o más, o como color de borde, ícono y chip.
3. El estado nunca se comunica solo con color: siempre color **más** texto (por ejemplo el chip dice "Aprobada", no es solo un punto verde).
4. Foco de teclado visible con anillo azul `#0053A1` de 2 px.

---

## Qué NO hacer

| Prohibido | Razón |
|---|---|
| Gradientes, glassmorphism, neón, sombras de color | GALCO es una empresa industrial con 26 años. La UI debe transmitir solidez, no tendencia. |
| Cualquier color fuera de la paleta | Rompe la identidad de marca |
| Modo oscuro | Fuera de alcance del Sprint 0 |
| Tipografía script en interfaz | Reservada exclusivamente al eslogan de marca |
| Íconos rellenos o multicolor | Solo íconos lineales de trazo 1,5 px |

---

**Anterior:** [[10 Competencia y ventaja competitiva]] · **Siguiente:** [[14 Mockups]]
