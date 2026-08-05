# 04 · Divergir — Benchmark de soluciones existentes

**Momento 2 del Design Thinking.** Antes de decidir qué construir, revisamos qué existe ya en el mercado para resolver este tipo de problema.

---

## Criterio de comparación

Buscamos plataformas **todo en uno** que cubran, en un solo producto, los tres frentes de GALCO: comercial (cotizaciones), talento humano (hojas de vida) y gastos (viáticos).

---

## Alternativas evaluadas

### Odoo

**Qué es:** ERP modular de código abierto. Se empieza con una aplicación (CRM, Inventario, Contabilidad) y se van agregando módulos, pagando por usuario en toda la suite.

| Aspecto | Evaluación |
|---|---|
| Cobertura funcional | Muy alta. Tiene módulos de ventas, reclutamiento y gastos. |
| Costo | Por usuario en toda la suite. Escala mal si media empresa necesita acceso. |
| Curva de aprendizaje | Alta. Requiere consultor o partner para implementar bien. |
| Ajuste al negocio de GALCO | Genérico. No conoce bandejas portacable, galvanizado ni perfilería. |

### Zoho One

**Qué es:** suite de más de 40 aplicaciones de negocio bajo una sola suscripción.

| Aspecto | Evaluación |
|---|---|
| Cobertura funcional | Muy alta. Zoho CRM, Zoho Recruit y Zoho Expense cubren los tres frentes. |
| Costo | Suscripción por usuario. Se paga por 40 apps aunque se usen 3. |
| Curva de aprendizaje | Media. Buen onboarding guiado y plantillas. |
| Ajuste al negocio de GALCO | Genérico. Cada app es una interfaz distinta, no una experiencia unificada. |

### Bitrix24

**Qué es:** plataforma de colaboración con CRM, tareas y gestión de equipos.

| Aspecto | Evaluación |
|---|---|
| Cobertura funcional | Media. Fuerte en CRM y colaboración, débil en operación industrial. |
| Costo | Cobra **por plan, no por usuario**, desde alrededor de 49 EUR/mes. Ventaja real de costo. |
| Curva de aprendizaje | Baja. Configuración rápida. |
| Ajuste al negocio de GALCO | **No es un ERP en sentido estricto.** Carece de contabilidad, fabricación, almacén y compras con la profundidad que requiere una empresa industrial. |

---

## Tabla comparativa

| Criterio | Odoo | Zoho One | Bitrix24 | **Sistema GALCO** |
|---|---|---|---|---|
| Cotizador con catálogo metalmecánico propio | Genérico | Genérico | Limitado | **A la medida** |
| Gestor de hojas de vida | Sí (Recruitment) | Sí (Recruit) | Básico | **A la medida** |
| Gestor de viáticos con soportes | Sí (Expenses) | Sí (Expense) | Básico | **A la medida** |
| Integración con el sistema interno actual de GALCO | Requiere desarrollo | Requiere desarrollo | Requiere desarrollo | **Nativa** |
| Modelo de costo | Por usuario | Por usuario | Por plan | **Sin licencia recurrente** |
| Curva de aprendizaje para personal de planta | Alta | Media | Baja | **Diseñada para ellos** |
| Facturación electrónica DIAN Colombia | Vía localización | Vía partner | No nativa | **Integración directa** |

---

## Conclusión de la divergencia

Las tres plataformas **resuelven el problema en general, pero ninguna lo resuelve para GALCO en particular**. Los tres puntos de quiebre:

1. **Costo recurrente por usuario.** GALCO necesitaría licenciar comerciales, RRHH, contabilidad, aprobadores y personal de obra. El costo crece con la adopción, que es exactamente lo contrario de lo que se busca.
2. **Genericidad del catálogo.** Ninguna sabe qué es una bandeja portacable tipo escalera de 20 x 8 cm x 2,4 m, ni cómo se cotiza galvanizado por kilo o por metro cuadrado. Todo eso habría que configurarlo igual.
3. **Curva de aprendizaje contra el dolor declarado.** El usuario dijo textualmente que teme que el cambio tome tiempo de capacitación que no tiene. Implementar Odoo contradice directamente ese hallazgo del mapa de empatía.

**Decisión:** construir a la medida, tomando de estas plataformas las buenas ideas de UX (todo en uno, un solo login, roles por módulo) sin heredar su complejidad ni su costo.

---

**Anterior:** [[03 Empatizar]] · **Siguiente:** [[05 Decidir]]
