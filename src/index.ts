#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.jogg.ai/v2";

function getApiKey(): string {
  const key = process.env.JOGGAI_API_KEY;
  if (!key) {
    throw new Error(
      "JOGGAI_API_KEY environment variable is not set. " +
        "Get your API key from https://app.jogg.ai → Avatar → API."
    );
  }
  return key;
}

interface ApiResponse {
  code: number;
  msg: string;
  data?: unknown;
}

async function apiRequest(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  query?: Record<string, string | number | boolean | undefined>
): Promise<ApiResponse> {
  const apiKey = getApiKey();
  let url = `${BASE_URL}${path}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };

  const opts: RequestInit = { method, headers };
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);
  const json = (await res.json()) as ApiResponse;
  return json;
}

function formatResponse(result: ApiResponse): { content: Array<{ type: "text"; text: string }> } {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "joggai-mcp",
  version: "1.0.0",
});

// ============================= USER ========================================

server.tool(
  "joggai_get_user_info",
  "Get current user account information (email, username)",
  {},
  async () => formatResponse(await apiRequest("GET", "/user/whoami"))
);

server.tool(
  "joggai_get_remaining_quota",
  "Get remaining API credit quota for the authenticated user",
  {},
  async () => formatResponse(await apiRequest("GET", "/user/remaining_quota"))
);

// ============================= AVATARS =====================================

server.tool(
  "joggai_list_public_avatars",
  "List public avatars with optional filters (aspect_ratio, style, gender, age, scene, ethnicity). Supports pagination.",
  {
    page: z.number().optional().describe("Page number (default 1)"),
    page_size: z.number().optional().describe("Items per page (default 10, max 100)"),
    aspect_ratio: z.enum(["portrait", "landscape", "square"]).optional().describe("Filter by aspect ratio"),
    style: z.enum(["professional", "social"]).optional().describe("Filter by style"),
    gender: z.enum(["female", "male"]).optional().describe("Filter by gender"),
    age: z.enum(["adult", "senior", "young_adult"]).optional().describe("Filter by age group"),
    scene: z.enum(["lifestyle", "outdoors", "business", "studio", "health_fitness", "education", "news"]).optional().describe("Filter by scene"),
    ethnicity: z.enum(["european", "african", "south_asian", "east_asian", "middle_eastern", "south_american", "north_american"]).optional().describe("Filter by ethnicity"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/avatars/public", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_list_custom_avatars",
  "List user's custom instant avatars with optional filters",
  {
    page: z.number().optional().describe("Page number"),
    page_size: z.number().optional().describe("Items per page"),
    name: z.string().optional().describe("Filter by avatar name"),
    status: z.enum(["processing", "completed", "failed"]).optional().describe("Filter by status"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/avatars/custom", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_list_photo_avatars",
  "List user's photo-based avatars with optional filters",
  {
    page: z.number().optional().describe("Page number"),
    page_size: z.number().optional().describe("Items per page"),
    name: z.string().optional().describe("Filter by name"),
    status: z.enum(["processing", "completed", "failed"]).optional().describe("Filter by status"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/avatars/photo_avatars", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_list_product_avatars",
  "List user's product avatars, optionally filtered by aspect ratio",
  {
    aspect_ratio: z.enum(["portrait", "landscape"]).optional().describe("Filter by aspect ratio"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/avatars/product_avatars", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_generate_photo_avatar",
  "Generate an AI photo avatar from provided parameters (and optionally a reference image). Returns a photo_id to poll for status.",
  {
    age: z.enum(["Teenager", "Young adult", "Adult", "Elderly"]).describe("Avatar age group"),
    avatar_style: z.enum(["Professional", "Social"]).describe("Avatar style"),
    gender: z.enum(["Female", "Male"]).describe("Avatar gender"),
    model: z.enum(["classic", "modern"]).describe("Photo generation model"),
    aspect_ratio: z.enum(["portrait", "landscape", "square"]).describe("Photo aspect ratio"),
    image_url: z.string().optional().describe("Reference portrait photo URL"),
    ethnicity: z.enum(["European", "African", "South Asian", "East Asian", "Middle Eastern", "South American", "North American"]).optional().describe("Avatar ethnicity"),
    background: z.string().optional().describe("Background description"),
    appearance: z.string().optional().describe("Appearance description"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/photo_avatar/photo/generate", params as Record<string, unknown>))
);

server.tool(
  "joggai_get_photo_avatar_status",
  "Check the status of a photo avatar generation task",
  {
    photo_id: z.string().describe("Photo ID from the generation task"),
  },
  async ({ photo_id }) =>
    formatResponse(await apiRequest("GET", "/photo_avatar/photo", undefined, { photo_id }))
);

server.tool(
  "joggai_add_motion_to_photo_avatar",
  "Add motion to a photo avatar to make it animated. Returns a motion_id to poll for status.",
  {
    image_url: z.string().describe("Photo avatar image URL"),
    name: z.string().describe("Avatar name"),
    voice_id: z.string().describe("Voice ID to associate"),
    model: z.enum(["1.0", "2.0", "2.0-Pro", "3.0"]).describe("Motion model version"),
    photo_id: z.string().optional().describe("Photo ID from generation"),
    description: z.string().optional().describe("Avatar description"),
    welcome_msg: z.string().optional().describe("Welcome message"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/photo_avatar/add_motion", params as Record<string, unknown>))
);

server.tool(
  "joggai_check_motion_status",
  "Check the status of a motion generation task by motion ID",
  {
    motion_id: z.string().describe("Motion ID from the add_motion task"),
  },
  async ({ motion_id }) =>
    formatResponse(await apiRequest("GET", "/photo_avatar", undefined, { motion_id }))
);

server.tool(
  "joggai_generate_product_avatar_image",
  "Generate product avatar images using AI. Returns a batch_id with generation tasks.",
  {
    product_image_url: z.string().describe("Product image URL"),
    avatar_source: z.object({
      type: z.enum(["id", "image", "description"]).describe("Avatar source type"),
      value: z.string().optional().describe("Image URL or description (for image/description types)"),
      avatar_id: z.number().optional().describe("Avatar ID (for id type)"),
      avatar_type: z.enum(["public", "photo", "custom"]).optional().describe("Avatar type (for id type)"),
    }).describe("Avatar source configuration"),
    quality: z.enum(["medium", "high", "low"]).describe("Image generation quality"),
    aspect_ratio: z.enum(["3:2", "2:3", "1:1"]).describe("Aspect ratio"),
    num_images: z.number().min(1).max(4).describe("Number of images to generate (1-4)"),
    prompt: z.string().optional().describe("Image generation prompt"),
    webhook_url: z.string().optional().describe("Webhook URL for notifications"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/product_avatar/generation", params as Record<string, unknown>))
);

server.tool(
  "joggai_get_product_avatar_generation_status",
  "Check product avatar image generation status by batch ID",
  {
    batch_id: z.string().describe("Batch ID from the generation request"),
  },
  async ({ batch_id }) =>
    formatResponse(await apiRequest("GET", `/product_avatar/generation/${batch_id}`))
);

server.tool(
  "joggai_convert_image_to_product_avatar",
  "Convert a generated image to a product avatar with motion and voice",
  {
    generation_id: z.string().describe("Generation ID from product avatar image generation"),
    name: z.string().describe("Product avatar name"),
    voice_id: z.string().describe("Voice ID to associate"),
    description: z.string().describe("Motion description"),
    model: z.number().optional().describe("Model selection (0-2)"),
    aspect_ratio: z.enum(["portrait", "landscape", "square"]).optional().describe("Aspect ratio"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/product_avatar/add_motion", params as Record<string, unknown>))
);

server.tool(
  "joggai_check_product_avatar_status",
  "Check the status of a product avatar creation by motion ID",
  {
    motion_id: z.string().describe("Motion ID from the avatar creation task"),
  },
  async ({ motion_id }) =>
    formatResponse(await apiRequest("GET", "/product_avatar", undefined, { motion_id }))
);

// ============================= VOICES ======================================

server.tool(
  "joggai_list_voices",
  "List available TTS voices with optional filters (gender, language, age, use_case). Supports pagination.",
  {
    page: z.number().optional().describe("Page number"),
    page_size: z.number().optional().describe("Items per page"),
    gender: z.enum(["female", "male"]).optional().describe("Filter by gender"),
    language: z.string().optional().describe("Filter by language (e.g. 'english', 'spanish')"),
    age: z.enum(["young", "middle_aged", "old"]).optional().describe("Filter by age group"),
    use_case: z.string().optional().describe("Filter by use case (e.g. 'narrative_story')"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/voices", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_list_custom_voices",
  "List user's custom voice timbres, optionally filtered by language",
  {
    language: z.string().optional().describe("Filter by language"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/voices/custom", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

// ============================= ASSETS ======================================

server.tool(
  "joggai_list_music",
  "List available background music tracks with pagination",
  {
    page: z.number().optional().describe("Page number"),
    page_size: z.number().optional().describe("Items per page"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/musics", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_list_visual_styles",
  "List available visual styles/templates for product videos, optionally filtered by aspect ratio",
  {
    aspect_ratio: z.enum(["portrait", "landscape", "square"]).optional().describe("Filter by aspect ratio"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/visual_styles", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_upload_asset",
  "Get a signed upload URL for a media asset (image, video, or audio). After receiving the sign_url, upload the file via PUT request to that URL. Use the asset_url in subsequent video creation calls.",
  {
    filename: z.string().describe("Filename (e.g. 'product.jpg')"),
    content_type: z.string().describe("MIME type (e.g. 'image/jpeg', 'video/mp4', 'audio/mpeg')"),
    file_size: z.number().optional().describe("File size in bytes"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/upload/asset", params as Record<string, unknown>))
);

// ============================= AI SCRIPTS ==================================

server.tool(
  "joggai_create_ai_script",
  "Generate AI-powered video scripts based on product information. Returns a task_id to poll for results. Scripts are generated in multiple styles.",
  {
    language: z.string().describe("Script language (e.g. 'english', 'spanish', 'japanese')"),
    video_length_seconds: z.enum(["15", "30", "60"]).describe("Desired video length in seconds"),
    script_style: z.enum(["Don't Worry", "Storytime", "Discovery", "Data", "Top 3 reasons", "Light marketing"]).describe("Script writing style"),
    product_info: z.object({
      source_type: z.enum(["id", "details"]).describe("'id' to use product ID, 'details' to provide info directly"),
      data: z.object({
        id: z.string().optional().describe("Product ID (when source_type is 'id')"),
        name: z.string().optional().describe("Product name (when source_type is 'details')"),
        description: z.string().optional().describe("Product description (when source_type is 'details')"),
      }).describe("Product data"),
    }).describe("Product information for script generation"),
    target_audience: z.string().optional().describe("Target audience description"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/ai_scripts", params as Record<string, unknown>))
);

server.tool(
  "joggai_get_ai_script_result",
  "Check the status and retrieve results of an AI script generation task",
  {
    task_id: z.string().describe("Task ID from the script generation request"),
  },
  async ({ task_id }) =>
    formatResponse(await apiRequest("GET", `/ai_scripts/results/${task_id}`))
);

// ============================= PRODUCTS ====================================

server.tool(
  "joggai_create_product",
  "Create a product entry from a URL or manual details. This is Step 1 for product video generation. Returns a product_id.",
  {
    url: z.string().optional().describe("Product URL to analyze (e.g. Amazon link)"),
    name: z.string().optional().describe("Product name (required if no URL)"),
    description: z.string().optional().describe("Product description"),
    target_audience: z.string().optional().describe("Target audience"),
    media: z.array(z.object({
      type: z.number().describe("1=Image, 2=Video"),
      name: z.string().optional().describe("Media file name"),
      url: z.string().describe("Media URL"),
      description: z.string().optional().describe("Media description"),
    })).optional().describe("Product media (images/videos)"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/product", params as Record<string, unknown>))
);

server.tool(
  "joggai_update_product",
  "Update an existing product's information",
  {
    product_id: z.string().describe("Product ID to update"),
    name: z.string().optional().describe("Updated product name"),
    description: z.string().optional().describe("Updated description"),
    target_audience: z.string().optional().describe("Updated target audience"),
    media: z.array(z.object({
      type: z.number().describe("1=Image, 2=Video"),
      name: z.string().optional(),
      url: z.string(),
      description: z.string().optional(),
    })).optional().describe("Updated media resources"),
  },
  async (params) =>
    formatResponse(await apiRequest("PUT", "/product", params as Record<string, unknown>))
);

// ============================= TEMPLATES ===================================

server.tool(
  "joggai_list_index_templates",
  "List public index templates, optionally filtered by aspect ratio",
  {
    aspect_ratio: z.enum(["portrait", "landscape", "square"]).optional().describe("Filter by aspect ratio"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/templates", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_list_custom_templates",
  "List user's custom templates, optionally filtered by aspect ratio",
  {
    aspect_ratio: z.enum(["portrait", "landscape", "square"]).optional().describe("Filter by aspect ratio"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/templates/custom", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_get_template_by_id",
  "Get detailed information about a specific custom template including its variables",
  {
    id: z.number().describe("Template ID"),
  },
  async ({ id }) =>
    formatResponse(await apiRequest("GET", `/template/custom/${id}`))
);

// ============================= VIDEO CREATION ==============================

server.tool(
  "joggai_create_avatar_video",
  "Create a talking avatar video with script or audio input. Returns a video_id. Poll joggai_get_avatar_video_status for result.",
  {
    avatar: z.object({
      avatar_type: z.number().describe("0=Public avatar, 1=Custom avatar"),
      avatar_id: z.number().describe("Avatar ID"),
    }).describe("Avatar configuration"),
    voice: z.object({
      type: z.enum(["script", "audio"]).describe("'script' for TTS, 'audio' for custom audio"),
      voice_id: z.string().describe("Voice ID for TTS"),
      script: z.string().optional().describe("Text script (required when type='script')"),
      audio_url: z.string().optional().describe("Audio URL (required when type='audio')"),
    }).describe("Voice configuration"),
    aspect_ratio: z.enum(["portrait", "landscape", "square"]).describe("Output video aspect ratio"),
    screen_style: z.number().describe("1=Full screen, 2=Split screen, 3=Picture in picture"),
    caption: z.boolean().optional().describe("Enable subtitles"),
    webhook_url: z.string().optional().describe("Webhook URL for completion notification"),
    video_name: z.string().optional().describe("Custom video name"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/create_video_from_avatar", params as Record<string, unknown>))
);

server.tool(
  "joggai_create_product_video",
  "Create a video from a product with customizable visual style, avatar, voice, and script. Returns a video_id.",
  {
    product_id: z.string().describe("Product ID from product creation"),
    visual_style: z.string().optional().describe("Visual style name"),
    video_spec: z.object({
      aspect_ratio: z.enum(["portrait", "landscape", "square"]).optional().describe("Video aspect ratio"),
      length: z.enum(["15", "30", "60"]).describe("Video length in seconds"),
      caption: z.boolean().optional().describe("Enable subtitles"),
      name: z.string().optional().describe("Video name"),
    }).describe("Video specification"),
    avatar: z.object({
      id: z.number().describe("Avatar ID"),
      type: z.number().optional().describe("0=Public, 1=Custom"),
    }).describe("Avatar configuration"),
    voice: z.object({
      id: z.string().optional().describe("Voice ID for TTS"),
    }).describe("Voice configuration"),
    audio: z.object({
      music_id: z.number().optional().describe("Background music ID"),
    }).optional().describe("Audio configuration"),
    script: z.object({
      style: z.enum(["Don't Worry", "Storytime", "Discovery", "Data", "Top 3 reasons", "Light marketing"]).describe("Script style"),
      language: z.string().describe("Script language"),
    }).describe("Script configuration"),
    override_script: z.string().optional().describe("Override the AI-generated script with custom text"),
    webhook_url: z.string().optional().describe("Webhook URL for completion notification"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/create_video_from_product", params as Record<string, unknown>))
);

server.tool(
  "joggai_submit_preview_list",
  "Submit multiple visual styles for preview generation from a product. Generates preview videos to compare before final render.",
  {
    product_id: z.string().describe("Product ID"),
    visual_styles: z.array(z.string()).describe("List of visual style names to preview"),
    video_spec: z.object({
      aspect_ratio: z.enum(["portrait", "landscape", "square"]).optional(),
      length: z.enum(["15", "30", "60"]).describe("Video length"),
      caption: z.boolean().optional(),
      name: z.string().optional(),
    }).describe("Video specification"),
    avatar: z.object({
      id: z.number().describe("Avatar ID"),
      type: z.number().optional().describe("0=Public, 1=Custom"),
    }).describe("Avatar configuration"),
    voice: z.object({
      id: z.string().optional().describe("Voice ID"),
    }).describe("Voice configuration"),
    audio: z.object({
      music_id: z.number().optional(),
    }).optional().describe("Audio configuration"),
    script: z.object({
      style: z.enum(["Don't Worry", "Storytime", "Discovery", "Data", "Top 3 reasons", "Light marketing"]),
      language: z.string(),
    }).describe("Script configuration"),
    override_script: z.string().optional(),
    webhook_url: z.string().optional(),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/create_video_from_product/preview_list", params as Record<string, unknown>))
);

server.tool(
  "joggai_render_preview",
  "Render a final video from a selected preview. Returns a video_id.",
  {
    preview_id: z.string().describe("Preview ID from preview list"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/create_video_from_product/render_single_preview", params as Record<string, unknown>))
);

server.tool(
  "joggai_create_template_video",
  "Create a video from a template with custom variables. Returns a video_id.",
  {
    template_id: z.number().describe("Template ID"),
    voice_language: z.string().describe("Voice language for TTS"),
    variables: z.array(z.object({
      type: z.enum(["text", "image", "video", "script"]).describe("Variable type"),
      name: z.string().describe("Variable name (must match template definition)"),
      properties: z.object({
        content: z.string().optional().describe("Text/script content"),
        url: z.string().optional().describe("Media URL (for image/video)"),
        asset_id: z.number().optional().describe("Asset ID (for image/video, from upload)"),
      }).describe("Variable properties"),
    })).describe("Template variables to fill"),
    video_name: z.string().optional().describe("Custom video name"),
    avatar_id: z.number().optional().describe("Override template avatar ID"),
    avatar_type: z.number().optional().describe("0=Public, 1=Custom"),
    voice_id: z.string().optional().describe("Override voice ID"),
    captions_enabled: z.boolean().optional().describe("Enable captions"),
    background_music_id: z.number().optional().describe("Background music ID"),
    disable_random_trans: z.boolean().optional().describe("Disable random transitions"),
    disable_random_moving: z.boolean().optional().describe("Disable random image effects"),
    disable_trans: z.boolean().optional().describe("Disable all transitions"),
    disable_moving: z.boolean().optional().describe("Disable all image effects"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/create_video_with_template", params as Record<string, unknown>))
);

// ============================= LIP SYNC ====================================

server.tool(
  "joggai_create_lip_sync_video",
  "Create a lip sync video by combining a source video with a target audio track. Returns a task_id.",
  {
    video_url: z.string().describe("Source video URL"),
    audio_url: z.string().describe("Source audio URL"),
    playback_type: z.enum(["normal", "normal_reverse", "normal_reverse_by_audio"]).optional().describe("Playback strategy when video is shorter than audio"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/create_lip_sync_video", params as Record<string, unknown>))
);

server.tool(
  "joggai_get_lip_sync_status",
  "Check the status of a lip sync video task",
  {
    task_id: z.string().describe("Lip sync task ID"),
  },
  async ({ task_id }) =>
    formatResponse(await apiRequest("GET", `/lip_sync_video/${task_id}`))
);

// ============================= VIDEO TRANSLATION ===========================

server.tool(
  "joggai_translate_video",
  "Translate a video into another language with AI voiceover and optional subtitles. Video must be 0-3 minutes. Returns a video_translate_id.",
  {
    video_url: z.string().describe("URL of the video to translate (must be publicly accessible)"),
    output_language: z.string().describe("Target language (e.g. 'spanish', 'french', 'japanese')"),
    output_voice: z.string().optional().describe("Specific voice ID for the target language"),
    add_subtitles: z.boolean().optional().describe("Generate subtitle file (default true)"),
    title: z.string().optional().describe("Title for the translated video"),
    translate_audio_only: z.boolean().optional().describe("Translate audio only, no lip sync (default false)"),
    enable_dynamic_duration: z.boolean().optional().describe("Enable dynamic duration adjustment"),
    callback_url: z.string().optional().describe("Callback URL for status notifications"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/video_translate/", params as Record<string, unknown>))
);

server.tool(
  "joggai_get_translation_status",
  "Check the status of a video translation task. Returns video URL and subtitle URL when completed.",
  {
    video_translate_id: z.string().describe("Video translation task ID"),
  },
  async ({ video_translate_id }) =>
    formatResponse(await apiRequest("GET", `/video_translate/${video_translate_id}`))
);

server.tool(
  "joggai_list_translation_languages",
  "Get the list of supported target languages for video translation",
  {},
  async () => formatResponse(await apiRequest("GET", "/video_translate/target_languages"))
);

// ============================= VIDEO STATUS ================================

server.tool(
  "joggai_get_avatar_video_status",
  "Get avatar video information and status by video ID",
  {
    video_id: z.string().describe("Video ID from avatar video creation"),
  },
  async ({ video_id }) =>
    formatResponse(await apiRequest("GET", `/avatar_video/${video_id}`))
);

server.tool(
  "joggai_get_product_video_status",
  "Get product video generation status and details",
  {
    product_video_id: z.string().describe("Product video ID"),
  },
  async ({ product_video_id }) =>
    formatResponse(await apiRequest("GET", `/product_video/${product_video_id}`))
);

server.tool(
  "joggai_get_template_video_status",
  "Get template video status and details by video ID",
  {
    video_id: z.string().describe("Template video ID"),
  },
  async ({ video_id }) =>
    formatResponse(await apiRequest("GET", `/template_video/${video_id}`))
);

// ============================= VIDEO LISTS =================================

server.tool(
  "joggai_list_product_videos",
  "List generated product videos with pagination and filtering",
  {
    page: z.number().optional().describe("Page number"),
    page_size: z.number().optional().describe("Items per page"),
    status: z.number().optional().describe("Filter by status: 3=Processing, 4=Success, 5=Failed"),
    sort_by: z.string().optional().describe("Sort field (default 'created_at')"),
    sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/product_videos", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_list_product_previews",
  "List product preview videos with pagination and filtering",
  {
    page: z.number().optional().describe("Page number"),
    page_size: z.number().optional().describe("Items per page"),
    status: z.number().optional().describe("Filter by status: 3=Processing, 4=Success, 5=Failed"),
    sort_by: z.string().optional().describe("Sort field"),
    sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/product_previews", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

server.tool(
  "joggai_list_template_videos",
  "List template videos with pagination and filtering",
  {
    page: z.number().optional().describe("Page number"),
    page_size: z.number().optional().describe("Items per page"),
    status: z.number().optional().describe("Filter by status: 3=Processing, 4=Success, 5=Failed"),
    sort_by: z.string().optional().describe("Sort field"),
    sort_order: z.enum(["asc", "desc"]).optional().describe("Sort order"),
  },
  async (params) =>
    formatResponse(
      await apiRequest("GET", "/template_videos", undefined, params as Record<string, string | number | boolean | undefined>)
    )
);

// ============================= WEBHOOKS ====================================

server.tool(
  "joggai_list_webhook_endpoints",
  "List all webhook endpoints configured for the account",
  {},
  async () => formatResponse(await apiRequest("GET", "/endpoints"))
);

server.tool(
  "joggai_add_webhook_endpoint",
  "Create a new webhook endpoint to receive event notifications. Returns the endpoint_id and secret for signature verification.",
  {
    url: z.string().describe("Webhook endpoint URL (must be HTTPS)"),
    status: z.enum(["enabled", "disabled"]).describe("Initial status"),
    events: z.array(z.string()).describe("Event types to subscribe to (e.g. 'generated_avatar_video_success', 'generated_avatar_video_failed')"),
  },
  async (params) =>
    formatResponse(await apiRequest("POST", "/endpoint", params as Record<string, unknown>))
);

server.tool(
  "joggai_update_webhook_endpoint",
  "Update an existing webhook endpoint's URL, status, or subscribed events. The secret cannot be modified.",
  {
    endpoint_id: z.string().describe("Webhook endpoint ID"),
    url: z.string().describe("Updated webhook URL"),
    status: z.enum(["enabled", "disabled"]).describe("Updated status"),
    events: z.array(z.string()).describe("Updated event subscriptions"),
  },
  async ({ endpoint_id, ...body }) =>
    formatResponse(await apiRequest("PUT", `/endpoint/${endpoint_id}`, body as Record<string, unknown>))
);

server.tool(
  "joggai_delete_webhook_endpoint",
  "Delete a webhook endpoint. This cannot be undone.",
  {
    endpoint_id: z.string().describe("Webhook endpoint ID to delete"),
  },
  async ({ endpoint_id }) =>
    formatResponse(await apiRequest("DELETE", `/endpoint/${endpoint_id}`))
);

server.tool(
  "joggai_list_webhook_events",
  "List all available webhook event types that can be subscribed to",
  {},
  async () => formatResponse(await apiRequest("GET", "/events"))
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
