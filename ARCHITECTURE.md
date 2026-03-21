# StoryChain Architecture v3

## Folder Structure (File-Tree First)

```
StoryChain/
├── app/                    # Application layer
│   ├── pages/             # Page components
│   │   ├── Feed.tsx
│   │   ├── StoryDetail.tsx
│   │   ├── Create.tsx
│   │   └── Settings.tsx
│   ├── components/        # Shared components
│   │   ├── StoryCard.tsx
│   │   ├── AgentPanel.tsx
│   │   ├── ContributionForm.tsx
│   │   └── Navigation.tsx
│   └── hooks/             # Custom hooks
│       ├── useStories.ts
│       ├── useStory.ts
│       ├── useAgents.ts
│       └── useLocalStorage.ts
├── core/                  # Core business logic
│   ├── state/            # State management (no frameworks)
│   │   ├── store.ts      # Central store
│   │   ├── storiesSlice.ts
│   │   └── agentsSlice.ts
│   ├── services/         # API services
│   │   ├── storyService.ts
│   │   ├── agentService.ts
│   │   └── llmService.ts
│   └── utils/            # Utilities
│       ├── date.ts
│       ├── id.ts
│       └── format.ts
├── domain/               # Domain models
│   ├── Story.ts
│   ├── Agent.ts
│   ├── Contribution.ts
│   └── User.ts
├── api/                  # Backend API
│   ├── routes/           # Route handlers
│   │   ├── stories.ts
│   │   ├── agents.ts
│   │   └── contributions.ts
│   ├── middleware/       # Auth, validation
│   └── db/              # Database
│       ├── schema.sql
│       └── connection.ts
└── public/              # Static assets
    └── index.html
```

## State Management (Zero Dependencies)

No Redux, Zustand, or Context bloat. Use file-tree state:

```typescript
// core/state/store.ts
export const store = {
  stories: new Map<string, Story>(),
  agents: new Map<string, Agent>(),
  currentUser: null as User | null,
  
  // Subscribers
  _listeners: new Set<Function>(),
  
  subscribe(fn: Function) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  },
  
  notify() {
    this._listeners.forEach(fn => fn());
  },
  
  // Actions
  setStories(stories: Story[]) {
    stories.forEach(s => this.stories.set(s.id, s));
    this.notify();
  },
  
  addStory(story: Story) {
    this.stories.set(story.id, story);
    this.notify();
  }
};
```

## Routing (Hash-based, Zero Dependencies)

```typescript
// core/router.ts
export const router = {
  current: () => window.location.hash.slice(1) || '/',
  
  navigate(path: string) {
    window.location.hash = path;
  },
  
  params() {
    const parts = this.current().split('/');
    return {
      route: parts[0],
      id: parts[1],
    };
  },
  
  // Subscribe to changes
  onChange(fn: Function) {
    window.addEventListener('hashchange', () => fn(this.current()));
  }
};
```

## Key Principles

1. **File-tree over frameworks** — Folders organize code, not imports
2. **Plain TypeScript** — No decorators, no complex types
3. **Map-based state** — O(1) lookups, no array scans
4. **Event-driven** — Subscribe to changes, no prop drilling
5. **API-first** — Backend drives frontend structure
