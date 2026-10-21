# Plan de continuidad hacia APF3 - APF2

El APF3 (semana 17) evalua orquestacion y despliegue avanzado,
integracion entre servicios, escalabilidad/elasticidad y sistema de
monitoreo/telemetria. Este documento fija que se hara en cada frente y
que se necesita para completarlo.

## 1. Trabajo pendiente

| Frente | Accion prevista | Responsable | Dependencias / riesgos | Evidencia esperada |
|---|---|---|---|---|
| **Orquestacion y despliegue avanzado** | Migrar el `compose.yaml` a Kubernetes con un manifiesto por componente (Deployment, Service, ConfigMap, Secret, PersistentVolumeClaim) y despliegue en un cluster de laboratorio (kind o minikube) | Equipo tecnico | Requiere imagenes publicadas en un registro accesible; el registro actual es local | Manifiestos en `k8s/`, salida de `kubectl get all` y de `kubectl get pods` |
| **Integracion entre servicios** | Sustituir el proxy inverso de Nginx por un Ingress del cluster; conectar el backend con un servicio de correo para notificaciones de estado y con el bucket de objetos para los documentos de postulacion (RF-03 y RF-04) | Equipo tecnico | El servicio de correo requiere credenciales de un proveedor; los documentos requieren un bucket | Solicitud de un documento con carga y descarga comprobada; correo de notificacion recibido |
| **Escalabilidad / elasticidad** | Configurar replicas del backend con `HorizontalPodAutoscaler` sobre la metrica de CPU, y un `PodDisruptionBudget`. Definir el umbral y la justificacion | Equipo tecnico | El cluster debe tener recursos suficientes para disparar el escalado | Grafico o salida de `kubectl describe hpa` mostrando el cambio de replicas |
| **Monitoreo / telemetria** | Desplegar Prometheus y Grafana, exportar metricas de la aplicacion con Micrometer y configurar alarmas por latencia, tasa de error y uso de recursos | Equipo tecnico | Requiere acceso a la imagen del backend para exponer `/actuator/prometheus` | Panel con las metricas y una alarma disparada de forma controlada |
| **Datos y continuidad** | Configurar copias automaticas de la base de datos con retencion, y ejecutar una restauracion real para medir RPO y RTO frente a los objetivos de 1 h y 4 h | Equipo tecnico | El snapshot o dump debe guardarse en un volumen separado | Evidencia de restauracion con el tiempo medido |
| **Cierre funcional** | Implementar los requerimientos pendientes del APF1: comprobante de inscripcion descargable (RF-04), reportes (RF-08) y validacion de tamano de documentos (RF-03) | Equipo tecnico | Depende del bucket de objetos | Casos de prueba ejecutados |
| **Sustentacion** | Grabar el video de 8 a 12 minutos en YouTube con visibilidad "No listado", con participacion de los tres integrantes | Todo el equipo | Debe grabarse despues de cerrar el codigo para que coincida con el estado final | Enlace verificable en la caratula del informe |

## 2. Metricas que se monitorizaran

| Metrica | Fuente | Umbral de atencion | Decision asociada |
|---|---|---|---|
| Disponibilidad de la API | Probes sobre `/api/health` | < 99,5 % en 5 minutos | Revisar reinicios y saturacion; activar el balanceador |
| Latencia p95 de `/api` | Metrica de latencia HTTP | > 3 s (RNF-03) | Escalar el backend |
| Tasa de errores 5xx | Metrica de errores por codigo de estado | > 1 % en 5 minutos | Revisar logs del backend y base de datos |
| Uso de CPU | Metrica de contenedor | > 70 % sostenido 10 min | Escalar horizontalmente |
| Uso de memoria | Metrica de contenedor | > 80 % sostenido o por debajo de 20 % | Ajustar los limites de la solicitud o del contenedor |
| Crecimiento del volumen de datos | Tamano del volumen `db_data` | Crecimiento no previsto | Revisar politica de retencion y respaldos |
| Errores de MySQL | Logs del contenedor `db` | Cualquier error de conexion | Revisar la conectividad y el pool de HikariCP |

## 3. Criterio inicial de escalado

El criterio se apoya en el objetivo de rendimiento del APF1 (RNF-03: el
95 % de las solicitudes web debe responder en 3 segundos) y en la
experiencia de uso del modulo ENAO, que concentra la carga durante los
periodos de inscripcion y de publicacion de resultados.

- **Escalado horizontal del backend** cuando la CPU supere el 70 % de
  forma sostenida durante 10 minutos, o cuando la latencia p95 supere
  3 segundos con la CPU por encima del 50 %. Estas dos condiciones
  indican que la capacidad actual no sostiene la demanda.
- **Sin escalado** cuando la latencia sube pero la CPU permanece baja:
  la causa probable es la base de datos o un recurso externo, y
  escalar el backend no resolveria el problema.
- **Revision a la baja** cuando el uso sostenido de CPU se mantiene por
  debajo del 20 % y la latencia es baja: se reduce el numero deplicas
  para no pagar capacidad innecesaria durante los periodos muertos.
- **Rebalanceo de la base de datos** antes que escalado de aplicacion
  cuando el cuello de botella es el numero de conexiones o el
  tiempo de consulta, ajustando el pool de HikariCP y los indices.

## 4. Hitos sugeridos

| Semana | Actividad | Entregable |
|---|---|---|
| 13 | Manifiestos de Kubernetes y despliegue en cluster local | `k8s/` con la aplicacion ejecutandose |
| 14 | Ingress, bucket de objetos y notificaciones por correo | Integracion verificada extremo a extremo |
| 15 | Prometheus, Grafana, Micrometer y alarmas | Panel de metricas con alarma configurada |
| 16 | Copias automaticas, restauracion y prueba de RPO/RTO | Evidencia de recuperacion con tiempos medidos |
| 17 | Cierre funcional de RF-03, RF-04 y RF-08; preparacion de sustentacion | Video de APF3 y documento final |

## 5. Riesgos que deben vigilarse

| Riesgo | Impacto | Mitigacion prevista |
|---|---|---|
| El cluster de laboratorio no reproduce la resolucion DNS ni los certificados de un entorno real | Retrabajo al desplegar en AWS | Validar tambien con los manifiestos sobre la VPC |
| El registro de imagenes local no es accesible desde el cluster | La orquestacion no arranca | Publicar las imagenes en un registro con acceso de lectura |
| El servicio de correo exige datos personales de envio | Riesgo normativo bajo la Ley N.o 29733 | Usar un servicio transaccional, minimizar datos y documentar la base legal |
| Las metricas pueden exponer datos personales en los logs | Incumplimiento de proteccion de datos | Revision de los logs antes de centralizarlos y anonimizacion de los identificadores |
| El costo del cluster y de los servicios administrados crece con el uso | Desvio del presupuesto | Etiquetar recursos, fijar presupuestos y alertas de costo desde el inicio |
