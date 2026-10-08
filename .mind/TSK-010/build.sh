#!/bin/sh
# Envoltorio de build de ESTA sesión, generado por el runtime de MIND.
# El arquetipo asume un wrapper (`mvnw`/`gradlew`) que este repo NO trae; el toolchain
# del contenedor sí está. Usa este script y no improvises con el wrapper ausente.
#   ./.mind/TSK-010/build.sh                       → compila main + fuentes de test
#   ./.mind/TSK-010/build.sh test <Clase>[,<Otra>] → ejecuta SÓLO esas clases de test
#   ./.mind/TSK-010/build.sh <objetivo>            → pasa el objetivo/goal tal cual
#
# El objetivo `test` existe para que NO lances la suite del repo entero. `mvn verify` a
# pelo compila y ejecuta TODOS los módulos y TODOS sus tests, arranca el contexto completo
# y te hace dueño de los fallos de código ajeno: en TSK-005 fueron once vueltas (una de
# 6 min) y tres delegaciones gastadas arreglando otro módulo, fuera de sus zone_paths.
set -e
case "${1:-}" in
  test)
    shift
    if [ -z "$1" ]; then
      echo "uso: build.sh test <ClaseTest>[,<OtraClase>] — acota el run a TUS tests" >&2
      exit 2
    fi
    exec mvn -B -ntp -f /workspaces/mind-9939df9e-7a34-42af-b2cd-3286f4567f39-TSK-010--feature-TSK-010/sources/pom.xml verify -Dtest="$1" -Dit.test="$1" -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false -Dit.failIfNoSpecifiedTests=false ;;
  *)
    exec mvn -B -ntp -f /workspaces/mind-9939df9e-7a34-42af-b2cd-3286f4567f39-TSK-010--feature-TSK-010/sources/pom.xml test-compile "$@" ;;
esac
