import bcrypt from 'bcryptjs';
import { DB_PATH } from './config.js';
import { localDate } from './dates.js';
import { openDb } from './db.js';
import { DROP_ALL, SCHEMA } from './schema.js';
import type { CasePriority, CaseStatus } from './types.js';

const PASSWORD = 'password123';

const USERS = [
  { name: 'Alice Nguyen', email: 'alice@example.com' },
  { name: 'Ben Okafor', email: 'ben@example.com' },
];

const CLIENTS = [
  { name: 'Northwind Traders', email: 'support@northwind.example' },
  { name: 'Bluebird Dental', email: 'office@bluebirddental.example' },
  { name: 'Harbor & Pine Legal', email: 'admin@harborpine.example' },
  { name: 'Cedar Ridge Property Management', email: 'help@cedarridge.example' },
  { name: 'Lumen Analytics', email: 'ops@lumenanalytics.example' },
  { name: 'Ortega Family Bakery', email: 'hello@ortegabakery.example' },
  { name: 'Summit Physical Therapy', email: 'frontdesk@summitpt.example' },
  { name: 'Greyline Logistics', email: 'dispatch@greyline.example' },
];

const TITLES = [
  'Invoice #4471 charged twice',
  'Cannot log in to customer portal',
  'Request to update billing address',
  'Payroll export missing overtime hours',
  'Website contact form not sending email',
  'Lease renewal paperwork review',
  'Refund request for cancelled order',
  'Quarterly tax filing documents',
  'New employee onboarding accounts',
  'Printer in reception offline',
  'Dispute over late delivery fee',
  'Data export for annual audit',
  'Change of registered business address',
  'Appointment reminders sent at wrong time',
  'Insurance claim documentation incomplete',
  'Shipping labels printing blank',
  'Contract amendment for extended hours',
  'VPN connection drops every hour',
  'Duplicate customer records after import',
  'Request for itemised statement',
  'Broken link in monthly newsletter',
  'Tenant complaint about heating',
  'Card terminal declining contactless payments',
  'Update emergency contact list',
  'Backup job failing overnight',
  'Missing pallet on warehouse delivery',
  'Review of new privacy policy',
  'Password reset email not received',
  'Overdue invoice follow-up',
  'Request to close account',
  'Calendar sync showing double bookings',
  'Supplier price increase dispute',
  'Annual software licence renewal',
  'Patient records request',
  'Fuel surcharge calculation incorrect',
  'Mobile app crashes on checkout',
  'Signage order for new location',
  'Expense report rejected without reason',
  'Email bouncing from shared inbox',
  'Lease deposit return',
  'Dashboard numbers do not match export',
  'Allergen labels need updating',
  'Treatment notes template changes',
  'Route planning tool showing old addresses',
  'Notice of intent to terminate contract',
  'Bulk order discount not applied',
  'Slow loading on reports page',
  'Security deposit dispute',
  'Wholesale account application',
  'Two-factor codes arriving late',
  "Correction to last month's invoice",
  'Request for certificate of insurance',
  'Website opening hours out of date',
  'Damaged goods claim',
  'Add new user to billing portal',
  'Maintenance request for unit 4B',
  'Data retention policy question',
  'Schedule change for holiday period',
  'Missing receipt for March payment',
  'Review of service level agreement',
];

const NOTE_BODIES = [
  'Called the client and left a voicemail.',
  'Client confirmed the details by email.',
  'Escalated to the billing team for review.',
  'Waiting on a copy of the original document.',
  'Reproduced the issue on our side.',
  'Sent the client a summary of next steps.',
  'Client asked for an update by end of week.',
  'Attached screenshots from the client to the shared drive.',
  'Spoke with the account manager; no objections.',
  'Applied the fix and asked the client to confirm.',
  'Client says the problem started after the last update.',
  'Checked the logs; nothing unusual before the reported time.',
  'Scheduled a call for next Tuesday.',
  'Client confirmed everything is working now.',
  'Refund approved and processed.',
  'Need sign-off from the client before proceeding.',
];

const STATUS_COUNTS: Record<CaseStatus, number> = {
  new: 12,
  in_review: 14,
  waiting_on_client: 10,
  resolved: 13,
  closed: 11,
};

const CLOSED_STATUSES: readonly CaseStatus[] = ['resolved', 'closed'];
const DAY_MS = 24 * 60 * 60 * 1000;

// mulberry32: a fixed seed makes every run produce the same data, so documented examples stay accurate.
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261015);
const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)] as T;

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j] as T, items[i] as T];
  }
  return items;
}

function randomPriority(): CasePriority {
  const roll = random();
  if (roll < 0.25) return 'low';
  if (roll < 0.75) return 'normal';
  return 'high';
}

const now = Date.now();
const today = localDate(new Date(now));
const iso = (ms: number) => new Date(ms).toISOString();

const db = openDb();
const passwordHash = bcrypt.hashSync(PASSWORD, 10);

const insertUser = db.prepare(
  'INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)',
);
const insertClient = db.prepare('INSERT INTO clients (name, email, created_at) VALUES (?, ?, ?)');
const insertCase = db.prepare(
  `INSERT INTO cases (title, client_id, assignee_id, status, priority, due_date, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);
const insertNote = db.prepare(
  'INSERT INTO notes (case_id, author_id, body, created_at) VALUES (?, ?, ?, ?)',
);

const statuses = shuffle(
  Object.entries(STATUS_COUNTS).flatMap(([status, count]) =>
    Array<CaseStatus>(count).fill(status as CaseStatus),
  ),
);
// Oldest first, so ids increase with created_at like real data.
const createdDaysAgo = statuses.map(() => int(1, 90)).sort((a, b) => b - a);

let overdue = 0;
let withoutNotes = 0;
let withoutDueDate = 0;
let unassigned = 0;

db.transaction(() => {
  db.exec(DROP_ALL);
  db.exec(SCHEMA);

  const seededAt = iso(now - 120 * DAY_MS);
  const userIds = USERS.map(
    (u) => insertUser.run(u.email, u.name, passwordHash, seededAt).lastInsertRowid as number,
  );
  const clientIds = CLIENTS.map(
    (c) => insertClient.run(c.name, c.email, seededAt).lastInsertRowid as number,
  );

  statuses.forEach((status, i) => {
    const isClosed = CLOSED_STATUSES.includes(status);
    const createdAt = now - (createdDaysAgo[i] as number) * DAY_MS - int(0, 8 * 60) * 60 * 1000;
    const updatedAt = createdAt + random() * (now - createdAt);

    let dueDate: string | null = null;
    if (random() >= 0.15) {
      const offset = isClosed ? int(-45, 5) : int(-14, 21);
      const dueMs = Math.max(now + offset * DAY_MS, createdAt);
      dueDate = localDate(new Date(dueMs));
    }

    const assigneeId = random() < 0.2 ? null : pick(userIds);

    const caseId = insertCase.run(
      TITLES[i],
      pick(clientIds),
      assigneeId,
      status,
      randomPriority(),
      dueDate,
      iso(createdAt),
      iso(updatedAt),
    ).lastInsertRowid as number;

    const noteCount = random() < 0.25 ? 0 : int(1, 4);
    const noteTimes = Array.from({ length: noteCount }, () => createdAt + random() * (now - createdAt)).sort(
      (a, b) => a - b,
    );
    for (const at of noteTimes) {
      insertNote.run(caseId, pick(userIds), pick(NOTE_BODIES), iso(at));
    }

    if (dueDate === null) withoutDueDate++;
    else if (dueDate < today && !isClosed) overdue++;
    if (noteCount === 0) withoutNotes++;
    if (assigneeId === null) unassigned++;
  });
})();

db.close();

const statusSummary = Object.entries(STATUS_COUNTS)
  .map(([status, count]) => `${status} ${count}`)
  .join(', ');

console.log(`Seeded ${DB_PATH}

Users (password for both: ${PASSWORD})
${USERS.map((u) => `  ${u.email}  ${u.name}`).join('\n')}

Clients: ${CLIENTS.length}
Cases:   ${statuses.length} (${statusSummary})
  overdue ${overdue}, no due date ${withoutDueDate}, no notes ${withoutNotes}, unassigned ${unassigned}`);
