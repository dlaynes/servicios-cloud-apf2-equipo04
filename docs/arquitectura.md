# Arquitectura de la solucion - APF2

## 1. Objetivo arquitectonico

La plataforma de ASPEFO integra dos productos digitales que hoy se
gestionan por separado: el **Portal Institucional** (informacion de la
organizacion, noticias, normas, convocatorias) y el **modulo ENAO**
(inscripcion de postulantes, validacion, publicacion de resultados).
El APF2 construye la base tecnica que sostiene ambos: una red
segmentada, tres componentes contenerizados y una base de datos
persistente.

## 2. Vista de componentes

| ID | Componente | Tecnologia | Responsabilidad | Estado |
|---|---|---|---|---|
| C-01 | `frontend` | React 19 + Vite 6 + Nginx 1.27 | Sirve la SPA, aplica el proxy inverso `/api` y es la unica entrada publica | IMPLEMENTADO |
| C-02 | `backend` | Spring Boot 3.3.0 + Java 21 | API REST del modulo ENAO: autenticacion JWT, postulacion, validacion, resultados | IMPLEMENTADO |
| C-03 | `db` | MySQL 8.0 | Persistencia de postulantes, resultados y usuarios administrativos | IMPLEMENTADO |
| C-04 | `apf2_public` | Red bridge 172.28.10.0/24 | Frontera de la solucion | IMPLEMENTADO |
| C-05 | `apf2_private` | Red bridge internal 172.28.20.0/24 | Capa de aplicacion y datos, sin salida a Internet | IMPLEMENTADO |
| C-06 | Volumen `apf2_db_data` | Volumen Docker | Persistencia de los datos de MySQL entre reinicios | IMPLEMENTADO |
| C-07 | VPC de AWS | Terraform (`infra/cloud/`) | Destino de despliegue en nube | SIMULADO |

## 3. Flujo de una peticion

1. El usuario abre `http://localhost:8080` en el navegador.
2. Nginx (contenedor `frontend`) responde con el `index.html` del build
   de React. Si la ruta no corresponde a un archivo estatico, aplica el
   fallback de SPA (`try_files ... /index.html`), de modo que las rutas
   del cliente React funcionan con recarga directa.
3. El frontend llama a `GET /api/applicants/me` o a otra ruta de la API.
   La URL base es relativa (`VITE_API_URL=/api`), por lo que el navegador
   resuelve la peticion contra **el mismo origen** y no hay CORS.
4. Nginx aplica la regla `location /api/` y reenvia la peticion a
   `http://backend:8080/api/`, reenviando `Host`, `X-Real-IP`,
   `X-Forwarded-For` y `X-Forwarded-Proto`.
5. El backend valida el token JWT (filtro `JwtAuthenticationFilter`) y el
   rol del usuario segun la ruta:
   - `/api/auth/**` y `/api/health`: publicos.
   - `POST /api/applicants`: publico (registro de postulante).
   - `/api/admin/**`: requiere rol `ADMIN` o `MAINTAINER`.
   - `/api/**`: requiere autenticacion.
6. Spring Boot accede a MySQL por la red privada (`db:3306`) mediante
   un pool HikariCP. Los datos se escriben en el volumen `apf2_db_data`.
7. La respuesta viaja de vuelta por el proxy inverso hasta el navegador.

## 4. Decisiones tecnicas y su justificacion

### 4.1 Un unico origen publico (proxy inverso)

**Decision:** el navegador solo conoce `http://localhost:8080`. Nginx
hace de proxy inverso hacia el backend.

**Justificacion:** elimina la necesidad de CORS en el flujo normal,
evita exponer el puerto de la API y reproduce el comportamiento de un
Application Load Balancer con regla de redireccion, que es el diseno
previsto para AWS. El downside es que la API no es accesible de forma
directa desde el host durante las pruebas; se compensa con `exec` o
`docker compose exec backend` o con el perfil `dev` local.

### 4.2 Segmentacion en dos redes

**Decision:** `apf2_public` (con salida a Internet) y `apf2_private`
(`internal: true`, sin salida).

**Justificacion:** reproduce la separacion subred publica / subred privada
de una VPC. El frontend es el unico componente que participa en las dos
redes, de modo que hace de puente controlado. La base de datos y el
backend quedan inalcanzables desde Internet y sin acceso de salida.

### 4.3 El backend en red privada, sin puerto publicado

**Decision:** el servicio `backend` no declara `ports:`.

**Justificacion:** cumple la regla de minimo privilegio. Unicamente el
proxy inverso, que esta en la misma red, puede alcanzar la API. Para
depurar, `docker compose exec backend wget ...` funciona desde dentro
del contenedor.

### 4.4 Construccion multi-stage

**Decision:** dos etapas en cada Dockerfile.

**Justificacion:** la imagen final no contiene ni el compilador ni el
codigo fuente.

| Imagen | Etapa de compilacion | Imagen final | Tamano aproximado |
|---|---|---|---|
| `apf2/backend-enao:2.0-apf2` | `maven:3.9.9` + JDK 21 | `eclipse-temurin:21-jre-alpine` | ~250 MB |
| `apf2/aspefo-demo:2.0-apf2` | `node:22-alpine` | `nginx:1.27-alpine` | ~60 MB |

El backend se ejecuta como usuario no-root (`aspefo`, UID 10001) y solo
contiene el JAR. El frontend solo contiene el build estatico y la
configuracion de Nginx.

### 4.5 Perfiles de Spring Boot en lugar de variables sueltas

**Decision:** la configuracion de la base de datos se separa en
`application-dev.properties` (H2 en memoria) y
`application-prod.properties` (MySQL 8).

**Justificacion:** durante el desarrollo del APF2 se detecto que la
configuracion original fijaba `driver-class-name=org.h2.Driver` de forma
incondicional, lo que hacia fallar el arranque contra MySQL con el
error `Driver org.h2.Driver claims to not accept jdbcUrl, jdbc:mysql://...`.
Con los perfiles, el driver correcto se selecciona automaticamente segun
el entorno y la propiedad `SPRING_PROFILES_ACTIVE` lo fija el Compose.
El perfil `prod` tambien desactiva la consola H2.

### 4.6 Secretos por variable de entorno, nunca en el codigo

**Decision:** las contrasenas de MySQL y el secreto JWT llegan por
variables de entorno desde un archivo `.env` que no se versiona. El
sembrado de datos de ejemplo esta desactivado por defecto
(`enao.seed.enabled=false`) y sus contrasenas tambien son variables.

**Justificacion:** el repositorio no debe contener credenciales. El
mismo artefacto sirve para desarrollo y para despliegue.

### 4.7 Endpoint de salud explicito

**Decision:** `GET /api/health` devuelve el estado del servicio y de la
conexion con la base de datos, y es publico.

**Justificacion:** el healthcheck del contenedor necesita una ruta que
responda de forma fiable. Las rutas de negocio devuelven `401` o `400`
y hacen que `wget --spider` los considere fallidos. Un endpoint dedicado
ademas sirve como sonda de disponibilidad para el balanceador.

## 5. Modelo de datos

```text
users            (id, username, password_hash, full_name, role)
                  -> administracion (ADMIN / MAINTAINER)

applicants       (id, full_name, doc_type, doc_number, email, phone,
                   emergency_contact, emergency_phone, address,
                   password_hash, university, international_university,
                   country, other_university, organization, bank,
                   receipt_code, status, created_at, updated_at)
                  -> postulantes y su postulacion

exam_results     (id, applicant_id, score, maximum_score, status,
                   published_at)
                  -> resultado del examen, 1:1 con el postulante
```

- `applicants.doc_number` es unico: es la identidad de negocio con la
  que el postulante inicia sesion.
- `exam_results.applicant_id` es unico: un postulante tiene como maximo
  un resultado.
- `organization` y `status` se persisten como cadenas (`EnumType.STRING`),
  lo que mantiene la legibilidad de los datos y facilita su migracion.

## 6. Autenticacion y autorizacion

- **Login** (`POST /api/auth/login`): recibe el numero de documento y la
  contrasena. Devuelve un token JWT (HS256) con el rol y la marca
  `isApplicant`.
- **Expiracion:** 24 horas, configurable con `ENAO_JWT_EXPIRATION_MS`.
- **Filtro:** `JwtAuthenticationFilter` valida firma y expiracion en cada
  peticion sobre `/api/**`.
- **Roles:** `ADMIN` y `MAINTAINER` acceden a `/api/admin/**`;
  `APPLICANT` accede a sus propios datos y resultados.
- **CORS:** los origenes permitidos se leen de
  `enao.cors.allowed-origins` (variable `ENAO_CORS_ALLOWED_ORIGINS`). Si
  no se define ninguno, no se registra ninguna regla CORS.

## 7. Estado de los componentes frente al APF2

| Ambito | Estado | Justificacion |
|---|---|---|
| Red virtual y segmentacion | IMPLEMENTADO | Dos redes con CIDR fijo, red privada `internal`, unico puerto publicado. |
| Contenedores y comunicacion | IMPLEMENTADO | `compose.yaml` con 3 servicios, healthchecks y dependencias condicionales. |
| Empaquetado y optimizacion | IMPLEMENTADO | Multi-stage, usuario no-root, imagenes sin toolchain de compilacion. |
| Almacenamiento persistente | IMPLEMENTADO | Volumen `apf2_db_data` + `restart: unless-stopped`. |
| Red en AWS (VPC, ALB, NAT, RDS) | SIMULADO | Manifiestos Terraform en `infra/cloud/`, sin despliegue ejecutado. |
| Monitoreo y alarmas | PARCIALMENTE IMPLEMENTADO | Logs con rotacion y healthchecks; sin metricas ni alertas centralizadas. |
| Orquestacion avanzada | PENDIENTE | Reservado para APF3. |
