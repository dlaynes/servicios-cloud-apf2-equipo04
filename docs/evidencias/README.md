# Evidencias de validacion - APF2

Registro de las verificaciones realizadas para los avances del proyecto.
Cada evidencia tiene un identificador estable (E-01 a E-06 del APF2, y
E-07 del cierre funcional) que se usa en la matriz de trazabilidad del
informe y en las tablas de la plantilla.

## Indice

| ID | Que demuestra | Tipo | Archivo |
|---|---|---|---|
| E-01 | Red virtual segmentada y reglas de seguridad | Texto | `E-01-red-y-seguridad.md` |
| E-02 | Computo: compilacion y arranque del backend | Texto | `E-02-computo.md` |
| E-03 | Almacenamiento persistente | Texto | `E-03-persistencia.md` |
| E-04 | Contenerizacion y comunicacion entre servicios | Texto | `E-04-contenedores.md` |
| E-05 | Repositorio, documentacion y control de secretos | Texto | `E-05-repositorio.md` |
| E-06 | Observabilidad: logs, healthchecks y metricas | Texto | `E-06-observabilidad.md` |
| E-07 | Ciclo funcional end-to-end de RF-03, RF-04 y RF-08 | Texto | `E-07-ciclo-funcional-rf.md` |

## Estado de las evidencias

Las evidencias E-01 a E-04 y E-06 se generaron en dos momentos distintos:

1. **Verificaciones ejecutadas durante la elaboracion del informe**, con el
   backend corriendo en local y el codigo de los dos componentes. Son
   reproducibles con los comandos indicados en cada archivo.
2. **Verificaciones pendientes de ejecucion en la maquina del equipo**,
   que requieren el demonio de Docker. El entorno de elaboracion no
   tenia acceso al socket de Docker, por lo que las imagenes no pudieron
   construirse alli.

Cada archivo de evidencia distingue explicitamente que parte se verifico y
que parte queda por ejecutar, con el comando exacto para completarla.
No se afirma que algo este funcionando si no se ha comprobado.

## Como completar las evidencias de Docker

```bash
# 1. Preparar las variables de entorno
cp config/ejemplos.env .env
# Editar .env y colocar valores aleatorios en MYSQL_PASSWORD,
# MYSQL_ROOT_PASSWORD y JWT_SECRET.

# 2. Construir las imagenes
docker compose -f docker/compose.yaml --env-file .env build

# 3. Levantar los servicios
docker compose -f docker/compose.yaml --env-file .env up -d

# 4. Capturar el estado
docker compose -f docker/compose.yaml --env-file .env ps

# 5. Capturar los logs de arranque
docker compose -f docker/compose.yaml --env-file .env logs --tail 40

# 6. Comprobar la salud
bash scripts/verificar-salud.sh http://localhost:8080

# 7. Comprobar el aislamiento de la red
docker network inspect apf2_public apf2_private
docker ps --format 'table {{.Names}}\t{{.Ports}}'

# 8. Comprobar la persistencia
docker compose -f docker/compose.yaml --env-file .env exec db \
  mysql -uenao -p"$MYSQL_PASSWORD" enao -e "SELECT COUNT(*) FROM applicants;"
docker compose -f docker/compose.yaml --env-file .env restart db
docker compose -f docker/compose.yaml --env-file .env exec db \
  mysql -uenao -p"$MYSQL_PASSWORD" enao -e "SELECT COUNT(*) FROM applicants;"

# 9. Recoger el uso de recursos
docker stats --no-stream
```

Guardar la salida de cada comando como `.txt` en esta misma carpeta
(por ejemplo `E-04-contenedores-salida.txt`) y adjuntar las capturas
correspondientes.
