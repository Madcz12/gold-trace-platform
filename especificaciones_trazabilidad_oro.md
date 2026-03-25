# Sistema de trazabilidad y cadena de custodia del oro

**Versión:** 1.0  
**Fecha:** Marzo 2026  
**Estado:** Borrador inicial

---

## 1. Descripción general

Sistema web y móvil para el registro, seguimiento y auditoría del oro desde su extracción en mina hasta su venta o exportación. El sistema garantiza la trazabilidad completa de cada lote, cumple con los requisitos regulatorios colombianos (ANM, UPME, DIAN) y genera documentación de origen válida para compradores nacionales e internacionales.

---

## 2. Objetivos del sistema

- Reemplazar el registro en papel o Excel por un sistema digital centralizado.
- Garantizar que cada gramo de oro tenga un historial de custodia auditable.
- Detectar inconsistencias de peso o volumen que puedan indicar fraude.
- Generar automáticamente los reportes exigidos por los entes regulatorios.
- Proveer a compradores y exportadores documentación de origen confiable.

---

## 3. Actores del sistema

| Actor | Rol |
|---|---|
| Operador de mina | Registra la extracción y el pesaje del mineral bruto |
| Técnico de laboratorio | Registra la ley del mineral (pureza) y resultados de muestreo |
| Fundidor | Registra la producción de barras y asigna código único |
| Transportador | Registra el traslado del oro entre puntos de custodia |
| Comercializador | Recibe, valida y registra la compra del lote |
| Exportador | Genera documentos de origen para venta internacional |
| Auditor / Regulador | Consulta el historial completo de cualquier lote |
| Administrador del sistema | Gestiona usuarios, permisos y configuración |

---

## 4. Módulos del sistema

### 4.1 Módulo de registro de lotes

**Descripción:** Permite registrar cada lote de mineral desde el momento de su extracción.

**Requerimientos funcionales:**

- RF-01: El sistema debe permitir registrar un nuevo lote con los siguientes campos: fecha y hora, coordenadas GPS del punto de extracción, nombre de la mina, identificación del operador, peso bruto en gramos, turno de trabajo y observaciones.
- RF-02: Al registrar un lote, el sistema debe generar automáticamente un código único alfanumérico (ej. `AU-2026-00341`) que identifique ese lote durante toda su vida útil.
- RF-03: El sistema debe generar un código QR vinculado al código único del lote, imprimible desde la interfaz.
- RF-04: El registro debe poder realizarse desde dispositivos móviles sin conexión a internet, con sincronización automática cuando se recupere la conectividad.
- RF-05: El sistema debe registrar automáticamente el usuario y la marca de tiempo de cada operación.

**Requerimientos no funcionales:**

- RNF-01: El registro offline debe funcionar en dispositivos Android e iOS.
- RNF-02: La sincronización debe completarse en menos de 30 segundos al recuperar conectividad.

---

### 4.2 Módulo de pesaje y muestreo

**Descripción:** Registra el análisis técnico del mineral para determinar su contenido de oro.

**Requerimientos funcionales:**

- RF-06: El sistema debe permitir registrar el peso seco del mineral, el porcentaje de humedad, la ley del mineral (gramos de oro por tonelada) y el peso estimado de oro fino contenido.
- RF-07: El sistema debe calcular automáticamente el contenido de oro fino a partir del peso bruto y la ley registrada.
- RF-08: El sistema debe permitir adjuntar el certificado de análisis del laboratorio en formato PDF o imagen.
- RF-09: Cada registro de muestreo debe estar vinculado al código único del lote correspondiente.
- RF-10: El sistema debe permitir registrar múltiples muestras por lote y calcular un promedio ponderado.

---

### 4.3 Módulo de fundición

**Descripción:** Registra la transformación del mineral en barras o lingotes de oro.

**Requerimientos funcionales:**

- RF-11: El sistema debe permitir registrar la producción de una barra con los siguientes campos: código del lote de origen, peso de la barra en gramos, pureza en quilates o porcentaje, número de barra, fecha y hora de fundición, e identificación del fundidor.
- RF-12: El sistema debe generar un código único para cada barra producida, diferente al código del lote de mineral.
- RF-13: El sistema debe mantener la trazabilidad entre la barra producida y el lote de mineral del que proviene, incluso si una barra proviene de la mezcla de varios lotes.
- RF-14: El sistema debe alertar si el peso de las barras producidas supera el contenido de oro fino estimado en el muestreo, con una tolerancia configurable (por defecto ±2%).

---

### 4.4 Módulo de cadena de custodia y traspasos

**Descripción:** Registra cada cambio de manos del oro entre actores de la cadena.

**Requerimientos funcionales:**

- RF-15: El sistema debe registrar cada traspaso de custodia con los campos: actor que entrega, actor que recibe, peso entregado, código del lote o barra, fecha y hora, ubicación GPS del traspaso y observaciones.
- RF-16: Tanto el actor que entrega como el que recibe deben firmar digitalmente el traspaso dentro del sistema.
- RF-17: El sistema debe impedir que un actor registre la recepción de un lote que no le haya sido transferido formalmente.
- RF-18: El sistema debe generar automáticamente una guía de movilización en formato PDF al registrar un traspaso, con todos los datos del movimiento.
- RF-19: El historial completo de custodios de cualquier lote debe ser consultable desde el código QR o el código único del lote.

---

### 4.5 Módulo de registro inmutable (hash chain)

**Descripción:** Garantiza que ningún registro histórico pueda ser modificado sin ser detectado.

**Requerimientos funcionales:**

- RF-20: Cada registro creado en el sistema debe incluir el hash SHA-256 del registro inmediatamente anterior, formando una cadena de hashes.
- RF-21: El sistema debe proveer una función de auditoría que recorra la cadena de hashes y reporte cualquier inconsistencia.
- RF-22: Los registros auditados como íntegros deben mostrar un sello de verificación visible en la interfaz y en los reportes exportados.
- RF-23: Ningún usuario, incluyendo el administrador, debe poder editar o eliminar un registro ya firmado. Solo se permite agregar registros de corrección con referencia al registro original.

**Requerimientos no funcionales:**

- RNF-03: La función de verificación de integridad de la cadena debe completarse en menos de 5 segundos para cadenas de hasta 10.000 registros.

---

### 4.6 Módulo de alertas de fraude e inconsistencias

**Descripción:** Detecta automáticamente situaciones anómalas en los datos registrados.

**Requerimientos funcionales:**

- RF-24: El sistema debe generar una alerta cuando el peso registrado en un traspaso difiera en más de un umbral configurable (por defecto ±1%) respecto al peso del registro anterior del mismo lote.
- RF-25: El sistema debe generar una alerta cuando el contenido de oro fino de las barras producidas supere el estimado del muestreo.
- RF-26: El sistema debe alertar cuando un lote permanezca sin movimiento por más de un número de días configurable (por defecto 30 días).
- RF-27: El sistema debe alertar cuando un usuario intente registrar una operación fuera de su horario habitual o desde una ubicación geográfica inusual.
- RF-28: Las alertas deben ser visibles en el dashboard y enviadas por correo electrónico al administrador y al auditor designado.

---

### 4.7 Módulo de reportes regulatorios

**Descripción:** Genera automáticamente los informes exigidos por los entes de control colombianos.

**Requerimientos funcionales:**

- RF-29: El sistema debe generar el reporte mensual de producción exigido por la Agencia Nacional de Minería (ANM) en el formato vigente.
- RF-30: El sistema debe generar el reporte de producción para la Unidad de Planeación Minero Energética (UPME).
- RF-31: El sistema debe generar la declaración de origen del mineral para trámites ante la DIAN.
- RF-32: El sistema debe generar el certificado de cadena de custodia por lote, que pueda ser entregado al comprador como garantía de origen legal.
- RF-33: Todos los reportes deben poder exportarse en formato PDF y Excel.
- RF-34: El sistema debe mantener un historial de los reportes generados con fecha, usuario y estado de envío.

---

### 4.8 Módulo de cotización del oro

**Descripción:** Muestra el valor estimado de cada lote en pesos colombianos y dólares, basado en el precio spot internacional del oro.

**Requerimientos funcionales:**

- RF-35: El sistema debe consumir una API pública de precios del oro (por ejemplo, Gold API o Metals-API) para obtener el precio spot actualizado en USD por onza troy.
- RF-36: El sistema debe calcular y mostrar el valor estimado de cada lote en USD y en COP, usando la TRM del día publicada por el Banco de la República.
- RF-37: El valor mostrado es referencial y no vinculante; el sistema debe indicarlo claramente en la interfaz.
- RF-38: El sistema debe guardar un histórico de los precios consultados para auditoría.

**Nota:** Este módulo no incluye integración con mercados de criptoactivos ni operaciones en criptomonedas.

---

### 4.9 Módulo de dashboard y trazabilidad visual

**Descripción:** Vista centralizada del estado operativo de toda la cadena.

**Requerimientos funcionales:**

- RF-39: El dashboard debe mostrar: total de lotes activos, kilos de oro en tránsito, alertas pendientes, últimos traspasos registrados y valor estimado de la producción del mes.
- RF-40: El sistema debe mostrar un mapa con la ubicación actual de los lotes activos, basado en el último registro GPS.
- RF-41: El sistema debe mostrar la línea de tiempo completa de un lote al escanear su código QR o ingresar su código único.
- RF-42: El dashboard debe tener vistas diferenciadas según el rol del usuario (operador, comercializador, auditor, administrador).

---

### 4.10 Módulo de gestión de usuarios y permisos

**Requerimientos funcionales:**

- RF-43: El sistema debe implementar autenticación con usuario y contraseña, con opción de autenticación de dos factores (2FA).
- RF-44: El sistema debe gestionar roles con permisos diferenciados: operador de mina, técnico de laboratorio, fundidor, transportador, comercializador, exportador, auditor y administrador.
- RF-45: Cada acción en el sistema debe quedar registrada en un log de auditoría con usuario, fecha, hora y datos modificados.
- RF-46: El administrador debe poder activar, desactivar y reasignar usuarios sin eliminar su historial de operaciones.

---

## 5. Requerimientos técnicos

### 5.1 Stack tecnológico recomendado

| Capa | Tecnología sugerida |
|---|---|
| Backend | Node.js con Express o Python con FastAPI |
| Base de datos | PostgreSQL |
| Frontend web | React.js |
| App móvil | React Native o Flutter |
| Almacenamiento de archivos | AWS S3 o MinIO (self-hosted) |
| Autenticación | JWT + bcrypt, con soporte para 2FA (TOTP) |
| API de precios del oro | Gold API, Metals-API o similar |
| API de TRM | Banco de la República (servicio web público) |

### 5.2 Arquitectura general

- Arquitectura cliente-servidor con API REST.
- La app móvil debe soportar modo offline con base de datos local (SQLite) y sincronización diferida.
- Los archivos adjuntos (certificados, fotos) se almacenan en objeto storage, no en la base de datos.
- Los hashes de la cadena de integridad se calculan en el servidor, nunca en el cliente.

### 5.3 Seguridad

- Toda comunicación debe realizarse sobre HTTPS/TLS.
- Las contraseñas deben almacenarse con hash bcrypt (factor de costo mínimo 12).
- Los tokens JWT deben expirar en 8 horas para sesiones web y 30 días para la app móvil, con posibilidad de revocación.
- El sistema debe implementar rate limiting en los endpoints de autenticación.
- Los logs de auditoría deben ser de solo escritura; ningún rol debe poder modificarlos.

### 5.4 Rendimiento

- El sistema debe soportar al menos 50 usuarios concurrentes sin degradación perceptible.
- Los listados y búsquedas deben responder en menos de 2 segundos para conjuntos de hasta 100.000 registros.
- La generación de reportes PDF debe completarse en menos de 10 segundos.

### 5.5 Disponibilidad

- Disponibilidad objetivo: 99,5% mensual (equivale a menos de 3,7 horas de caída al mes).
- El sistema debe realizar respaldos automáticos de la base de datos cada 24 horas, con retención de 30 días.

---

## 6. Requerimientos de cumplimiento normativo

- El sistema debe cumplir con la Ley 1658 de 2013 (uso de mercurio y formalización minera).
- Los reportes deben ajustarse a los formatos vigentes de la ANM y la UPME al momento del desarrollo.
- El sistema debe soportar la generación de la documentación exigida por el Decreto 1666 de 2016 sobre minería de hecho.
- La información de cada lote debe conservarse por un mínimo de 10 años, conforme a las obligaciones de archivo empresarial en Colombia.

---

## 7. Modelo de negocio sugerido

| Plan | Incluye | Precio referencial mensual |
|---|---|---|
| Básico | Registro manual, reportes PDF, hasta 3 usuarios | A definir según mercado |
| Profesional | Todo lo anterior + app móvil, alertas, dashboard, hasta 10 usuarios | A definir según mercado |
| Empresarial | Todo lo anterior + API para integración con compradores, usuarios ilimitados, SLA | A definir según mercado |

Adicionalmente se recomienda cobrar una tarifa única de implementación y capacitación.

---

## 8. Fases de desarrollo sugeridas

### Fase 1 — MVP (2 a 3 meses)
- Registro de lotes y pesaje.
- Cadena de custodia con firmas digitales básicas.
- Hash chain para integridad de registros.
- Generación de código QR por lote.
- Reporte básico de producción en PDF.
- Gestión de usuarios y roles.

### Fase 2 — Producto completo (2 meses adicionales)
- App móvil con soporte offline.
- Módulo de alertas de fraude.
- Dashboard con mapa de lotes activos.
- Reportes regulatorios completos (ANM, UPME, DIAN).
- Módulo de cotización con precio spot del oro.

### Fase 3 — Escalabilidad (según demanda)
- API pública para integración con sistemas de compradores y exportadores.
- Panel multiempresa para comercializadoras con varias minas.
- Módulo de auditoría externa con acceso de solo lectura para reguladores.

---

## 9. Glosario

| Término | Definición |
|---|---|
| Lote | Cantidad de mineral extraído en una operación, identificada con un código único |
| Ley del mineral | Concentración de oro en el mineral, expresada en g/t (gramos por tonelada) |
| Oro fino | Peso de oro puro contenido en un lote, después de descontar impurezas |
| Cadena de custodia | Registro cronológico de todos los actores que han tenido bajo su responsabilidad un lote |
| Hash chain | Técnica de integridad de datos donde cada registro contiene el hash del anterior |
| TRM | Tasa Representativa del Mercado, tasa oficial de cambio USD/COP publicada por el Banco de la República |
| ANM | Agencia Nacional de Minería |
| UPME | Unidad de Planeación Minero Energética |
| DIAN | Dirección de Impuestos y Aduanas Nacionales |

---

*Documento elaborado como especificación inicial. Debe ser revisado y validado con los usuarios finales antes de iniciar el desarrollo.*
