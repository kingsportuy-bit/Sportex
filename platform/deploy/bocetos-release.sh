#!/bin/sh
set -eu
mode=${1:?build or activate}
release=${2:?full commit}
case "$release" in *[!0-9a-f]*|'') exit 2;; esac
test "${#release}" -eq 40
base=/opt/sportex-bocetos
source="$base/releases/$release/source/platform"
test -f "$source/deploy/Dockerfile.bocetos"
image="sportex-bocetos:$release"
if [ "$mode" = build ]; then
  docker build --pull=false --build-arg "SPORTEX_RELEASE=$release" -f "$source/deploy/Dockerfile.bocetos" -t "$image" "$source"
  docker image inspect "$image" --format '{{.Id}}'
elif [ "$mode" = activate ]; then
  test -f "$base/data/lab.sqlite"
  docker secret inspect sportex_bocetos_openai_primary_20261020 >/dev/null
  export SPORTEX_BOCETOS_IMAGE="$image"
  docker stack deploy --compose-file "$source/deploy/docker-stack.bocetos.yml" --resolve-image never sportex_bocetos
else
  exit 2
fi
