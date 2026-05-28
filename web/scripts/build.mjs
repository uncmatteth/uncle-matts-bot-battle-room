import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");
const source = path.join(repoRoot, "server", "src", "public", "index.html");
const dist = path.join(webRoot, "dist");
const target = path.join(dist, "index.html");

const apiUrl = process.env.AGENT_ROOM_API_URL || "";
const wsUrl = process.env.AGENT_ROOM_WS_URL || "";

let html = fs.readFileSync(source, "utf8");
const configScript = `<script>
window.AGENT_ROOM_API_URL = ${JSON.stringify(apiUrl)};
window.AGENT_ROOM_WS_URL = ${JSON.stringify(wsUrl)};
</script>`;

html = html.replace("</head>", `${configScript}\n</head>`);
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.writeFileSync(target, html);

console.log(`Built ${target}`);
