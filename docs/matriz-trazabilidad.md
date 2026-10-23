# Matriz de trazabilidad de requisitos y evidencias - APF2

Relaciona cada requisito del APF2 con el componente que lo implementa, el
archivo o configuracion donde puede verificarse y la evidencia que lo
demuestra.

## 1. Requisitos de la evaluacion

| Requisito | Componente | Archivo / configuracion | Evidencia | Resultado |
|---|---|---|---|---|
| **A. Arquitectura y red virtual** | | | | |
| Diagrama con usuarios, entrada, red, subredes, computo, almacenamiento y flujos | C-01..C-05 | `docs/arquitectura.md`, `docs/topologia-red.md`, `docs/arquitectura.png` | E-01 | Implementado |
| Subredes publicas y privadas con direccionamiento explicito | C-04, C-05 | `docker/compose.yaml` (redes), `infra/cloud/vpc.tf` | E-01 | Implementado (Docker) / Simulado (AWS) |
| Tablas de ruteo, gateway de Internet y NAT | - | `infra/cloud/vpc.tf` (IGW, NAT Gateway, route tables) | E-01 | Simulado |
| Reglas de seguridad de minimo privilegio | C-01..C-03 | `infra/cloud/security-groups.tf`, `docker/compose.yaml` (sin `ports:` en backend y db) | E-01 | Implementado |
| **B. Computo y almacenamiento** | | | | |
| Inventario de recursos con tipo, funcion, runtime, conectividad y estado | R-01..R-06 | `docs/inventario-computo-almacenamiento.md` | E-02 | Implementado |
| Almacenamiento persistente inicial identificado | S-01 | `docker/compose.yaml` (volumen `db_data`) | E-03 | Implementado |
| Explicacion de que datos guarda | S-01 | `docs/arquitectura.md` (modelo de datos) | E-03 | Implementado |
| **C. Contenerizacion** | | | | |
| Dockerfile(s) de los componentes principales | C-01, C-02 | `docker/Dockerfile.frontend`, `docker/Dockerfile.backend` | E-04 | Implementado |
| Configuracion multi-contenedor | C-01..C-03 | `docker/compose.yaml` | E-04 | Implementado |
| Variables de entorno documentadas sin secretos | - | `config/ejemplos.env` | E-04 | Implementado |
| Puertos, dependencias, comandos de construccion y ejecucion | - | `README.md` (secciones 4 y 5) | E-04 | Implementado |
| Justificacion de imagenes ligeras y multi-stage | R-01, R-02 | `docs/arquitectura.md` (seccion 4.4) | E-04 | Implementado |
| **D. Repositorio y documentacion** | | | | |
| Repositorio Git accesible y ordenado | - | `https://github.com/dlaynes/servicios-cloud-apf2-equipo04` | E-05 | Implementado |
| Commits trazables de los integrantes | - | historial del repositorio (app/ ya es parte del repo) | E-05 | Implementado |
| README con requisitos, instalacion, configuracion, ejecucion y verificacion | - | `README.md` | E-05 | Implementado |
| Diagrama, inventario, evidencias e informe tecnico | - | `docs/` | E-01, E-02, E-05 | Implementado |
| Ausencia de credenciales en el repositorio | - | `.gitignore` (`.env`), `scripts/verificar-codificacion.py`, revision de `git ls-files` | E-05 | Implementado |
| **E. Evidencias de gestion de servicios (complementario)** | | | | |
| Como se observara el estado de los servicios | C-01..C-03 | healthchecks en `compose.yaml`, `docker compose logs` | E-06 | Parcialmente implementado |
| Indicador de rendimiento a vigilar | C-02 | `docs/inventario-computo-almacenamiento.md`, seccion de validacion | E-06 | Parcialmente implementado |
| Criterio inicial para escalar o ajustar recursos | C-01..C-03 | `docs/plan-apf3.md` | E-06 | Parcialmente implementado |

## 2. Requisitos funcionales del APF1 covered en este hito

| Requerimiento (APF1) | Estado en APF2 | Componente | Evidencia |
|---|---|---|---|
| RF-01 El postulante crea cuenta e inicia sesion | Implementado | C-02 (`POST /api/auth/login`, `POST /api/applicants`) | E-04 |
| RF-02 Registrar y actualizar datos personales, academicos y de postulacion | Implementado | C-02 (`PUT /api/applicants/me`) | E-04 |
| RF-05 Consultar estado de inscripcion y resultados | Implementado | C-02 (`GET /api/applicants/me`, `GET /api/results/me`) | E-04 |
| RF-06 El administrador consulta, valida y actualiza inscripciones | Implementado | C-02 (`/api/admin/**`) | E-04 |
| RF-07 El portal publica noticias, eventos y normas | Implementado | C-01 (paginas del portal) | E-04 |
| RF-03 Adjuntar documentos y validar tamano | **No implementado** | Requiere almacenamiento de objetos (S-02) | Pendiente APF3 |
| RF-04 Generar comprobante de inscripcion descargable | **No implementado** | Requiere generacion de PDF | Pendiente APF3 |
| RF-08 Reportes de inscritos por periodo, sede, institucion y estado | **No implementado** | - | Pendiente APF3 |
| RF-09 Mesa de ayuda con tickets (Freshdesk) | **No implementado** | Servicio SaaS externo | Pendiente APF3 |

## 3. Requerimientos no funcionales del APF1

| Requerimiento | Estado en APF2 | Observacion |
|---|---|---|
| RNF-01 Disponibilidad 99,9 % | Parcialmente implementado | El healthcheck y `restart: unless-stopped` cubren fallos del contenedor. La disponibilidad medida en el tiempo requiere el balanceador y varias zonas (APF3). |
| RNF-02 Escalabilidad automatica | No implementado | Requiere orquestador y autoescalado (APF3). |
| RNF-03 Rendimiento: 95 % de solicitudes en 3 s | Parcialmente implementado | El proxy inverso y la conexion persistente a BD favorecen la latencia. Falta una prueba de carga (APF3). |
| RNF-04 Seguridad: HTTPS, minimo privilegio, registro de eventos | Parcialmente implementado | Minimo privilegio y registro de eventos implementados. HTTPS lo aporta el ALB o un proxy TLS en el borde (APF3). |
| RNF-05 Proteccion de datos: cifrado en transito y en reposo, acceso por roles | Parcialmente implementado | Control de acceso por roles y separacion de red implementados. Cifrado en transito (TLS) y en reposo (RDS/S3) corresponde al despliegue en AWS (APF3). |
| RNF-06 Continuidad: respaldos, RPO 1 h, RTO 4 h | Parcialmente implementado | El volumen conserva los datos entre reinicios. Las copias automaticas y la prueba de restauracion quedan para RDS/S3 (APF3). |
| RNF-07 Monitoreo: metricas, logs y alarmas | Parcialmente implementado | Logs con rotacion y healthchecks. Faltan metricas, paneles y alarmas centralizadas (APF3). |
| RNF-08 Usabilidad adaptable | Implementado | Layout responsivo del portal y formularios con validacion. |
| RNF-09 Atencion y trazabilidad de tickets | No implementado | Depende de Freshdesk (APF3). |

## 4. Trazabilidad de las correcciones tecnicas del hito

| Hallazgo | Causa | Correccion | Verificacion |
|---|---|---|---|
| El backend no arrancaba contra MySQL | `spring.datasource.driver-class-name=org.h2.Driver` fijo en `application.properties` | Perfiles `dev` (H2) y `prod` (MySQL) en `application-dev.properties` y `application-prod.properties` | `SPRING_PROFILES_ACTIVE=prod` en `compose.yaml`; reproduccion del error y de la correccion documentadas |
| El healthcheck del backend fallaria | `wget --spider` contra `/api/auth/login`, que responde 500 en GET | Endpoint publico `GET /api/health` que verifica ademas la base de datos | `GET /api/health` devuelve `{"status":"UP","database":"UP"}` |
| El navegador tendria que resolver CORS | Orígenes hardcodeados en `WebConfig.java`, la variable del Compose no se usaba | `enao.cors.allowed-origins` leido de la variable `ENAO_CORS_ALLOWED_ORIGINS` | Sin origenes, no se registra ninguna regla CORS |
| Contrasenas en el codigo | `DataSeeder` con contrasenas fijas | Sembrado desactivado por defecto y contrasenas por variable de entorno | `enao.seed.enabled=false` en el despliegue |
| Doble codificacion en un archivo | `vite.config.ts` linea 20 con `E2 80 94` codificado dos veces | Byte corregido a `E2 80 94` | `scripts/verificar-codificacion.py` sin hallazgos |
| Contrasena de MySQL en la configuracion resuelta | Interpolacion en el healthcheck | `CMD-SHELL` con `$$MYSQL_ROOT_PASSWORD` | `docker compose config` no expone la clave |
