// Mini SQL-like query language for the search page.
//
// Supported syntax (translated into Serveronet Site API query_parameters):
//
//   [SELECT *] [FROM articles] WHERE <clause> {(AND|OR) <clause>}* [ORDER BY col [ASC|DESC]] [LIMIT n]
//
// clause := <column> <op> <value>
// op     := = | != | <> | > | < | >= | <= | LIKE | NOT LIKE | IN
// value  := 'quoted string' | "quoted string" | number | bareword
//           (barewords may contain spaces until the next keyword)
//
// AND-joined clauses map to `where` entries, OR-joined clauses map to the
// `orWhere` group (the backend evaluates them as where... AND (orWhere OR orWhere ...)).
// For LIKE values, % wildcards are preserved; without them the value is
// wrapped as %value% so `title like camera` matches substring occurrences.

const COLUMNS = new Set([
  'slug',
  'title',
  'short_description',
  'description',
  'author',
  'published_at',
  'published_date',
  'download_size',
  'is_external',
  'edited_rank',
  'sources',
  'links',
  'categories',
  'countries',
])

const WORD_OPS = ['not like', 'like', 'in']
const SYMBOL_OPS = ['!=', '<>', '>=', '<=', '=', '>', '<']

export function looksLikeSql(raw) {
  const q = (raw || '').trim()
  if (!q) return false
  const lower = q.toLowerCase()
  if (/^(select\b|from\b|where\b)/.test(lower)) return true
  if (/\border\s+by\b/.test(lower) || /\blimit\s+\d+/.test(lower)) return true
  if (/(!=|<>|>=|<=|=|<|>)/.test(q)) return true
  if (/\blike\s+['"\w(]/.test(lower)) return true
  if (/\bin\s*\(/.test(lower)) return true
  return false
}

class SqlParseError extends Error {}

// Leftmost operator scan. Word operators (like/in) require word boundaries,
// symbol operators require symbol boundaries, so `title like 'x'`,
// `author=Bonaventure` and `download_size>=1000` all work.
function findOperator(text) {
  const lower = text.toLowerCase()
  for (let i = 0; i < lower.length; i++) {
    for (const op of WORD_OPS) {
      if (lower.startsWith(op, i)) {
        const before = i === 0 ? ' ' : lower[i - 1]
        const after = lower[i + op.length] ?? ' '
        if (/[\s,]/.test(before) && (op === 'in' ? /[ (\[]/.test(after) : /[\s(]/.test(after))) {
          return { op, idx: i, len: op.length }
        }
      }
    }
    for (const op of SYMBOL_OPS) {
      if (lower.startsWith(op, i)) {
        const before = i === 0 ? '' : lower[i - 1]
        const after = lower[i + op.length] ?? ''
        if (!/[=!<>]/.test(before) && !/[=!<>]/.test(after)) {
          return { op, idx: i, len: op.length }
        }
      }
    }
  }
  return null
}

function readValue(raw) {
  const t = raw.trim()
  const m = t.match(/^(['"])((?:\\.|(?!\1)[^\\])*)\1\s*(.*)$/)
  if (m) {
    return { value: m[2].replace(/\\(['"])/g, '$1'), rest: m[3] }
  }
  if (/^\d+$/.test(t)) return { value: t, rest: '' }
  return { value: t, rest: '' }
}

function parseClause(text) {
  const opMatch = findOperator(text, 0)
  if (!opMatch) throw new SqlParseError('Cannot parse clause: "' + text.trim() + '"')
  const colRaw = text.slice(0, opMatch.idx).trim()
  const opRaw = opMatch.op
  let rest = text.slice(opMatch.idx + opMatch.len).trim()

  const col = colRaw.toLowerCase()
  if (!COLUMNS.has(col)) {
    throw new SqlParseError(
      'Unknown column "' + colRaw + '". Columns: ' + [...COLUMNS].join(', ')
    )
  }

  let sqlOp = '='
  let value = null
  if (opRaw === 'like' || opRaw === 'not like') {
    const parsed = readValue(rest)
    value = parsed.value
    if (!/[%_]/.test(value)) value = '%' + value + '%'
    sqlOp = opRaw === 'like' ? 'like' : 'not like'
  } else if (opRaw === 'in') {
    const close = rest.lastIndexOf(')')
    if (!rest.startsWith('(') || close === -1) {
      throw new SqlParseError('Malformed IN(...) list: "' + rest + '"')
    }
    const inner = rest.slice(1, close)
    const items = inner
      .split(',')
      .map((s) => readValue(s).value.trim())
      .filter((s) => s !== '')
    return { type: 'in', column: col, values: items }
  } else {
    const parsed = readValue(rest)
    value = parsed.value
    sqlOp = opRaw === '<>' ? '!=' : opRaw
  }
  return { type: 'cmp', column: col, op: sqlOp, value }
}

function splitTopLevel(text) {
  // split preserving the AND / OR keyword that follows each clause
  const parts = []
  let current = ''
  let pendingJoin = 'and'
  const lower = text.toLowerCase()
  let i = 0
  let quote = null
  while (i < text.length) {
    const ch = text[i]
    if (quote) {
      current += ch
      if (ch === '\\' && i + 1 < text.length) {
        current += text[i + 1]
        i += 2
        continue
      }
      if (ch === quote) quote = null
      i++
      continue
    }
    if (ch === "'" || ch === '"') {
      quote = ch
      current += ch
      i++
      continue
    }
    const seg = lower.slice(i)
    if (/^[ ,]*and[ ,]+/.test(seg) && current.trim() !== '') {
      const m = seg.match(/^[ ,]*and[ ,]+/)
      parts.push({ join: pendingJoin, text: current })
      pendingJoin = 'and'
      current = ''
      i += m[0].length
      continue
    }
    if (/^[ ,]*or[ ,]+/.test(seg) && current.trim() !== '') {
      const m = seg.match(/^[ ,]*or[ ,]+/)
      parts.push({ join: pendingJoin, text: current })
      pendingJoin = 'or'
      current = ''
      i += m[0].length
      continue
    }
    current += ch
    i++
  }
  parts.push({ join: pendingJoin, text: current })
  return parts
}

export function parseSqlQuery(raw) {
  let text = raw.trim()
  const out = { where: [], orWhere: [], whereIn: null, orderBy: null, limit: null, notes: [] }

  // strip trailing ORDER BY / LIMIT
  const orderMatch = text.match(/\border by\s+([a-z_]+)(\s+(asc|desc))?\s*$/i)
  if (orderMatch) {
    const col = orderMatch[1].toLowerCase()
    if (!COLUMNS.has(col)) throw new SqlParseError('Unknown ORDER BY column "' + orderMatch[1] + '"')
    out.orderBy = [col, (orderMatch[3] || 'asc').toLowerCase()]
    text = text.slice(0, orderMatch.index).trim()
  }
  const limitMatch = text.match(/\blimit\s+(\d+)\s*$/i)
  if (limitMatch) {
    out.limit = parseInt(limitMatch[1], 10)
    text = text.slice(0, limitMatch.index).trim()
  }

  // strip SELECT ... FROM articles / FROM articles / WHERE prefix
  text = text.replace(/^(select\b[^]*?\bfrom\s+articles\s+|from\s+articles\s+)/i, '')
  text = text.replace(/^where\s+/i, '')

  if (!text.trim()) throw new SqlParseError('No WHERE clauses found')

  const parts = splitTopLevel(text)
  for (const part of parts) {
    if (!part.text.trim()) continue
    const clause = parseClause(part.text)
    const triple =
      clause.type === 'in'
        ? { in: true, column: clause.column, values: clause.values }
        : [clause.column, clause.op, String(clause.value)]
    if (part.join === 'or') out.orWhere.push(triple)
    else out.where.push(triple)
  }
  return out
}

// Translate parsed query to Site API query_parameters for `articles`.
export function toQueryParameters(parsed) {
  const qp = { table: 'articles' }
  const where = []
  const orWhere = []
  for (const t of parsed.where) {
    if (t.in) {
      qp.whereIn = [t.column, t.values]
    } else {
      where.push(t)
    }
  }
  for (const t of parsed.orWhere) {
    if (t.in) {
      where.push(t)
    } else {
      orWhere.push(t)
    }
  }
  if (where.length) qp.where = where
  if (orWhere.length) qp.orWhere = orWhere
  if (parsed.orderBy) qp.orderBy = parsed.orderBy
  else qp.orderBy = ['published_at', 'desc']
  if (parsed.limit) qp.limit = parsed.limit
  return qp
}
