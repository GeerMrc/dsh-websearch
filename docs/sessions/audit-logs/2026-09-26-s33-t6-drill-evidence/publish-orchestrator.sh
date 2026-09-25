#!/bin/bash
# S33 T7 multi-end publish orchestrator (network-gated, idempotent)
LOG=/tmp/dshws-s33/publish-orchestrator.log
cd /Volumes/IPFSJK/Zcode/dsh-websearch
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:$PATH"
for i in $(seq 1 120); do
  NOW=$(date +%H:%M:%S)
  # 1) GitHub push via SSH when reachable
  if [ ! -f /tmp/dshws-s33/pushed ]; then
    if timeout 20 git ls-remote git@github.com:GeerMrc/dsh-websearch.git HEAD >/dev/null 2>&1; then
      if timeout 60 git push git@github.com:GeerMrc/dsh-websearch.git master v0.1.3 >> $LOG 2>&1; then
        echo "[$NOW] GITHUB PUSH OK (attempt $i)" >> $LOG; touch /tmp/dshws-s33/pushed
      else
        echo "[$NOW] push attempt $i failed" >> $LOG
      fi
    else
      echo "[$NOW] github ssh unreachable (attempt $i)" >> $LOG
    fi
  fi
  # 2) npm publish when registry.npmjs.org reachable
  if [ ! -f /tmp/dshws-s33/published ] && curl -m 8 -s -o /dev/null https://registry.npmjs.org 2>/dev/null; then
    if npm publish ./dist-artifacts/maricgeer-dsh-websearch-0.1.3.tgz --access=public --registry=https://registry.npmjs.org >> $LOG 2>&1; then
      echo "[$NOW] NPM PUBLISH OK (attempt $i)" >> $LOG; touch /tmp/dshws-s33/published
    else
      echo "[$NOW] npm publish attempt $i failed" >> $LOG
    fi
  fi
  if [ -f /tmp/dshws-s33/pushed ] && [ -f /tmp/dshws-s33/published ]; then echo "[$NOW] ALL DONE" >> $LOG; exit 0; fi
  sleep 60
done
echo "ORCHESTRATOR EXHAUSTED" >> $LOG
