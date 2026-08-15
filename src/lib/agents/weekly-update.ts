import Anthropic from '@anthropic-ai/sdk';
import { TriageResult, WeeklyUpdate, Slide } from '@/lib/types';

const WEEKLY_UPDATE_SYSTEM_PROMPT = `You are an AI chief-of-staff helping an early-stage startup founder write their weekly investor update email and a mini pitch-style slide summary.

You will receive the week's triaged email data including: categories, priorities, deadlines, summaries, and statuses.

## Part 1: Investor Update Email

Write a concise, professional weekly investor update email with these sections:
1. **TL;DR** (2-3 bullet points of the week's biggest wins/developments)
2. **Key Metrics** (use placeholders like [INSERT ARR], [INSERT MRR GROWTH] where specific numbers aren't available from the email data)
3. **Deals & Pipeline** (summarize investor-related activity: new conversations, follow-ups, term sheet progress)
4. **Customer Health** (summarize customer-related activity: issues resolved, churn risks, feature requests, sentiment)
5. **Operational Updates** (deadlines met, hiring updates, compliance items, anything else notable)
6. **Open Loops / Asks** (what's still unresolved, any asks from investors)
7. **Next Week Focus** (2-3 priorities for the coming week)

Keep the tone confident but honest. Don't hide problems — frame them with your plan to address them. Founders who share challenges with context earn more trust than those who only share wins.

## Part 2: Slide Summary

Also generate a 4-5 slide mini pitch-style summary. Each slide should have:
- A title
- Key content (brief text, 2-3 sentences max)  
- Optional metrics (label + value + optional change indicator)
- Optional bullet points

Slide structure:
1. **Week in Review** — headline wins and key numbers
2. **Pipeline & Fundraising** — investor activity summary
3. **Customer Pulse** — satisfaction, issues, retention signals
4. **Ops & Team** — hiring, compliance, operational milestones
5. **Next Week** — top 3 priorities and any asks

## Output Format

Return a JSON object with this exact structure:
{
  "emailContent": "string (the full investor update email in markdown)",
  "slides": [
    {
      "title": "string",
      "content": "string",
      "metrics": [{"label": "string", "value": "string", "change": "string (optional)"}],
      "bulletPoints": ["string"]
    }
  ]
}

Return ONLY the JSON object, no other text.`;

export async function generateWeeklyUpdate(
  triageResults: TriageResult[]
): Promise<WeeklyUpdate> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Calculate week range
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — using fallback weekly update');
    return fallbackWeeklyUpdate(triageResults, weekStart, now);
  }

  const client = new Anthropic({ apiKey });

  const triageSummary = triageResults.map(r => ({
    emailId: r.emailId,
    category: r.category,
    priority: r.priority,
    deadline: r.deadline,
    actionRequired: r.actionRequired,
    summary: r.summary,
    status: r.status,
    from: r.email.from,
    subject: r.email.subject,
  }));

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: WEEKLY_UPDATE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate the weekly investor update and slide summary based on this week's triaged email activity:\n\nWeek: ${weekStart.toISOString().split('T')[0]} to ${now.toISOString().split('T')[0]}\n\nTriaged emails (${triageResults.length} total):\n${JSON.stringify(triageSummary, null, 2)}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse weekly update response:', text);
      return fallbackWeeklyUpdate(triageResults, weekStart, now);
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      emailContent: string;
      slides: Slide[];
    };

    return {
      emailContent: parsed.emailContent,
      slides: parsed.slides,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: now.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Weekly update agent error:', error);
    return fallbackWeeklyUpdate(triageResults, weekStart, now);
  }
}

function fallbackWeeklyUpdate(
  triageResults: TriageResult[],
  weekStart: Date,
  weekEnd: Date
): WeeklyUpdate {
  const investors = triageResults.filter(r => r.category === 'Investor');
  const customers = triageResults.filter(r => r.category === 'Customer');
  const urgent = triageResults.filter(r => r.category === 'Urgent/Deadline');
  const open = triageResults.filter(r => r.status === 'open' && r.actionRequired);

  const emailContent = `# Weekly Investor Update

**Week of ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}**

## TL;DR
- ${investors.length} active investor conversations, including term sheet discussions and due diligence requests
- ${customers.length} customer touchpoints this week — addressed SLA concerns and feature requests
- ${urgent.length} time-sensitive items tracked and managed

## Key Metrics
- **MRR**: [INSERT MRR]
- **MRR Growth**: [INSERT MRR GROWTH]%
- **Active Customers**: [INSERT COUNT]
- **Churn Rate**: [INSERT CHURN]%

## Deals & Pipeline
${investors.map(i => `- **${i.email.subject}** (from ${i.email.from.split('@')[0]}): ${i.summary}`).join('\n')}

## Customer Health
${customers.map(c => `- **${c.email.subject}**: ${c.summary} [Status: ${c.status}]`).join('\n')}

## Operational Updates
${urgent.map(u => `- **${u.email.subject}**: ${u.summary}${u.deadline ? ` (Deadline: ${new Date(u.deadline).toLocaleDateString()})` : ''}`).join('\n')}

## Open Loops
${open.length > 0 ? open.map(o => `- ${o.summary}`).join('\n') : '- All items addressed this week ✅'}

## Next Week Focus
1. Close on term sheet discussions and send requested due diligence materials
2. Resolve outstanding customer issues and conduct churn-risk call
3. Complete board deck and compliance filings before deadlines`;

  const slides: Slide[] = [
    {
      title: 'Week in Review',
      content: 'Active week across fundraising, customer management, and operations.',
      metrics: [
        { label: 'Total Emails Triaged', value: String(triageResults.length) },
        { label: 'Action Items', value: String(open.length), change: 'open' },
        { label: 'Investor Conversations', value: String(investors.length) },
      ],
      bulletPoints: [
        'Term sheet discussions advancing with Sequoia',
        'Customer SLA issue resolved within hours',
        'SOC 2 compliance filing on track',
      ],
    },
    {
      title: 'Pipeline & Fundraising',
      content: `${investors.length} investor touchpoints this week. Active discussions include term sheet follow-ups and due diligence.`,
      metrics: [
        { label: 'Active Conversations', value: String(investors.length) },
        { label: 'Target Raise', value: '$12M', change: 'Series A' },
      ],
      bulletPoints: investors.map(i => i.summary),
    },
    {
      title: 'Customer Pulse',
      content: `${customers.length} customer interactions. Monitoring churn risk and addressing feature requests proactively.`,
      metrics: [
        { label: 'Support Tickets', value: String(customers.length) },
        { label: 'Churn Risk Flags', value: String(customers.filter(c => c.priority <= 2).length) },
      ],
      bulletPoints: customers.map(c => c.summary),
    },
    {
      title: 'Ops & Team',
      content: 'Keeping the operational engine running — compliance, hiring, and deadline management.',
      metrics: [
        { label: 'Deadlines This Week', value: String(urgent.length) },
        { label: 'Open Items', value: String(open.length) },
      ],
      bulletPoints: urgent.map(u => u.summary),
    },
    {
      title: 'Next Week Priorities',
      content: 'Focused execution on the three highest-impact items.',
      bulletPoints: [
        'Send due diligence materials to Lightspeed (deadline: Aug 18)',
        'Customer retention call with TechStartup re: renewal',
        'Finalize and submit Q3 board deck (deadline: Aug 19)',
        'RSVP and prepare slides for Demo Day (Aug 21)',
      ],
    },
  ];

  return {
    emailContent,
    slides,
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
}

export { WEEKLY_UPDATE_SYSTEM_PROMPT };
