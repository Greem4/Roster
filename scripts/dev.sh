#!/bin/sh
exec "$(cd "$(dirname "$0")/internal" && pwd)/dev.sh" "$@"
