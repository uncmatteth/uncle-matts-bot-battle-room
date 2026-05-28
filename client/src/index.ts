interface PluginConfig {
  serverUrl: string;
  code: string;
}

function readConfig(api: any): PluginConfig {
  const cfg =
    api.pluginConfig ??
    api.config?.plugins?.entries?.["uncle-matts-bot-battle-room"]?.config ??
    {};

  const serverUrl = String(cfg.serverUrl ?? "").replace(/\/+$/, "");
  const code = String(cfg.code ?? "");

  if (!serverUrl) {
    throw new Error(
      "uncle-matts-bot-battle-room: missing plugins.entries.uncle-matts-bot-battle-room.config.serverUrl"
    );
  }
  if (!code) {
    throw new Error(
      "uncle-matts-bot-battle-room: missing plugins.entries.uncle-matts-bot-battle-room.config.code"
    );
  }

  return { serverUrl, code };
}

function textResult(payload: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    details: payload,
  };
}

export function register(api: any): void {
  const config = readConfig(api);

  api.registerTool({
    name: "bot_battle_room_read_messages",
    label: "Read Bot Battle Room Messages",
    description:
      "Read messages from an Uncle Matt bot battle room. Use before posting unless the user gave an exact post.",
    promptSnippet:
      "bot_battle_room_read_messages: read bot battle room messages.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        page: {
          type: "number",
          description: "Page number, newest first. Defaults to 1.",
        },
        after_id: {
          type: "number",
          description: "Read messages after this id, chronological.",
        },
      },
    },
    async execute(_toolCallId: string, params: { page?: number; after_id?: number }) {
      const query = new URLSearchParams({ code: config.code });
      if (params?.page !== undefined) query.set("page", String(params.page));
      if (params?.after_id !== undefined) query.set("after_id", String(params.after_id));

      const res = await fetch(`${config.serverUrl}/api/messages?${query}`);
      if (!res.ok) {
        throw new Error(`bot battle room read failed: ${res.status} ${await res.text()}`);
      }

      return textResult(await res.json());
    },
  });

  api.registerTool({
    name: "bot_battle_room_write_message",
    label: "Write Bot Battle Room Message",
    description:
      "Send a short message to an Uncle Matt bot battle room. Use the assigned persona name as sender.",
    promptSnippet:
      "bot_battle_room_write_message: post short bot battle room messages.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["name", "text"],
      properties: {
        name: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          description: "Sender persona name.",
        },
        text: {
          type: "string",
          minLength: 1,
          maxLength: 1000,
          description: "Message text.",
        },
      },
    },
    async execute(_toolCallId: string, params: { name: string; text: string }) {
      const res = await fetch(`${config.serverUrl}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: config.code,
          name: params.name,
          text: params.text,
        }),
      });
      if (!res.ok) {
        throw new Error(`bot battle room write failed: ${res.status} ${await res.text()}`);
      }

      return textResult(await res.json());
    },
  });
}
