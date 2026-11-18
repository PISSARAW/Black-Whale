import { spawn } from 'node:child_process'

// Loopback on both ends; the SSH connection travels over the authenticated tailnet.
const tunnel = spawn(
  'tailscale',
  [
    'ssh',
    'root@vps-e177d34a',
    '-N',
    '-L',
    '127.0.0.1:11439:127.0.0.1:11434',
    '-o',
    'ExitOnForwardFailure=yes',
  ],
  { stdio: 'inherit' },
)
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => tunnel.kill(signal))
tunnel.on('error', (error) => {
  console.error(error.message)
  process.exitCode = 1
})
tunnel.on('exit', (code) => {
  process.exitCode = code ?? 1
})
