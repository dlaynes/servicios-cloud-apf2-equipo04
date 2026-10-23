# Guia general de verificacion de evidencias - APF2 Servicios Cloud

Este documento ordena, paso a paso, las labores necesarias para
comprobar cada evidencia del Avance Final 2 (E-01 a E-06) y dejar un
registro reproducible. Las evidencias detalladas viven en
`docs/evidencias/`; esta guia indica el orden, los comandos, los
resultados esperados y como registrar cada resultado.

---

## 1. Objetivo

Reproducir de forma ordenada las verificaciones que sustentan el APF2 y
dejar, por cada evidencia, un registro con el comando ejecutado, la
salida obtenida y el resultado esperado. Al terminar debe quedar claro
que parte del proyecto esta **IMPLEMENTADA**, que parte es **PARCIAL**
y que parte es **SIMULADA** (diseno equivalente en AWS, sin despliegue
real).

## 2. Alcance y limites

### 2.1 Que se puede verificar en local

| Evidencia | Se verifica con |
|---|---|
| E-01 Red y seguridad | Docker (redes, subredes, internal, puertos publicados) |
| E-02 Computo | Compilacion Maven y arranque del backend |
| E-03 Persistencia | Volumen de Docker y consultas a MySQL |
| E-04 Contenedores | `docker compose config`, `build`, `up`, `ps` |
| E-05 Repositorio | Historial Git, `.gitignore`, `verificar-codificacion.py` |
| E-06 Observabilidad | Logs, healthchecks, `docker stats` |

### 2.2 Que no se verifica en local

Los recursos de AWS (VPC, ALB, EC2, RDS, S3, NAT Gateway, grupos de
seguridad) son **diseno simulado** en `infra/cloud/`. Se documenta con
Terraform y con la equivalencia descrita en `infra/network/README.md`.
No se afirma un despliegue real en AWS:

- No se publica el informe ni el repositorio diciendo que la VPC o el
  ALB estan en ejecucion en la nube.
- No se usa un emulador (Floci) como sustituto del despliegue real; el
  emulador, si se emplea, es solo para pruebas locales adicionales y se
  declara como tal en `docs/floci-cli.md`.

## 3. Requisitos previos

| Herramienta | Version minima | Uso | Como comprobar |
|---|---|---|---|
| Git | 2.30+ | Clonar y auditar commits | `git --version` |
| Docker Engine | 24+ | Construir y ejecutar contenedores | `docker --version` |
| Docker Compose | v2 | Desplegar frontend, backend y db | `docker compose version` |
| JDK 21 | 21 | Compilar el backend fuera de contenedor (opcional) | `java -version` |
| Maven | 3.9+ | Compilar y empaquetar el backend (opcional) | `mvn -version` (o usar el wrapper) |
| Node.js + npm | 22 + 10 | Lint y build del frontend (opcional) | `node -v`, `npm -v` |
| AWS CLI v2 | 2.x | Ejemplos de la infraestructura simulada (opcional) | `aws --version` |

> Si una herramienta no esta disponible, registralo en la evidencia
> como **bloqueo del entorno** y continua con las que si lo esten. No
> se interpreta un bloqueo del entorno como un defecto del proyecto.

## 4. Preparacion del entorno

### 4.1 Clonar el repositorio

El codigo de los dos componentes esta **directamente** dentro del repositorio,
en `app/aspefo-demo` (frontend) y en `app/backend-enao-ti` (backend); no hay
submodulos.

```bash
git clone https://github.com/dlaynes/servicios-cloud-apf2-equipo04.git
cd servicios-cloud-apf2-equipo04
```

### 4.2 Preparar las variables de entorno

```bash
cp config/ejemplos.env .env
```

Editar `.env` y colocar valores aleatorios en:

| Variable | Requisito |
|---|---|
| `MYSQL_PASSWORD` | Al menos 16 caracteres aleatorios |
| `MYSQL_ROOT_PASSWORD` | Al menos 16 caracteres aleatorios |
| `JWT_SECRET` | Al menos 32 bytes aleatorios |
| `CORS_ALLOWED_ORIGINS` | Origen del navegador, por defecto `http://localhost:8080` |

> `config/ejemplos.env` solo contiene marcadores de posicion. El
> archivo `.env` real esta en `.gitignore` y **no** se versiona.

### 4.3 Comprobar el demonio de Docker

```bash
docker info --format '{{.ServerVersion}}'
```

Si falla con `permission denied` o el servicio esta apagado, este es un
bloqueo del entorno: registralo y continua con las verificaciones que no
dependen del demonio (E-02 y E-05).

### 4.4 Compilar el backend fuera de contenedor (opcional)

```bash
app/backend-enao-ti/mvnw -o -f app/backend-enao-ti/pom.xml clean compile
```

Resultado esperado: `BUILD SUCCESS`.

## 5. Orden de ejecucion

El orden importa: primero se comprueba que la definicion es valida, se
construyen las imagenes, se levantan los servicios, se valida la red y
la persistencia y, solo al final, el repositorio y la observabilidad.

| Paso | Evidencia | Objetivo | Comando principal |
|---|---|---|---|
| 1 | E-04 | Definicion de contenedores valida | `docker compose -f docker/compose.yaml --env-file .env config --quiet` |
| 2 | E-04 | Construccion de las tres imagenes | `docker compose -f docker/compose.yaml --env-file .env build` |
| 3 | E-04 | Arranque ordenado y salud | `docker compose -f docker/compose.yaml --env-file .env up -d` |
| 4 | E-01 | Redes, subredes y aislamiento | `docker network inspect apf2_public apf2_private` |
| 5 | E-01 | Puertos realmente publicados | `docker ps --format 'table {{.Names}}\t{{.Ports}}'` |
| 6 | E-02 | Salud del backend y de la API | `bash scripts/verificar-salud.sh http://localhost:8080` |
| 7 | E-03 | Persistencia ante reinicio | reinicio de `db` y consulta de conteo |
| 8 | E-06 | Logs, metricas y uso de recursos | `logs`, `docker stats --no-stream` |
| 9 | E-05 | Repositorio, codificacion y secretos | `scripts/verificar-codificacion.py .` |

## 6. Detalle por evidencia

### 6.1 E-04 - Contenedores y comunicacion entre servicios

**Objetivo:** comprobar que existe una definicion valida de los tres
servicios, que las imagenes se construyen multi-stage y que el arranque
respeta las dependencias.

Pasos:

1. Validar la definicion sin ejecutar nada:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env config --quiet
   ```

   Resultado esperado: salida vacia y codigo de salida `0`.

2. Construir las imagenes:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env build
   ```

   Resultado esperado: tres imagenes creadas (`apf2/backend-enao:2.0-apf2`,
   `apf2/aspefo-demo:2.0-apf2`, `mysql:8.0` descargada) sin errores.

3. Levantar los servicios:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env up -d
   ```

4. Comprobar el estado y los logs de arranque:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env ps
   docker compose -f docker/compose.yaml --env-file .env logs --tail 40
   ```

   Resultado esperado: los tres contenedores en `running`; `db` y
   `backend` en `healthy`; el frontend, en el puerto 8080 del host.

Registro: `docs/evidencias/E-04-contenedores.md`, junto con las capturas
de cada comando (archivos `E-04-*.txt` o PNG).

### 6.2 E-01 - Red y seguridad

**Objetivo:** comprobar la segmentacion, el direccionamiento, el
aislamiento de la red privada y que solo el frontend publica un puerto.

Pasos:

1. Inspeccionar las redes:

   ```bash
   docker network inspect apf2_public apf2_private
   ```

   Resultado esperado: `apf2_public` con `172.28.10.0/24`; `apf2_private`
   con `172.28.20.0/24` y `Internal: true`.

2. Comprobar el aislamiento:

   ```bash
   docker network inspect apf2_private --format '{{.Internal}}'
   ```

   Resultado esperado: `true`.

3. Comprobar los puertos publicados:

   ```bash
   docker ps --format 'table {{.Names}}\t{{.Ports}}'
   ```

   Resultado esperado: solo `apf2-frontend` expone `0.0.0.0:8080->80`;
   `apf2-backend` y `apf2-db` no tienen puerto publicado.

4. (Opcional) Comprobar desde dentro de la red privada que no hay salida:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env exec backend \
     wget -q --spider --timeout=5 http://example.com || echo "Sin salida a Internet"
   ```

Registro: `docs/evidencias/E-01-red-y-seguridad.md` y capturas de cada
comando.

### 6.3 E-02 - Computo, compilacion y arranque del backend

**Objetivo:** comprobar que el backend compila y expone un endpoint de
salud que ademas refleja el estado de la base de datos.

Pasos:

1. Compilar (fuera del contenedor, si Java esta disponible):

   ```bash
   app/backend-enao-ti/mvnw -o -f app/backend-enao-ti/pom.xml clean compile
   ```

   Resultado esperado: `BUILD SUCCESS`.

2. Comprobar la salud (requiere el despliegue de Docker del paso 3 de
   E-04):

   ```bash
   bash scripts/verificar-salud.sh http://localhost:8080
   ```

   Resultado esperado: `/api/health` devuelva
   `{"status":"UP","database":"UP"}`.

3. Autenticacion y control de acceso (si el despliegue esta activo):

   | Prueba | Resultado esperado |
   |---|---|
   | `POST /api/auth/login` con credenciales de administrador | 200 y token |
   | `GET /api/admin/applicants` con token de administrador | 200 |
   | `GET /api/admin/applicants` con token de postulante | 403 |
   | `GET /api/admin/applicants` sin token | 403 |

Registro: `docs/evidencias/E-02-computo.md` con la salida de Maven, el
`curl` de salud y la matriz de control de acceso.

### 6.4 E-03 - Persistencia

**Objetivo:** comprobar que los datos sobreviven al reinicio del
contenedor de base de datos, gracias al volumen nombrado.

Pasos:

1. Registrar el numero de registros antes del reinicio:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env exec db \
     mysql -uenao -p"$MYSQL_PASSWORD" enao \
     -e "SELECT COUNT(*) FROM applicants;"
   ```

2. Reiniciar el contenedor de base de datos:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env restart db
   ```

3. Volver a consultar el conteo y comparar:

   Resultado esperado: el mismo numero de registros que antes del
   reinicio, sin perdida de datos.

4. Comprobar el volumen:

   ```bash
   docker volume inspect apf2_db_data
   ```

   Resultado esperado: existe un volumen nombrado con `Driver: local`
   y un Mountpoint en el host.

Registro: `docs/evidencias/E-03-persistencia.md` con los dos conteos y
la captura de `docker volume inspect`.

### 6.5 E-06 - Observabilidad

**Objetivo:** comprobar que hay healthchecks, logs acotados y una
manera de observar el uso de recursos.

Pasos:

1. Healthchecks definidos:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env ps
   ```

   Resultado esperado: estados `healthy` para `db` y `backend`, y un
   endpoint de salud en el backend.

2. Logs limitados:

   ```bash
   docker compose -f docker/compose.yaml --env-file .env logs --tail 20
   docker inspect apf2-backend --format '{{.HostConfig.LogConfig.Config}}'
   ```

   Resultado esperado: `max-size=10m`, `max-file=3`.

3. Uso de recursos:

   ```bash
   docker stats --no-stream
   ```

   Resultado esperado: tres contenedores con consumo acotado de CPU y
   memoria.

Registro: `docs/evidencias/E-06-observabilidad.md` con las salidas.

### 6.6 Documentos adjuntos, comprobante y reportes (RF-03, RF-04, RF-08)

Estas verificaciones dependen de los endpoints ya implementados en el
backend. Cada una se prueba con `curl` y se registra en la evidencia
correspondiente (E-03 para el comprobante, E-04 para los documentos y
E-02/E-06 para los reportes).

```bash
# 1) Documentos (RF-03): requiere un token de postulante
curl -X POST http://localhost:8080/api/me/documents \
    -H "Authorization: Bearer <token>" \
    -F "file=@DNI.pdf" \
    -F "documentType=DNI" \
    -F "uploadComment=DNI escaneado"
# Resultado esperado: 201 con id, sha256 y estado PENDING.
# Caso de rechazo: un archivo mayor al limite devuelve 413 con mensaje claro.

# 2) Comprobante (RF-04): requiere inscripcion en estado VALIDATED
curl -o comprobante.pdf \
     http://localhost:8080/api/me/comprobante.pdf \
     -H "Authorization: Bearer <token>"
# Resultado esperado: 200 con application/pdf; el archivo abre y contiene
# el serial y el hash. La verificacion publica no exige token:
curl http://localhost:8080/api/comprobantes/<serial>

# 3) Reportes (RF-08): solo roles ADMIN o MAINTAINER
curl "http://localhost:8080/api/admin/reports/applicants?group-by=period" \
     -H "Authorization: Bearer <token-admin>"
curl "http://localhost:8080/api/admin/reports/applicants?group-by=period&format=csv" \
     -H "Authorization: Bearer <token-admin>" -o reporte.csv
curl "http://localhost:8080/api/admin/reports/summary" \
     -H "Authorization: Bearer <token-admin>"
```

El esquema y los indices correspondientes estan en
`docs/sql/schema-complementario.sql`; ejecutalo contra la base de datos
`enao` antes de medir con `EXPLAIN`.



### 6.7 E-05 - Repositorio, documentacion y secretos

**Objetivo:** comprobar que el repositorio esta completo, ordenado,
sin secretos y con codificacion UTF-8 sin BOM.

Pasos:

1. Confirmar que el arbol esta limpio:

   ```bash
   git status --short
   ```

   Resultado esperado: sin cambios pendientes (o solo los archivos que
   se estan editando).

2. Codificacion y BOM:

   ```bash
   python scripts/verificar-codificacion.py .
   ```

   Resultado esperado: `OK - sin BOM, UTF-8 valido y sin doble codificacion`.

3. Buscar posibles secretos en historial y arbol:

   ```bash
   git grep -nIE '^(password|passwd|secret|token|api[_-]?key)[[:space:]]*=' -- .
   git ls-files | grep -iE '\.(pem|key|env)$|id_rsa' || echo 'ninguno'
   ```

   Resultado esperado: ningun archivo con credenciales reales; solo
   `config/ejemplos.env` con marcadores de posicion.


Registro: `docs/evidencias/E-05-repositorio.md` con las salidas.

## 7. Registro de resultados

### 7.1 Convencion de nombres

| Archivo | Contenido |
|---|---|
| `docs/evidencias/E-01-red-y-seguridad.md` | Descripcion, comandos y resultados |
| `docs/evidencias/E-01-\*.txt` | Salida cruda de cada comando |
| capturas `.png` o `.jpg` | Pantallazos de resultados graficos |

### 7.2 Plantilla de registro de verificacion

| Fecha | Hora | Responsable | Comando ejecutado | Resultado | Observacion |
|---|---|---|---|---|---|
| | | | | | |

Cada fila corresponde a un comando. En `Resultado` se anota `OK`,
`FALLO` o `PENDIENTE`; en `Observacion`, cualquier dato relevante.

## 8. Criterios de aceptacion y cierre

Una evidencia se considera **verificada** cuando:

1. Se ejecuto el comando.
2. Se capturo la salida o una captura de pantalla.
3. La salida coincide con el resultado esperado.
4. Queda registrado en el archivo de la evidencia.

Si una comprobacion falla:

- No se oculta el error; se registra el comando, la salida y la fecha.
- Se clasifica si fue un **bloqueo del entorno** (por ejemplo, sin
  demonio de Docker, sin conectividad a github.com) o un **defecto del
  proyecto**, y se indica la causa.
- Se deja la accion pendiente en el plan de continuidad hacia APF3.

## 9. Checklist final

- [ ] E-01 Redes y seguridad verificadas y registradas.
- [ ] E-02 Compilacion y arranque del backend verificados.
- [ ] E-03 Persistencia ante reinicio verificada.
- [ ] E-04 Construccion y ejecucion de contenedores verificadas.
- [ ] E-05 Repositorio, codificacion y secretos verificados.
- [ ] E-06 Observabilidad verificada.
- [ ] Cada salida cruda guardada con su fecha y responsable.
- [ ] Bloqueos de entorno clasificados y pendientes trasladados al plan.

## 10. Referencias

- `docs/evidencias/README.md` - indice de las evidencias.
- `docs/evidencias/E-01-*.md` a `E-06-\*.md` - detalle de cada evidencia.
- `docs/floci-cli.md` - guia opcional del emulador AWS (Floci).
- `infra/network/README.md` - equivalencia entre Docker y la VPC de AWS.
- `infra/cloud/vpc.tf`, `infra/cloud/security-groups.tf` - diseno simulado.
- `README.md` del repositorio - requisitos, configuracion y ejecucion.
- `scripts/verificar-codificacion.py`, `scripts/verificar-salud.sh` - automatizaciones de apoyo.
