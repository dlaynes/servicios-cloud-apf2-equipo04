# Guia opcional: uso local con Floci CLI

Este documento describe como usar **Floci** como emulador de AWS para
validaciones locales. **No sustituye** al despliegue real en AWS y no
debe presentarse como infraestructura en la nube.

## 1. Requisitos

| Herramienta | Uso |
|---|---|
| Docker Engine 24+ | Ejecutar el contenedor del emulador y los servicios del proyecto. |
| Docker Compose v2 | Levantar `frontend`, `backend` y `db`. |
| Floci CLI | Gestionar el ciclo de vida del emulador (`floci aws`). |
| AWS CLI v2 (opcional) | Enviar peticiones a los servicios emulados. |

## 2. Arranque del emulador

```powershell
floci aws start --persist .\floci-data
floci aws wait --timeout 2m
floci aws env --shell powershell | Invoke-Expression
```

Verifique que el contenedor este en estado `running` con:

```powershell
floci aws status -o json
```

## 3. Consultar cobertura

El emulador no garantiza soporte completo de todos los servicios y
operaciones de AWS. Antes de usar un servicio, consulte la cobertura
disponible en la instancia:

```powershell
floci aws services -o json
```

## 4. Usar AWS CLI contra Floci

Las credenciales del emulador son de prueba y no corresponden a una
cuenta real. Para evitar que una llamada alcance AWS real, use siempre
el endpoint explicito:

```powershell
aws --endpoint-url $env:AWS_ENDPOINT_URL sts get-caller-identity
```

## 5. Uso con Terraform

Los archivos `infra/cloud/vpc.tf` y `infra/cloud/security-groups.tf`
definen la VPC de destino y sus grupos de seguridad. Si se usan con el
emulador, cada operacion de API y servicio debe verificarse contra la
cobertura real de Floci; no se puede garantizar que el mismo recurso se
comporte igual que en AWS.

## 6. Como debe documentarse en el informe del proyecto

- No declare recursos de AWS como desplegados por usar Floci.
- Si se usa solo para pruebas locales, identifique el recurso como
  `SIMULADO` o `PARCIALMENTE IMPLEMENTADO`.
- Mantenga Floci como herramienta de apoyo. El estado base del APF2
  sigue siendo `IMPLEMENTADO` en Docker Compose y `SIMULADO` en la VPC
  de AWS.