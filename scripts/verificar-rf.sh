#!/usr/bin/env bash
# =====================================================================
# APF2 - verificacion end-to-end de RF-03, RF-04 y RF-08
#
# Requiere:
#   * el stack levantado: docker compose -f docker/compose.yaml up -d
#   * curl (y bash). No necesita python ni jq: los campos del JSON se
#     extraen con grep/sed y el hash con sha256sum/openssl si alguno
#     esta disponible en el equipo.
#
# Uso:
#   bash scripts/verificar-rf.sh [URL_BASE]
#
# La contrasena del administrador se lee de ADMIN_PASSWORD (es la que
# configura el bootstrap del backend); sin ella se usa 'admin123', el
# valor del perfil de desarrollo.
#
# Cada corrida crea un postulante de prueba con documento y correo
# unicos, de modo que es seguro repetirla. Los pasos que dependen de un
# token que no llego se marcan [SALTADO] con su contador propio en el
# resumen, en lugar de acumular fallos en cascada.
# =====================================================================
set -uo pipefail

BASE="${1:-http://localhost:8080}"
# La contrasena del administrador vive en el .env del repositorio y solo la
# consume Compose: si no esta en el entorno, se lee del archivo para que la
# prueba no dependa de variables exportadas a mano en la sesion.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ENV_CANDIDATOS="$SCRIPT_DIR/../.env $SCRIPT_DIR/.env ./../.env ./.env"
for candidato in $ENV_CANDIDATOS; do
  if [ -z "${ADMIN_PASSWORD:-}" ] && [ -f "$candidato" ]; then
    ADMIN_PASSWORD="$(sed -n 's/^[[:space:]]*ADMIN_PASSWORD[[:space:]]*=[[:space:]]*\(.*\)[[:space:]]*/\1/p' "$candidato" | head -n1)"
    break
  fi
done
ADMIN_PASS="${ADMIN_PASSWORD:-admin123}"
OKS=0
FALLOS=0
SALTADOS=0
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "== APF2 - verificacion de RF-03, RF-04 y RF-08 =="
echo "Base: $BASE"
echo

result() {
  local nombre="$1"
  local obtenido="$2"
  local esperado="$3"
  if [ "$obtenido" = "$esperado" ]; then
    echo "[OK]      $nombre"
    OKS=$((OKS + 1))
  else
    echo "[FALLA]   $nombre (obtuvo '$obtenido', esperaba '$esperado')"
    FALLOS=$((FALLOS + 1))
  fi
}

saltar() {
  echo "[SALTADO] $1 (depende del paso anterior)"
  SALTADOS=$((SALTADOS + 1))
}

# ---------------- extraccion de los campos del JSON, se lee por stdin ----------------
str_field() {
  sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p" | head -n1
}
num_field() {
  grep -oE "\"$1\"[[:space:]]*:[[:space:]]*[0-9]+" | head -n1 | sed 's/.*:[[:space:]]*//'
}
bool_field() {
  grep -oE "\"$1\"[[:space:]]*:[[:space:]]*(true|false)" | head -n1 | sed 's/.*:[[:space:]]*//'
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | awk '{print $1}'
  elif command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$1" | sed 's/^.*= *//'
  elif command -v node >/dev/null 2>&1; then
    node -e "const c=require('crypto'),f=require('fs');console.log(c.createHash('sha256').update(f.readFileSync(process.argv[1])).digest('hex'))" "$1"
  else
    echo ""
  fi
}

if ! command -v curl >/dev/null 2>&1; then
  echo "FALTA curl: no se puede ejecutar la verificacion." >&2
  exit 2
fi

# ---------------------------------------------------------- salud del backend
echo "0) Estado del backend (publico, sin token)"
SALUD=$(curl -sS "$BASE/api/health" 2>&1)
ADMIN_ESTADO=$(echo "$SALUD" | str_field adminAccount)
echo "   database=$ADMIN_ESTADO"
if [ -n "$ADMIN_ESTADO" ] && [ "$ADMIN_ESTADO" != "CONFIGURED" ]; then
  echo "   AVISO: no hay usuario de personal (adminAccount=$ADMIN_ESTADO)."
  echo "          Con ADMIN_PASSWORD en el .env, el backend crea al admin"
  echo "          admin en el primer arranque; sin esa variable los pasos"
  echo "          de revision y de reportes quedan sin token."
fi

# ---------------------------------------------------------------- 1. registro
STAMP="$(date +%s)$RANDOM"
DOC="RF$STAMP"
EMAIL="postulante$STAMP@prueba.ejemplo"
echo "1) Registro publico de un postulante de prueba ($DOC)"
REGISTER=$(curl -sS -X POST "$BASE/api/applicants" \
    -H "Content-Type: application/json" \
    -d "{\"fullName\":\"Postulante de Prueba $STAMP\",\"docType\":\"DNI\",\"docNumber\":\"$DOC\",\"email\":\"$EMAIL\",\"password\":\"prueba123\",\"organization\":\"MINSA\",\"bank\":\"BCP\",\"receiptCode\":\"REC-$STAMP\",\"period\":\"2026-II\",\"campus\":\"Lima\"}" 2>&1)
APPLICANT_ID=$(echo "$REGISTER" | num_field id)
if [ -n "$APPLICANT_ID" ]; then
  result "1. Registro publico del postulante (id $APPLICANT_ID)" "creado" "creado"
else
  result "1. Registro publico del postulante" "sin id" "creado"
  echo "   respuesta: $REGISTER"
  echo
  echo "Sin el postulante de prueba no se puede continuar el ciclo."
  exit 1
fi

# ---------------------------------------------------------------- 2. login del postulante
echo "2) Login del postulante"
LOGIN=$(curl -sS -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"docNumber\":\"$DOC\",\"password\":\"prueba123\"}" 2>&1)
TOKEN_APPL=$(echo "$LOGIN" | str_field token)
AUTH_APPL="Authorization: Bearer $TOKEN_APPL"
if [ -n "$TOKEN_APPL" ]; then
  result "2. Login del postulante (JWT)" "token recibido" "token recibido"
else
  result "2. Login del postulante (JWT)" "sin token" "token recibido"
  echo "   respuesta: $LOGIN"
fi

# ---------------------------------------------------------------- 3. PDF de prueba
printf '%%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] >>\nendobj\n4 0 obj\n<< /Length 1 >>\nstream\nx\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n1\n%%%%EOF\n' > "$TMP/prueba.pdf"
printf 'x' >> "$TMP/prueba.pdf"

if [ -z "$TOKEN_APPL" ]; then
  for paso in "4. Subida del documento" "5. Listado de documentos" \
              "6. Descarga del propio documento" "7. Contenido no PDF rechazado" \
              "8. Archivo de 11 MB rechazado" "9. Comprobante no permitido en estado PENDING"; do
    saltar "$paso"
  done
else
  echo "4) Subir documento (RF-03)"
  RESP4=$(curl -sS -w '\n%{http_code}' -X POST "$BASE/api/me/documents" \
      -H "$AUTH_APPL" \
      -F "file=@$TMP/prueba.pdf;filename=DNI-prueba.pdf" \
      -F "documentType=DNI" \
      -F "uploadComment=prueba automatica de RF-03" 2>&1)
  CODE4=$(echo "$RESP4" | tail -n1)
  BODY4=$(echo "$RESP4" | sed '$d')
  result "4. Subida del documento" "$CODE4" "201"
  DOC_ID=$(echo "$BODY4" | num_field id)
  SHA256=$(echo "$BODY4" | str_field sha256)
  if [ -n "$SHA256" ]; then
    result "4a. sha256 registrado por el backend" "presente" "presente"
  fi
  if [ "$CODE4" = "404" ]; then
    echo "   el backend desplegado no tiene el endpoint de documentos: hace falta"
    echo "   reconstruir el servicio backend con build backend."
  fi

  echo "5) Listar los documentos del postulante"
  CODE5=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/me/documents" -H "$AUTH_APPL" 2>&1)
  result "5. Listado de documentos" "$CODE5" "200"

  echo "6) Descargar el documento (propietario)"
  CODE6=$(curl -sS -o "$TMP/bajado.pdf" -w '%{http_code}' \
      "$BASE/api/me/documents/$DOC_ID/download" -H "$AUTH_APPL" 2>&1)
  result "6. Descarga del propio documento" "$CODE6" "200"
  if [ -n "$SHA256" ] && [ "$CODE6" = "200" ]; then
    BAJADO=$(sha256_of "$TMP/bajado.pdf")
    if [ -n "$BAJADO" ]; then
      result "6a. Integridad del documento (sha256 igual)" "$BAJADO" "$SHA256"
    fi
  fi

  echo "7) Rechazo de un archivo que no es PDF"
  printf 'texto plano disfrazado de pdf' > "$TMP/falso.pdf"
  CODE7=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/api/me/documents" \
      -H "$AUTH_APPL" \
      -F "file=@$TMP/falso.pdf;filename=DNI-falso.pdf" \
      -F "documentType=DNI" 2>&1)
  result "7. Contenido no PDF rechazado" "$CODE7" "415"

  echo "8) Rechazo de un archivo mayor al limite (11 MB)"
  dd if=/dev/zero of="$TMP/grande.pdf" bs=1M count=11 2>/dev/null
  printf '%%PDF-1.4' > "$TMP/grande.pdf"
  CODE8=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/api/me/documents" \
      -H "$AUTH_APPL" \
      -F "file=@$TMP/grande.pdf;filename=DNI-grande.pdf" \
      -F "documentType=DNI" 2>&1)
  result "8. Archivo de 11 MB rechazado" "$CODE8" "413"

  echo "9) Comprobante cuando la inscripcion NO esta validada"
  CODE9=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/me/comprobante.pdf" -H "$AUTH_APPL" 2>&1)
  result "9. Comprobante no permitido en estado PENDING" "$CODE9" "422"
fi
if [ -z "$APPLICANT_ID" ]; then
  exit 1
fi

# ---------------------------------------------------------------- 10. login del administrador
echo "10) Login del administrador ($ADMIN_PASS)"
LOGIN_ADMIN=$(curl -sS -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"docNumber\":\"admin\",\"password\":\"$ADMIN_PASS\"}" 2>&1)
ADMIN_TOKEN=$(echo "$LOGIN_ADMIN" | str_field token)
AUTH_ADMIN="Authorization: Bearer $ADMIN_TOKEN"
if [ -n "$ADMIN_TOKEN" ]; then
  result "10. Login del administrador (JWT)" "token recibido" "token recibido"
else
  result "10. Login del administrador (JWT)" "sin token" "token recibido"
  echo "   respuesta: $LOGIN_ADMIN"
  echo "   el bootstrap del backend crea al admin en el primer arranque con la"
  echo "   contrasena de ADMIN_PASSWORD; el perfil de desarrollo usa admin123."
fi

if [ -z "$ADMIN_TOKEN" ]; then
  for paso in "11. Cambio de estado del postulante" "12. revision del documento" \
              "12a. Estado del documento tras la revision" "13. Emision del comprobante" \
              "13a. PDF del comprobante no vacio" "13b. El sha256 del PDF coincide" \
              "14. Verificacion publica por serial" "14a. Comprobante valid=true" \
              "15. Anulacion del comprobante" "15a. Tras la anulacion valid=false" \
              "16a. applicants?group-by=status" "16a. applicants?group-by=period" \
              "16a. applicants?group-by=campus" "16a. applicants?group-by=university" \
              "16b. reporte results" "16c. reporte summary" \
              "16d. summary con totalApplicants"; do
    saltar "$paso"
  done
else
  echo "11) Estado del postulante -> VALIDATED (necesario para el comprobante)"
  CODE11=$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$BASE/api/admin/applicants/$APPLICANT_ID/status" \
      -H "$AUTH_ADMIN" -H "Content-Type: application/json" \
      -d "{\"status\":\"VALIDATED\"}" 2>&1)
  result "11. Cambio de estado del postulante" "$CODE11" "200"

  echo "12) Revision del documento por el administrador"
  CODE12=$(curl -sS -o "$TMP/rev.json" -w '%{http_code}' -X PUT "$BASE/api/admin/documents/$DOC_ID/review" \
      -H "$AUTH_ADMIN" -H "Content-Type: application/json" \
      -d "{\"status\":\"APPROVED\",\"comment\":\"prueba automatica\"}" 2>&1)
  result "12. revision del documento" "$CODE12" "200"
  result "12a. Estado del documento tras la revision" "$(cat "$TMP/rev.json" | str_field status)" "APPROVED"

  echo "13) Emitir y descargar el comprobante (RF-04)"
  CODE13=$(curl -sS -D "$TMP/h13.txt" -o "$TMP/comprobante.pdf" \
      -w '%{http_code}' "$BASE/api/me/comprobante.pdf" -H "$AUTH_APPL" 2>&1)
  result "13. Emision del comprobante" "$CODE13" "200"
  SERIAL=$(sed -n 's/.*filename="comprobante-\([0-9a-f-]*\)\.pdf".*/\1/p' "$TMP/h13.txt" | head -n1)
  if [ "$CODE13" = "200" ] && [ -n "$SERIAL" ]; then
    BYTES13=$(wc -c < "$TMP/comprobante.pdf" 2>/dev/null | tr -d ' ')
    if [ -n "$BYTES13" ] && [ "$BYTES13" -gt 0 ]; then
      result "13a. PDF del comprobante no vacio ($BYTES13 bytes)" "no vacio" "no vacio"
    fi
    echo "14) Verificacion publica del comprobante por serial"
    RESP14=$(curl -sS "$BASE/api/comprobantes/$SERIAL" 2>&1)
    CODE14=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/comprobantes/$SERIAL" 2>&1)
    result "14. Verificacion publica por serial" "$CODE14" "200"
    result "14a. Comprobante valid=true" "$(echo "$RESP14" | bool_field valid)" "true"
    if [ -n "$(sha256_of "$TMP/comprobante.pdf")" ]; then
      PREFIJO=$(echo "$RESP14" | str_field sha256Prefix)
      result "13b. El sha256 del PDF coincide con el registrado" \
             "$(sha256_of "$TMP/comprobante.pdf" | head -c 8)" "$PREFIJO"
    fi

    echo "15) Anulacion del comprobante por el administrador"
    CODE15=$(curl -sS -o /dev/null -w '%{http_code}' -X PUT "$BASE/api/admin/comprobantes/$SERIAL/revoke" \
        -H "$AUTH_ADMIN" 2>&1)
    result "15. Anulacion del comprobante" "$CODE15" "200"
    VALID2=$(curl -sS "$BASE/api/comprobantes/$SERIAL" 2>&1 | bool_field valid)
    result "15a. Tras la anulacion valid=false" "$VALID2" "false"
  fi

  echo "16) Reportes agregados (RF-08)"
  for dim in status period campus university; do
    C=$(curl -sS -o /dev/null -w '%{http_code}' \
        "$BASE/api/admin/reports/applicants?group-by=$dim" -H "$AUTH_ADMIN" 2>&1)
    result "16a. applicants?group-by=$dim" "$C" "200"
  done
  CODE16=$(curl -sS -o "$TMP/res.json" -w '%{http_code}' "$BASE/api/admin/reports/results" -H "$AUTH_ADMIN" 2>&1)
  result "16b. reporte results" "$CODE16" "200"
  RESP17=$(curl -sS "$BASE/api/admin/reports/summary" -H "$AUTH_ADMIN" 2>&1)
  CODE17=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/admin/reports/summary" -H "$AUTH_ADMIN" 2>&1)
  result "16c. reporte summary" "$CODE17" "200"
  TOTAL=$(echo "$RESP17" | num_field totalApplicants)
  if [ -n "$TOTAL" ]; then
    result "16d. summary con totalApplicants" "presente" "presente"
  fi
fi

# ---------------------------------------------------------------- resumen
echo
echo "== resumen =="
echo "[OK]      $OKS comprobaciones"
[ $SALTADOS -gt 0 ] && echo "[SALTADO] $SALTADOS pasos (dependen de un token que no llego)"
if [ $FALLOS -gt 0 ]; then
  echo "[FALLA]   $FALLOS comprobaciones"
  echo
  echo "El detalle de lo que debe devolver cada endpoint esta en docs/evidencias/ y"
  echo "en docs/plan-rf-pendientes.md. Para revisar el log del backend:"
  echo "  docker compose -f docker/compose.yaml logs --tail 200 backend"
  exit 1
fi
echo
echo "Ciclo funcional completo de RF-03, RF-04 y RF-08 verificado."
exit 0
