# Detalle de los requerimientos pendientes - APF2 hacia APF3

Este documento desglosa los cuatro requerimientos funcionales que el
APF2 declaro pendientes y propone, para cada uno, su alcance tecnico,
dependencias, modelo de datos, API, validaciones, evidencia esperada y
tareas estimadas. Es la base del "cierre funcional" previsto en el plan
de continuidad hacia el APF3.

---

## 0.bis Estado de implementacion en el backend (APF2 -> APF3)

En el backend (`app/backend-enao-ti`) ya esta implementada la parte tecnica
de los cuatro RF, con estas piezas concretas:

| RF | Piezas implementadas en el backend |
|---|---|
| RF-03 | `FilesProperties` (limites y lista blanca por variables de entorno), `ObjectStorageAdapter` + `FilesystemObjectStorage` y `S3ObjectStorage` (con `S3Client`/`S3Presigner`), `ApplicantDocument`, `ApplicantDocumentRepository`, `DocumentService`, `DocumentController` y `DocumentAdminController`, deteccion de tipo por magic bytes y `sha256`. |
| RF-04 | `Comprobante`, `ComprobanteRepository`, `ComprobanteService`, `ComprobanteController` y `MinimalPdfWriter` (generador de PDF sin dependencias externas, con `Helvetica` y `WinAnsiEncoding`). |
| RF-08 | `ReportEntity`/`ReportRepository` (agregaciones JPQL por periodo, sede, institucion y estado), `ReportService`, `ReportController` y exportacion en JSON, CSV y PDF. |
| RF-09 | `docker/compose-helpdesk.yaml` con FreeScout, su base de datos y su volumen; proxy de entrada por `location /soporte/` en `docker/nginx-frontend.conf`; variables en `config/ejemplos.env`. |

Lo que queda pendiente del cierre funcional (no implementado en el backend):

- Pantallas del frontend para subir documentos, descargar el comprobante y
  consultar los reportes (el backend ya expone los endpoints REST).
- Indices de reportes aplicados en la base de datos real (estan en
  `docs/sql/schema-complementario.sql`) y medicion con `EXPLAIN`.
- Cache de resultados en RF-08.
- Configuracion real del correo y del bucket de objetos en el despliegue.

---

## 0. Contexto y precondiciones

Los cuatro pendientes, tal como figuran en la matriz de trazabilidad y
en el informe (secciones 2.1 y 12.2), son:

| ID | Requerimiento | Estado en el APF2 | Motivo del pendiente |
|---|---|---|---|
| RF-03 | Adjuntar documentos y validar tamano | No implementado | Requiere almacenamiento de objetos (S-02) |
| RF-04 | Comprobante de inscripcion descargable | No implementado | Requiere generacion de PDF |
| RF-08 | Reportes por periodo, sede, institucion y estado | No implementado | Cierre funcional pendiente |
| RF-09 | Mesa de ayuda con tickets | No implementado | SaaS externo en el diseno del APF1 |

Precondiciones tecnicas que habilitan el cierre funcional:

1. **Bucket de objetos (S-02)** para RF-03 y la parte de adjuntos de
   tickets (RF-09). En el diseno AWS es Amazon S3; en el laboratorio
   Docker/Kubernetes es un bucket compatible (por ejemplo MinIO) que se
   declara en el `compose.yaml` separado del servicio de datos.
2. **Ingress/proxy** que configure el tamano maximo de cuerpo de peticion
   para que el limite del backend no se corte antes por el proxy.
3. **Servicio de correo transaccional** para notificaciones de estado y
   de tickets (es condicion en el plan del APF3).
4. Roles JWT ya implementados en el backend (`ADMIN`, `MAINTAINER`,
   `APPLICANT`), que se reutilizan tal cual.

---

## 1. RF-03 - Adjuntar documentos y validar tamano

### 1.1 Alcance funcional

Un postulante adjunta los documentos exigidos para su inscripcion. El
backend valida tamano y tipo de forma autoritativa y solo deja el
documento disponible si supera la validacion.

Criterios de aceptacion propuestos:

| Criterio | Resultado esperado |
|---|---|
| El postulante puede subir hasta N archivos (configurable) | Se aceptan hasta N; el N+1 se rechaza con mensaje claro |
| Tamano maximo por archivo configurable | Un archivo mayor se rechaza con 413 y mensaje legible |
| Tipos permitidos configurables | Un tipo no permitido se rechaza con 415 |
| El tipo real del archivo se comprueba por contenido, no por extension | Un PDF renombrado a `.jpg` se rechaza |
| El nombre del archivo se sanitiza | Ningun path traversal ni caracteres peligrosos |
| El documento persiste tras reinicio del contenedor de base de datos | El registro y el objeto siguen disponibles |
| Solo el propietario o un administrador puede descargarlo | Un postulante no puede descargar el fichero de otro |
| Se puede registrar la revision del documento | Estado VALIDACION_OK o VALIDACION_NO_OK con comentario |

### 1.2 Dependencias tecnicas

| Dependencia | Impacto si falta | Como se resuelve |
|---|---|---|
| Bucket de objetos | No se puede almacenar el archivo fuera de la BD | MinIO en el laboratorio o Amazon S3 en el diseno AWS |
| Proxy/Ingress con tamano de cuerpo | El proxy corta la subida antes del backend | Configurar `client_max_body_size` en Nginx y el Ingress |
| Servicio de correo | Notificacion de rechazo/validacion | Condicion del plan del APF3 |

### 1.3 Modelo de datos propuesto

```text
documents
  id                  BIGINT PK
  applicant_id        BIGINT FK -> applicants.id
  document_type_id    BIGINT FK (catalogo: DNI, certificado, etc.)
  original_name       VARCHAR(255)     -- solo para mostrar, nunca usado como clave
  storage_key         VARCHAR(255) UNIQUE   -- uuid + extension
  content_type        VARCHAR(100)     -- declarado por el frontend
  detected_mime       VARCHAR(100)     -- detectado por magic bytes
  size_bytes          BIGINT
  sha256              CHAR(64)         -- integridad y desduplicacion
  status              ENUM('PENDIENTE', 'VALIDACION_OK', 'VALIDACION_NO_OK')
  upload_comment      VARCHAR(500) NULL
  review_comment      VARCHAR(500) NULL
  reviewed_by         BIGINT NULL FK -> users.id
  uploaded_at         DATETIME
  reviewed_at         DATETIME NULL
```

Nota: el `storage_key` nunca contiene el nombre del usuario y nunca se
construye concatenando rutas.

### 1.4 API propuesta

| Metodo y ruta | Rol | Descripcion |
|---|---|---|
| `POST /api/me/documents` | `APPLICANT` | Sube un documento; el cuerpo es `multipart/form-data` |
| `GET  /api/me/documents` | `APPLICANT` | Lista los documentos propios con su estado |
| `GET  /api/documents/{id}/download` | `APPLICANT` (propietario) o `ADMIN` | Descarga por URL prefirmada |
| `DELETE /api/me/documents/{id}` | `APPLICANT` (propietario) | Elimina el propio documento antes de la revision |
| `GET  /api/admin/applicants/{id}/documents` | `ADMIN`/`MAINTAINER` | Lista los documentos de un postulante |
| `PUT  /api/admin/documents/{id}/review` | `ADMIN` | Registra la revision con comentario |

Codigos de error consistentes: `400` si falta un campo, `401` sin token,
`403` fuera del rol, `404` si no existe, `413` tamano excedido,
`415` tipo no permitido y `422` si la validacion semantica falla.

### 1.5 Validaciones y seguridad

- **Tamano configurable por variables de entorno** (nada en el codigo):
  `FILES_MAX_FILE_SIZE_MB`, `FILES_MAX_TOTAL_MB`,
  `FILES_MAX_FILES_PER_APPLICANT`, `FILES_ALLOWED_EXT`, `FILES_ALLOWED_MIME`.
- Tamano declarado en `spring.servlet.multipart.max-file-size` y
  `max-request-size`, y tambien verificado en el backend antes de mover el
  archivo, de modo no se confie en una sola capa.
- **Deteccion de tipo por magic bytes** (Apache Tika: `tika-core` y
  `tika-parsers-standard`), y comparacion contra la lista blanca.
- **Sanitizacion del nombre**: se quita cualquier ruta y se limita a un
  conjunto seguro de caracteres; el documento se guarda con `uuid`
  generado por el backend.
- **Hash SHA-256** para comprobacion de integridad y desduplicacion.
- **Acceso restringido**: el bucket nunca es publico; la descarga se hace
  por **URL prefirmada** con un TTL corto (5 a 15 minutos) o proxificada
  por el backend.
- **Cifrado en reposo** en el diseno AWS (SSE-S3 o SSE-KMS) y versionado
  del bucket si se desea retener versiones anteriores.
- **Registros de auditoria**: quien subio, quien reviso, quien descargo y
  cuando (tabla `document_access_log`).
- **Ley N.o 29733** (proteccion de datos personales): se documenta la
  finalidad, el plazo de retencion y el procedimiento de supresion.

### 1.6 Opciones de almacenamiento

| Opcion | Uso real en el proyecto | Ventaja | Limitacion |
|---|---|---|---|
| Amazon S3 | Diseno del APF1 / APF2 (SIMULADO) | Es el recurso que la arquitectura ya contempla | No se desplegara en el laboratorio academico |
| MinIO en Docker | Verificacion local del APF3 | Compatibilidad con la API de S3 y costo cero | Consume recursos del host de laboratorio |
| Volumen Docker + disco local | Ultimo recurso | Sin dependencias externas | No es almacenamiento de objetos y no escala |

Recomendacion: implementar el adapter contra la **API de S3** y apuntar a
MinIO en el laboratorio y a Amazon S3 en el despliegue real, de modo que
el codigo del backend no cambie al migrar.

### 1.7 Tareas y evidencia esperada

| Tarea | Estimacion | Evidencia |
|---|---|---|
| Definir catalogo de tipos de documento y limites | 2 h | `config/ejemplos.env` actualizado |
| Modelo JPA + migracion de la tabla | 3 h | `schema.sql` o migracion en el repo |
| Crear el `ObjectStorageAdapter` (API S3) con dos perfiles | 4 h | Codigo y prueba de subida con MinIO |
| Endpoints de subida, listado y descarga | 6 h | `curl` con `Authorization` y salida JSON |
| Validacion por magic bytes y hash | 4 h | Caso de tipo no permitido y caso de PDF renombrado |
| Acceso restringido y URL prefirmada con TTL | 4 h | Prueba de acceso cruzado entre usuarios |
| Pantalla de subida en el frontend con drag-and-drop | 6 h | Captura de pantalla |
| Pantalla de revision en el frontend (admin) | 4 h | Captura de pantalla |
| Prueba de persistencia y documentos | 2 h | Salida de `mysql` y del reinicio |

---

## 2. RF-04 - Comprobante de inscripcion descargable

### 2.1 Alcance funcional

Cuando la inscripcion del postulante esta en un estado valido (por
ejemplo `REGISTRADA`), el sistema genera y ofrece descargar un PDF con
los datos de la inscripcion. Cada generacion queda registrada para
auditoria y para permitir la verificacion posterior por numero de serie.

Contenido minimo del PDF: codigo de inscripcion, nombre completo del
postulante, tipo y numero de documento, periodo, sede, institucion,
fecha y hora de inscripcion, estado, numero de serie, hash del
contenido y marca de agua `COPIA OFICIAL - APF2 ASPEFO`.

### 2.2 Librerias de generacion de PDF

| Libreria | Licencia | Uso en Java | Observacion |
|---|---|---|---|
| Apache PDFBox | Apache-2.0 | API de bajo nivel: se dibuja el PDF | Pesado en codigo, pero sin dependencias adicionales |
| OpenPDF | MPL-2.0 / LGPL | Fork libre de iText 4 | API amigable, buen equilibrio |
| JasperReports | LGPL-3.0 | Plantillas JRXML rellenadas con datos | Ideal cuando se quiere un diseno formal |
| iText 5/7 | AGPL o comercial | No usar sin revisar la licencia | Riesgo de licencia si el uso no es AGPL |

Recomendacion: **JasperReports** si se necesita una plantilla
profesional (se edita con Jaspersoft Studio y mantiene la logica de
negocio separada del diseno), o **OpenPDF/PDFBox** si se prefiere un
PDF directo sin plantilla. No se recomienda iText por la licencia.

### 2.3 Modelo de datos propuesto

```text
comprobantes
  id               BIGINT PK
  applicant_id     BIGINT FK -> applicants.id
  serial           CHAR(36) UNIQUE   -- uuid, publico y verificable
  sha256           CHAR(64)          -- hash del contenido del PDF
  period_id        BIGINT FK
  campus_id        BIGINT FK
  institution_id   BIGINT FK
  enrollment_status VARCHAR(30)
  generated_at     DATETIME
  generated_by     BIGINT NULL FK -> users.id
  state            ENUM('ACTIVO', 'ANULADO')
```

### 2.4 API propuesta

| Metodo y ruta | Rol | Descripcion |
|---|---|---|
| `GET /api/me/comprobante.pdf` | `APPLICANT` | Genera (o recupera si existe) y devuelve el PDF |
| `GET /api/admin/comprobantes/{id}.pdf` | `ADMIN` | Revisa el PDF emitido a un postulante |
| `GET /api/comprobantes/{serial}` | Publico | Verifica el serial y devuelve el hash y la fecha |

La respuesta del PDF se entrega con
`Content-Disposition: attachment; filename="comprobante-{serial}.pdf"`.

### 2.5 Integridad, auditoria y caching

- **Hash SHA-256** del contenido del PDF: si un byte cambia, el hash
  cambiara y la verificacion fallara.
- **Serial UUID** por emision; los intentos de generar dos comprobantes
  con el mismo serial fallan por la clausula `UNIQUE`.
- **Registro de emision** para cada generacion: fecha, usuario, y
  resultados de la inscripcion en ese momento.
- **Regeneracion controlada**: si cambia el estado de la inscripcion
  (por ejemplo, se anula), el estado del comprobante pasa a `ANULADO` y
  no se emiten nuevos hasta que se vuelva a un estado valido.
- **Cache por version**: si los datos de la inscripcion no cambiaron, se
  devuelve el PDF ya generado (cache en la BD mediante el `sha256` y
  `generated_at`), lo cual evita recalcular en cada descarga.
- **Tamano objetivo** de cada PDF: por debajo de 200 KB.

### 2.6 Frontend

- Boton "Descargar comprobante" en la vista del postulante: hace el
  `fetch` con `Authorization`, recibe el `Blob` y dispara la descarga
  por `URL.createObjectURL`.
- Mensaje claro si la inscripcion no esta en un estado que permita
  emitir el comprobante.
- Vista de administrador con el listado de comprobantes y su estado.
- Vista publica de verificacion con el serial.

### 2.7 Tareas y evidencia esperada

| Tarea | Estimacion | Evidencia |
|---|---|---|
| Plantilla del PDF (JasperReports) o dibujado con OpenPDF | 5 h | Archivo JRXML o clase de generacion |
| Modelo JPA y migracion | 3 h | `schema.sql` o migracion |
| Endpoint de generacion y descarga | 4 h | `curl -H Authorization` con el PDF recibido |
| Endpoint de verificacion por serial | 2 h | `curl` con el serial y respuesta JSON |
| Registro de emision y hash | 2 h | Tabla `comprobantes` con un registro |
| Pantalla del frontend y descarga como Blob | 4 h | Captura de pantalla |
| Casos de prueba (estado valido e invalido) | 3 h | Salida de `curl` con ambos casos |

---

## 3. RF-08 - Reportes por periodo, sede, institucion y estado

### 3.1 Alcance y consideraciones de datos personales

Los reportes se consumen por roles `ADMIN` y `MAINTAINER`. Para respetar
la Ley N.o 29733, en los reportes **agregados** (por periodo, sede,
institucion o estado) se muestran **conteos**, no datos personales. El
detalle persona-por-persona se entrega solo en la vista de administrador
ya existente, con paginacion y registro de accesos.

| Reporte | Agrupacion | Salida esperada |
|---|---|---|
| Inscripciones por periodo | `period_id` | Total de postulantes y por estado |
| Inscripciones por sede | `campus_id` | Total por sede y por estado |
| Inscripciones por institucion | `institution_id` | Total por institucion |
| Resumen combinado | period + campus + institution | Matriz cruzada y KPIs |
| Distribucion de resultados | `results.status` | Cantidad en cada estado |

### 3.2 Modelo de consultas e indices

Las consultas se expresan en JPQL/Specifications sobre `applicants` y
`results`. Los indices que conviene crear y justificar con `EXPLAIN`:

```sql
CREATE INDEX idx_applicants_period_status
  ON applicants (period_id, status);
CREATE INDEX idx_applicants_campus_period
  ON applicants (campus_id, period_id);
CREATE INDEX idx_applicants_institution_period
  ON applicants (institution_id, period_id);
CREATE INDEX idx_applicants_status
  ON applicants (status);
```

La salida de `EXPLAIN` debe mostrarse en la evidencia para justificar
que los indices usados son los esperados. Si un reporte tarda mas del
objetivo del APF1 (RNF-03: 95 % de peticiones en menos de 3 s), hay que
replantear la consulta o el indice, no escalar la aplicacion.

### 3.3 API propuesta

| Metodo y ruta | Rol | Descripcion |
|---|---|---|
| `GET /api/admin/reports/enrollment` | `ADMIN`/`MAINTAINER` | Reporte agregado con filtros combinables |
| `GET /api/admin/reports/enrollment` con `format=csv` | `ADMIN` | Exportacion CSV |
| `GET /api/admin/reports/enrollment` con `format=pdf` | `ADMIN` | Exportacion PDF |
| `GET /api/admin/reports/summary` | `ADMIN`/`MAINTAINER` | KPIs para el panel |
| `GET /api/admin/reports/results` | `ADMIN`/`MAINTAINER` | Distribucion de resultados |

Parametros de filtrado (combinables y opcionales): `period`, `campus`,
`institution`, `status`, `from`, `to`, `group-by`, `page`, `size`.

La respuesta JSON agrega un bloque `totals` con la suma de todos los
agrupamientos, para verificar que los totales cuadren con una consulta
SQL directa durante la verificacion.

### 3.4 Rendimiento y caching

- **Cache** de resultados agregados con Spring Cache + Caffeine, con TTL
  de 2 a 5 minutos. La cache se invalida cuando cambia la inscripcion.
- **Limite de paginacion**: `size` maximo configurable
  (`REPORTS_MAX_PAGE_SIZE`, por ejemplo 500) para que una peticion
  malformada no provoque una consulta sin limites.
- **Exportacion asincrona**: si el volumen excede un umbral
  (`REPORTS_SYNC_MAX_ROWS`), el endpoint encola la tarea y devuelve un
  identificador; la descarga se hace por URL prefirmada del bucket.
- **No exponer el detalle** de datos personales en los reportes
  agregados; el reporte solo entrega counts y agrupaciones.

### 3.5 Frontend

- Pantalla del panel con filtros, tabla y graficos (por ejemplo
  `recharts`) para los reportes.
- Botones de exportacion (CSV y PDF) que respetan el mismo conjunto de
  filtros.
- Mensaje claro cuando un filtro devuelve cero resultados.
- Registro de quien consulto cada reporte (tabla `report_access_log`) si
  se requiere trazabilidad completa en el APF3.

### 3.6 Tareas y evidencia esperada

| Tarea | Estimacion | Evidencia |
|---|---|---|
| Indices y `EXPLAIN` de cada consulta | 3 h | Salida de `EXPLAIN` en la evidencia |
| Repositorio y especificaciones de consulta | 5 h | Codigo y pruebas de consulta |
| Endpoints de reporte (JSON + CSV + PDF) | 6 h | `curl` con cada formato |
| Validacion de filtros y limites | 3 h | Casos con paginacion y filtros combinados |
| Cache con invalidacion | 3 h | Cambio de datos y repuesta desde cache |
| Pantalla con filtros, tabla y graficos | 8 h | Captura de pantalla |
| Pruebas de consistencia de totales contra SQL | 3 h | Comparacion reporte vs consulta directa |

---

## 4. RF-09 - Mesa de ayuda con tickets

### 4.1 Alcance y cambio desde el APF1

En el APF1 el requerimiento apuntaba a **Freshdesk**, un SaaS externo.
Para el APF3 se propone una **instancia self-hosted open source,
personalizable mediante variables de entorno**, que se despliega como un
servicio mas dentro del mismo enfoque de orquestacion:

- Sin dependencia de un proveedor externo y sin costo por usuario.
- Con el despliegue (contenedores, red, volumen y healthcheck) ya
  probado como parte de la arquitectura actual.
- Configurable por variables de entorno alineadas con el `.env` del
  proyecto, incluidas credenciales de base de datos y de correo.

El cambio de alcance (Freshdesk -> mesa de ayuda self-hosted) debe
reflejarse en la matriz de trazabilidad del APF3.

### 4.2 Comparativa de opciones open source

La tabla compara candidatas reales revisadas por documentacion oficial
(la licencia se indica tal como publican los repositorios; se debe
volver a verificar antes de fijar la eleccion).

| Proyecto | Licencia | Stack base | Requisitos adicionales | Config por variables de entorno | Integracion con el portal |
|---|---|---|---|---|---|
| **Zammad** | AGPL-3.0 | Ruby on Rails | PostgreSQL, Redis, Memcached y (recomendado) Elasticsearch | Muy completa; compose oficial con `.env.dist` | API REST y webhook; Helm chart oficial para Kubernetes |
| **FreeScout** | AGPL-3.0 | PHP (Laravel) | MySQL/MariaDB o PostgreSQL | Completa; `.env` de Laravel | API, webhooks, modulos, soporte nativo de S3 |
| **osTicket** | GPL-2.0 | PHP | MySQL 5.5+ | Parcial: instalacion web y `ost-config.php`; menos env-driven | API web, correo, campos propios |
| **UVdesk Community** | OSL-3.0 | PHP/Symfony | PHP 8.1 + MySQL 5.7 | Completa (installer web y consola) | Soporte de ticket por correo, modulos, API |

Consideraciones de licencia a documentar en la matriz:

- **AGPL-3.0** (Zammad y FreeScout): obliga a compartir las
  modificaciones del proyecto si se ofrece el servicio en red. En un
  repositorio academico de estudio no es un bloqueo, pero es un punto a
  declarar.
- **GPL-2.0** (osTicket): el alcance de copyleft es menor y solo aplica
  distribucion del binario.
- **OSL-3.0** (UVdesk): incluye la clausula de *external deployment* que
  trata como distribucion el ofrecer el servicio en red; requiere
  atencion adicional.

### 4.3 Recomendacion

**Primera opcion: FreeScout.** Razones:

1. Peso minimo: un contenedor PHP + su base de datos, sin Redis
  obligatorio ni Elasticsearch; cabe en el laboratorio academico.
2. Configuracion alineada con el patron ya usado en el proyecto: el
  `.env` de Laravel mapea directamente a las variables de entorno de
  Compose y del Secret en Kubernetes.
3. Soporte nativo de almacenamiento S3, lo que permite reutilizar el
  mismo enfoque del bucket S-02 para los adjuntos de tickets.
4. Interfaz y API sencillas, con web installer y modulos.

**Alternativa cuando el alcance crezca: Zammad.** Si se necesitan SLA
formales, reglas de negocio, multicanalidad (correo/chat/formularios) o
un modelo de permisos mas rico, Zammad tiene el paquete mas completo y
un despliegue Compose/Helm maduro. Su costo son los recursos
(PostgreSQL, Redis, Memcached y Elasticsearch).

osTicket y UVdesk quedan como alternativas secundarias: osTicket es muy
conocido pero su instalacion es menos env-driven, y UVdesk tiene la
clausula de licencia ya descrita.

### 4.4 Variables de entorno de configuracion (ejemplo con FreeScout)

La lista siguiente es indicativa, no definitiva: cada variable hay que
confirmarla contra la documentacion oficial antes de fijar la
configuracion final.

| Variable | Uso |
|---|---|
| `APP_URL` | URL publica del portal de soporte |
| `APP_KEY` | Clave de aplicacion (generada una vez, nunca versionada) |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Conexion a la base de datos propia de la mesa de ayuda |
| `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_ENCRYPTION`, `MAIL_FROM_ADDRESS` | Envio y recepcion de correo (tickets entrantes y respuestas) |
| `SESSION_SECURE_COOKIE`, `APP_DEBUG`, `APP_ENV` | Comportamiento del entorno |
| `FILESYSTEM_DISK=s3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, con endpoint configurable | Adjuntos en el bucket de objetos |

El principio es el mismo que en el resto del proyecto: los secretos
viven en el archivo `.env` (fuera del repositorio) y en
`config/ejemplos.env` se documentan los marcadores de posicion, de modo
que la configuracion quede versionada sin credenciales.

### 4.5 Integracion con la arquitectura propuesta

1. **Servicio nuevo en `docker/compose.yaml`** (o en un compose separado
   `docker/compose-helpdesk.yaml` que se levanta junto con el principal):
   contenedor de la mesa de ayuda y, si el proyecto lo exige, su propia
   base de datos.
2. **Red**: la mesa de ayuda se une a `apf2_private` para hablar con su
   base de datos, y **no publica ningun puerto en el host**. El acceso
   del usuario pasa por el mismo proxy/Ingress del portal, en una ruta
   dedicada (por ejemplo `https://portal/soporte`) o en un subdominio.
3. **Persistencia propia**: un volumen para la base de datos de la mesa
   de ayuda y otro para sus adjuntos, de modo que no se compartan
   volumes con la base de datos de la aplicacion.
4. **Healthcheck**: en el contenedor de la mesa de ayuda se configura un
   healthcheck propio (por ejemplo `GET /health` o una URL de login), de
   modo que el proxy no enrute a un contenedor caido.
5. **Integracion funcional con el portal**:
   - Enlace "Mesa de ayuda" en el menu del portal para el usuario final.
   - Registro opcional de la creacion de tickets via la API de la
     herramienta, si el portal quiere mostrar el ultimo ticket abierto
     del usuario.
6. **Mantenimiento**: respaldos de su base de datos y de sus adjuntos,
   y versionado de imagenes, tal como se planifico para los demas
   servicios.

### 4.6 Riesgos de implementacion

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| La herramienta consume mas recursos de lo previsto en el host de laboratorio | El resto del despliegue se degrada | Medir con `docker stats` antes y despues; fijar limites de CPU y memoria |
| Dependencias adicionales (Redis, Elasticsearch, PostgreSQL) | Complejidad de orquestacion | Preferir una imagen con menos dependencias, o deshabilitar las opcionales |
| La configuracion por variables de entorno no cubre todo | Configuracion manual fuera del control de versiones | Documentar los pasos manuales en la guia de evidencias |
| Licencia con alcance copyleft (AGPL) o clausula de external deployment (OSL) | Obligacion de compartir cambios | Registrar la licencia en la matriz y en el informe; no distribuir binarios modificados |
| La mesa de ayuda se convierte en un subproyecto mayor que el cierre funcional | Retraso del APF3 | Acotar el alcance: levantar el contenedor, configurar correo, y un ticket de prueba de extremo a extremo |

### 4.7 Tareas y evidencia esperada

| Tarea | Estimacion | Evidencia |
|---|---|---|
| Elegir la herramienta y registrar la decision (comparativa + licencia) | 2 h | Seccion en la matriz y en el informe |
| Servicio en Compose con su red y su volumen | 3 h | `docker compose config --quiet` y `ps` |
| Configuracion por variables de entorno y `.env` de ejemplo | 3 h | `config/ejemplos.env` actualizado |
| Healthcheck y proxy/Ingress | 3 h | Salida del proxy y del `ps` |
| Creacion de un ticket desde el portal y respuesta interna | 4 h | Captura de pantalla de ambos lados |
| Respaldos de su base de datos y de sus adjuntos | 3 h | Salida del respaldo |
| Guia de despliegue y de verificacion | 4 h | Entrada en la guia de verificacion de evidencias |

---

## 5. Resumen de esfuerzos y orden de trabajo

Las estimaciones de horas son de referencia (por integrante), no un
compromiso. El orden se apoya en las dependencias: primero el bucket de
objetos, luego RF-03 y RF-04, luego RF-08 y, en paralelo o al final,
RF-09.

| RF | Cambio principal | Backend | Frontend | Infraestructura | Total estimado |
|---|---|---|---|---|---|
| RF-03 | Subida y validacion de documentos con bucket S3 | 13 h | 10 h | 4 h (adapter + MinIO) | **27 h** |
| RF-04 | Generacion y descarga del comprobante PDF | 11 h | 4 h | 0 h | **15 h** |
| RF-08 | Reportes agregados con cache e indices | 14 h | 8 h | 3 h (indices + EXPLAIN) | **25 h** |
| RF-09 | Mesa de ayuda self-hosted open source | 0 h (opcional API) | 0 h | 15 h (contenedor + integracion) | **15-20 h** |
| **Total** | | **38 h** | **22 h** | **22 h** | **82-87 h** |

Orden previsto dentro del APF3 (alineado con los hitos semanales del
plan de continuidad):

| Hito | Trabajo |
|---|---|
| Semana 13-14 | Bucket de objetos y correo transaccional (habilita RF-03 y RF-04) |
| Semana 14 | RF-03: subida, validacion de tamano y tipo, revision |
| Semana 15 | RF-04: plantilla del PDF, emision, serial y hash |
| Semana 16 | RF-08: indices, consultas, cache y pantalla de reportes |
| Semana 16-17 | RF-09: eleccion de la herramienta, servicio en Compose/K8s y ticket de prueba |
| Semana 17 | Cierre de evidencias, video y documento final |

## 6. Riesgos generales del cierre funcional

| Riesgo | Impacto | Mitigacion |
|---|---|---|
| El bucket de objetos no llega disponible | Bloquea RF-03, RF-04 y adjuntos de RF-09 | Implementar el `ObjectStorageAdapter` contra MinIO en el laboratorio antes de migrar a S3 |
| El PDF consume mas tiempo o memoria de lo previsto | Latencia del endpoint | Cache por version y validacion del tamano del PDF |
| Los reportes agregados tardan mas de 3 s | Incumplimiento de RNF-03 | Revisar indices con `EXPLAIN` y limitar el tamano de pagina |
| La mesa de ayuda introduce dependencias pesadas | Complejidad de orquestacion | Preferir una imagen con menos dependencias; documentar lo que se deshibilita |
| Los datos personales aparecen en reportes o logs | Incumplimiento de la Ley N.o 29733 | Reportes con conteos y anonimizacion; revision de logs antes de centralizarlos |

## 7. Checklist de evidencias para el APF3

Para cada RF, la evidencia debe incluir al menos:

- [ ] Comando o captura de la operacion de negocio realizada de extremo a
  extremo (subida, descarga, emision, consulta, ticket).
- [ ] Caso de rechazo (archivo muy grande, tipo no permitido, estado
  invalido, filtro invalido) con el mensaje visualizado.
- [ ] Verificacion de persistencia (el dato sigue disponible tras el
  reinicio del contenedor correspondiente).
- [ ] Verificacion de acceso (un usuario sin permiso no obtiene el
  recurso).
- [ ] Registro de auditoria o log del evento.
- [ ] Nombre del archivo en el repositorio y ubicacion del log o captura
  en `docs/evidencias/`.

---

## Referencias

- `docs/matriz-trazabilidad.md` - estado actual de cada RF.
- `docs/evidencias/E-01` a `E-06` - evidencias del APF2.
- `docs/guia-verificacion-evidencias.md` - guia de verificacion.
- `config/ejemplos.env` - variables de entorno documentadas.
- `infra/cloud/vpc.tf`, `infra/cloud/security-groups.tf` - diseno AWS simulado.
- `infra/network/README.md` - equivalencia entre Docker y AWS.
