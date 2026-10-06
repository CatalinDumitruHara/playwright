#!/bin/sh
# Envoltorio de build de ESTA sesiÃ³n, generado por el runtime de MIND.
# El arquetipo asume un wrapper que este repo NO trae; el toolchain del contenedor sÃ­
# estÃ¡. Usa este script y no improvises con el wrapper ausente.
#   ./.mind/TSK-036/build.sh        â†’ compila
#   ./.mind/TSK-036/build.sh test   â†’ ejecuta la suite, NO interactiva (no se cuelga)
#   ./.mind/TSK-036/build.sh <otro> â†’ npm run <otro>
# Con npm los objetivos NO se encadenan como en Maven: `run build test` le pasarÃ­a
# `test` a `ng build` en vez de ejecutar los tests. De ahÃ­ el despacho explÃ­cito.
set -e
case "${1:-build}" in
  build) exec npm --prefix /workspaces/mind-a563c5cb-959a-4ac5-a1b7-04b487a00252-TSK-036--feature-TSK-036 run build ;;
  test)  exec npm --prefix /workspaces/mind-a563c5cb-959a-4ac5-a1b7-04b487a00252-TSK-036--feature-TSK-036 run test ;;
  *)     exec npm --prefix /workspaces/mind-a563c5cb-959a-4ac5-a1b7-04b487a00252-TSK-036--feature-TSK-036 run "$@" ;;
esac
