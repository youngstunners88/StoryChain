# AI Business Workspace — Notion Template

**Price:** $19  
**Target Audience:** Entrepreneurs, solopreneurs, freelancers, and small business owners  
**Description:** A complete business operating system with AI-powered templates to save 10+ hours per week on project management, content creation, customer relationships, research, meetings, and finances.

---

## 📋 Template Overview

This workspace includes **6 interconnected databases** with pre-built AI prompts and templates:

1. **Projects & Tasks** — Track work with AI task breakdown
2. **Content Calendar** — Plan posts with AI-generated ideas
3. **Customer Database** — Manage relationships with AI follow-ups
4. **Research Database** — Organise knowledge with AI summaries
5. **Meeting Notes** — Capture discussions with AI summaries
6. **Financial Tracker** — Monitor money with AI insights

---

## 🗂️ DATABASE 1: Projects & Tasks

### Database Properties

| Property Name | Type | Options/Notes |
|---------------|------|---------------|
| Task Name | Title | — |
| Status | Select | Backlog, To Do, In Progress, Blocked, Review, Done |
| Priority | Select | Critical, High, Medium, Low |
| Project | Relation | Links to Projects database |
| Due Date | Date | — |
| Assignee | Person | — |
| Effort | Select | Quick (<1hr), Medium (1-4hr), Large (4hr+) |
| AI Generated | Checkbox | Marks AI-created tasks |
| Tags | Multi-select | Marketing, Sales, Operations, Product, Admin, Finance |
| Notes | Text | — |

### Projects Database Properties

| Property Name | Type | Options/Notes |
|---------------|------|---------------|
| Project Name | Title | — |
| Status | Select | Planning, Active, On Hold, Completed, Archived |
| Progress | Rollup | Percentage of tasks complete |
| Owner | Person | — |
| Start Date | Date | — |
| Target End | Date | — |
| Budget | Number | — |
| Tasks | Relation | Links back to Tasks |

---

### 🤖 AI Task Breakdown Template

**When to use:** Starting a new project or complex task

**Prompt (copy into Notion AI or ChatGPT):**

```
You are a project management assistant. Break down the following project/task into actionable subtasks:

PROJECT/TASK: [Insert project name or description]
CONTEXT: [Business type, team size, deadline, any constraints]

OUTPUT FORMAT:
Provide 5-15 specific, actionable tasks following this structure:

1. **[Task Name]**
   - Priority: [Critical/High/Medium/Low]
   - Estimated effort: [Quick/Medium/Large]
   - Dependencies: [Any tasks that must happen first]
   - Notes: [Helpful context]

Organise tasks into phases if applicable. Include any hidden steps that are often forgotten.
```

**Example Output for "Launch Email Newsletter":**

| Task | Priority | Effort | Notes |
|------|----------|--------|-------|
| Define newsletter goals and KPIs | High | Medium | Decide on open rate target, subscriber goal |
| Choose email platform | High | Medium | Compare ConvertKit, Beehiiv, Mailchimp |
| Create lead magnet | High | Large | Free resource to encourage signups |
| Design signup form | Medium | Medium | Add to website homepage + footer |
| Write welcome sequence (3 emails) | High | Large | First email sent immediately |
| Create first 4 newsletter drafts | Medium | Large | Stay 1 month ahead |
| Set up analytics tracking | Medium | Quick | Track opens, clicks, unsubscribes |
| Test on mobile devices | Medium | Quick | Check rendering on iPhone, Android |
| Announce launch on social media | Medium | Medium | Create 3 posts per platform |
| Send first newsletter | Critical | Medium | Schedule for Tuesday or Thursday morning |

---

### 🤖 AI Weekly Planning Template

**Prompt:**

```
You are a productivity assistant. Help me plan my week based on these inputs:

TASKS THIS WEEK:
[Paste your task list with priorities and due dates]

MY AVAILABILITY:
- Monday: [hours available]
- Tuesday: [hours available]
- Wednesday: [hours available]
- Thursday: [hours available]
- Friday: [hours available]

CONSTRAINTS:
- [Any meetings, fixed commitments, energy levels]

OUTPUT:
1. Suggest which tasks to move to next week (if overloaded)
2. Recommend optimal scheduling (batch similar tasks, protect deep work time)
3. Identify any risks or blockers
4. Provide a suggested daily schedule
```

---

## 📅 DATABASE 2: Content Calendar

### Database Properties

| Property Name | Type | Options/Notes |
|---------------|------|---------------|
| Title | Title | — |
| Platform | Select | Instagram, LinkedIn, X/Twitter, TikTok, YouTube, Blog, Newsletter, Podcast |
| Status | Select | Idea, Draft, Scheduled, Published, Evergreen |
| Publish Date | Date | Include time |
| Content Type | Select | Educational, Behind-the-scenes, Promotional, Story, Tutorial, Q&A, Listicle, Case Study |
| Topic Pillar | Select | Product, Industry Tips, Personal Brand, Customer Stories, Company Updates |
| Hook | Text | Opening line that grabs attention |
| CTA | Text | Call-to-action |
| Hashtags | Text | Relevant hashtags |
| AI Generated | Checkbox | Marks AI-created content |
| Engagement | Number | Likes, comments, shares |
| Notes | Text | Performance notes, A/B test results |

---

### 🤖 AI Content Idea Generator

**Prompt for content ideas:**

```
You are a social media content strategist. Generate 10 content ideas for my business:

BUSINESS TYPE: [e.g., Online fitness coaching]
TARGET AUDIENCE: [e.g., Busy professionals aged 30-45 who want to get fit]
PLATFORM: [Instagram/LinkedIn/Twitter/TikTok/YouTube]
CONTENT GOAL: [Awareness/Engagement/Leads/Sales]

CONSTRAINTS:
- [Any topics to avoid]
- [Brand voice: professional/casual/funny/inspirational]

OUTPUT FORMAT:
For each idea, provide:

## Idea #[N]: [Title]

**Content Type:** [Educational/Behind-the-scenes/Promotional/Story/Tutorial/Q&A/Listicle/Case Study]
**Hook:** [Attention-grabbing first line]
**Outline:** [2-3 bullet points of what to cover]
**CTA:** [What action should the audience take?]
**Why this works:** [Brief explanation of why this resonates with the audience]

Vary the content types and ensure a mix of value-driven and promotional content.
```

---

### 🤖 AI Post Writer Templates

**Educational Post Template:**

```
Write a [LinkedIn/Instagram/Twitter] post on this topic:

TOPIC: [Insert topic]
KEY POINTS TO COVER:
- [Point 1]
- [Point 2]
- [Point 3]

STYLE GUIDELINES:
- Hook the reader in the first line
- Use short paragraphs (1-2 sentences)
- Include 1 personal insight or story
- End with an engaging question
- Tone: [Professional/Casual/Inspiring/Witty]
- Length: [50-100/100-200/200-300 words]

Hashtags: Suggest 3-5 relevant hashtags.
```

**Behind-the-Scenes Post Template:**

```
Write a [platform] behind-the-scenes post:

WHAT I'M SHOWING: [e.g., My morning routine, product development, team meeting, workspace]
STORY ANGLE: [What makes this interesting/relatable]
LESSON OR INSIGHT: [What should the audience learn or feel?]

STYLE:
- Authentic and relatable
- Show vulnerability or struggle if relevant
- Invite audience into the process
- Length: [word count]
```

**Promotional Post Template:**

```
Write a promotional social media post that doesn't feel salesy:

PRODUCT/SERVICE: [Name and brief description]
KEY BENEFIT: [Primary value to customer]
SOCIAL PROOF: [Testimonial, stat, or result]
OFFER: [Discount, bonus, or limited availability]
CALL TO ACTION: [What should they do next?]

STYLE:
- Lead with value, not the product
- Focus on transformation, not features
- Create urgency without being pushy
- Sound like a recommendation from a friend
- Length: [word count]
```

---

### Content Pillar Strategy

| Pillar | % of Content | Description | Content Types |
|--------|--------------|-------------|---------------|
| **Educational** | 40% | Teach your audience something valuable | Tutorials, tips, how-tos, industry insights |
| **Personal/Story** | 25% | Build connection and trust | Behind-the-scenes, origin story, lessons learned |
| **Social Proof** | 20% | Demonstrate results and credibility | Testimonials, case studies, results screenshots |
| **Promotional** | 15% | Directly sell products/services | Launches, offers, product features |

---

## 👥 DATABASE 3: Customer Database

### Database Properties

| Property Name | Type | Options/Notes |
|---------------|------|---------------|
| Name | Title | Full name |
| Email | Email | — |
| Company | Text | — |
| Status | Select | Lead, Prospect, Active Customer, Churned, VIP |
| Lead Source | Select | Website, Referral, Social Media, Cold Outreach, Event, Ad |
| Value | Number | Lifetime value or deal size |
| Last Contact | Date | — |
| Next Follow-Up | Date | — |
| Follow-Up Type | Select | Check-in, Proposal, Onboarding, Support, Renewal, Re-engagement |
| Products Purchased | Multi-select | [List your products/services] |
| Tags | Multi-select | Decision Maker, Influencer, Enterprise, SMB, Urgent, At Risk |
| Notes | Text | — |
| Tasks | Relation | Link to Tasks database |

---

### 🤖 AI Follow-Up Email Templates

**Cold Lead Re-engagement:**

```
Write a re-engagement email for a cold lead:

LEAD NAME: [Name]
BUSINESS: [Their company]
LAST INTERACTION: [When and what was discussed]
THEIR PAIN POINTS: [What problems they mentioned]
MY PRODUCT/SERVICE: [What you offer]
RECENT NEWS/UPDATE: [New feature, case study, or relevant content]

STYLE:
- Casual but professional
- No pressure, just checking in
- Provide value (don't just ask for a meeting)
- Under 150 words
- Include a soft CTA
```

**Post-Purchase Check-In:**

```
Write a post-purchase follow-up email:

CUSTOMER NAME: [Name]
PRODUCT PURCHASED: [Product/service name]
PURCHASE DATE: [Date]
KEY RESULTS THEY WANTED: [What outcome they're seeking]

INCLUDE:
- Thank them for their purchase
- Ask how it's going (2-3 specific questions)
- Offer help if they're stuck
- Suggest next steps or additional resources
- Request feedback or testimonial if appropriate

STYLE: Warm, helpful, under 150 words
```

**At-Risk Customer Retention:**

```
Write a retention email for a customer showing signs of churning:

CUSTOMER NAME: [Name]
PRODUCT/SERVICE: [What they use]
SIGNS OF DISENGAGEMENT: [Low usage, missed payments, negative feedback, no recent login]
THEIR ORIGINAL GOALS: [What they wanted to achieve]

INCLUDE:
- Acknowledge their experience without being defensive
- Offer specific solutions to their challenges
- Provide an incentive if appropriate (discount, bonus support, extended trial)
- Ask what would make this valuable for them
- Make it easy to respond

STYLE: Empathetic, solution-focused, no guilt-tripping, under 200 words
```

**VIP Customer Appreciation:**

```
Write an appreciation email for a top customer:

CUSTOMER NAME: [Name]
TIME AS CUSTOMER: [Duration]
TOTAL VALUE: [Amount spent or value delivered]
THEIR SUCCESS: [Results they've achieved]

INCLUDE:
- Genuine gratitude (be specific about why you appreciate them)
- Acknowledge their success
- Offer exclusive benefit or early access
- Ask for feedback or referral (optional)
- Keep it personal, not templated

STYLE: Warm, exclusive, under 150 words
```

---

### Customer Health Score Formula

Create a formula property in Notion:

```
Health Score = (Engagement × 0.3) + (Value × 0.25) + (Recency × 0.25) + (NPS/Feedback × 0.2)

Engagement: 1-5 (login frequency, feature usage)
Value: 1-5 (relative to other customers)
Recency: 1-5 (days since last interaction)
NPS: 1-5 (if collected, otherwise use 3 as default)

Score Interpretation:
- 4-5: Healthy (green)
- 2.5-3.9: At Risk (yellow)
- Below 2.5: Churn Risk (red)
```

---

## 📚 DATABASE 4: Research Database

### Database Properties

| Property Name | Type | Options/Notes |
|---------------|------|---------------|
| Title | Title | — |
| Type | Select | Article, Book, Podcast, Video, Course, Competitor Analysis, Market Research, Tool Review |
| Status | Select | To Read, In Progress, Completed, Reference |
| Source | URL | Link to original source |
| Author | Text | — |
| Topic | Multi-select | Marketing, Sales, Product, Finance, Operations, Leadership, Industry Trends, Tools |
| Rating | Select | ⭐⭐⭐⭐⭐ (5 stars) |
| Key Takeaways | Text | Main insights |
| Action Items | Text | What to do with this information |
| Related Project | Relation | Link to Projects database |
| AI Summary | Text | Generated summary |
| Date Added | Date | — |

---

### 🤖 AI Research Summary Template

**Prompt:**

```
You are a research assistant. Summarise and extract key insights from the following content:

CONTENT:
[Paste article text, or describe the video/podcast/book]

OUTPUT FORMAT:

## 📌 One-Sentence Summary
[Single sentence capturing the main point]

## 🎯 Key Takeaways (3-5 bullet points)
- [Insight 1]
- [Insight 2]
- [Insight 3]

## 💡 Actionable Ideas
What could I implement in my business based on this?
1. [Action 1]
2. [Action 2]

## 🤔 Questions This Raises
- [Question 1]
- [Question 2]

## 📚 Related Topics to Explore
- [Topic 1]
- [Topic 2]

## 🔖 Notable Quotes (if any)
"[Quote]" — [Attribution]
```

---

### 🤖 AI Competitor Analysis Template

**Prompt:**

```
You are a competitive intelligence analyst. Analyse this competitor:

COMPETITOR: [Company name and website]
MY BUSINESS: [Your business description and target market]
WHAT I WANT TO KNOW: [Pricing, positioning, features, marketing strategy, strengths/weaknesses]

ANALYSIS FRAMEWORK:

## 1. POSITIONING
- Who do they target?
- What's their unique value proposition?
- How do they describe themselves?

## 2. OFFERING
- Products/services and pricing
- Key features and differentiators
- Gaps or weaknesses in their offering

## 3. MARKETING
- Main channels (social, content, ads, SEO)
- Content themes and messaging
- Brand voice and personality

## 4. STRENGTHS
- What do they do well?
- What advantages do they have?

## 5. WEAKNESSES
- Where are they vulnerable?
- What do customers complain about?

## 6. OPPORTUNITIES FOR MY BUSINESS
- Where can I differentiate?
- What can I learn from them?
- What should I avoid?

## 7. THREAT LEVEL
- [ ] Direct competitor
- [ ] Indirect competitor
- [ ] Potential future competitor
- [ ] Not a threat

Brief explanation of threat assessment.
```

---

## 📝 DATABASE 5: Meeting Notes

### Database Properties

| Property Name | Type | Options/Notes |
|---------------|------|---------------|
| Meeting Title | Title | — |
| Date | Date | Include time |
| Type | Select | Team Standup, 1:1, Client Call, Sales Call, Project Review, Strategy, Brainstorm, All Hands |
| Attendees | Multi-select | [Add your team members] |
| Client/External | Text | External participants |
| Project | Relation | Link to Projects database |
| Status | Select | Scheduled, Completed, Cancelled |
| Agenda | Text | Pre-meeting bullet points |
| Notes | Text | Meeting notes |
| Decisions | Text | What was decided |
| Action Items | Text | Who does what by when |
| AI Summary | Text | Generated summary |
| Recording | URL | Link to recording if available |

---

### 🤖 AI Meeting Summary Template

**Prompt:**

```
You are an executive assistant. Summarise this meeting:

MEETING DETAILS:
- Title: [Meeting name]
- Date: [Date]
- Attendees: [Names]
- Type: [Call type]

RAW NOTES:
[Paste your messy meeting notes here]

OUTPUT:

## 📋 EXECUTIVE SUMMARY (2-3 sentences)
[What was discussed and the main outcome]

## ✅ DECISIONS MADE
- [Decision 1 - who made it, rationale if noted]
- [Decision 2]
- [Decision 3]

## 📌 ACTION ITEMS
| Task | Owner | Due Date |
|------|-------|----------|
| [Action 1] | [Name] | [Date] |
| [Action 2] | [Name] | [Date] |

## 🔮 NEXT STEPS
- [What happens next]
- [Follow-up meetings or checkpoints]

## 🚨 BLOCKERS OR RISKS
- [Any issues raised that need attention]

## 💡 KEY INSIGHTS
- [Important points that aren't actions but are worth remembering]

## ❓ OPEN QUESTIONS
- [Unresolved items to revisit]
```

---

### 🤖 AI Pre-Meeting Prep Template

**Prompt:**

```
You are a meeting preparation assistant. Help me prepare for this meeting:

MEETING TYPE: [Sales call, client check-in, project kickoff, performance review, etc.]
ATTENDEES: [Names and roles]
MY GOAL: [What I want to achieve]
THEIR LIKELY GOALS: [What they probably want]
CONTEXT: [Background, relationship history, current situation]

OUTPUT:

## 🎯 MEETING OBJECTIVES
1. [Primary objective]
2. [Secondary objective]

## 📝 SUGGESTED AGENDA (estimate timing)
1. [Item 1] — [X min]
2. [Item 2] — [X min]
3. [Item 3] — [X min]

## ❓ QUESTIONS TO ASK
- [Question 1]
- [Question 2]
- [Question 3]

## ⚠️ POTENTIAL OBJECTIONS/CHALLENGES
- [Objection 1] → Suggested response: [Response]
- [Objection 2] → Suggested response: [Response]

## 💬 TALKING POINTS
- [Point 1]
- [Point 2]

## 📌 DON'T FORGET
- [Important reminder]
```

---

### Meeting Types & Templates

| Type | Duration | Purpose | Template Focus |
|------|----------|---------|----------------|
| **Team Standup** | 15 min | Daily sync | Blockers only, quick wins |
| **1:1** | 30-60 min | Direct report check-in | Career growth, feedback, blockers |
| **Client Call** | 30-60 min | Progress update or sales | Outcomes, decisions, next steps |
| **Project Kickoff** | 60-90 min | Align on new project | Goals, roles, timeline, risks |
| **Strategy Session** | 60-120 min | Quarterly/annual planning | Priorities, OKRs, resource allocation |
| **Brainstorm** | 45-60 min | Generate ideas | No bad ideas, quantity over quality |
| **Project Review** | 30-60 min | Milestone check-in | What's working, what's not, pivots |

---

## 💰 DATABASE 6: Financial Tracker

### Database Properties

| Property Name | Type | Options/Notes |
|---------------|------|---------------|
| Date | Date | — |
| Description | Title | — |
| Category | Select | Revenue, COGS, Marketing, Software, Payroll, Contractors, Office, Travel, Legal, Taxes, Other |
| Subcategory | Select | [e.g., Marketing → Ads, Marketing → Content, Software → CRM, etc.] |
| Amount | Number | — |
| Type | Select | Income, Expense |
| Payment Method | Select | Bank Transfer, Credit Card, Cash, PayPal, Stripe, Other |
| Vendor/Client | Text | Who you paid or who paid you |
| Invoice # | Text | For tracking |
| Tax Deductible | Checkbox | — |
| Status | Select | Pending, Paid, Reconciled |
| Project | Relation | Link to Projects database |
| Notes | Text | — |

---

### 🤖 AI Financial Insights Template

**Prompt (run monthly):**

```
You are a financial analyst for a small business. Analyse these financial data:

BUSINESS TYPE: [Your business model]
TIME PERIOD: [Month/Quarter]

INCOME:
[Paste income data - amounts, sources, trends]

EXPENSES BY CATEGORY:
[Paste expense breakdown]

KEY METRICS:
- Total Revenue: $[X]
- Total Expenses: $[X]
- Net Profit: $[X]
- Profit Margin: [X]%
- Month-over-Month Growth: [X]%

OUTPUT:

## 📊 FINANCIAL HEALTH SCORE
[Rate 1-10 with explanation]

## 💰 REVENUE ANALYSIS
- Top income sources and trends
- Revenue concentration risk
- Growth or decline patterns

## 💸 EXPENSE ANALYSIS
- Highest expense categories
- Unusual or one-time costs
- Areas to optimise

## 📈 PROFITABILITY
- Margin trends
- Break-even status
- Comparison to previous period

## 🚨 ALERTS & WARNINGS
- Cash flow concerns
- Overspending patterns
- Missing revenue opportunities

## ✅ RECOMMENDATIONS
1. [Specific action to increase revenue]
2. [Specific action to reduce costs]
3. [Specific action to improve cash flow]

## 🔮 FORECAST
Based on current trends, predict next month:
- Expected Revenue: $[X]
- Expected Expenses: $[X]
- Expected Profit: $[X]

Assumptions and confidence level.
```

---

### 🤖 AI Pricing Strategy Template

**Prompt:**

```
You are a pricing strategist. Help me determine optimal pricing:

PRODUCT/SERVICE: [Description]
TARGET MARKET: [Who buys this]
CURRENT PRICE: $[X] (if any)
COMPETITOR PRICES: [What competitors charge]
MY COSTS: [What it costs me to deliver]
VALUE PROVIDED: [What outcome does the customer get?]

OUTPUT:

## 💡 PRICING OPTIONS

### Option 1: [Name] — $[X]/[period]
- Target margin: [X]%
- Best for: [Customer segment]
- Pros: [Advantages]
- Cons: [Disadvantages]

### Option 2: [Name] — $[X]/[period]
- Target margin: [X]%
- Best for: [Customer segment]
- Pros: [Advantages]
- Cons: [Disadvantages]

### Option 3: [Name] — $[X]/[period]
- Target margin: [X]%
- Best for: [Customer segment]
- Pros: [Advantages]
- Cons: [Disadvantages]

## 🎯 RECOMMENDED PRICE
$[X] — [Why this price]

## 📊 PRICING PSYCHOLOGY TACTICS
- [Tactic 1, e.g., charm pricing, anchoring, tiered options]
- [Tactic 2]

## 🔄 PRICING EXPERIMENT
Suggest a small test to validate pricing before full launch.
```

---

### Financial Dashboard Metrics to Track

| Metric | Formula | Target | Frequency |
|--------|---------|--------|-----------|
| **Monthly Recurring Revenue (MRR)** | Sum of active subscriptions | [Your target] | Monthly |
| **Average Revenue Per Customer (ARPC)** | Total Revenue ÷ # Customers | [Your target] | Monthly |
| **Customer Acquisition Cost (CAC)** | Marketing + Sales Costs ÷ New Customers | < 1x ARPC | Monthly |
| **Customer Lifetime Value (LTV)** | ARPC × Avg. Customer Lifespan (months) | > 3x CAC | Quarterly |
| **Gross Margin** | (Revenue - COGS) ÷ Revenue × 100 | > 50% | Monthly |
| **Operating Margin** | (Revenue - All Expenses) ÷ Revenue × 100 | > 20% | Monthly |
| **Burn Rate** | Monthly Expenses - Monthly Revenue | N/A (track trend) | Monthly |
| **Runway** | Cash Balance ÷ Burn Rate | > 6 months | Monthly |

---

## 🔗 DATABASE RELATIONSHIPS

Set up these relations in Notion for maximum power:

```
Projects ←→ Tasks
- One project has many tasks
- Tasks belong to one project

Projects ←→ Meetings
- See all meetings for a project
- Link meetings to relevant projects

Customers ←→ Tasks
- Track customer-specific tasks
- See task history per customer

Customers ←→ Financial Tracker
- See revenue per customer
- Track payment history

Research ←→ Projects
- Link research to relevant projects
- See all research for a project

Content Calendar ←→ Projects
- Link content to product launches or campaigns
- Track content for specific initiatives
```

---

## 🚀 SETUP INSTRUCTIONS

### Step 1: Create Databases (30 min)

1. Create a new page called "AI Business Workspace"
2. Create 6 databases using the property tables above:
   - Projects & Tasks (create Tasks first, then Projects, then link them)
   - Content Calendar
   - Customer Database
   - Research Database
   - Meeting Notes
   - Financial Tracker

### Step 2: Add Templates (30 min)

1. In each database, click the blue "New" button dropdown
2. Select "New Template" for each template listed
3. Add placeholder content and structure
4. Name templates clearly (e.g., "🤖 AI Task Breakdown")

### Step 3: Set Up Views (20 min)

Create multiple views per database:

**Tasks Database Views:**
- All Tasks (table)
- By Status (Kanban)
- This Week (calendar filtered by due date)
- High Priority (filtered table)
- By Project (grouped table)

**Content Calendar Views:**
- Calendar (calendar view by publish date)
- By Platform (grouped table)
- Ideas Queue (filtered by status = Idea)
- Scheduled (filtered by status = Scheduled)

**Customer Database Views:**
- All Customers (table)
- Leads (filtered by status)
- Active Customers (filtered)
- At Risk (filtered by next follow-up overdue)
- VIP (filtered by value > $X)

### Step 4: Create AI Prompts Page (10 min)

1. Create a sub-page called "AI Prompts Library"
2. Copy all prompts from this template
3. Organise by section (Projects, Content, Customers, Research, Meetings, Finance)
4. This becomes your quick-reference for using AI with the workspace

### Step 5: Add Sample Data (20 min)

Add 3-5 sample entries in each database to demonstrate how it works. This helps buyers see the system in action.

---

## 💡 PRO TIPS FOR BUYERS

### Time-Saving Workflows

1. **Weekly Planning Ritual (Monday AM):**
   - Review Tasks → Update priorities → Run AI Weekly Planning prompt
   - Check Content Calendar → Draft 3 posts → Run AI Content prompts
   - Review Customer Database → Identify follow-ups needed → Generate emails

2. **Daily Standup (5 min):**
   - Check Tasks "Today" view
   - Update task status
   - Note blockers in daily note

3. **Post-Meeting (immediately after):**
   - Open Meeting Notes → Create new entry
   - Paste rough notes → Run AI Summary prompt
   - Add action items to Tasks

4. **Monthly Review (Last Friday of month):**
   - Review Financial Tracker → Run AI Insights prompt
   - Update customer health scores
   - Archive completed projects
   - Plan next month's priorities

### AI Prompt Best Practices

1. **Be Specific:** The more context you give, the better the output
2. **Iterate:** Use follow-up prompts to refine results
3. **Save Your Best Prompts:** When a prompt works well, save it in your AI Prompts Library
4. **Combine Prompts:** Chain prompts together for complex tasks
5. **Human in the Loop:** Always review AI output before publishing or sending

---

## 📦 WHAT'S INCLUDED

✅ 6 interconnected databases with 40+ properties  
✅ 15+ AI prompt templates  
✅ 10+ content creation templates  
✅ 5+ email follow-up templates  
✅ Database relation setup guide  
✅ View configuration recommendations  
✅ Sample data for each database  
✅ Weekly/monthly workflow guides  

---

## 🎯 WHO THIS IS FOR

- **Solopreneurs** managing every aspect of their business
- **Freelancers** juggling multiple clients and projects
- **Small business owners** who want to professionalise operations
- **Startup founders** building systems from scratch
- **Content creators** who need to stay organised
- **Consultants & coaches** managing clients and content

---

## 📜 TERMS OF USE

- Personal and commercial use allowed
- Cannot resell this template as-is
- Can use as foundation for client projects with modifications
- Lifetime access to updates
- No refunds on digital products

---

*Template Version 1.0 — Created 2024*  
*Compatible with Notion AI, ChatGPT, Claude, and other AI assistants*
