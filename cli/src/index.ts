#!/usr/bin/env node
/**
 * RustPress CLI
 * Usage: rustpress <command> [options]
 */
import { Command } from 'commander'
import chalk from 'chalk'

const program = new Command()

program
  .name('rustpress')
  .description('CLI para gestionar tu instancia de RustPress CMS')
  .version('1.0.0')

// ==================== rustpress status ====================
program
  .command('status')
  .description('Ver el estado del servidor RustPress')
  .option('-u, --url <url>', 'URL del servidor', 'http://localhost:8080')
  .action(async (opts) => {
    const ora = (await import('ora')).default
    const fetch = (await import('node-fetch')).default
    const spin = ora('Conectando...').start()
    try {
      const res = await fetch(`${opts.url}/api/v1/health/detailed`)
      const data: any = await res.json()
      spin.succeed(chalk.green('Servidor online'))
      console.log(chalk.cyan('\n📊 Estado del sistema:'))
      console.log(`  ${chalk.bold('Versión:')}  ${data.version ?? 'N/A'}`)
      console.log(`  ${chalk.bold('DB:')}       ${data.database === 'ok' ? chalk.green('✓ OK') : chalk.red('✗ Error')}`)
      console.log(`  ${chalk.bold('Redis:')}    ${data.redis === 'ok' ? chalk.green('✓ OK') : chalk.red('✗ Error')}`)
    } catch {
      spin.fail(chalk.red(`No se puede conectar a ${opts.url}`))
    }
  })

// ==================== rustpress login ====================
program
  .command('login')
  .description('Autenticarse en RustPress')
  .option('-u, --url <url>', 'URL del servidor', 'http://localhost:8080')
  .option('-e, --email <email>', 'Email del usuario')
  .option('-p, --password <password>', 'Contraseña')
  .action(async (opts) => {
    const fetch = (await import('node-fetch')).default
    const ora   = (await import('ora')).default
    const fs    = await import('fs')
    const os    = await import('os')
    const path  = await import('path')

    let { email, password } = opts
    if (!email || !password) {
      const { default: inquirer } = await import('inquirer')
      const answers = await inquirer.prompt([
        { type: 'input',    name: 'email',    message: 'Email:',      when: !email },
        { type: 'password', name: 'password', message: 'Contraseña:', when: !password },
      ])
      email    = email    ?? answers.email
      password = password ?? answers.password
    }

    const spin = ora('Iniciando sesión...').start()
    try {
      const res  = await fetch(`${opts.url}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data: any = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Login fallido')

      // Guardar config
      const cfgDir  = path.join(os.homedir(), '.rustpress')
      const cfgFile = path.join(cfgDir, 'config.json')
      if (!fs.existsSync(cfgDir)) fs.mkdirSync(cfgDir)
      fs.writeFileSync(cfgFile, JSON.stringify({ url: opts.url, token: data.token, user: data.user }, null, 2))

      spin.succeed(chalk.green(`Sesión iniciada como ${chalk.bold(data.user.username)}`))
      console.log(chalk.gray(`  Config guardada en ${cfgFile}`))
    } catch (e: any) {
      spin.fail(chalk.red(e.message))
    }
  })

// ==================== rustpress posts ====================
const posts = program.command('posts').description('Gestionar posts')

posts
  .command('list')
  .description('Listar posts')
  .option('-l, --limit <n>', 'Límite', '10')
  .action(async (opts) => {
    const { url, token } = loadConfig()
    const fetch = (await import('node-fetch')).default
    const res   = await fetch(`${url}/api/v1/posts?limit=${opts.limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    const data: any = await res.json()
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    console.log(chalk.cyan(`\n📝 Posts (${list.length}):`))
    list.forEach((p: any) => {
      const status = p.status === 'published' ? chalk.green('●') : chalk.yellow('○')
      console.log(`  ${status} ${chalk.bold(p.title)} ${chalk.gray(`[${p.slug}]`)}`)
    })
  })

// ==================== rustpress backup ====================
program
  .command('backup')
  .description('Crear backup de la base de datos')
  .action(async () => {
    const { url, token } = loadConfig()
    const fetch = (await import('node-fetch')).default
    const ora   = (await import('ora')).default
    const spin  = ora('Creando backup...').start()
    try {
      const res  = await fetch(`${url}/api/v1/backup/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: any = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      spin.succeed(chalk.green(`Backup creado: ${chalk.bold(data.filename ?? 'OK')}`))
    } catch (e: any) {
      spin.fail(chalk.red(e.message))
    }
  })

// ==================== rustpress deploy ====================
program
  .command('deploy')
  .description('Actualizar RustPress desde git')
  .action(async () => {
    const { url, token } = loadConfig()
    const fetch = (await import('node-fetch')).default
    const ora   = (await import('ora')).default
    const spin  = ora('Desplegando actualización...').start()
    try {
      const res  = await fetch(`${url}/api/v1/updates/apply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data: any = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      spin.succeed(chalk.green('Deploy completado'))
      if (data.output) console.log(chalk.gray(data.output.slice(0, 500)))
    } catch (e: any) {
      spin.fail(chalk.red(e.message))
    }
  })

// ==================== rustpress stats ====================
program
  .command('stats')
  .description('Ver estadísticas del sitio')
  .action(async () => {
    const { url, token } = loadConfig()
    const fetch = (await import('node-fetch')).default
    try {
      const res  = await fetch(`${url}/api/v1/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d: any = await res.json()
      const s = d?.data ?? d
      console.log(chalk.cyan('\n📈 Estadísticas:'))
      console.log(`  ${chalk.bold('Ingresos:')}   $${(s?.revenue ?? 0).toFixed(2)}`)
      console.log(`  ${chalk.bold('Pedidos:')}    ${s?.orders ?? 0}`)
      console.log(`  ${chalk.bold('Posts:')}      ${s?.posts ?? 0}`)
      console.log(`  ${chalk.bold('Usuarios:')}   ${s?.users ?? 0}`)
      console.log(`  ${chalk.bold('Productos:')}  ${s?.products ?? 0}`)
    } catch (e: any) {
      console.error(chalk.red('Error: ' + e.message))
    }
  })

// ==================== rustpress whoami ====================
program
  .command('whoami')
  .description('Ver usuario actual')
  .action(() => {
    const cfg = loadConfig(false)
    if (!cfg.token) {
      console.log(chalk.yellow('No has iniciado sesión. Usa: rustpress login'))
      return
    }
    console.log(chalk.cyan(`\n👤 ${chalk.bold(cfg.user?.username ?? 'usuario')} (${cfg.user?.email ?? ''})`)  )
    console.log(chalk.gray(`   Servidor: ${cfg.url}`))
  })

// ==================== rustpress logout ====================
program
  .command('logout')
  .description('Cerrar sesión')
  .action(async () => {
    const fs   = await import('fs')
    const os   = await import('os')
    const path = await import('path')
    const cfg  = path.join(os.homedir(), '.rustpress', 'config.json')
    if (fs.existsSync(cfg)) {
      fs.unlinkSync(cfg)
      console.log(chalk.green('Sesión cerrada'))
    } else {
      console.log(chalk.yellow('No había sesión activa'))
    }
  })

// ==================== helpers ====================
function loadConfig(required = true): { url: string; token: string; user: any } {
  const fs   = require('fs')
  const os   = require('os')
  const path = require('path')
  const cfg  = path.join(os.homedir(), '.rustpress', 'config.json')
  if (!fs.existsSync(cfg)) {
    if (required) {
      console.error(chalk.red('No has iniciado sesión. Usa: rustpress login'))
      process.exit(1)
    }
    return { url: 'http://localhost:8080', token: '', user: null }
  }
  return JSON.parse(fs.readFileSync(cfg, 'utf-8'))
}

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}
