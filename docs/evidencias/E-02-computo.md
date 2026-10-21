# E-02 - Computo: compilacion, arranque y autenticacion

**Que demuestra:** que el backend compila, arranca, expone su endpoint de
salud y aplica el control de acceso por roles; y que el frontend
compila sin errores de tipos.

**Estado:** IMPLEMENTADO y verificado.

## E-02.1 Compilacion del backend

```bash
cd app/backend-enao-ti
mvn -o clean compile
```

Resultado obtenido:

```text
[INFO] Building backend-enao 0.0.1-SNAPSHOT
[INFO] Recompiling the module because of changed source code.
[INFO] Compiling 37 source files with javac [debug parameters release 21]
[INFO] BUILD SUCCESS
```

Entorno: OpenJDK 21, Maven 3.9, Spring Boot 3.3.0.

## E-02.2 Arranque y endpoint de salud

```bash
mvn -o spring-boot:run
```

Resultado obtenido:

```text
com.grupo4.enao.EnaoApplication : The following 1 profile is active: "dev"
com.grupo4.enao.EnaoApplication : Started EnaoApplication in 3.959 seconds
```

```bash
curl -s http://localhost:8080/api/health
```

```json
{"status":"UP","service":"backend-enao","timestamp":"2026-10-20T18:30:58.551976200","database":"UP"}
```

El endpoint comprueba ademas la conexion con la base de datos, por lo que
`database: UP` confirma que la persistencia esta operativa.

## E-02.3 Autenticacion y roles

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"docNumber":"admin","password":"admin123"}'
```

| Caso | Codigo | Resultado obtenido |
|---|---|---|
| Login de administrador | HTTP 200 | `role=ADMIN`, token de 213 caracteres |
| Login de postulante | HTTP 200 | `role=APPLICANT`, token de 227 caracteres |

Matriz de control de acceso verificada contra la API en ejecucion (9 de
9 casos conformes a lo esperado):

| Prueba | Esperado | Resultado |
|---|---|---|
| `POST /api/auth/login` (admin) | 200 | PASA |
| `GET /api/applicants/me` (postulante) | 200 | PASA |
| `GET /api/results/me` (postulante) | 200 | PASA |
| `GET /api/admin/applicants` (admin) | 200 | PASA |
| `GET /api/admin/applicants` (maintainer) | 200 | PASA |
| `GET /api/admin/applicants` (postulante) | 403 | PASA |
| `GET /api/admin/applicants` (sin token) | 403 | PASA |
| `GET /api/applicants/me` (sin token) | 403 | PASA |
| `GET /api/admin/applicants/1` (maintainer) | 200 | PASA |

## E-02.4 Compilacion del frontend

```bash
cd app/aspefo-demo
npm ci --offline --ignore-scripts   # 224 paquetes instalados
npm run lint                          # tsc --noEmit
```

Resultado obtenido: **0 errores de TypeScript**.

El empaquetado con `npm run build` (vite build) no concluyo en el entorno
de elaboracion por `spawn EPERM` (el sandbox bloquea el proceso hijo de
Node). Para confirmar que el grafo de modulos es correcto se ejecuto
esbuild de forma directa:

```bash
npx esbuild src/main.tsx --bundle --outfile=/tmp/bundle-test.js
```

Resultado obtenido: bundle de **1665.3 KB** con el grafo de modulos
completo, sin errores de resolucion. El bloqueo es del entorno, no del
proyecto; el `Dockerfile.frontend` ejecuta `npm run build` dentro del
contenedor, donde no aplica esa restriccion.

## Archivos relacionados

- `app/backend-enao-ti/pom.xml`
- `app/backend-enao-ti/src/main/resources/application*.properties`
- `app/backend-enao-ti/src/main/java/com/grupo4/enao/controller/HealthController.java`
- `app/aspefo-demo/package.json`
