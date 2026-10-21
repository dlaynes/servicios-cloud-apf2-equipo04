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

## Archivos relacionados

- `docker/compose.yaml`
- `docker/Dockerfile.backend`
- `docker/Dockerfile.frontend`
- `docker/nginx-frontend.conf`
- `.dockerignore`
- `config/ejemplos.env`
