import { GoogleGenAI } from '@google/genai';
import { Email, TriageResult, EmailCategory } from '@/lib/types';

const TRIAGE_SYSTEM_PROMPT = `You are an AI chief-of-staff for an early-stage startup founder. Your job is to triage incoming emails and classify them by category and urgency.

For each email, you must:
1. Classify it into exactly ONE category:
   - "Investor": Emails from VCs, angels, board members, or related to fundraising, term sheets, due diligence, investor updates, or investor relations.
   - "Customer": Emails from customers, users, or prospects about bugs, features, churn risk, onboarding, support, or feedback.
   - "Urgent/Deadline": Emails with explicit deadlines, time-sensitive action items, compliance requirements, legal deadlines, hiring approvals, or anything that will have negative consequences if not addressed within 48 hours. This includes emails from other categories IF they have an imminent deadline.
   - "Noise": Newsletters, cold outreach, social notifications, SaaS upsells, marketing emails, or anything that doesn't require a specific action from the founder.

2. Assign a priority score from 1 (most urgent) to 5 (least urgent):
   - 1: Immediate action required today (SLA breach, expiring offers, same-day deadlines)
   - 2: Action required within 24-48 hours (upcoming deadlines, churn risk, important investor requests)
   - 3: Should address this week (feature requests, introductions, quarterly catch-ups)
   - 4: Can wait but should eventually respond (general inquiries, non-urgent follow-ups)
   - 5: No action needed (newsletters, spam, notifications)

3. Extract any deadlines mentioned (as ISO 8601 date strings, e.g., "2026-08-20T00:00:00Z"). If no specific deadline is mentioned, return null.

4. Determine if the email requires a direct action from the founder (true/false).

5. Write a one-sentence summary of what the email is about and what action (if any) is needed.

IMPORTANT: An email can be categorized as "Investor" or "Customer" AND still have a high priority if it contains a deadline. The category reflects the TYPE of email; the priority reflects the URGENCY.

Respond with a JSON array. Each element must have this exact structure:
{
  "emailId": "string (the email's id field)",
  "category": "Investor" | "Customer" | "Urgent/Deadline" | "Noise",
  "priority": 1-5,
  "deadline": "ISO 8601 string" | null,
  "actionRequired": true | false,
  "summary": "string"
}

Return ONLY the JSON array, no other text.`;

export async function triageEmails(emails: Email[]): Promise<TriageResult[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — using fallback triage');
    return fallbackTriage(emails);
  }

  const emailSummaries = emails.map(e => ({
    id: e.id,
    from: e.from,
    to: e.to,
    subject: e.subject,
    body: e.body,
    date: e.date,
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Triage the following ${emails.length} emails:\n\n${JSON.stringify(emailSummaries, null, 2)}`,
      config: {
        systemInstruction: TRIAGE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('Failed to parse triage response:', text);
      return fallbackTriage(emails);
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      emailId: string;
      category: EmailCategory;
      priority: number;
      deadline: string | null;
      actionRequired: boolean;
      summary: string;
    }>;

    return parsed.map(result => ({
      ...result,
      email: emails.find(e => e.id === result.emailId)!,
      status: 'open' as const,
    }));
  } catch (error) {
    console.error('Triage agent error:', error);
    return fallbackTriage(emails);
  }
}

// Fallback triage when API key is not available (rule-based)
function fallbackTriage(emails: Email[]): TriageResult[] {
  return emails.map(email => {
    let category: EmailCategory = 'Noise';
    let priority = 5;
    let deadline: string | null = null;
    let actionRequired = false;
    let summary = '';

    const subjectLower = email.subject.toLowerCase();
    const bodyLower = email.body.toLowerCase();
    const fromLower = email.from.toLowerCase();

    // Investor detection
    if (
      fromLower.includes('vc') || fromLower.includes('ventures') || 
      fromLower.includes('capital') || fromLower.includes('vp') ||
      subjectLower.includes('term sheet') || subjectLower.includes('due diligence') ||
      subjectLower.includes('series') || subjectLower.includes('investor') ||
      subjectLower.includes('intro:') || subjectLower.includes('catch-up')
    ) {
      category = 'Investor';
      priority = 3;
      actionRequired = true;
      summary = `Investor email from ${email.from.split('@')[0]} regarding: ${email.subject}`;
    }
    // Customer detection
    else if (
      fromLower.includes('client') || fromLower.includes('support') ||
      subjectLower.includes('bug') || subjectLower.includes('feature request') ||
      subjectLower.includes('urgent') || subjectLower.includes('sla') ||
      subjectLower.includes('churn') || subjectLower.includes('alternative') ||
      subjectLower.includes('onboarding')
    ) {
      category = 'Customer';
      priority = 3;
      actionRequired = true;
      summary = `Customer issue from ${email.from.split('@')[0]}: ${email.subject}`;
    }
    // Noise detection
    else if (
      fromLower.includes('newsletter') || fromLower.includes('notification') ||
      fromLower.includes('linkedin') || fromLower.includes('sales@') ||
      fromLower.includes('cold') || fromLower.includes('recruitment') ||
      subjectLower.includes('unsubscribe') || subjectLower.includes('offer')
    ) {
      category = 'Noise';
      priority = 5;
      actionRequired = false;
      summary = `Non-actionable: ${email.subject}`;
    }

    // Deadline/Urgency override
    const deadlineMatch = email.body.match(/(?:due|by|before|expires?|deadline)[:\s]+(?:August|Aug)\s+(\d{1,2})/i);
    if (deadlineMatch) {
      const day = parseInt(deadlineMatch[1]);
      deadline = `2026-08-${day.toString().padStart(2, '0')}T00:00:00Z`;
      
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 2) {
        priority = 1;
        category = 'Urgent/Deadline';
      } else if (daysUntil <= 5) {
        priority = 2;
        if (category === 'Noise') category = 'Urgent/Deadline';
      }
      actionRequired = true;
    }

    // Urgency keywords
    if (
      subjectLower.includes('urgent') || subjectLower.includes('action required') ||
      subjectLower.includes('asap') || subjectLower.includes('immediately') ||
      bodyLower.includes('sla breach') || bodyLower.includes('escalat')
    ) {
      if (priority > 2) priority = 1;
      if (category === 'Noise') category = 'Urgent/Deadline';
      actionRequired = true;
    }

    // RSVP detection
    if (subjectLower.includes('rsvp') || bodyLower.includes('rsvp')) {
      actionRequired = true;
      if (priority > 3) priority = 2;
      const rsvpMatch = email.body.match(/(?:RSVP|reply)[^.]*?(?:by|before)\s+(?:August|Aug)\s+(\d{1,2})/i);
      if (rsvpMatch) {
        deadline = `2026-08-${parseInt(rsvpMatch[1]).toString().padStart(2, '0')}T00:00:00Z`;
      }
    }

    // Approval needed
    if (bodyLower.includes('approval') || bodyLower.includes('approve') || bodyLower.includes('sign-off')) {
      actionRequired = true;
      if (priority > 2) priority = 2;
      if (category === 'Noise') category = 'Urgent/Deadline';
    }

    // GDPR
    if (bodyLower.includes('gdpr') || bodyLower.includes('data export')) {
      category = 'Urgent/Deadline';
      priority = 2;
      actionRequired = true;
    }

    if (!summary) {
      summary = `${category} email: ${email.subject}`;
    }

    return {
      emailId: email.id,
      email,
      category,
      priority,
      deadline,
      actionRequired,
      summary,
      status: 'open' as const,
    };
  }).sort((a, b) => a.priority - b.priority);
}

export { TRIAGE_SYSTEM_PROMPT };
