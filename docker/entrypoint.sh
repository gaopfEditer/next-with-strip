#!/bin/sh
set -eu

if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
  echo "[entrypoint] prisma migrate deploy …"
  prisma migrate deploy --schema=./prisma/schema.prisma
fi

exec node server.js
