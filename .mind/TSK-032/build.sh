#!/bin/sh
# Envoltorio de build de ESTA sesión, generado por el runtime de MIND.
# El arquetipo asume un wrapper que este repo NO trae; el toolchain del contenedor sí
# está. Usa este script y no improvises con el wrapper ausente.
#   ./.mind/TSK-032/build.sh        → compila
#   ./.mind/TSK-032/build.sh test   → ejecuta la suite, NO interactiva (no se cuelga)
#   ./.mind/TSK-032/build.sh <otro> → npm run <otro>
# Con npm los objetivos NO se encadenan como en Maven: `run build test` le pasaría
# `test` a `ng build` en vez de ejecutar los tests. De ahí el despacho explícito.
set -e
case "${1:-build}" in
  build) exec npm --prefix /workspaces/mind-a563c5cb-959a-4ac5-a1b7-04b487a00252-TSK-032--feature-TSK-032 run build ;;
  test)  exec npm --prefix /workspaces/mind-a563c5cb-959a-4ac5-a1b7-04b487a00252-TSK-032--feature-TSK-032 run test ;;
  *)     exec npm --prefix /workspaces/mind-a563c5cb-959a-4ac5-a1b7-04b487a00252-TSK-032--feature-TSK-032 run "$@" ;;
esac
