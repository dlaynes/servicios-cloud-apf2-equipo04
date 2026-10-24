# E-04 - Contenerizacion y comunicacion entre servicios

**Que demuestra:** que los tres componentes estan definirios en
contenedores, que la configuracion es valida, que la construccion es
multi-stage y que existe un mecanismo ordenado de arranque y de
comprobacion de salud.

**Estado:** IMPLEMENTADO. La construccion y ejecucion real de las imagenes
queda pendiente de ejecutarse en la maquina del equipo (ver abajo).

## Definicion de los servicios

Archivo `docker/compose.yaml`:

| Servicio | Imagen | Dockerfile | Puerto | Dependencias |
|---|---|---|---|---|
| `db` | `mysql:8.0` | (imagen oficial) | 3306 interno, sin publicar | ninguna |
| `backend` | `apf2/backend-enao:2.0-apf2` | `docker/Dockerfile.backend` | 8080 interno, sin publicar | `db` en estado `healthy` |
| `frontend` | `apf2/aspefo-demo:2.0-apf2` | `docker/Dockerfile.frontend` | 80 interno, publicado como 8080 | `backend` en estado `healthy` |

## Construccion multi-stage

### Backend (`docker/Dockerfile.backend`)

```dockerfile
FROM maven:3.9.9-eclipse-temurin-21 AS build
COPY app/backend-enao-ti/pom.xml .
RUN mvn -B -q dependency:go-offline
COPY app/backend-enao-ti/src ./src
RUN mvn -B -q clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine AS runtime
RUN addgroup -S aspefo && adduser -S -G aspefo -u 10001 aspefo
COPY --from=build --chown=aspefo:aspefo /build/target/*.jar app.jar
USER aspefo
```

| Mejora | Justificacion |
|---|---|
| Dos etapas | La imagen final no contiene Maven ni el JDK |
| Solo el JAR en la imagen final | El codigo fuente no viaja a produccion |
| Usuario no-root (UID 10001) | La aplicacion no corre como root |
| `EXPOSE 8080` sin `ports:` | Documenta el puerto sin exponerlo |
| Imagen Alpine | Superficie de ataque menor y menor tamano |

### Frontend (`docker/Dockerfile.frontend`)

```dockerfile
FROM node:22-alpine AS build
COPY app/aspefo-demo/package.json app/aspefo-demo/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY app/aspefo-demo/ ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx-frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
```

| Mejora | Justificacion |
|---|---|
| Dos etapas | La imagen final no contiene Node ni el gestor de paquetes |
| Solo el build de Vite | No se sirve codigo fuente |
| `npm ci` con lockfile | Instalacion reproducible de las mismas versiones |
| Nginx Alpine | Servidor de archivos estaticos y proxy inverso |

### Contexto de build

El `.dockerignore` de la raiz excluye `.git`, `node_modules`, `target`,
`dist`, `docs`, `evidencias`, `infra` y `config`, de modo que el contexto
que se envia al demonio de Docker es solo lo necesario para compilar.

## Variables de entorno sin secretos

Archivo `config/ejemplos.env` (plantilla, sin valores reales):

| Variable | Tipo | Visible en el repositorio |
|---|---|---|
| `FRONTEND_PORT` | Puerto publicado | Si (valor por defecto) |
| `MYSQL_PASSWORD` | Contrasena | Solo como marcador de posicion |
| `MYSQL_ROOT_PASSWORD` | Contrasena | Solo como marcador de posicion |
| `JWT_SECRET` | Secreto de firma | Solo como marcador de posicion |
| `CORS_ALLOWED_ORIGINS` | Lista de origenes | Si (valor por defecto) |

El archivo `.env` real esta en `.gitignore` y **no se versiona**.

## Comprobaciones de salud y orden de arranque

```yaml
  db:
    healthcheck:
      test:
        - CMD-SHELL
        - mysqladmin ping -h 127.0.0.1 -u root -p"$$MYSQL_ROOT_PASSWORD" --silent
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 40s

  backend:
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://localhost:8080/api/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 60s

  frontend:
    depends_on:
      backend:
        condition: service_healthy
```

| Comprobacion | Proposito |
|---|---|
| `mysqladmin ping` | La base de datos acepta conexiones antes de que arranque el backend |
| `GET /api/health` | El backend esta vivo y alcanza la base de datos |
| `wget --spider http://localhost/` | Nginx sirve la SPA |
| `depends_on: service_healthy` | Ningun servicio arranca antes de que su dependencia este sana |

El uso de `$$MYSQL_ROOT_PASSWORD` hace que la contrasena se resuelva
dentro del contenedor y no aparezca en la configuracion resuelta de
Compose.

## Validez de la configuracion

```bash
docker compose --env-file .env -f docker/compose.yaml config --quiet
```

Resultado obtenido en el entorno de elaboracion:

```text
EXIT=0
```

Y de la configuracion resuelta se verifico que:

- Solo el servicio `frontend` declara `published: "8080"`.
- La red `apf2_private` aparece con `internal: true` y
  `subnet: 172.28.20.0/24`.
- La red `apf2_public` aparece con `subnet: 172.28.10.0/24`.
- Los tres servicios tienen `logging: driver: json-file` con
  `max-size: 10m`.

## Comunicacion entre servicios

El navegador llama a `/api/...` en el mismo origen. Nginx lo reenvia al
backend:

```nginx
location /api/ {
    proxy_pass http://backend:8080/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```

El backend se conecta a la base de datos por la red privada:

```yaml
SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/enao?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

## Pendiente de ejecucion en la maquina del equipo

El entorno de elaboracion de este informe no tenia acceso al socket del
demonio de Docker (`permission denied while trying to connect to the
docker API at npipe:////./pipe/dockerDesktopLinuxEngine`). Por eso las
imagenes no se pudieron construir ni ejecutar alli. El procedimiento
completo esta en `docs/evidencias/README.md` y comprises:

```bash
docker compose -f docker/compose.yaml --env-file .env build
docker compose -f docker/compose.yaml --env-file .env up -d
docker compose -f docker/compose.yaml --env-file .env ps
bash scripts/verificar-salud.sh http://localhost:8080
```

## Correccion aplicada durante este hito

La primera version del `Dockerfile.backend` usaba como healthcheck
`wget --spider http://localhost:8080/api/auth/login`. Esa ruta solo
acepta `POST` y respondia `500` ante un `GET`, de modo que el contenedor
se marcaria como no sano de forma permanente. Se sustituyo por
`GET /api/health`, un endpoint publico que ademas comprueba la conexion
con la base de datos.

## Registro real del despliegue (22/10/2026)

Salida de `docker compose -f docker/compose.yaml --env-file .env ps` con el
stack levantado en la maquina del equipo:

```text
NAME           IMAGE                        COMMAND                  SERVICE   CREATED         STATUS                     PORTS
apf2-backend   apf2/backend-enao:2.0-apf2   "sh -c 'exec java $J..."   backend   4 minutes ago   Up 4 minutes (healthy)     8080/tcp
apf2-db        mysql:8.0                    "docker-entrypoint.s..."   db        4 minutes ago   Up 4 minutes (healthy)     3306/tcp, 33060/tcp
apf2-frontend  apf2/aspefo-demo:2.0-apf2    "/docker-entrypoint...."   frontend  4 minutes ago   Up 2 minutes (unhealthy)   0.0.0.0:8080->80/tcp, [::]:8080->80/tcp
```

Y la salida de `bash scripts/verificar-salud.sh http://localhost:8080`:

```text
[OK]   Frontend (SPA) accesible
[OK]   Proxy inverso /api -> backend
[OK]   Backend y base de datos en estado UP
[OK]   Login invalido devuelve 400 y no 500
[OK]   MySQL no publicado en el host
```

### Falso `unhealthy` del frontend y su correccion

El contenedor `apf2-frontend` aparecia `unhealthy` aunque la SPA y el proxy
responderian bien desde el host. La causa era el healthcheck del contenedor:

```yaml
test: ["CMD-SHELL", "wget -q --spider http://localhost/ || exit 1"]
```

Dentro del contenedor `nginx:1.27-alpine`, `localhost` resolvio a `::1`
(IPv6) mientras nginx solo escucha IPv4, con lo que el chequeo interno
fallaba y Docker tenia que marcar el contenedor como no sano; la misma comprobacion
hecha desde el host, que usa `0.0.0.0`, si funcionaba.

Correccion aplicada:

- `docker/Dockerfile.frontend` crea `health.txt` en el runtime y cambia el
  chequeo a `http://127.0.0.1/health.txt`, con `-O /dev/null` en lugar de
  `--spider`.
- `docker/compose.yaml` (servicio `frontend`) queda con el mismo comando.

Para que el cambio tome efecto hace falta reconstruir la imagen del
frontend, porque la version en ejecucion todavia tiene el healthcheck
anterior:

```bash
docker compose -f docker/compose.yaml --env-file .env build frontend
docker compose -f docker/compose.yaml --env-file .env up -d
```

## Verificacion end-to-end de los RF

`scripts/verificar-rf.sh` recorre el ciclo completo de RF-03, RF-04 y RF-08
contra el despliegue en marcha:

```bash
bash scripts/verificar-rf.sh http://localhost:8080
```

Registra el postulante de prueba que crea, el documento que sube, la
revision del administrador, el comprobante emitido y su anulacion, y las
agregaciones de RF-08 (estado, periodo, sede, institucion, resultados y
resumen). Cada paso imprime `[OK]` o `[FALLA]` con el codigo HTTP
obtenido frente al esperado.

## Bootstrap del administrador en el despliegue

En el despliegue con contenedores el sembrado de datos va apagado
(`ENAO_SEED_ENABLED=false`), de modo que sin un usuario de personal el panel
de administrcion y los reportes de RF-08 quedarian inaccesibles, y el login
invalido seguiria devolviendo 400 sin forma de autenticar a un administrador.

`AdminBootstrap` resuelve ese caso: se ejecuta en el arranque, es idempotente
y solo crea el usuario `admin` si (a) no existe ninguno y (b) llega la contrasena
por variable de entorno.

| Variable | Uso |
|---|---|
| `ADMIN_PASSWORD` | Contrasena del administrador (obligatoria para crearlo) |
| `ADMIN_USERNAME` | Nombre de usuario, por defecto `admin` |
| `ADMIN_BOOTSTRAP_ENABLED` | Permite apagarlo en un entorno que ya tiene usuarios |

Si la contrasena no llega, el backend registra un aviso en el log al arrancar
y el resto del despliegue queda igual; para usar la revision y los reportes
definela en el `.env` y reconstruye el servicio `backend`.

## Defectos encontrados el 24/10/2026 con el despliegue en marcha (y sus correcciones)

En la corrida de `scripts/verificar-rf.sh` del 24/10/2026 el ciclo llego a
24 comprobaciones con 5 OK y 23 fallos; la causa no era una sino tres y
quedaron diferenciadas en el log tras corregir la extraccion de los campos
del JSON (los pasos que dependen de un token que no llego se marcan
`[SALTADO]` y dejan de acumular fallos en cascada).

### 1) El almacenamiento de documentos no tenia volumen (causa del 500 en RF-03)

El servicio `backend` corre con `USER aspefo` (UID 10001), el `WORKDIR /app`
era propiedad de root y `./data/documents` no existia, por lo que
`Files.createDirectories` lanzaba `AccessDeniedException`, el servicio lo
envolvia en `IllegalStateException` y el endpoint de subida devolvia 500 en
lugar de 201. El mismo archivo con contenido no declarado si daba 415, con lo
que se confirmo que el backend desplegado tenia el endpoint y la deteccion de
magic bytes.

Correccion:

- `docker/Dockerfile.backend` crea `/app/data/documents` con el UID del usuario
  (`mkdir -p /app/data/documents && chown -R aspefo:aspefo /app/data`).
- `docker/compose.yaml` monta un volumen propio `backend_data:/app/data`,
  define `FILES_STORAGE_PATH: /app/data/documents` y deja el path del backend
  dentro del contenedor en lugar de depender del filesystem del host.

### 2) El archivo de 11 MB devolvia 500 en lugar de 413

El limite de Nginx era el valor por defecto (1 MiB) con lo que el 11 MB
llegaba al backend, y el limite por archivo de Spring se controlaba en el
`DispatcherServlet`; el handler de `MaxUploadSizeExceededException` se
registraba pero en esa corrida la respuesta fue 500. Con `client_max_body_size
12m` en `/api/` el limite del proxy queda por encima del del backend, y el
orden de las validaciones del `DocumentService` ahora verifica el tamano **antes
de leer los bytes y de tocar el almacenamiento**, con una excepcion propia
(`PayloadTooLargeException`) mapeada a 413: el archivo de 11 MB se rechaza por
el backend con el mensaje del backend en lugar de un 500.

### 3) Sin usuario de personal, el panel administrativo no podia usarse

Con el sembrado apagado (`ENAO_SEED_ENABLED=false`) no habia usuario `admin`,
asi que la revision de documentos y los reportes de RF-08 quedaban sin token y
el comprobante no se podia emitir (el estado de la inscripcion seguia en
`PENDING`). `AdminBootstrap` crea al administrador en el primer arranque si
llega `ADMIN_PASSWORD` por variable de entorno, de forma idempotente e
independiente del seeder; si la contrasena no llega, el backend avisa en el log
y el despliegue no se rompe.

Para no necesitar los logs a mano, `/api/health` ahora devuelve tambien
`adminAccount`:

```json
{"status":"UP","service":"backend-enao","database":"UP","adminAccount":"CONFIGURED"}
```

Con `adminAccount=MISSING` se sabe que falta la contrasena del administrador,
y con `CONFIGURED` que el bootstrap ya lo creo; ese valor no revela datos del
negocio ni credenciales.

## Archivos relacionados

- `docker/compose.yaml`
- `docker/Dockerfile.backend`
- `docker/Dockerfile.frontend`
- `docker/nginx-frontend.conf`
- `.dockerignore`
- `config/ejemplos.env`
