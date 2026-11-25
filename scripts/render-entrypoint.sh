#!/bin/sh
set -eu
umask 077
if [ "${DATABASE_BACKEND:-sqlite}" = postgres ]; then
  exec runuser -u node -- "$@"
fi
render_data_dir="$(node -e 'process.stdout.write(require("node:path").resolve(process.env.APP_DATA_DIR || "/app/data/runtime"))')"
case "$render_data_dir" in
  /app/data|/app/data/*) ;;
  *) echo 'APP_DATA_DIR must remain inside /app/data for the Render image' >&2; exit 1 ;;
esac
# Render attaches the disk at runtime, after the image's ownership was set.
mkdir -p "$render_data_dir"
chown -R node:node /app/data
exec runuser -u node -- "$@"
