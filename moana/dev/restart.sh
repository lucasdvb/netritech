#!/bin/sh
# Restart the local preview server (kills by pid file, never by pattern).
cd "$(dirname "$0")/.."
[ -f dev/out/server.pid ] && kill "$(cat dev/out/server.pid)" 2>/dev/null
sleep 0.3
nohup node dev/server.mjs > dev/out/server.log 2>&1 &
echo $! > dev/out/server.pid
sleep 1.2
