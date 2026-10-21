# E-03 - Almacenamiento persistente

**Que demuestra:** que los datos de la aplicacion se guardan en un
almacenamiento durable, independiente del ciclo de vida del contenedor, y
que sobreviven al reinicio de la base de datos.

**Estado:** IMPLEMENTADO en el laboratorio (volumen Docker). Las copias
automaticas de RDS y S3 son SIMULADAS.

## Recurso de almacenamiento

| Aspecto | Valor |
|---|---|
| Identificador | `S-01` |
| Tipo | Volumen Docker (bind mount sobre el host) |
| Nombre | `apf2_db_data` |
| Contenido | Todo el almacenamiento de MySQL 8: tablas `users`, `applicants`, `exam_results` |
| Punto de montaje | `/var/lib/mysql` en el contenedor `apf2-db` |
| Datos | Postulantes, datos de postulacion, resultados del examen, usuarios administradores |
| Politica de conservacion | Sobrevive a `docker compose stop`, `restart` y `down` (sin `-v`) |

Definicion en `docker/compose.yaml`:

```yaml
volumes:
  db_data:
    name: apf2_db_data

services:
  db:
    image: mysql:8.0
    volumes:
      - db_data:/var/lib/mysql
    restart: unless-stopped
```

## Modelo de datos persistido

```text
users
  id, username (unico), password_hash, full_name, role
  -> administradores del modulo ENAO (ADMIN, MAINTAINER)

applicants
  id, full_name, doc_type, doc_number (unico), email, phone,
  emergency_contact, emergency_phone, address, password_hash,
  university, international_university, country, other_university,
  organization, bank, receipt_code, status, created_at, updated_at
  -> postulantes y los datos de su postulacion

exam_results
  id, applicant_id (unico), score, maximum_score, status, published_at
  -> resultado del examen, relacion 1:1 con el postulante
```

Los campos `organization` y `status` se persisten como cadenas
(`EnumType.STRING`), lo que mantiene los datos legibles y facilita su
migracion entre entornos.

## Prueba de persistencia

```bash
# 1. Comprobar el volumen antes de reiniciar
docker compose -f docker/compose.yaml --env-file .env exec db \
  mysql -uenao -p"$MYSQL_PASSWORD" enao -e "SELECT COUNT(*) FROM applicants;"

# 2. Reiniciar la base de datos
docker compose -f docker/compose.yaml --env-file .env restart db

# 3. Volver a comprobar
docker compose -f docker/compose.yaml --env-file .env exec db \
  mysql -uenao -p"$MYSQL_PASSWORD" enao -e "SELECT COUNT(*) FROM applicants;"

# 4. Inspeccionar el volumen
docker volume inspect apf2_db_data
```

**Resultado esperado:** el numero de postulantes es el mismo antes y
despues del reinicio, y el volumen `apf2_db_data` sigue existiendo.

## Verificacion equivalente ya realizada

Con el backend corriendo sobre H2 en el perfil `dev` se verifico el ciclo
completo de escritura y lectura:

| Paso | Operacion | Resultado |
|---|---|---|
| 1 | `POST /api/applicants` (registro de postulante, endpoint publico) | HTTP 200, registro persistido con id asignado |
| 2 | `POST /api/auth/login` con el DNI del postulante | HTTP 200, `role=APPLICANT` |
| 3 | `PUT /api/admin/applicants/{id}/status` (admin) | HTTP 200, estado actualizado |
| 4 | `PUT /api/admin/applicants/{id}/results` (admin) | HTTP 200, `score=91.5/100`, `status=PUBLISHED` |
| 5 | `GET /api/results/me` (postulante) | HTTP 200, resultado disponible |

Los pasos 1 a 5 demuestran que la escritura llega a la base de datos, que
la lectura posterior la recupera y que el estado persiste entre peticiones
y entre conexiones distintas del pool.

## Continuidad prevista (APF3)

El objetivo de continuidad del APF1 es RPO de 1 hora y RTO de 4 horas.
En el laboratorio la persistencia cubre la reinicializacion de
contenedores, pero no la perdida del host. El APF3 incorpora copias
automaticas con retencion y una prueba real de restauracion sobre RDS.

## Archivos relacionados

- `docker/compose.yaml` (volumen `db_data` y servicio `db`)
- `app/backend-enao-ti/src/main/java/com/grupo4/enao/model/`
- `docs/arquitectura.md` (modelo de datos)
- `docs/inventario-computo-almacenamiento.md`
