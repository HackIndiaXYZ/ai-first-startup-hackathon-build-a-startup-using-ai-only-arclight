import Anthropic from '@anthropic-ai/sdk';
import { Email, DraftResult } from '@/lib/types';

const DRAFT_SYSTEM_PROMPT = `You are an AI writing assistant for an early-stage startup founder. Your job is to draft email replies in the founder's voice.

You will be given:
1. The original email (from, subject, body)
2. A tone setting: "direct", "warm", or "formal"

Tone guidelines:
- **Direct**: Concise, no fluff. Get to the point quickly. Use short sentences. Professional but efficient. Think: busy founder who values everyone's time.
- **Warm**: Friendly and personable. Show genuine interest. Use the person's first name. Add a personal touch where appropriate. Think: founder who builds strong relationships.
- **Formal**: Professional and polished. Proper business language. Structured response. Think: founder communicating with board members or legal teams.

Rules:
1. Always address the sender by their first name (extract from the "from" field or email body).
2. Reference specific details from the original email to show you've read it carefully.
3. Keep replies concise — founders are busy. Aim for 3-6 sentences for most replies, longer only if the original email asks multiple questions.
4. If the email requires specific data/numbers you don't have, use a placeholder like [INSERT MRR FIGURE] or [ATTACH DOCUMENT] so the founder knows to fill it in.
5. End with a clear next step or call to action when appropriate.
6. Never be sycophantic or overly enthusiastic. Be genuine and competent.
7. Sign off as "Best," or "Thanks," followed by a newline (the founder will add their own signature).

Return ONLY the draft reply text. No JSON wrapping, no explanation — just the email body ready to send.`;

export async function generateDraft(
  email: Email,
  tone: 'direct' | 'warm' | 'formal'
): Promise<DraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — using fallback draft');
    return fallbackDraft(email, tone);
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: DRAFT_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Original email:\nFrom: ${email.from}\nSubject: ${email.subject}\nBody:\n${email.body}\n\nTone: ${tone}\n\nDraft a reply.`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      triageId: email.id,
      tone,
      draftText: text.trim(),
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Draft agent error:', error);
    return fallbackDraft(email, tone);
  }
}

function fallbackDraft(email: Email, tone: 'direct' | 'warm' | 'formal'): DraftResult {
  const firstName = email.from.split('@')[0].split('.')[0];
  const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  
  const toneGreetings = {
    direct: `Hi ${capitalizedName},`,
    warm: `Hey ${capitalizedName}!`,
    formal: `Dear ${capitalizedName},`,
  };

  const toneClosings = {
    direct: 'Best,',
    warm: 'Thanks so much,',
    formal: 'Best regards,',
  };

  const subject = email.subject.toLowerCase();
  let body = '';

  if (subject.includes('term sheet') || subject.includes('series')) {
    body = `Thanks for the update. I'll get the cap table and MRR figures over to you by the deadline. Happy to align on valuation expectations — let me find a time for a quick call this week.`;
  } else if (subject.includes('due diligence')) {
    body = `Absolutely — I'll pull together the customer references and data you've requested. You'll have everything by [INSERT DATE]. Let me know if you need anything else in the meantime.`;
  } else if (subject.includes('urgent') || subject.includes('sla')) {
    body = `I'm aware of the issue and our engineering team is on it. I'll personally ensure this is resolved within the hour and will follow up with a full post-mortem. Apologies for the disruption.`;
  } else if (subject.includes('alternative') || subject.includes('churn')) {
    body = `Thanks for being upfront about this — I really appreciate it. I'd love to hop on a call this week to walk you through our Q4 roadmap. I think you'll be excited about what's coming. When works for you?`;
  } else if (subject.includes('feature request')) {
    body = `Great feedback — a Slack integration is definitely something we've been hearing about. It's on our roadmap for Q4. I'll make sure your team gets early access when we ship it.`;
  } else if (subject.includes('board deck') || subject.includes('compliance')) {
    body = `Got it — I'll have this completed and submitted before the deadline. Will flag if I need any additional inputs from the team.`;
  } else {
    body = `Thanks for reaching out. I've reviewed your email and will get back to you with a detailed response shortly. Let me look into this and follow up by end of week.`;
  }

  const draftText = `${toneGreetings[tone]}\n\n${body}\n\n${toneClosings[tone]}`;

  return {
    triageId: email.id,
    tone,
    draftText,
    createdAt: new Date().toISOString(),
  };
}

export { DRAFT_SYSTEM_PROMPT };
