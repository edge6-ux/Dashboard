// ═══════════════════════════════════════════════
//  Constants & Static Data
// ═══════════════════════════════════════════════

export const AGENTS = {
  christopher: { name: 'Christopher', initial: 'C', model: 'Claude Opus 4', color: '#b9a9ff', role: 'Primary AI Companion' },
  gordon: { name: 'Gordon', initial: 'G', model: 'GPT-5 Mini', color: '#06b6d4', role: 'Quick-Draw Sidekick' }
}

export const CRON_JOBS = [
  {
    id: '109478ad-16af-4243-94de-982fe73a6e08',
    name: 'Daily Briefing',
    agent: 'gordon',
    cron: '30 8 * * 1-5',
    tz: 'America/New_York',
    message: 'Search the web for the latest news in: (1) Regenerative agriculture (2) MAHA (3) Rural area and small business policy. Only include stories from the last 24 hours.',
    delivery: 'announce',
    status: 'active',
    lastError: null,
    lastRun: 1774140389620,
    nextRun: 1774269000000,
    color: '#06b6d4',
    enabled: true
  },
  {
    id: 'de5ffb87-dc68-4329-868b-1a7244205516',
    name: 'Daily Briefing (Discord)',
    agent: 'gordon',
    cron: '30 8 * * 1-5',
    tz: 'America/New_York',
    message: 'Post the Daily Briefing with news on regenerative agriculture, MAHA, and rural/small business policy to Discord.',
    delivery: 'announce',
    status: 'active',
    lastError: null,
    lastRun: 1774140389620,
    nextRun: 1774269000000,
    color: '#06b6d4',
    enabled: true
  }
]

export const GATEWAY_URL = 'http://127.0.0.1:18789'

export const HUES = ['purple', 'red', 'blue', 'orange', 'pink', 'green', 'white', 'yellow']

export const BUILTIN_OUTPUT_ARTIFACTS = {
  tasks: [
    {
      matchNames: [
        'Armed Forces Wellness Center Overview 2',
        'Armed Forces Wellness Centers 2',
        'Armed Forces Wellness Centers Overview 2'
      ],
      files: ['Armed_Forces_Wellness_Centers_Overview.html']
    }
  ]
}
