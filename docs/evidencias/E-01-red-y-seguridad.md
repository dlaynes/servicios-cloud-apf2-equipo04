# E-01 - Red virtual segmentada y reglas de seguridad

**Que demuestra:** que la solucion implementa dos capas de red con
direccionamiento explicito, que la capa privada no tiene salida a
Internet y que el acceso directo a la base de datos y al backend esta
denegado.

**Estado:** IMPLEMENTADO en el laboratorio Docker. El diseno equivalente
en AWS (VPC, IGW, NAT Gateway y grupos de seguridad) es SIMULADO.

## Configuracion declarada

Archivo `docker/compose.yaml`:

```yaml
networks:
  apf2_public:
    name: apf2_public
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.10.0/24

  apf2_private:
    name: apf2_private
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.28.20.0/24
```

El servicio `db` y el servicio `backend` **no declaran `ports:`**. Solo el
servicio `frontend` publica un puerto:

```yaml
  frontend:
    ports:
      - "${FRONTEND_PORT:-8080}:80"
```

## Comandos de verificacion

```bash
# La red privada no tiene salida a Internet
docker network inspect apf2_private --format '{{.Internal}}'

# Direccionamiento de cada red
docker network inspect apf2_public apf2_private \
  --format '{{.Name}}: {{range .IPAM.Config}}{{.Subnet}}{{end}}'

# Solo el frontend tiene un puerto publicado
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

## Resultados esperados

| Comprobacion | Resultado esperado | Significado |
|---|---|---|
| `Internal` de `apf2_private` | `true` | Sin salida a Internet |
| `Internal` de `apf2_public` | `false` | Con salida, es la frontera |
| Subnet de `apf2_public` | `172.28.10.0/24` | CIDR de la capa publica |
| Subnet de `apf2_private` | `172.28.20.0/24` | CIDR de la capa privada |
| Puertos de `apf2-frontend` | `0.0.0.0:8080->80/tcp` | Unica entrada publica |
| Puertos de `apf2-backend` | (vacio) | Sin exposicion |
| Puertos de `apf2-db` | (vacio) | Sin exposicion |

## Matriz de accesos aplicada

| Origen | Destino | Puerto | Regla |
|---|---|---|---|
| Internet | `apf2-frontend` | 8080 -> 80 | PERMITIDO |
| `apf2-frontend` | `apf2-backend` | 8080 | PERMITIDO (misma red, via proxy inverso) |
| `apf2-backend` | `apf2-db` | 3306 | PERMITIDO (misma red, credenciales por entorno) |
| Host | `apf2-backend` | 8080 | **DENEGADO** (sin `ports:`) |
| Host | `apf2-db` | 3306 | **DENEGADO** (sin `ports:`) |
| `apf2-backend` / `apf2-db` | Internet | salida | **DENEGADO** (red `internal: true`) |

## Equivalente en AWS (SIMULADO)

- `infra/cloud/vpc.tf`: VPC `10.20.0.0/16`, subred publica `10.20.10.0/24`,
  subred privada `10.20.20.0/24`, subred de datos `10.20.30.0/24`, IGW,
  NAT Gateway y tres tablas de ruteo.
- `infra/cloud/security-groups.tf`: ALB con 80/443 desde Internet, backend
  con 8080 solo desde el ALB, base de datos con 3306 solo desde el
  backend y sin regla de salida.

## Archivos relacionados

- `docker/compose.yaml`
- `docker/nginx-frontend.conf`
- `infra/cloud/vpc.tf`
- `infra/cloud/security-groups.tf`
- `infra/network/README.md`
- `docs/topologia-red.md`
- `docs/topologia-red.png`
