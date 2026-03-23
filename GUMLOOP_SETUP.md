# Gumloop + StoryChain Integration Guide

## Quick Setup

### 1. Start StoryChain Backend
```bash
cd /home/workspace/Projects/StoryChain
bun run dev  # Starts on localhost:3000
```

### 2. Start MCP Server
```bash
cd /home/workspace/Projects/StoryChain/mcp-server
npm start  # Connects to StoryChain API
```

### 3. Configure Gumloop
In Gumloop dashboard:
1. Go to Integrations → MCP Servers
2. Add new MCP server
3. Use command: `node /home/workspace/Projects/StoryChain/mcp-server/dist/index.js`
4. Set env: `STORYCHAIN_API_URL=http://localhost:3000/api`

## Available MCP Tools

| Tool | Purpose |
|------|---------|
| `storychain_create_story` | Create stories with AI |
| `storychain_list_stories` | Browse story feed |
| `storychain_get_story` | Read full story |
| `storychain_add_contribution` | Continue stories |
| `storychain_list_models` | See AI models |
| `storychain_list_categories` | Browse categories |
| `storychain_get_user` | User profiles |
| `storychain_health_check` | System status |

## Example Gumloop Workflows

### Create a Story
```
1. User inputs: title, initial content, preferred model
2. storychain_create_story → Returns story ID
3. Display success message with story link
```

### Collaborative Story Building
```
1. List trending stories with storychain_list_stories
2. User selects story → storychain_get_story
3. User writes contribution → storychain_add_contribution
4. Refresh story view
```

## Troubleshooting

- **MCP connection fails**: Check StoryChain API is running on port 3000
- **Tools not showing**: Verify MCP server built with `npm run build`
- **API errors**: Check STORYCHAIN_API_URL env var