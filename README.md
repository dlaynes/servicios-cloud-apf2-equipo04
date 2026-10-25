# APF2 - Servicios Cloud | Plataforma Cloud para ASPEFO

Avance Final 2 (APF2) del curso **Servicios Cloud (100000S91T)**.
Implementacion de la infraestructura base, la red virtual segmentada y
la contenerizacion de la plataforma de ASPEFO: **Portal Institucional**
y **Sistema de Inscripcion al ENAO**.

| Dato | Valor |
|---|---|
| Titulo | IMPLEMENTACION DE UNA PLATAFORMA CLOUD PARA EL PORTAL INSTITUCIONAL Y EL SISTEMA DE INSCRIPCION AL ENAO DE ASPEFO |
| Organizacion | ASPEFO (Asociacion Peruana de Facultades de Odontologia) |
| Curso | Servicios Cloud (100000S91T) - Semana 12 - APF2 |
| Docente | Rodriguez Vilcarromero, Carlos Daniel |
| Seccion | 42880 |
| Integrantes | Laynes Gonzales, Donato Cassel (U23201439); Puma Polo, Paolo Ricardo (U21300760); Quispe Rodriguez, Marita Lizet (U23209774) |
| Repositorio | https://github.com/dlaynes/servicios-cloud-apf2-equipo04 |

## 1. Que contiene este repositorio

```text
servicios-cloud-apf2-equipo04/
|-- README.md                 Este documento
|-- app/                      Codigo de la solucion
|   |-- aspefo-demo/          Frontend React + Vite (portal institucional y ENAO)
|   `-- backend-enao-ti/      API REST Spring Boot 3.3.0 (modulo ENAO)
|-- docker/
|   |-- Dockerfile.backend    Build multi-stage del backend
|   |-- Dockerfile.frontend   Build multi-stage del frontend
|   |-- nginx-frontend.conf   SPA + proxy inverso hacia la API y la mesa de ayuda
|   |-- compose.yaml          Orquestacion del portal, el backend y la base de datos
|   `-- compose-helpdesk.yaml Orquestacion de la mesa de ayuda (RF-09, FreeScout)
|-- infra/
|   |-- cloud/                Manifiestos Terraform de la VPC de destino
|   |   |-- vpc.tf
|   |   `-- security-groups.tf
|   `-- network/README.md     Equivalencia Docker <-> AWS
|-- config/ejemplos.env       Variables de ejemplo, sin secretos
|-- docs/                     Documentacion tecnica, evidencias y guias
|   `-- sql/                  Esquema e indices de los RF pendientes del APF3
|-- scripts/                  Utilidades de verificacion
`-- evidencias/               Capturas y salidas de consola
```

## 2. Codigo de la aplicacion en `app/`

El frontend (`app/aspefo-demo`) y el backend (`app/backend-enao-ti`) forman
**parte de este repositorio**: no hay submodulos, de modo que la revision del
APF3 puede hacerse clonando un unico repositorio. Los origenes con sus
respectivos historiales son:

| Ruta | Repositorio de origen |
|---|---|
| `app/aspefo-demo` | https://github.com/dlaynes/aspefo-demo |
| `app/backend-enao-ti` | https://github.com/dlaynes/backend-enao-ti |

Clonar y trabajar sobre el repositorio:

```bash
git clone https://github.com/dlaynes/servicios-cloud-apf2-equipo04.git
cd servicios-cloud-apf2-equipo04
```

Con este esquema `git status` del repositorio muestra directamente los
cambios dentro de `app/`, lo mismo que los cambios de documentacion, sin
necesidad de revisar repositorios separados.

## 3. Requisitos

| Herramienta | Version | Uso |
|---|---|---|
| Docker Engine | 24 o superior | Ejecucion de los contenedores |
| Docker Compose | v2 o superior (incluido en Docker Desktop) | Orquestacion multi-contenedor |
| Git | 2.30 o superior | Clonado del repositorio |
| Java | 21 (JDK) | Solo para ejecutar el backend fuera de Docker |
| Maven | 3.9 o superior | Solo para compilar el backend fuera de Docker |
| Node.js | 22 (LTS) | Solo para el desarrollo del frontend |

Para la sustentacion basta con Docker Desktop; Java, Maven y Node solo
son necesarios para trabajar sobre el codigo sin contenedores.

## 4. Configuracion

El repositorio **no contiene credenciales**. Copie el archivo de ejemplo
y complete los valores:

```bash
cp config/ejemplos.env .env
```

| Variable | Obligatoria | Descripcion |
|---|---|---|
| `FRONTEND_PORT` | No | Puerto del host donde se publica el frontend. Por defecto `8080`. |
| `MYSQL_PASSWORD` | Si | Contrasena del usuario `enao` de MySQL. |
| `MYSQL_ROOT_PASSWORD` | Si | Contrasena del usuario `root` de MySQL. |
| `JWT_SECRET` | Si | Secreto de firma de los tokens JWT (HS256). Minimo 32 bytes. |
| `CORS_ALLOWED_ORIGINS` | No | Origenes permitidos, separados por coma. Por defecto `http://localhost:8080`. |
| `ENAO_SEED_ENABLED` | No | Activa el sembrado de usuarios y de un postulante de ejemplo. En el despliegue con contenedores va `false`; en el perfil dev con H2 va `true`. |
| `ENAO_SEED_ADMIN_PASSWORD`, `ENAO_SEED_MAINTAINER_PASSWORD`, `ENAO_SEED_DEMO_PASSWORD` | Solo con el sembrado activo | Contraseñas de los tres usuarios que crea el sembrado. Sin efecto con `ENAO_SEED_ENABLED=false`. |
| `ADMIN_PASSWORD` | Con el bootstrap del administrador | Contraseña con la que el backend crea al usuario `admin` en el primer arranque, sin datos de ejemplo. Es lo que habilita la revision de documentos y los reportes. |
| `ADMIN_USERNAME` | No | Nombre del usuario del personal. Por defecto `admin`. |
| `ADMIN_BOOTSTRAP_ENABLED` | No | Permite apagar el bootstrap en un entorno que ya tiene usuarios. |

### Sembrado de datos y usuario del personal

El despliegue con contenedores define `ENAO_SEED_ENABLED=false`: no crea
usuarios ni postulantes de ejemplo, y las tres contrasenas `ENAO_SEED_*`
quedan sin efecto. Con el sembrado apagado, quien abre los paneles de
revision y de reportes necesita un usuario administrador, y ese lo crea
`AdminBootstrap` en el primer arranque con la contrasena de `ADMIN_PASSWORD`
(idempotente: solo crea si la tabla `users` esta vacia).

Como indicador de estado, `/api/health` devuelve tambien `adminAccount`:

```text
{"status":"UP","service":"backend-enao","timestamp":"...","database":"UP","adminAccount":"CONFIGURED"}
```

`CONFIGURED` significa que hay un usuario de personal; `MISSING`, que no, y que
definir `ADMIN_PASSWORD` (o encender el sembrado con sus contrasenas) es lo que
hace falta. Ese valor es un metadato tecnico, no un dato de negocio, y no expone
credenciales.

Generar secretos aleatorios:

```bash
# Linux / macOS
openssl rand -base64 48

# Windows PowerShell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

> `.env` esta en `.gitignore`. No lo versione nunca.

## 5. Construccion y ejecucion

### 5.1 Con Docker (reproducible)

```bash
# Construir las imagenes
docker compose -f docker/compose.yaml --env-file .env build

# Levantar los servicios
docker compose -f docker/compose.yaml --env-file .env up -d

# Ver el estado
docker compose -f docker/compose.yaml --env-file .env ps

# Seguir los logs
docker compose -f docker/compose.yaml --env-file .env logs -f
```

La aplicacion queda disponible en **http://localhost:8080**.

El orden de arranque esta controlado por comprobaciones de salud:
la base de datos debe estar sana antes de que arranque el backend, y el
backend debe estar sano antes de que arranque el frontend.

### 5.2 Sin Docker (desarrollo)

Backend, con base de datos H2 en memoria y datos de ejemplo:

```bash
cd app/backend-enao-ti
mvn spring-boot:run
```

El perfil por defecto es `dev` (H2 en memoria, sembrado activado con
usuarios de prueba). La API queda en http://localhost:8080.

Frontend:

```bash
cd app/aspefo-demo
npm ci
npm run dev
```

El frontend de desarrollo escucha en el puerto 3000 y usa
`VITE_API_URL` para apuntar a la API.

> En desarrollo el frontend se conecta al backend por un origen distinto
> (3000 frente a 8080), por eso en el perfil `dev` estan habilitados los
> origenes `http://localhost:3000` e `http://127.0.0.1:3000` en CORS.
> En el despliegue con contenedores el navegador usa un unico origen y
> CORS no se activa.

## 6. Verificacion

### 6.1 Salud de los servicios

```bash
bash scripts/verificar-salud.sh http://localhost:8080
```

Comprueba que la SPA responde, que el proxy inverso alcanza el backend,
que el backend declara su base de datos en estado `UP`, que un login
invalido devuelve `400` (y no `500`) y que MySQL no esta publicado en el
host.

### 6.2 Codificacion de los archivos

```bash
python scripts/verificar-codificacion.py .
```

Comprueba que ningun archivo de texto tiene BOM, que todos decodifican
como UTF-8 estricto y que no hay caracteres de control C1, que son la
huella de una doble codificacion. Es una comprobacion de referencia del
proyecto: todo el codigo se versiona en UTF-8 sin BOM.

### 6.3 Comprobaciones manuales de la aplicacion

```bash
# Estado del backend
curl -s http://localhost:8080/api/health

# Login de administrador (usuarios de ejemplo del perfil dev)
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"docNumber":"admin","password":"admin123"}'

# Aislamiento de la red privada
docker network inspect apf2_private --format '{{.Internal}}'
# Debe imprimir: true

# Persistencia: reiniciar la base de datos no debe borrar los datos
docker compose -f docker/compose.yaml restart db
```

## 7. Arquitectura en resumen

```text
Navegador
   |
   |  http://localhost:8080
   v
+---------------------------+        red publica        +---------------------------+
|  frontend (Nginx)         |-------------------------->|  backend (Spring Boot)    |
|  SPA estatica             |   /api/ -> backend:8080   |  API REST ENAO            |
|  apf2_public             |                           |  apf2_private             |
+---------------------------+                           +---------------------------+
                                                                  |
                                                                  | 3306/tcp
                                                                  v
                                                      +---------------------------+
                                                      |  db (MySQL 8)             |
                                                      |  volumen apf2_db_data    |
                                                      |  apf2_private             |
                                                      +---------------------------+
```

- Solo el **frontend** publica un puerto hacia el host.
- El **backend** y la **base de datos** no son alcanzables desde el host.
- La red `apf2_private` es `internal: true`: sin salida a Internet.
- El navegador usa **un unico origen**, por lo que no se requiere CORS.

Detalle completo en `docs/topologia-red.md` y `docs/arquitectura.md`.

## 8. Estado real de los componentes

El documento del APF2 distingue tres estados. Este es el estado
verificable a la fecha de entrega:

| Componente | Estado | Detalle |
|---|---|---|
| Red segmentada y aislamiento | **IMPLEMENTADO** | Dos redes Docker con CIDR fijo, red privada `internal`, unico puerto publicado. |
| Contenedores y comunicacion | **IMPLEMENTADO** | 3 servicios en `compose.yaml` con healthchecks y dependencias ordenadas. |
| Imagenes multi-stage | **IMPLEMENTADO** | Backend: solo el JAR sobre JRE Alpine, usuario no-root. Frontend: solo el build sobre Nginx. |
| Persistencia de datos | **IMPLEMENTADO** | Volumen Docker `apf2_db_data` para MySQL. |
| API REST ENAO | **IMPLEMENTADO** | Login con JWT, roles ADMIN/MAINTAINER/APPLICANT, ciclo de postulacion y resultados verificado. |
| Portal institucional | **IMPLEMENTADO** | Frontend React compilado, 0 errores de TypeScript. |
| VPC de AWS, RDS, ALB, NAT | **SIMULADO** | Definido en `infra/cloud/` con Terraform; no desplegado en AWS. |
| Monitoreo y alertas | **PARCIALMENTE IMPLEMENTADO** | Logs de contenedor con rotacion y healthchecks; no hay metricas ni alarmas centralizadas. |

> No se afirma en ningun documento que exista un despliegue en la nube.
> Los recursos de AWS son el diseno del destino, no un despliegue
> realizado.

## 9. Documentacion adicional

| Documento | Contenido |
|---|---|
| `docs/arquitectura.md` | Componentes, flujo de datos y decisiones tecnicas. |
| `docs/topologia-red.md` | Subredes, rutas, puertos y reglas de seguridad. |
| `docs/inventario-computo-almacenamiento.md` | Inventario de recursos con estado. |
| `docs/matriz-trazabilidad.md` | Requisito -> componente -> archivo -> evidencia. |
| `docs/plan-apf3.md` | Continuidad hacia orquestacion, escalabilidad y monitoreo. |
| `docs/evidencias/` | Evidencias E-01 a E-06. |
| `infra/network/README.md` | Equivalencia entre Docker y AWS. |
| `docs/guia-verificacion-evidencias.md` | Guia general ordenada para verificar E-01 a E-06. |
| `docs/floci-cli.md` | Guia opcional del emulador AWS (Floci) para pruebas locales. |
| `docs/plan-rf-pendientes.md` | Detalle tecnico de RF-03, RF-04, RF-08 y RF-09. |
| `docs/sql/schema-complementario.sql` | Esquema e indices de los RF pendientes del APF3. |
