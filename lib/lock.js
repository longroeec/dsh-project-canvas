/**
 * Cross-machine lock for a canvas database stored in a synced folder (OneDrive, 坚果云, a network
 * share). SQLite allows one writer at a time and a cloud client may upload a half-written file, so:
 *
 *  - a `<db>.lock` file next to the database records the host, pid, and a heartbeat time;
 *  - a fresh lock from another machine turns the store read-only instead of letting two writers race;
 *  - a lock older than `staleMs` is taken over, so a crashed session does not block the other machine.
 *
 * The lock lives beside the database on purpose: that is the only place both machines can see it.
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { hostname } from 'node:os'

/** A lock older than this has no live owner. */
export const LOCK_STALE_MS = 10 * 60 * 1000
/** Heartbeat interval; keeps OneDrive's upload churn modest. */
const HEARTBEAT_MS = 3 * 60 * 1000

export class CanvasLock {
  /**
   * @param {string} dbPath database file the lock belongs to
   * @param {{ host?: string, pid?: number, staleMs?: number }} [options]
   */
  constructor(dbPath, options = {}) {
    this.path = `${dbPath}.lock`
    this.host = options.host ?? hostname()
    this.pid = options.pid ?? process.pid
    this.staleMs = options.staleMs ?? LOCK_STALE_MS
    this.owned = false
    this.timer = undefined
  }

  /** Current lock record, or undefined when absent or unreadable. */
  read() {
    try {
      if (!existsSync(this.path)) return undefined
      const value = JSON.parse(readFileSync(this.path, 'utf8'))
      if (typeof value !== 'object' || value === null) return undefined
      return {
        host: typeof value.host === 'string' ? value.host : 'unknown',
        pid: typeof value.pid === 'number' ? value.pid : 0,
        at: typeof value.at === 'number' ? value.at : 0,
      }
    } catch {
      return undefined
    }
  }

  /** True when another live session owns the lock. */
  holder() {
    const current = this.read()
    if (current === undefined) return undefined
    const fresh = Date.now() - current.at < this.staleMs
    const mine = current.host === this.host && current.pid === this.pid
    return fresh && !mine ? current : undefined
  }

  /**
   * Acquire the lock for this session.
   * @returns {{ ok: boolean, owner?: { host: string, pid: number, at: number }, tookOver?: boolean }}
   */
  acquire() {
    const owner = this.holder()
    if (owner !== undefined) return { ok: false, owner }
    const previous = this.read()
    this.write()
    this.owned = true
    this.timer = setInterval(() => this.write(), HEARTBEAT_MS)
    if (typeof this.timer.unref === 'function') this.timer.unref()
    return { ok: true, tookOver: previous !== undefined && previous.host !== this.host }
  }

  write() {
    try {
      writeFileSync(this.path, JSON.stringify({
        host: this.host, pid: this.pid, at: Date.now(),
      }, null, 0), 'utf8')
    } catch {
      // An unwritable folder already fails the database write itself; the lock stays best effort.
    }
  }

  /** Release the lock when this session owned it. */
  release() {
    if (this.timer !== undefined) {
      clearInterval(this.timer)
      this.timer = undefined
    }
    if (!this.owned) return
    this.owned = false
    try { rmSync(this.path, { force: true }) } catch { /* already gone */ }
  }
}
