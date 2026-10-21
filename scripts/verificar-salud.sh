#!/usr/bin/env bash
# =====================================================================
# Comprobacion de salud de la solucion APF2 (contenedores en marcha).
#
# Uso:
#   bash scripts/verificar-salud.sh [URL_BASE]
#   URL_BASE por defecto: http://localhost:8080
#
# Devuelve 0 si todas las comprobaciones pasan.
# =====================================================================
set -uo pipefail

BASE="${1:-http://localhost:8080}"
FALLOS=0

echo "== APF2 - verificacion de salud =="
echo "Base: $BASE"
echo

comprobar() {
  local nombre="$1"
  local comando="$2"
  local esperado="$3"

  local salida
  salida=$(eval "$comando" 2>&1)
  local codigo=$?

  if [ $codigo -eq 0 ]; then
    echo "[OK]   $nombre"
  else
    echo "[FALLA] $nombre (codigo $codigo)"
    echo "       $salida"
    FALLOS=$((FALLOS + 1))
  fi
}

# 1. El frontend responde y sirve la SPA.
comprobar "Frontend (SPA) accesible" \
  "curl -fsS -o /dev/null -w '%{http_code}' $BASE/ | grep -q 200" 200

# 2. El proxy inverso enruta /api hacia el backend.
comprobar "Proxy inverso /api -> backend" \
  "curl -fsS -o /dev/null -w '%{http_code}' $BASE/api/health | grep -q 200" 200

# 3. El backend declara estado UP y la base de datos accesible.
comprobar "Backend y base de datos en estado UP" \
  "curl -fsS $BASE/api/health | grep -q '\"status\":\"UP\"' && curl -fsS $BASE/api/health | grep -q '\"database\":\"UP\"'" 200

# 4. La API responde con 400 en un login invalido (no 5xx).
comprobar "Login invalido devuelve 400 y no 500" \
  "test \"\$(curl -s -o /dev/null -w '%{http_code}' -X POST $BASE/api/auth/login -H 'Content-Type: application/json' -d '{}')\" = 400" 400

# 5. La base de datos no esta expuesta en el host.
if command -v docker >/dev/null 2>&1; then
  comprobar "MySQL no publicado en el host" \
    "! docker ps --format '{{.Names}} {{.Ports}}' | grep 'apf2-db' | grep -q '0.0.0.0'" 0
fi

echo
if [ $FALLOS -eq 0 ]; then
  echo "RESULTADO: todas las comprobaciones pasaron."
  exit 0
fi

echo "RESULTADO: $FALLOS comprobacion(es) fallaron."
exit 1
