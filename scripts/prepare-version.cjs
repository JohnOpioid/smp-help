const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

function run(cmd) {
  try { return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() } catch { return '' }
}

function main() {
  const root = path.resolve(__dirname, '..')
  const pkgPath = path.join(root, 'package.json')
  const outPath = path.join(root, '.app-version')

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  const semver = pkg.version || '0.0.0'
  const commit = run('git rev-parse --short HEAD')
  const dirty = run('git diff --quiet || echo -n "-dirty"')
  const ts = new Date().toISOString().replace(/[:.]/g, '-')

  const composed = [semver, commit && `(${commit})`, dirty, ts].filter(Boolean).join(' ')
  fs.writeFileSync(outPath, composed, 'utf8')
  console.log('Prepared app version:', composed)
}

main()


