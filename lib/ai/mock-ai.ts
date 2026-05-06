/**
 * mock-ai.ts
 *
 * Simulated AI responses using live app data and templates.
 * Every exported function matches the signature a real AI provider would use —
 * swap implementations here to connect Claude API or OpenAI without changing callers.
 *
 * Swap path:
 *   1. Replace function bodies with `await anthropic.messages.create(...)` calls.
 *   2. Move prompt construction to a prompts/ subfolder.
 *   3. Add streaming support via ReadableStream if desired.
 */

import { AppState, Task, Person, PrayerRequest, Sermon } from '@/lib/types';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { USERS } from '@/lib/storage';

// Simulated network delay — feels real, easy to remove when using actual API
function delay(ms = 900): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

// ─── 1. Weekly Ministry Brief ─────────────────────────────────────────────────

export interface WeeklyBriefInput {
  state: AppState;
  currentUserId: string;
}

export interface WeeklyBriefOutput {
  text: string;
}

export async function generateWeeklyBrief(
  input: WeeklyBriefInput
): Promise<WeeklyBriefOutput> {
  await delay(1100);

  const { state, currentUserId } = input;
  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  // Gather live data
  const openTasks = state.tasks.filter(t => t.status !== 'Completed');
  const overdue = state.tasks.filter(t =>
    t.status !== 'Completed' && t.dueDate &&
    isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
  );
  const highPriority = openTasks.filter(t => t.priority === 'High');
  const followUps = state.people.filter(p =>
    p.nextFollowUpDate &&
    (isPast(parseISO(p.nextFollowUpDate)) || isToday(parseISO(p.nextFollowUpDate))) &&
    p.status !== 'Archived'
  );
  const activePrayers = state.prayerRequests.filter(p => p.status === 'Active');
  const nextSermon = state.sermons
    .filter(s => s.preachingDate && s.status !== 'Preached')
    .sort((a, b) => (a.preachingDate ?? '').localeCompare(b.preachingDate ?? ''))[0];
  const rhythmPct = state.rhythmItems.length
    ? Math.round((state.weeklyRhythm.completedItems.length / state.rhythmItems.length) * 100)
    : 0;

  const user = USERS.find(u => u.id === currentUserId) ?? USERS[0];

  const lines: string[] = [];

  lines.push(`📋 Weekly Ministry Brief — ${today}`);
  lines.push(`Prepared for ${user.name}, ${user.title}`);
  lines.push('');

  // Rhythm health
  lines.push('── Weekly Rhythm ──────────────────');
  if (rhythmPct === 100) {
    lines.push('✅ All rhythm items complete this week. Well done.');
  } else if (rhythmPct >= 60) {
    lines.push(`📊 ${rhythmPct}% of weekly rhythm complete (${state.weeklyRhythm.completedItems.length}/${state.rhythmItems.length} items). Keep the pace.`);
  } else {
    lines.push(`⚠️  Only ${rhythmPct}% of weekly rhythm complete. Consider protecting time for the remaining items.`);
  }
  const incomplete = state.rhythmItems.filter(r => !state.weeklyRhythm.completedItems.includes(r.id));
  if (incomplete.length) {
    lines.push(`   Remaining: ${incomplete.slice(0, 4).map(r => r.title).join(', ')}${incomplete.length > 4 ? ` +${incomplete.length - 4} more` : ''}`);
  }
  lines.push('');

  // Tasks
  lines.push('── Tasks ──────────────────────────');
  lines.push(`${openTasks.length} open task${openTasks.length !== 1 ? 's' : ''} total.`);
  if (overdue.length) {
    lines.push(`🔴 ${overdue.length} overdue: ${overdue.slice(0, 3).map(t => `"${t.title}"`).join(', ')}${overdue.length > 3 ? '…' : ''}`);
  } else {
    lines.push('✅ No overdue tasks.');
  }
  if (highPriority.length) {
    lines.push(`🟠 ${highPriority.length} high-priority item${highPriority.length !== 1 ? 's' : ''}: ${highPriority.slice(0, 2).map(t => `"${t.title}"`).join(', ')}${highPriority.length > 2 ? '…' : ''}`);
  }
  lines.push('');

  // People care
  lines.push('── People Care ────────────────────');
  if (followUps.length) {
    lines.push(`🤝 ${followUps.length} follow-up${followUps.length !== 1 ? 's' : ''} due today or overdue:`);
    followUps.slice(0, 4).forEach(p => {
      lines.push(`   • ${p.name} (${p.careCategory})`);
    });
    if (followUps.length > 4) lines.push(`   • …and ${followUps.length - 4} more`);
  } else {
    lines.push('✅ No follow-ups overdue.');
  }
  const needsAttention = state.people.filter(p => p.status === 'Needs Attention');
  if (needsAttention.length) {
    lines.push(`⚠️  ${needsAttention.length} person${needsAttention.length !== 1 ? 's' : ''} marked "Needs Attention": ${needsAttention.slice(0, 2).map(p => p.name).join(', ')}`);
  }
  lines.push('');

  // Sermons
  lines.push('── Sermon Preparation ─────────────');
  if (nextSermon) {
    const dateStr = nextSermon.preachingDate
      ? format(parseISO(nextSermon.preachingDate), 'MMMM d')
      : 'date TBD';
    const steps = ['Idea','Researching','Outlining','Drafting','Ready','Preached'];
    const pct = Math.round(((steps.indexOf(nextSermon.status) + 1) / steps.length) * 100);
    lines.push(`📖 Next sermon: "${nextSermon.title}" — ${dateStr}`);
    lines.push(`   Status: ${nextSermon.status} (${pct}% complete)`);
    if (nextSermon.status === 'Idea' || nextSermon.status === 'Researching') {
      lines.push('   💡 Still in early stages — consider carving out extended prep time this week.');
    } else if (nextSermon.status === 'Ready') {
      lines.push('   ✅ Sermon is ready. Time to rest and trust the preparation.');
    }
    if (nextSermon.scriptureText) {
      lines.push(`   Scripture: ${nextSermon.scriptureText}`);
    }
  } else {
    lines.push('No upcoming sermons scheduled.');
  }
  lines.push('');

  // Prayer
  lines.push('── Prayer ─────────────────────────');
  lines.push(`${activePrayers.length} active prayer request${activePrayers.length !== 1 ? 's' : ''}.`);
  if (activePrayers.length) {
    activePrayers.slice(0, 3).forEach(p => {
      lines.push(`   🙏 ${p.personName} — ${p.category}`);
    });
    if (activePrayers.length > 3) lines.push(`   …and ${activePrayers.length - 3} more`);
  }
  lines.push('');

  // Encouragement
  const encouragements = [
    'The work of ministry is never finished, but this week\'s faithfulness matters. Keep shepherding well.',
    'You cannot lead people further than you have gone yourself. Tend to your own soul this week.',
    'Sustainable ministry is built on daily faithfulness, not heroic sprints. Pace yourself with grace.',
    'The people in your care are not projects — they are beloved. Let that truth shape every interaction.',
  ];
  lines.push('── A Word for You ─────────────────');
  lines.push(encouragements[new Date().getDay() % encouragements.length]);

  return { text: lines.join('\n') };
}


// ─── 2. Notes → Tasks ────────────────────────────────────────────────────────

export interface ExtractedTask {
  title: string;
  category: Task['category'];
  priority: Task['priority'];
  notes?: string;
}

export interface NotesToTasksInput {
  notes: string;
}

export interface NotesToTasksOutput {
  tasks: ExtractedTask[];
  summary: string;
}

export async function extractTasksFromNotes(
  input: NotesToTasksInput
): Promise<NotesToTasksOutput> {
  await delay(800);

  const { notes } = input;
  const lines = notes.split('\n').map(l => l.trim()).filter(Boolean);
  const extracted: ExtractedTask[] = [];

  // Pattern matching for action indicators
  const actionPatterns = [
    /^[-–•*]\s+(.+)/,                        // bullet points
    /^(?:action|todo|task|follow.?up)[:\s]+(.+)/i,
    /^(?:\d+[.)]\s+)(.+)/,                   // numbered lists
    /\b(?:need to|we should|will|must|going to|i'll|let's|assign|schedule|reach out to|call|email|visit|follow up|prepare|send|order|plan|review|update|complete|check)\b(.{10,60})/i,
  ];

  const seen = new Set<string>();

  for (const line of lines) {
    for (const pattern of actionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const raw = (match[1] ?? match[0]).trim().replace(/[.!?]+$/, '');
        if (raw.length < 8 || raw.length > 120 || seen.has(raw.toLowerCase())) continue;
        seen.add(raw.toLowerCase());

        // Infer category from keywords
        let category: Task['category'] = 'Admin';
        if (/sermon|preach|message|outline|scripture|study|text/i.test(raw)) category = 'Sermon';
        else if (/care|visit|hospital|family|member|follow.?up|call|reach out|pray/i.test(raw)) category = 'Care';
        else if (/staff|team|meeting|agenda|hire|review|leader/i.test(raw)) category = 'Staff';
        else if (/sunday|service|worship|communion|offering|usher|bulletin/i.test(raw)) category = 'Sunday Service';
        else if (/personal|self|rest|sabbath|devotion|read/i.test(raw)) category = 'Personal';

        // Infer priority from urgency words
        let priority: Task['priority'] = 'Medium';
        if (/urgent|asap|immediately|critical|today|emergency|overdue/i.test(raw)) priority = 'High';
        else if (/eventually|someday|low priority|when possible|minor/i.test(raw)) priority = 'Low';

        // Capitalize first letter
        const title = raw.charAt(0).toUpperCase() + raw.slice(1);
        extracted.push({ title, category, priority });
        break;
      }
    }
    if (extracted.length >= 8) break;
  }

  // Fallback: if nothing extracted, pick up sentence fragments with verbs
  if (extracted.length === 0) {
    for (const line of lines.slice(0, 15)) {
      if (line.length > 15 && line.length < 100 && /[a-z]/i.test(line)) {
        const title = line.charAt(0).toUpperCase() + line.slice(1).replace(/[.!?]+$/, '');
        if (!seen.has(title.toLowerCase())) {
          seen.add(title.toLowerCase());
          extracted.push({ title, category: 'Admin', priority: 'Medium' });
        }
        if (extracted.length >= 5) break;
      }
    }
  }

  const summary = extracted.length === 0
    ? 'No clear action items found. Try using bullet points or phrases like "follow up", "schedule", or "need to".'
    : `Found ${extracted.length} potential action item${extracted.length !== 1 ? 's' : ''} in your notes.`;

  return { tasks: extracted, summary };
}


// ─── 3. Follow-Up Message Draft ───────────────────────────────────────────────

export type FollowUpSource =
  | { type: 'person'; data: Person }
  | { type: 'prayer'; data: PrayerRequest };

export interface FollowUpMessageInput {
  source: FollowUpSource;
  senderName: string;
  organization: string;
}

export interface FollowUpMessageOutput {
  subject: string;
  body: string;
}

export async function generateFollowUpMessage(
  input: FollowUpMessageInput
): Promise<FollowUpMessageOutput> {
  await delay(900);

  const { source, senderName, organization } = input;
  const firstName = source.type === 'person'
    ? source.data.name.split(' ')[0]
    : source.data.personName.split(' ')[0];

  if (source.type === 'person') {
    const p = source.data;
    const templates: Record<Person['careCategory'], { subject: string; body: string }> = {
      'New Visitor': {
        subject: `So glad you joined us`,
        body: `Hi ${firstName},\n\nIt was such a joy to have you with us recently at ${organization}. I hope your time with us felt warm and welcoming.\n\nI'd love to connect, hear a bit of your story, and answer any questions you might have. Would you be open to a short conversation over coffee sometime this week or next?\n\nNo pressure at all — just wanted to reach out and say we're genuinely glad you came.\n\nWith care,\n${senderName}`,
      },
      'Hospital Visit': {
        subject: `Thinking of you`,
        body: `Hi ${firstName},\n\nYou've been on my mind and in my prayers. I know this season isn't easy, and I want you to know you're not walking through it alone.\n\nI'd love to stop by and visit if you're up for it, or simply chat on the phone. Just say the word and I'll make it happen.\n\nPraying for your comfort, healing, and peace.\n\nWith you,\n${senderName}`,
      },
      'Grieving': {
        subject: `Holding you in prayer`,
        body: `Dear ${firstName},\n\nI have been thinking about you so much. Loss is one of the hardest things we face, and there are no words that fully capture what you're carrying right now.\n\nI want you to know that you are deeply loved and not alone. I'm here — whether you need someone to talk to, sit in silence with, or just to know someone cares.\n\nPlease don't hesitate to reach out at any hour. I mean that.\n\nWith love and prayers,\n${senderName}`,
      },
      'Counseling': {
        subject: `Checking in on you`,
        body: `Hi ${firstName},\n\nI've been thinking about our recent conversations and wanted to check in. How are you doing this week — honestly?\n\nI'm praying for clarity, peace, and small but real steps forward for you. You're showing a lot of courage by engaging in this process.\n\nFeel free to reach out anytime between our meetings if something comes up that you'd like to talk through.\n\nFor you,\n${senderName}`,
      },
      'Inactive Member': {
        subject: `Thinking of you — it's been a while`,
        body: `Hi ${firstName},\n\nI realized it's been some time since we've connected, and I wanted to simply reach out and say you've been on my heart.\n\nNo agenda here — I'm not checking a box. I genuinely care about how you're doing and how life has been treating you.\n\nWould love to grab coffee or a quick call if you're open to it. Either way, know that you're missed and valued.\n\nWarmly,\n${senderName}`,
      },
      'Volunteer Leader': {
        subject: `Grateful for you`,
        body: `Hi ${firstName},\n\nI wanted to take a moment to say thank you — genuinely. The work you're doing in leading your team doesn't go unnoticed, and it matters more than you might realize.\n\nI also want to make sure I'm checking in on you, not just the ministry. How are you doing? Is there anything you need more of — support, margin, encouragement, a hard conversation?\n\nLet's connect soon. I want to pour into you the way you're pouring into others.\n\nGratefully,\n${senderName}`,
      },
      'General Follow-Up': {
        subject: `Just checking in`,
        body: `Hi ${firstName},\n\nHope this finds you well. I've been thinking about you and wanted to reach out.\n\nHow are things going? I'd love to hear what's on your heart and stay connected.\n\nLet me know if there's anything I can do for you or if you'd like to connect soon.\n\nWith care,\n${senderName}`,
      },
    };
    return templates[p.careCategory] ?? templates['General Follow-Up'];
  }

  // Prayer request
  const pr = source.data;
  const prayerTemplates: Partial<Record<PrayerRequest['category'], { subject: string; body: string }>> = {
    'Health': {
      subject: `Praying for your healing`,
      body: `Dear ${firstName},\n\nI've been lifting you up in prayer and wanted you to know that. Health challenges are exhausting — physically, emotionally, and spiritually.\n\nI'm trusting God with you. If there's anything I can do — a visit, a meal, a phone call, or just someone to pray with — please let me know.\n\nStanding with you,\n${senderName}`,
    },
    'Family': {
      subject: `Praying for your family`,
      body: `Hi ${firstName},\n\nI wanted to check in and let you know your family has been in my prayers. Family dynamics can be complex and draining, and I want you to know you don't have to navigate this alone.\n\nI'd love to connect soon. Even just to listen.\n\nWith you in prayer,\n${senderName}`,
    },
    'Grief': {
      subject: `With you in your grief`,
      body: `Dear ${firstName},\n\nI've been thinking of you so much. Grief doesn't follow a schedule, and I want you to know I'm not in a hurry to move past this with you.\n\nYou are loved. Please reach out whenever you need — day or night.\n\nWith deep care,\n${senderName}`,
    },
  };

  const template = prayerTemplates[pr.category as keyof typeof prayerTemplates];
  if (template) return template;

  return {
    subject: `Following up — you've been on my heart`,
    body: `Hi ${firstName},\n\nI've been praying for you and wanted to reach out personally. Whatever you're carrying right now, know that you're not alone.\n\nI'd love to connect if you're open to it — even just for a short conversation. My door is always open.\n\nWith care and prayers,\n${senderName}`,
  };
}


// ─── 4. Sermon Helper ─────────────────────────────────────────────────────────

export interface SermonHelperInput {
  sermon: Sermon;
}

export interface SermonHelperOutput {
  outline: string;
  discussionQuestions: string;
  applicationIdeas: string;
  socialPost: string;
}

export async function generateSermonHelper(
  input: SermonHelperInput
): Promise<SermonHelperOutput> {
  await delay(1200);

  const { sermon } = input;
  const title = sermon.title;
  const scripture = sermon.scriptureText ?? 'the selected passage';
  const bigIdea = sermon.bigIdea ?? 'the central truth of this passage';
  const series = sermon.seriesName;

  const outline = [
    `📖 SERMON OUTLINE — "${title}"`,
    scripture !== 'the selected passage' ? `Scripture: ${scripture}` : '',
    series ? `Series: ${series}` : '',
    '',
    '  I. INTRODUCTION',
    `     • Open with a relatable story or image that surfaces the tension this text addresses.`,
    `     • Introduce the central question: What does it mean to truly live out ${bigIdea.slice(0, 60)}?`,
    `     • Big Idea: ${bigIdea}`,
    '',
    ' II. CONTEXT & BACKGROUND',
    `     • Who wrote this? To whom? What was the situation?`,
    `     • What would the original hearers have understood that we might miss?`,
    `     • Bridge: Why does this ancient text speak to us today?`,
    '',
    'III. MAIN POINT 1 — The Invitation',
    `     • What is God inviting us into through this text?`,
    `     • Key verse or phrase from ${scripture}.`,
    `     • Illustration: [Add a story, image, or cultural reference here]`,
    '',
    ' IV. MAIN POINT 2 — The Obstacle',
    `     • What gets in the way of receiving what God offers here?`,
    `     • Name the honest struggle your congregation faces.`,
    `     • Scripture support + pastoral honesty.`,
    '',
    '  V. MAIN POINT 3 — The Way Forward',
    `     • What does it look like to live this truth this week?`,
    `     • Concrete, practical, and grace-filled steps.`,
    `     • Point to Jesus as the one who has already done what we cannot.`,
    '',
    ' VI. CONCLUSION',
    `     • Restate the Big Idea: ${bigIdea}`,
    `     • Land with hope, not pressure. The gospel is good news.`,
    `     • Close with a prayer, invitation, or moment of response.`,
    '',
    '─────────────────────────────────────',
    '💡 Notes: Fill in personal illustrations, cultural bridges, and local application.',
  ].filter(l => l !== null).join('\n');

  const discussionQuestions = [
    `💬 DISCUSSION QUESTIONS — "${title}"`,
    `Based on ${scripture}`,
    '',
    '  1. What stood out to you most from this message? What phrase or idea stuck with you?',
    '',
    `  2. Read ${scripture} aloud together. What's one thing you notice that you might have missed before?`,
    '',
    `  3. ${bigIdea} — What does this look like in daily, practical terms for someone in your stage of life?`,
    '',
    '  4. Where do you most feel resistance to what this passage is asking of you? What makes it hard?',
    '',
    '  5. Can you think of someone in your life who seems to genuinely live out this truth? What does it look like in them?',
    '',
    '  6. What is one specific thing you will do differently this week because of this message?',
    '',
    '  7. How can this group pray for you as you seek to live this out?',
    '',
    '─────────────────────────────────────',
    '💡 Tip: Let the questions breathe. Silence is okay. The goal is honest conversation, not quick answers.',
  ].join('\n');

  const applicationIdeas = [
    `⚡ APPLICATION IDEAS — "${title}"`,
    '',
    '  PERSONAL',
    `  • Set aside 10 minutes this week to sit with ${scripture} and journal what it surfaces in you.`,
    `  • Identify one relationship where you can apply the core truth of this message.`,
    '  • Share what you\'re learning with one person outside of church this week.',
    '',
    '  FAMILY / HOUSEHOLD',
    `  • Use dinner conversation to ask: "What do you think it means to ${bigIdea.toLowerCase().slice(0, 50)}?"`,
    '  • Pray together as a household around the theme of this message.',
    '  • Find a practical way to serve someone in your neighborhood this week.',
    '',
    '  COMMUNITY GROUP',
    '  • Begin your next group gathering with a 5-minute reflection: What has God been showing me this week?',
    '  • Do a group act of service that connects to the message theme.',
    '  • Commit to holding each other accountable to the one application you each chose.',
    '',
    '  CONGREGATION-WIDE',
    series ? `  • Use this as a bridge to the next message in the "${series}" series.` : '  • Consider a follow-up sermon or teaching series to go deeper.',
    '  • Invite people to share a short testimony next week about how this message impacted them.',
    '  • Feature a prayer station during the week focused on the Big Idea.',
    '',
    '─────────────────────────────────────',
    '💡 The best application is the one people actually do. Simple + specific > impressive + forgettable.',
  ].join('\n');

  const socialPost = [
    `📱 SOCIAL MEDIA POSTS — "${title}"`,
    '',
    '  INSTAGRAM / FACEBOOK (long-form):',
    `  "${bigIdea}"`,
    '',
    `  This Sunday we're exploring ${scripture} together — a passage that challenges us to rethink ${title.toLowerCase()}.`,
    `  ${series ? `Part of our series: ${series}.` : ''}`,
    '  Join us and bring someone who needs to hear this.',
    '',
    '  ──',
    '',
    '  TWITTER / X (short):',
    `  "${bigIdea.slice(0, 100)}${bigIdea.length > 100 ? '…' : ''}"`,
    `  Preaching on ${scripture} this Sunday. Come ready to be challenged. 🙏`,
    '',
    '  ──',
    '',
    '  GRAPHIC QUOTE (for story/reel):',
    `  "${bigIdea.split('.')[0]}."`,
    `  — ${title}`,
    series ? `  ${series}` : '',
    '',
    '─────────────────────────────────────',
    '💡 Edit to match your church\'s voice. Remove anything that feels inauthentic to you.',
  ].filter(l => l !== null).join('\n');

  return { outline, discussionQuestions, applicationIdeas, socialPost };
}
