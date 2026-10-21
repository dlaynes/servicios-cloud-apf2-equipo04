# E-06 - Observabilidad: logs, comprobaciones de salud y metricas

**Que demuestra:** como se observa el estado de los servicios, que
indicadores de rendimiento conviene vigilar y que criterio inicial
justificaria escalar o ajustar recursos.

**Estado:** PARCIALMENTE IMPLEMENTADO. Los logs, las comprobaciones de
salud y la rotacion de logs estan implementados. No hay metricas
centralizadas ni alarmas, que corresponden al APF3.

## 1. Mecanismos de observacion implementados

| Mecanismo | Implementacion | Que aporta |
|---|---|---|
| Logs de contenedor | `docker compose logs` | Salida estandar y de error de cada servicio |
| Rotacion de logs | `json-file`, `max-size: 10m`, `max-file: 3` | Evita que los logs agoten el disco del host |
| Comprobacion de salud de la base de datos | `mysqladmin ping` | Estado de MySQL cada 10 s |
| Comprobacion de salud del backend | `GET /api/health` | Estado de la API y de la base de datos cada 15 s |
| Comprobacion de salud del frontend | `wget --spider http://localhost/` | Estado de Nginx cada 15 s |
| Reinicio automatico | `restart: unless-stopped` | Recuperacion ante caida del proceso |
| Endpoint de salud | `GET /api/health` | Sonda utilizable por un balanceador o un monitor externo |

## 2. El endpoint de salud

```bash
curl -s http://localhost:8080/api/health
```

```json
{
  "status": "UP",
  "service": "backend-enao",
  "timestamp": "2026-10-20T18:30:58.551976200",
  "database": "UP"
}
```

El campo `database` es el que aporta valor operativo: distingue "el
proceso esta vivo" de "el proceso puede realmente trabajar". Si la base
de datos deja de responder, `database` pasa a `DOWN` aunque el proceso
siga en ejecucion.

## 3. Verificacion del estado de los servicios

```bash
# Estado y salud de cada contenedor
docker compose -f docker/compose.yaml --env-file .env ps

# Estado de salud en detalle
docker inspect --format '{{.Name}}: {{.State.Health.Status}}' \
  apf2-db apf2-backend apf2-frontend

# Ultimas lineas de log
docker compose -f docker/compose.yaml --env-file .env logs --tail 40

# Consumo de recursos
docker stats --no-stream
```

## 4. Indicadores a vigilar

| Indicador | Como se obtiene | Valor observado | Umbral de atencion | Decision inicial |
|---|---|---|---|---|
| Disponibilidad del servicio | `GET /api/health` | `status: UP` | `status: DOWN` o mas de 3 comprobaciones fallidas seguidas | Revisar reinicios, saturacion y la base de datos |
| Estado de la base de datos | Campo `database` de `/api/health` | `UP` | `DOWN` | Revisar el contenedor `db` y el pool de conexiones |
| Estado de los contenedores | `docker compose ps` (columna STATUS) | `healthy` | `unhealthy` o `restarting` | Revisar los logs del servicio afectado |
| Uso de CPU | `docker stats --no-stream` | Por medir en el laboratorio | Mayor del 70 % sostenido 10 min | Escalar el backend horizontalmente |
| Uso de memoria | `docker stats --no-stream` | Por medir en el laboratorio | Mayor del 80 % sostenido | Ajustar los limites de la solicitud o del contenedor |
| Latencia de respuesta | `curl -w '%{time_total}'` sobre `/api/health` | Por medir en el laboratorio | p95 mayor de 3 s (RNF-03 del APF1) | Escalar el backend |
| Tasa de errores 5xx | `docker compose logs backend \| grep -c ERROR` | Por medir en el laboratorio | Mayor del 1 % en 5 minutos | Revisar logs del backend y de la base de datos |
| Logs de error de MySQL | `docker compose logs db` | Sin errores en el arranque verificado | Cualquier error de conexion | Revisar la conectividad y el pool de HikariCP |
| Tamano del volumen | `docker system df -v` | Por medir | Crecimiento no previsto | Revisar la politica de retencion y los respaldos |

## 5. Criterio inicial de escalado

Se apoya en el objetivo de rendimiento del APF1 (RNF-03: el 95 % de las
solicitudes web debe responder en 3 segundos) y en el hecho de que la
carga del modulo ENAO se concentra en los periodos de inscripcion y de
publicacion de resultados.

- **Escalado horizontal** cuando la CPU supere el 70 % de forma
  sostenida durante 10 minutos, o cuando la latencia p95 supere 3 s con
  la CPU por encima del 50 %.
- **Sin escalado de aplicacion** cuando la latencia sube pero la CPU
  permanece baja: la causa probable es la base de datos o un recurso
  externo.
- **Revision a la baja** cuando la CPU se mantiene por debajo del 20 %
  con latencias bajas.
- **Revision de la base de datos** antes que de la aplicacion cuando el
  cuello de botella es el pool de conexiones o el tiempo de consulta.

## 6. Lo que falta (APF3)

| Falta | Descripcion | Donde se implementara |
|---|---|---|
| Metricas de aplicacion | Exponer `/actuator/prometheus` con Micrometer | APF3, junto con Prometheus y Grafana |
| Paneles | Graficos de latencia, tasa de error, CPU y memoria | APF3, Grafana |
| Alarma | Notificacion al superar un umbral | APF3, sobre las metricas centralizadas |
| Traza distribuida | Correlacionar la peticion entre Nginx, backend y base de datos | APF3, OpenTelemetry |
| Logs centralizados | Envio de logs a un servicio de agregacion con retencion | APF3, equivalente a CloudWatch Logs |
| Prueba de carga | Medir el p95 real con carga representativa | APF3 |

La seccion 11 de la plantilla del informe califica esta parte como
**evidencia complementaria** y no como un quinto criterio de
calificacion, de modo que su estado parcial no penaliza los cuatro
criterios principales de la rubrica.

## Archivos relacionados

- `docker/compose.yaml` (healthchecks y `x-logging`)
- `app/backend-enao-ti/src/main/java/com/grupo4/enao/controller/HealthController.java`
- `scripts/verificar-salud.sh`
- `docs/plan-apf3.md`
