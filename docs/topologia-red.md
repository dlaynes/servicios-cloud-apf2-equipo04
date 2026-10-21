# Topologia de red virtual - APF2

## 1. Esquema

```text
                          Internet
                             |
                    :8080 (unico puerto publicado)
                             |
        +--------------------+--------------------+
        |            red apf2_public            |
        |            172.28.10.0/24             |
        |                                         |
        |  +---------------------------------+  |
        |  |  apf2-frontend                   |  |
        |  |  Nginx + SPA React               |  |
        |  |  172.28.10.x                     |  |
        |  +---------------------------------+  |
        |              |                      |
        |              | /api/ -> backend:8080  |
        +--------------|----------------------+
                       |            |
        +--------------|----+       | (sin salida a Internet)
        |                    |       |
        |   red apf2_private |       |
        |   172.28.20.0/24  |       |
        |   internal: true   |       |
        |                    |       |
        |  +------------------+----+  |
        |  |  apf2-backend        |  |  |
        |  |  Spring Boot :8080   |  |  |
        |  |  172.28.20.x         |  |  |
        |  +----------+-----------+  |  |
        |             | 3306/tcp     |  |
        |  +----------+-----------+  |  |
        |  |  apf2-db               |  |  |
        |  |  MySQL 8 :3306         |  |  |
        |  |  volumen apf2_db_data  |  |  |
        |  +------------------------+  |
        +-------------------------------+
```

## 2. Inventario de redes

| Elemento | Nombre | Tipo | CIDR | Acceso a Internet | Servicios conectados |
|---|---|---|---|---|---|
| Red publica | `apf2_public` | bridge | 172.28.10.0/24 | Si | `frontend` |
| Red privada | `apf2_private` | bridge (`internal: true`) | 172.28.20.0/24 | **No** | `backend`, `db`, `frontend` |
| Persistencia | `apf2_db_data` | volumen Docker | - | - | `db` (`/var/lib/mysql`) |

El frontend participa en las dos redes a proposito: es el unico elemento
que hace de puente entre la frontera y la capa de aplicacion. Su
conexion a la red privada no permite responder peticiones que no
provengan del proxy inverso, porque el puerto 80 solo se publica en la
red publica.

## 3. Matriz de accesos

| Origen | Destino | Puerto | Protocolo | Permitido | Regla aplicada |
|---|---|---|---|---|---|
| Internet | `apf2-frontend` | 8080 (host) -> 80 (contenedor) | TCP | Si | `ports: "${FRONTEND_PORT:-8080}:80"` |
| `apf2-frontend` | `apf2-backend` | 8080 | TCP | Si | Misma red privada, regla `location /api/` de Nginx |
| `apf2-backend` | `apf2-db` | 3306 | TCP | Si | Misma red privada, credenciales de la variable de entorno |
| Host | `apf2-backend` | 8080 | TCP | **No** | El servicio no declara `ports:` |
| Host | `apf2-db` | 3306 | TCP | **No** | El servicio no declara `ports:` |
| `apf2-db` | Internet | cualquiera | - | **No** | Red `internal: true` |
| `apf2-backend` | Internet | cualquiera | - | **No** | Red `internal: true` (salida unicamente por el frontend) |

## 4. Reglas de seguridad y su justificacion

| Regla | Motivo |
|---|---|
| Solo el frontend publica un puerto | Minimo privilegio: la superficie expuesta a Internet se reduce a un servicio. |
| El backend no se publica | La API no se expone directamente; solo es alcanzable a traves del proxy inverso, que aplica CORS, limites y cabeceras. |
| MySQL no se publica | La base de datos nunca es alcanzable desde el host ni desde Internet. |
| La red privada es `internal: true` | Sin salida a Internet: ni el backend ni la base de datos pueden iniciar conexiones salientes. |
| La API usa JWT con roles | Autorizacion por rol en el servidor, independiente de la interfaz. |
| El secreto JWT llega por variable de entorno | No hay credenciales en el codigo ni en la imagen. |
| Cabeceras de seguridad en Nginx | `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy` en todas las respuestas. |
| Rotacion de logs | `json-file` con `max-size: 10m` y `max-file: 3` evita agotar el disco del host. |

Cabeceras anadidas por el servidor de borde:

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## 5. Verificacion del aislamiento

```bash
# La red privada no tiene salida a Internet
docker network inspect apf2_private --format '{{.Internal}}'
# -> true

# Solo el frontend tiene un puerto publicado
docker ps --format 'table {{.Names}}	{{.Ports}}'
# -> apf2-frontend   0.0.0.0:8080->80/tcp
# -> apf2-backend   (vacio)
# -> apf2-db        (vacio)

# Direcciones asignadas
docker network inspect apf2_public apf2_private \
  --format '{{.Name}}: {{range .IPAM.Config}}{{.Subnet}}{{end}}'
```

## 6. Traslado a la VPC de AWS

Las equivalencias con la VPC de destino (subredes `10.20.10.0/24`,
`10.20.20.0/24` y `10.20.30.0/24`, IGW, NAT Gateway y tres grupos de
seguridad con reglas de minimo privilegio) estan en
`infra/cloud/vpc.tf`, `infra/cloud/security-groups.tf` y
`infra/network/README.md`.

El estado de esos recursos es **SIMULADO**: describen el destino, no un
despliegue ejecutado.
