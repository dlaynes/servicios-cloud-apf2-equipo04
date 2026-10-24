# E-07 - Cierre funcional de RF-03, RF-04 y RF-08 en el despliegue

**Que demuestra:** que los tres requerimientos que el APF2 declaro
pendientes quedaron implementados y verificados end-to-end contra el
despliegue real con contenedores (frontend + backend + base de datos), y
que el ciclo completo funciona de extremo a extremo con un solo script.

**Estado:** IMPLEMENTADO y VERIFICADO el 24/10/2026, con 28 de 28
comprobaciones positivas.

## Como reproducir

```bash
# el stack debe estar levantado
docker compose -f docker/compose.yaml --env-file .env up -d
bash scripts/verificar-rf.sh http://localhost:8080
# -> 28 de 28 comprobaciones [OK]
```

El script registra un postulante de prueba con documento y correo unicos
en cada corrida, por lo que es seguro repetirla. La contrasena del
administrador se lee de `ADMIN_PASSWORD` en el `.env` del repositorio; sin
usar el valor por defecto del perfil de desarrollo (`admin123`).

## Las 28 comprobaciones verificadas

| Paso | Comprobacion | Resultado |
|---|---|---|
| 0 | `/api/health` con `database=UP` y `adminAccount=CONFIGURED` | OK |
| 1 | Registro publico del postulante (id asignado) | OK |
| 2 | Login del postulante con JWT | OK |
| 4 | Subida del documento (RF-03) con 201 | OK |
| 4a | `sha256` registrado por el backend | OK |
| 5 | Listado de los documentos del postulante | OK |
| 6 | Descarga del documento por el propietario | OK |
| 6a | Integridad: `sha256` del archivo bajado igual al registrado | OK |
| 7 | Rechazo con 415 de un contenido que no es PDF (magic bytes) | OK |
| 8 | Rechazo con 413 del archivo mayor al limite (11 MB) | OK |
| 9 | El comprobante no se emite en estado PENDING (422) | OK |
| 10 | Login del administrador con JWT | OK |
| 11 | Cambio del estado de la inscripcion a VALIDATED | OK |
| 12 | Revision del documento por el administrador | OK |
| 12a | Estado del documento VALIDADO tras la revision | OK |
| 13 | Emision del comprobante (RF-04) | OK |
| 13a | PDF del comprobante no vacio | OK |
| 14 | Verificacion publica por numero de serie | OK |
| 14a | Comprobante `valid=true` antes de anular | OK |
| 13b | Integridad cruzada: `sha256` del PDF emitido coincide | OK |
| 15 | Anulacion del comprobante por el administrador | OK |
| 15a | Comprobante `valid=false` despues de anular | OK |
| 16a | Reporte de postulantes agrupado por estado | OK |
| 16a | Reporte agrupado por periodo | OK |
| 16a | Reporte agrupado por sede | OK |
| 16a | Reporte agrupado por institucion | OK |
| 16b | Reporte de resultados publicados | OK |
| 16c/16d | Reporte resumen con `totalApplicants` | OK |

## Lo que se verifico con evidencia real en cada RF

### RF-03 Documentos adjuntos

- El backend registra el `sha256` del archivo y devuelve el documento con
  su estado `PENDING` en la subida.
- El archivo bajado conserva el `sha256` registrado: no se corrompio en el
  almacenamiento de objetos ni en la transferencia.
- La validacion se hace por el tipo real del contenido: un archivo con la
  extension `.pdf` cuyo contenido es texto plano se rechaza con 415.
- Un archivo de 11 MB se rechaza con 413, porque el orden de las
  validaciones comprueba el tamano antes de leer los bytes y antes de
  tocar el almacenamiento.

### RF-04 Comprobante de inscripcion

- El comprobante **no** se emite si la inscripcion esta en `PENDING` (422):
  la regla de negocio es obligatoria y esta verificada.
- Emitido con la inscripcion en `VALIDATED`: PDF no vacio, con numero de
  serie y `Content-Disposition` con nombre de archivo.
- El prefijo del `sha256` devuelto por la verificacion publica coincide
  con el hash del PDF generado.
- La anulacion por el administrador deja el comprobante en
  `valid=false` en la verificacion publica.

### RF-08 Reportes agregados

- Los cuatro agrupamientos (`status`, `period`, `campus`,
  `university`) responden 200.
- El reporte de resultados y el resumen responden 200, y el resumen
  expone `totalApplicants` para cuadrar las cifras.

## Requisitos del entorno y problemas encontrados

| Requisito | Valor |
|---|---|
| Backend corriendo en contenedores con el codigo de RF-03/04/08 | build del 24/10/2026 |
| Usuario de personal disponible | `admin` creado por `AdminBootstrap` con `ADMIN_PASSWORD` en el `.env` |

Defectos que encontro la corrida del 24/10/2026 (y su correccion):

| Sintoma | Causa | Correccion aplicada |
|---|---|---|
| 500 en la subida y en la descarga del comprobante | el almacenamiento de documentos estaba en `./data/documents` con UID 10001 y sin volumen | `docker/Dockerfile.backend` crea `/app/data/documents` con el UID y `docker/compose.yaml` monta el volumen `backend_data` |
| 500 en el archivo de 11 MB | el tamano se validaba despues del tipo y de la extension | el tamano se comprueba antes de leer los bytes, con una excepcion propia con 413 |
| Sin usuario de personal | el sembrado esta apagado en el despliegue | `AdminBootstrap` crea el administrador con `ADMIN_PASSWORD`, idempotente |
| `unhealthy` del frontend aunque la SPA respondia | el healthcheck usaba `localhost`, que en Alpine resolvio a `::1` con nginx en IPv4 | healthcheck con `127.0.0.1` y un recurso propio `/health.txt` |
| 24 pasos en cascada con un solo fallo | la prueba extraia los campos con python, que el Git Bash no tenia | script reescrito sin python, con los pasos dependientes marcados `[SALTADO]` |

El detalle tecnico de cada correccion esta en `docs/evidencias/E-04-contenedores.md`
y en `docs/plan-rf-pendientes.md`.

## Referencias

- `scripts/verificar-rf.sh` - el script de la corrida, con cada paso y su
  codigo HTTP obtenido frente al esperado.
- `docs/plan-rf-pendientes.md` - el detalle tecnico de los tres RF.
- `docs/evidencias/E-04-contenedores.md` - el despliegue real con
  contenedores y las correcciones del 24/10/2026.
- `config/ejemplos.env` - las variables de entorno que necesita el
  despliegue, incluida `ADMIN_PASSWORD`.
