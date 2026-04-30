# joggai-mcp

MCP server for the [Jogg.ai](https://www.jogg.ai/?fpr=johnathan60) video generation API. 47 tools covering the full v2 API: avatars, video creation, templates, translation, lip sync, AI scripts, webhooks, and more.

Works with Claude Code, Cursor, Windsurf, and any MCP-compatible client.

## Quick Start

### 1. Get your Jogg.ai API key

Sign in at [app.jogg.ai](https://www.jogg.ai/?fpr=johnathan60) &rarr; click your profile icon &rarr; **API** &rarr; copy your key.

### 2. Install

```bash
npm install -g github:spyderman4g63/joggai-mcp
```

### 3. Add to your MCP client

#### Claude Code

```bash
claude mcp add joggai -e JOGGAI_API_KEY=your_api_key -- joggai-mcp
```

#### Claude Code (settings JSON)

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "joggai": {
      "command": "joggai-mcp",
      "env": {
        "JOGGAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "joggai": {
      "command": "joggai-mcp",
      "env": {
        "JOGGAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### OpenAI Codex

Add to `~/.codex/config.json`:

```json
{
  "mcpServers": {
    "joggai": {
      "command": "joggai-mcp",
      "env": {
        "JOGGAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### OpenCode

Add to `~/.config/opencode/opencode.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "joggai": {
      "command": "joggai-mcp",
      "env": {
        "JOGGAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Windsurf / Other MCP Clients

```json
{
  "mcpServers": {
    "joggai": {
      "command": "joggai-mcp",
      "env": {
        "JOGGAI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Alternative: from source

```bash
git clone https://github.com/spyderman4g63/joggai-mcp.git
cd joggai-mcp
npm install && npm run build
```

Then use `"command": "node"` with `"args": ["/path/to/joggai-mcp/dist/index.js"]` in your MCP config.

## Features

| Category | Tools | What you can do |
|----------|-------|-----------------|
| **User** | 2 | Account info, check remaining credits |
| **Avatars** | 12 | Browse 300+ public avatars, manage custom/photo/product avatars, generate from photos, add motion |
| **Voices** | 2 | Browse TTS voices by language/gender/age, list custom voices |
| **Assets** | 3 | Background music, visual styles, upload images/video/audio |
| **AI Scripts** | 2 | Generate marketing scripts from product info |
| **Products** | 2 | Create products from URLs (Amazon, etc.) or manual details |
| **Templates** | 3 | Browse and inspect video templates |
| **Video Creation** | 5 | Avatar videos, product videos, preview comparison, template videos |
| **Lip Sync** | 2 | Combine video + audio with lip sync |
| **Translation** | 3 | Translate videos into 40+ languages with AI dubbing |
| **Video Status** | 3 | Poll avatar/product/template video generation |
| **Video Lists** | 3 | List and filter generated videos |
| **Webhooks** | 5 | Manage webhook endpoints for real-time notifications |

## Usage Examples

Once configured, ask your AI assistant:

- *"List available avatars for portrait videos"*
- *"Create a talking avatar video with avatar 81 saying 'Hello world'"*
- *"Create a product from this Amazon URL and generate a 30-second marketing video"*
- *"Translate this video to Spanish with subtitles"*
- *"Generate an AI script for my product in the Storytime style"*
- *"Check the status of video video_123456"*
- *"What's my remaining API quota?"*
- *"Set up a webhook to notify me when videos are done"*
- *"List my custom templates and show me the variables for template 1234"*
- *"Create a lip sync video from this video and audio URL"*

## Tool Reference

### User
| Tool | Description |
|------|-------------|
| `joggai_get_user_info` | Get account email and username |
| `joggai_get_remaining_quota` | Check remaining API credits |

### Avatars
| Tool | Description |
|------|-------------|
| `joggai_list_public_avatars` | Browse 300+ public avatars with filters |
| `joggai_list_custom_avatars` | List your instant avatars |
| `joggai_list_photo_avatars` | List your photo-based avatars |
| `joggai_list_product_avatars` | List your product avatars |
| `joggai_generate_photo_avatar` | Create avatar from portrait photo |
| `joggai_get_photo_avatar_status` | Poll photo avatar generation |
| `joggai_add_motion_to_photo_avatar` | Add motion to photo avatar |
| `joggai_check_motion_status` | Poll motion generation |
| `joggai_generate_product_avatar_image` | Generate product avatar images |
| `joggai_get_product_avatar_generation_status` | Poll product avatar generation |
| `joggai_convert_image_to_product_avatar` | Convert image to product avatar |
| `joggai_check_product_avatar_status` | Poll product avatar status |

### Voices
| Tool | Description |
|------|-------------|
| `joggai_list_voices` | Browse TTS voices by language, gender, age |
| `joggai_list_custom_voices` | List your custom voices |

### Assets
| Tool | Description |
|------|-------------|
| `joggai_list_music` | Browse background music tracks |
| `joggai_list_visual_styles` | Browse visual styles for product videos |
| `joggai_upload_asset` | Get signed URL for media upload |

### AI Scripts
| Tool | Description |
|------|-------------|
| `joggai_create_ai_script` | Generate video scripts with AI |
| `joggai_get_ai_script_result` | Get generated script results |

### Products
| Tool | Description |
|------|-------------|
| `joggai_create_product` | Create product from URL or details |
| `joggai_update_product` | Update product information |

### Templates
| Tool | Description |
|------|-------------|
| `joggai_list_index_templates` | Browse public templates |
| `joggai_list_custom_templates` | List your custom templates |
| `joggai_get_template_by_id` | Get template details and variables |

### Video Creation
| Tool | Description |
|------|-------------|
| `joggai_create_avatar_video` | Create talking avatar video |
| `joggai_create_product_video` | Create product marketing video |
| `joggai_submit_preview_list` | Generate previews with multiple styles |
| `joggai_render_preview` | Render final video from preview |
| `joggai_create_template_video` | Create video from template |

### Lip Sync
| Tool | Description |
|------|-------------|
| `joggai_create_lip_sync_video` | Create lip sync video |
| `joggai_get_lip_sync_status` | Check lip sync task status |

### Video Translation
| Tool | Description |
|------|-------------|
| `joggai_translate_video` | Translate video to 40+ languages |
| `joggai_get_translation_status` | Check translation status |
| `joggai_list_translation_languages` | List supported languages |

### Video Status
| Tool | Description |
|------|-------------|
| `joggai_get_avatar_video_status` | Poll avatar video status |
| `joggai_get_product_video_status` | Poll product video status |
| `joggai_get_template_video_status` | Poll template video status |

### Video Lists
| Tool | Description |
|------|-------------|
| `joggai_list_product_videos` | List product videos with filters |
| `joggai_list_product_previews` | List product previews |
| `joggai_list_template_videos` | List template videos |

### Webhooks
| Tool | Description |
|------|-------------|
| `joggai_list_webhook_endpoints` | List all webhook endpoints |
| `joggai_add_webhook_endpoint` | Create webhook endpoint |
| `joggai_update_webhook_endpoint` | Update webhook endpoint |
| `joggai_delete_webhook_endpoint` | Delete webhook endpoint |
| `joggai_list_webhook_events` | List available event types |

## How It Works

This is a [Model Context Protocol](https://modelcontextprotocol.io/) server. It runs as a local process that your AI coding tool (Claude Code, Cursor, etc.) communicates with over stdio. The server translates MCP tool calls into Jogg.ai REST API requests using your API key.

All video generation on Jogg.ai is **asynchronous** &mdash; creation endpoints return an ID immediately, and you poll a status endpoint (or use webhooks) until the video is ready. The MCP tools follow this same pattern.

## Requirements

- Node.js 18+
- A [Jogg.ai](https://www.jogg.ai/?fpr=johnathan60) account with API access

## API Documentation

- [Jogg.ai API Docs](https://docs.jogg.ai/api-reference/v2/QuickStart/GettingStarted)
- [Rate Limits](https://docs.jogg.ai/api-reference/v2/QuickStart/RateLimits)
- [Pricing](https://docs.jogg.ai/api-reference/v2/QuickStart/Pricing)

## License

MIT
