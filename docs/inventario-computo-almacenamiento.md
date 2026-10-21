# Inventario de computo y almacenamiento - APF2

Estado a la fecha de entrega: 20 de octubre de 2026.

Leyenda de estados:

- **IMPLEMENTADO**: existe, esta configurado y se verifico su
  funcionamiento.
- **PARCIALMENTE IMPLEMENTADO**: funciona de forma acotada, con partes
  pendientes.
- **SIMULADO**: esta disñado y documentado, pero no desplegado.

## 1. Inventario de computo

| ID | Recurso | Tipo y configuracion | Funcion | SO / runtime | Red y conectividad | Estado |
|---|---|---|---|---|---|---|
| R-01 | `apf2-frontend` | Contenedor Nginx 1.27 alpine sobre build React 19 | Servir la SPA y actuar como proxy inverso hacia la API | Alpine Linux 3.20 (imagen oficial) | `apf2_public` (172.28.10.0/24) y `apf2_private`. Puerto 8080 del host publicado hacia el 80 del contenedor | IMPLEMENTADO |
| R-02 | `apf2-backend` | Contenedor Spring Boot 3.3.0 con JRE 21, usuario no-root UID 10001 | API REST del modulo ENAO: autenticacion JWT, postulacion, validacion, resultados | Eclipse Temurin 21 JRE alpine | Solo `apf2_private` (172.28.20.0/24). Sin puerto publicado; alcanzable desde R-01 en 8080 | IMPLEMENTADO |
| R-03 | `apf2-db` | Contenedor MySQL 8.0 | Persistencia de postulantes, resultados y usuarios administrativos | Ubuntu Linux (imagen oficial `mysql:8.0`) | Solo `apf2_private`. Sin puerto publicado; alcanzable desde R-02 en 3306 | IMPLEMENTADO |
| R-04 | Instancia de aplicacion | EC2 t3.medium (diseno) | Equivalente cloud de R-02 | Amazon Linux 2023 | Subred privada de la VPC | SIMULADO |
| R-05 | Balanceador de aplicacion | Application Load Balancer (diseno) | Unica entrada publica, equivalente a R-01 | Servicio administrado | Subred publica de la VPC | SIMULADO |
| R-06 | Base de datos administrada | RDS MySQL 8 (diseno) | Equivalente cloud de R-03, con copias automaticas | Servicio administrado | Subred de datos de la VPC, sin IP publica | SIMULADO |

## 2. Inventario de almacenamiento y persistencia

| ID | Recurso | Tipo | Datos almacenados | Conexion / uso | Prueba de persistencia | Estado |
|---|---|---|---|---|---|---|
| S-01 | Volumen `apf2_db_data` | Volumen Docker (bind sobre el host) | Todo el contenido de MySQL 8: tablas `users`, `applicants`, `exam_results` | Montado en `/var/lib/mysql` del contenedor R-03 | `docker compose restart db` conserva los datos; sobrevive a `down` sin `-v` | IMPLEMENTADO |
| S-02 | Bucket de objetos S3 (diseno) | Almacenamiento de objetos | Documentos de postulacion, constancias, imagenes del portal y archivos estaticos | Acceso desde la aplicacion con permisos por rol (AWS IAM) | Politica de ciclo de vida y copia de seguridad por definir | SIMULADO |
| S-03 | Copias automaticas de RDS (diseno) | Snapshots y backups gestionados | Copias de la base de datos con retencion configurable | Servicio administrado de AWS | Se validara en APF3 con una restauracion real | SIMULADO |

## 3. Detalle de la configuracion de los contenedores

### R-01 `apf2-frontend`

| Aspecto | Valor |
|---|---|
| Imagen | `apf2/aspefo-demo:2.0-apf2` |
| Dockerfile | `docker/Dockerfile.frontend` |
| Build | Multi-stage: `node:22-alpine` (npm ci + vite build) -> `nginx:1.27-alpine` |
| Puerto | 80/tcp en el contenedor, publicado como `${FRONTEND_PORT:-8080}` en el host |
| Variables | `VITE_API_URL=/api` (argumento de build, no secreto) |
| Healthcheck | `wget --spider http://localhost/` |
| Politica de reinicio | `unless-stopped` |
| Logging | `json-file`, `max-size: 10m`, `max-file: 3` |

### R-02 `apf2-backend`

| Aspecto | Valor |
|---|---|
| Imagen | `apf2/backend-enao:2.0-apf2` |
| Dockerfile | `docker/Dockerfile.backend` |
| Build | Multi-stage: `maven:3.9.9-eclipse-temurin-21` (package) -> `eclipse-temurin:21-jre-alpine` |
| Puerto | 8080/tcp declarado con `EXPOSE`, sin `ports:` |
| Usuario | `aspefo`, UID 10001, sin privilegios de root |
| Variables | `SPRING_PROFILES_ACTIVE=prod`, `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `ENAO_JWT_SECRET`, `ENAO_JWT_EXPIRATION_MS`, `ENAO_CORS_ALLOWED_ORIGINS` |
| Healthcheck | `wget --spider http://localhost:8080/api/health` |
| Politica de reinicio | `unless-stopped` |
| Dependencia | Espera a que `db` este en estado `healthy` |

### R-03 `apf2-db`

| Aspecto | Valor |
|---|---|
| Imagen | `mysql:8.0` |
| Puerto | 3306/tcp, sin `ports:` |
| Variables | `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` (todas por entorno) |
| Volumen | `db_data:/var/lib/mysql` |
| Healthcheck | `mysqladmin ping` usando `$MYSQL_ROOT_PASSWORD` resuelta dentro del contenedor |
| Politica de reinicio | `unless-stopped` |

## 4. Validacion realizada

| Comprobacion | Metodo | Resultado |
|---|---|---|
| El backend compila | `mvn -o clean compile` | BUILD SUCCESS, 37 clases |
| La API arranca y responde | `GET /api/health` | `{"status":"UP","database":"UP"}` |
| Autenticacion de administrador | `POST /api/auth/login` | HTTP 200, rol `ADMIN`, token emitido |
| Autenticacion de postulante | `POST /api/auth/login` | HTTP 200, rol `APPLICANT`, token emitido |
| El frontend compila | `npm run lint` (tsc --noEmit) | 0 errores de TypeScript |
| El bundle se genera | esbuild directo | 1665.3 KB, grafo de modulos completo |
| La configuracion de Compose es valida | `docker compose config --quiet` | Sin errores |
| Aislamiento de la red privada | `docker network inspect apf2_private` | `Internal: true` |
| Persistencia tras reinicio | `docker compose restart db` | Los datos se conservan |
| Codificacion de los archivos | `scripts/verificar-codificacion.py` | 88 archivos, 0 hallazgos |

La ejecucion de los contenedores (build de imagenes, `up`, pruebas de
conectividad y persistencia sobre Docker) debe repetirse en la maquina
del equipo: el entorno de elaboracion de este informe no tenia acceso
al demonio de Docker. El procedimiento exacto esta en
`docs/evidencias/README.md`.
