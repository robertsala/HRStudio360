// replace old Supabase project ID and URL everywhere
import fs from "fs";
import path from "path";

const root = "./";
const oldID = "cgqoazepziswoziybhiz";
const newID = "cgqoazepziswoziybhiz";
const oldURL = `https://${oldID}.supabase.co`;
const newURL = `https://${newID}.supabase.co`;

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (!["node_modules", "build", ".git"].includes(file)) walk(p);
    } else if (p.endsWith(".js") || p.endsWith(".jsx") || p.endsWith(".ts") || p.endsWith(".tsx") || p.endsWith(".env")) {
      let content = fs.readFileSync(p, "utf8");
      const orig = content;
      content = content.replaceAll(oldID, newID).replaceAll(oldURL, newURL);
      if (content !== orig) {
        fs.writeFileSync(p, content, "utf8");
        console.log("Updated:", p);
      }
    }
  }
}

walk(root);
console.log("✅ Replacement complete");

