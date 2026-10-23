<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# frontend-gestion-ti

Frontend del portal institucional de la **Asociación Peruana de Facultades de Odontología (ASPEFO)** y del módulo **ENAO** (Examen Nacional de Odontología).

## Tecnologías

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- React Router DOM 7
- Framer Motion (`motion`)
- Lucide React (iconos)

## Estructura de carpetas

```
src/
├── components/          # Layout, Header, Footer
├── contexts/            # AuthContext (JWT + rol + postulante)
├── pages/               # Home, News, Institution, Contact, ENAO
├── services/            # Cliente HTTP hacia el backend
├── types/               # Interfaces TypeScript
├── App.tsx              # Router principal
├── main.tsx             # Punto de entrada
└── index.css            # Configuración Tailwind + tema ASPEFO
```

## Configuración

Copiar el archivo de ejemplo y ajustar si es necesario:

```bash
cp .env.example .env.local
```

Variables:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base de la API ENAO | `http://localhost:8080/api` |
| `GEMINI_API_KEY` | Clave de Gemini (no usada actualmente) | - |
| `APP_URL` | URL de despliegue | - |

## Ejecutar localmente

**Requisito:** Node.js

```bash
npm install
npm run dev
```

La aplicación se sirve en `http://localhost:3000`.

## Scripts útiles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Construcción para producción |
| `npm run preview` | Previsualización del build |
| `npm run lint` | Verificación de tipos con TypeScript |

## Funcionalidades

### Portal institucional

- Portada con carrusel de noticias/hero.
- Sección de noticias.
- Información institucional (misión, visión, estadísticas).
- Formulario de contacto.

### Módulo ENAO

- Bienvenida y normativas.
- Registro de postulante en 4 pasos.
- Login con DNI, `admin` o `maintainer`.
- Panel del postulante:
  - Mis datos.
  - Editar postulación (organización, banco, recibo).
  - Resultados del examen.
- Panel de administración (solo `ADMIN` / `MAINTAINER`):
  - Listado de postulantes.
  - Búsqueda por nombre o DNI.
  - Cambio de estado de inscripción.
  - Registro/edición de resultados de examen.

## Roles

El frontend consume el rol devuelto por el backend (`APPLICANT`, `MAINTAINER`, `ADMIN`):

- `APPLICANT` ve el panel de postulante.
- `MAINTAINER` y `ADMIN` acceden al panel de administración.

La ruta `/enao/admin` está protegida por el componente `AdminGuard`.

## Integración con backend

El frontend consume la API REST de `backend-enao`. Asegúrate de que el backend esté corriendo en `http://localhost:8080` antes de usar las funciones de ENAO.

## Usuarios de prueba

Si se ejecuta el backend con el seeder de desarrollo:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `72345678` (DNI) | `123456` | Postulante |
| `admin` | `admin123` | Administrador |
| `maintainer` | `maintainer123` | Mantenedor |

## Notas

- Los formularios de contacto y suscripción de noticias son visuales y no envían datos a ningún servicio.
- El módulo ENAO está completamente integrado con el backend.
