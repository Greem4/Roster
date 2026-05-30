#!/bin/sh
exec "$(cd "$(dirname "$0")/internal" && pwd)/deploy-frontend.sh" "$@"
