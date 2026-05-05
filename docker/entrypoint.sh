#!/bin/sh
set -eu

# 默认不导出；仅显式设置 EXPORT_NEXT_TO_HOST=1 时尝试导出，失败静默跳过
if [ "${EXPORT_NEXT_TO_HOST:-0}" = "1" ] && [ -d /opt/built-next ] && [ -d /host-output/.next ]; then
  if touch /host-output/.next/.write-test 2>/dev/null; then
    rm -f /host-output/.next/.write-test
    rm -rf /host-output/.next/* 2>/dev/null || true
    cp -r /opt/built-next/. /host-output/.next/ 2>/dev/null || true
  fi
fi

if [ "${RUN_MIGRATIONS:-0}" = "1" ]; then
  echo "[entrypoint] prisma migrate deploy …"
  prisma migrate deploy --schema=./prisma/schema.prisma
fi

exec node server.js
