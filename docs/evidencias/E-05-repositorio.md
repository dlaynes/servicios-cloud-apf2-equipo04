# E-05 - Repositorio, documentacion y control de secretos

**Que demuestra:** que el avance esta versionado en un repositorio
ordenado, con commits trazables, documentacion completa y sin
credenciales.

**Estado:** IMPLEMENTADO.

## Repositorio

| Aspecto | Valor |
|---|---|
| URL | https://github.com/dlaynes/servicios-cloud-apf2-equipo04 |
| Nombre | `servicios-cloud-apf2-equipo04` |
| Ram principal | `main` |
| Submodulos | `app/aspefo-demo`, `app/backend-enao-ti` |

Clonado con los submodulos:

```bash
git clone --recurse-submodules https://github.com/dlaynes/servicios-cloud-apf2-equipo04.git
```

Verificacion del estado de los submodulos:

```bash
git submodule status
```

El codigo de los dos componentes **no se copio** al repositorio: se
incorpora como submodulo Git, lo que conserva el historial, el remoto y
la posibilidad de actualizar cada componente por separado. En el
repositorio padre cada uno se registra con modo `160000` (entrada de
directorio enlazada a un commit concreto):

```bash
git ls-files -s app/
# 160000 416e4c7... 0  app/aspefo-demo
# 160000 52d0a52... 0  app/backend-enao-ti
```

## Estructura del repositorio

```text
servicios-cloud-apf2-equipo04/
|-- README.md                 Requisitos, configuracion, ejecucion, verificacion
|-- .gitmodules               Declaracion de los submodulos
|-- .gitattributes            Normalizacion LF y tratamiento de binarios
|-- .dockerignore             Contexto de build de Docker
|-- app/                      Codigo de la solucion (submodulos)
|-- docker/                   Dockerfiles, compose.yaml, nginx-frontend.conf
|-- infra/                    Terraform de la VPC y equivalencias de red
|-- config/ejemplos.env       Variables de ejemplo, sin secretos
|-- docs/                     Documentacion tecnica, diagramas e informe
|-- scripts/                  Verificaciones de codificacion y de salud
`-- evidencias/               Salidas de consola y capturas
```

## Documentacion entregada

| Documento | Contenido |
|---|---|
| `README.md` | Requisitos, instalacion, configuracion, ejecucion, verificacion, arquitectura y estado de los componentes |
| `docs/arquitectura.md` | Componentes, flujo, decisiones tecnicas y su justificacion, modelo de datos, autenticacion |
| `docs/topologia-red.md` | Redes, CIDR, matriz de accesos, reglas de seguridad y verificacion del aislamiento |
| `docs/inventario-computo-almacenamiento.md` | Inventario de recursos con estado, configuracion y validacion |
| `docs/matriz-trazabilidad.md` | Requisito -> componente -> archivo -> evidencia, y trazabilidad de las correcciones |
| `docs/plan-apf3.md` | Continuidad hacia orquestacion, integracion, escalabilidad y monitoreo |
| `infra/network/README.md` | Equivalencia entre el laboratorio Docker y la VPC de AWS |
| `docs/arquitectura.png`, `docs/topologia-red.png` | Diagramas con leyenda y flujos |
| `docs/evidencias/` | Registro E-01 a E-06 |
| `docs/informe-apf2.pdf` | Informe tecnico final (entregable) |

## Control de secretos

### Archivos que nunca se versionan

Contenido de `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
*.pem
*.key
id_rsa
id_ed25519
node_modules/
target/
```

### Comprobaciones aplicadas

```bash
# 1. Ningun archivo de secretos esta versionado
git ls-files | grep -E '\.(env|pem|key)$'

# 2. Busqueda de credenciales en el historico
git log -p --all | grep -iE 'password[[:space:]]*=[[:space:]]*[^*[:space:]]{6,}|secret[[:space:]]*=[[:space:]]*[^*[:space:]]{6,}'

# 3. Verificacion de codificacion de todo el arbol
python scripts/verificar-codificacion.py .
```

### Correccion aplicada durante este hito

El `DataSeeder` del backend contenia contrasenas escritas en el codigo
(`admin123`, `maintainer123`, `123456`). Se sustituyeron por variables
de entorno y el sembrado quedo desactivado por defecto:

```properties
enao.seed.enabled=false
enao.seed.admin-password=
enao.seed.maintainer-password=
enao.seed.demo-password=
```

En el perfil `dev` (desarrollo local) se mantienen los valores de
prueba, y en el perfil `prod` (el que usa el despliegue con
contenedores) el sembrado esta desactivado.

## Codificacion de los archivos

Todo el codigo se versiona en **UTF-8 sin BOM**. La comprobacion se
automatiza en `scripts/verificar-codificacion.py`, que verifica tres
criterios: ausencia de BOM, decodificacion estricta como UTF-8 y
ausencia de caracteres de control C1 (la huella de una doble
codificacion).

Resultado obtenido tras las correcciones de este hito:

```text
Archivos de texto verificados: 88
RESULTADO: OK - sin BOM, UTF-8 valido y sin doble codificacion.
```

La doble codificacion que se detecto en `app/aspefo-demo/vite.config.ts`
(linea 20, un comentario) se corrigio: la secuencia `C3 A2 C2 80 C2 94`
se sustituyo por `E2 80 94`, que es la codificacion correcta de la
raya Unicode.

## Commits

Los commits se organizan por componente funcional para que la
sustentacion pueda seguir la evolucion del proyecto:

| Commit | Contenido |
|---|---|
| Estructura inicial | Submodulos, `.gitignore`, `.gitmodules`, `.gitattributes` |
| Contenerizacion | `docker/` con los Dockerfiles, `compose.yaml` y la configuracion de Nginx |
| Infraestructura | `infra/` con los manifiestos Terraform y las equivalencias de red |
| Correccion del backend | Perfiles `dev`/`prod`, endpoint de salud, CORS parametrizado, sembrado seguro |
| Correccion del frontend | Correccion de la doble codificacion en `vite.config.ts` |
| Documentacion | `README.md` y el conjunto de documentos de `docs/` |
| Evidencias | Registro E-01 a E-06 en `docs/evidencias/` |

La atribucion de cada commit se deja explicita en el mensaje, de modo que
en la sustentacion se pueda identificar la contribucion de cada
integrante.

## Archivos relacionados

- `README.md`
- `.gitignore`, `.gitattributes`, `.gitmodules`
- `scripts/verificar-codificacion.py`
- `docs/matriz-trazabilidad.md`
