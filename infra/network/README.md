# Equivalencia entre el laboratorio Docker y la VPC de AWS

Este documento explica como la topologia implementada en el laboratorio
(docker/compose.yaml) se traslada a una VPC real de AWS, y cual es el
estado real de cada elemento.

## Principio de diseno

La solucion se separa en dos capas de red con criterios distintos:

- **Capa publica (borde)**: recibe el trafico de los usuarios y aloja
  unicamente el servidor web que sirve la SPA y hace de proxy inverso.
- **Capa privada (datos y aplicacion)**: aloja la API y la base de datos.
  No tiene acceso a Internet ni puertos publicados hacia el host.

En el laboratorio, la capa publica se materializa con una red Docker
`bridge` y la privada con una red `bridge` marcada `internal: true`.
En AWS, la misma division se materializa con subredesPublicSubnetIds
y subredes privadas, un Internet Gateway, un NAT Gateway y tres grupos
de seguridad con reglas de minimo privilegio.

## Tabla de equivalencias

| Elemento | Laboratorio (Docker) | Destino AWS | Estado |
|---|---|---|---|
| Red publica | `apf2_public` (bridge, 172.28.10.0/24) | Subred publica 10.20.10.0/24 con IGW | SIMULADO |
| Red privada | `apf2_private` (bridge internal, 172.28.20.0/24) | Subred privada 10.20.20.0/24 con NAT GW | SIMULADO |
| Red de datos | (no se separa en Docker) | Subred de datos 10.20.30.0/24, sin ruta por defecto | SIMULADO |
| Puerta de entrada | Nginx del contenedor `frontend`, puerto 8080->80 | Application Load Balancer (80/443) | IMPLEMENTADO (Docker) / SIMULADO (AWS) |
| Proxy inverso | `location /api/` en docker/nginx-frontend.conf | Listener del ALB con regla de redireccion a /api | IMPLEMENTADO (Docker) |
| API | Contenedor `backend` (Spring Boot, 8080) | EC2 en subred privada, 8080 | IMPLEMENTADO (Docker) / SIMULADO (AWS) |
| Base de datos | Contenedor `db` (MySQL 8, 3306) | RDS MySQL en subred de datos | IMPLEMENTADO (Docker) / SIMULADO (AWS) |
| Persistencia | Volumen Docker `apf2_db_data` | RDS con backups automaticos + S3 | IMPLEMENTADO (Docker) / SIMULADO (AWS) |
| Salida a Internet | Puentes de Docker | NAT Gateway en la subred publica | SIMULADO |
| Aislamiento | `internal: true` en la red privada | Subred privada sin IP publica y SG de la BD | IMPLEMENTADO (Docker) / SIMULADO (AWS) |
| Registro de eventos | `docker compose logs` + logging json-file | CloudWatch Logs y CloudWatch Metrics | PARCIALMENTE IMPLEMENTADO |

## Reglas de seguridad aplicadas

| Origen | Destino | Puerto | Regla | Equivalente AWS |
|---|---|---|---|---|
| Internet | Nginx (frontend) | 80/tcp | Permitido | SG del ALB: 0.0.0.0/0 en 80 y 443 |
| Nginx (frontend) | Backend | 8080/tcp | Permitido | SG del backend: solo desde el SG del ALB |
| Backend | MySQL | 3306/tcp | Permitido | SG de la BD: solo desde el SG del backend |
| Host | MySQL | 3306/tcp | **Denegado** (sin `ports:`) | SG de la BD: sin regla de entrada publica |
| Host | Backend | 8080/tcp | **Denegado** (sin `ports:`) | SG del backend: sin regla de entrada publica |
| Backend | Internet | salida | **Denegado** (red `internal`) | Sin IP publica, salida solo por NAT GW |

La regla de minimo privilegio se verifica en el laboratorio con:

```bash
docker network inspect apf2_public apf2_private
docker ps --format '{{.Names}} {{.Ports}}'
```

El resultado esperado es que solo `apf2-frontend` muestra un puerto
publicado y que `apf2_private` figura con `"Internal": true`.

## Traslado a AWS (procedimiento)

1. Crear la VPC y las subredes: `terraform apply` en `infra/cloud/vpc.tf`.
2. Crear los grupos de seguridad: `terraform apply` en
   `infra/cloud/security-groups.tf`.
3. Desplegar la base de datos (RDS MySQL) en la subred de datos con
   el grupo de seguridad de la base de datos y copias automaticas.
4. Desplegar la API en EC2 (o ECS/Fargate) en la subred privada,
   con el mismo `SPRING_PROFILES_ACTIVE=prod` y las mismas variables
   de entorno usadas en el laboratorio.
5. Publicar la SPA en S3 + CloudFront, o en EC2 con Nginx como en el
   laboratorio, usando el ALB como unica entrada publica.
6. Sustituir `db:3306` por el endpoint de RDS y la URL de la API por
   el dominio publico. El resto de la configuracion no cambia.
