# backend-enao

Backend Spring Boot del módulo **ENAO** (Examen Nacional de Odontología) para el proyecto de gestión del servicio TI de la Asociación Peruana de Facultades de Odontología (ASPEFO).

## Tecnologías

- Java 21
- Spring Boot 3.3.0
- Spring Security (autenticación JWT stateless con roles)
- Spring Data JPA
- H2 (desarrollo) / MySQL (producción)
- Lombok 1.18.38
- JJWT 0.12.5

## Estructura de carpetas

```
src/main/java/com/grupo4/enao/
├── config/           # SecurityConfig, WebConfig (CORS)
├── controller/       # AuthController, ApplicantController, ResultController, AdminController
├── dto/              # Request/Response DTOs y ApplicantMapper
├── exception/        # GlobalExceptionHandler, ErrorResponse
├── model/            # Applicant, ApplicationData, ExamResult, Role, User
├── repository/       # JPA repositories
├── security/         # JwtUtil, JwtAuthenticationFilter, UserDetailsServiceImpl
├── seed/             # DataSeeder (datos de prueba)
└── service/          # AuthService, ApplicantService, ExamResultService, AdminService
```

## Roles y autoridades

El sistema soporta tres roles:

| Rol | Autoridad | Descripción |
|-----|-----------|-------------|
| `APPLICANT` | `ROLE_APPLICANT` | Postulante del ENAO. Accede a su perfil y resultados. |
| `MAINTAINER` | `ROLE_MAINTAINER` | Mantenedor. Puede gestionar inscripciones y resultados. |
| `ADMIN` | `ROLE_ADMIN` | Administrador. Mismos privilegios que `MAINTAINER` (extensible en el futuro). |

Los postulantes se autentican con su **DNI**. Los usuarios internos (`ADMIN`/`MAINTAINER`) se autentican con su **username**.

## Ejecutar localmente

```bash
# Compilar y ejecutar con Maven local
mvn -Dmaven.repo.local=./.m2/repository spring-boot:run

# O empaquetar y ejecutar el JAR
mvn -Dmaven.repo.local=./.m2/repository package -DskipTests
java -jar target/backend-enao-0.0.1-SNAPSHOT.jar
```

La aplicación arranca en `http://localhost:8080`.

La consola H2 está disponible en `http://localhost:8080/h2-console` (solo en desarrollo).

## Endpoints principales

### Autenticación (público)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Inicio de sesión con DNI/username y contraseña |

### Postulante (requiere `ROLE_APPLICANT`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/applicants` | Registro de nuevo postulante (público) |
| GET | `/api/applicants/me` | Perfil del postulante autenticado |
| PUT | `/api/applicants/me` | Editar datos de postulación (organización, banco, recibo) |
| GET | `/api/results/me` | Resultado del examen del postulante autenticado |

### Administración (requiere `ROLE_ADMIN` o `ROLE_MAINTAINER`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/applicants` | Listar todos los postulantes |
| GET | `/api/admin/applicants/{id}` | Ver detalle de un postulante |
| PUT | `/api/admin/applicants/{id}/status` | Cambiar estado de inscripción (`PENDING`, `VALIDATED`, `REJECTED`) |
| GET | `/api/admin/applicants/search?docNumber=...` | Buscar postulante por DNI |
| PUT | `/api/admin/applicants/{id}/results` | Registrar/editar resultado del examen |

## Flujo de autenticación

1. El usuario inicia sesión con DNI/username y contraseña.
2. El backend devuelve un JWT tipo Bearer junto con el rol y, si aplica, el perfil del postulante.
3. El frontend almacena el token y lo envía en el header `Authorization: Bearer <token>`.
4. `JwtAuthenticationFilter` valida el token, reconstruye las autoridades desde el claim `authorities` y las asigna al contexto de seguridad.
5. Las anotaciones `@PreAuthorize` y las reglas de `SecurityFilterChain` protegen los endpoints por rol.

## Usuarios de prueba

El seeder crea automáticamente los siguientes usuarios al iniciar la aplicación:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | `ADMIN` |
| `maintainer` | `maintainer123` | `MAINTAINER` |
| `72345678` (DNI) | `123456` | `APPLICANT` |

## Configuración de base de datos

Por defecto se usa H2 en memoria (`spring.jpa.hibernate.ddl-auto=create-drop`).

Para usar MySQL en producción, actualizar `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/enao
spring.datasource.username=root
spring.datasource.password=secret
spring.jpa.hibernate.ddl-auto=update
spring.h2.console.enabled=false
```

## Seguridad

- Contraseñas hasheadas con BCrypt.
- JWT firmado con HS256; el secreto se configura en `enao.jwt.secret`.
- CORS habilitado para los orígenes del frontend Vite:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`

## Configuración de JWT

En `src/main/resources/application.properties`:

```properties
enao.jwt.secret=dev-secret-key-for-enao-project-only-do-not-use-in-production
enao.jwt.expiration-ms=86400000
```

**Importante:** cambiar el secreto en producción.

## Compatibilidad

- El proyecto está configurado para Java 21.
- En este entorno se usa un JDK 25, por lo que Lombok se fijó en la versión **1.18.38** para garantizar la compatibilidad con el procesador de anotaciones.
- Si se usa un toolchain Java 21 estricto, también funciona con Lombok 1.18.32+.

## Notas

- El cache de Maven local se guarda en `backend-enao/.m2` cuando se usa `-Dmaven.repo.local=./.m2/repository`, lo que mantiene las descargas dentro del workspace.
- El directorio se renombró de `enao` a `backend-enao` para distinguirlo claramente del frontend.
