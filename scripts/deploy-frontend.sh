#!/bin/sh
exec "$(cd "$(dirname "$0")/internal" && pwd)/deploy.sh" --frontend "$@"
