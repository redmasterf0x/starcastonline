const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'starcast-employee-login-2/app/portal/page.tsx');
let content = fs.readFileSync(p, 'utf8');

// 1. Add import
if (!content.includes('BandLinksPanel')) {
  content = content.replace(
    `import { BandPostsPanel } from "@/components/portal/band-posts-panel"`,
    `import { BandPostsPanel } from "@/components/portal/band-posts-panel"\nimport { BandLinksPanel } from "@/components/portal/band-links-panel"`
  );
}

// 2. Add Links tab to portalTab state
if (!content.includes('portalTab, setPortalTab] = useState<"posts" | "links" | "studio" | "payments">')) {
  content = content.replace(
    `const [portalTab, setPortalTab] = useState<"posts" | "studio" | "payments">("posts")`,
    `const [portalTab, setPortalTab] = useState<"posts" | "links" | "studio" | "payments">("posts")`
  );
}

// 3. Add Links button
const postsButtonStr = `<button
                    onClick={() => setPortalTab("posts")}
                    className={\`inline-flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all \${portalTab === "posts"
                        ? "bg-[#0c0c3f]/70 text-[#ea6f2a] border border-b-0 border-[#20205a]/60 -mb-px shadow-inner"
                        : "text-[#9a9fc4] hover:text-[#f5f7ff] border border-transparent"}\`}
                  >
                    <Newspaper className="w-4 h-4" /> Posts
                  </button>`;
                  
const newTabButtons = postsButtonStr + `
                  <button
                    onClick={() => setPortalTab("links")}
                    className={\`inline-flex items-center gap-2 px-5 py-2.5 rounded-t-xl text-sm font-semibold transition-all \${portalTab === "links"
                        ? "bg-[#0c0c3f]/70 text-[#ea6f2a] border border-b-0 border-[#20205a]/60 -mb-px shadow-inner"
                        : "text-[#9a9fc4] hover:text-[#f5f7ff] border border-transparent"}\`}
                  >
                    <ExternalLink className="w-4 h-4" /> Links
                  </button>`;
                  
content = content.replace(postsButtonStr, newTabButtons);

// 4. Add Links panel
const postsPanelStr = `{portalTab === "posts" && (
                  <div className="pt-2">
                    <BandPostsPanel bandId={selectedBand.id} bandName={selectedBand.name} />
                  </div>
                )}`;
                
const linksPanelStr = postsPanelStr + `
                {portalTab === "links" && (
                  <div className="pt-2">
                    <BandLinksPanel band={selectedBand} onUpdated={() => refreshBands()} />
                  </div>
                )}`;

content = content.replace(postsPanelStr, linksPanelStr);

// 5. Update emptyBandForm to have links
content = content.replace(
  `const emptyBandForm: BandInput = { name: "", type: "band", genre: "", bio: "", contactEmail: "", contactPhone: "" }`,
  `const emptyBandForm: BandInput = { name: "", type: "band", genre: "", bio: "", contactEmail: "", contactPhone: "", links: [] }`
);

fs.writeFileSync(p, content, 'utf8');
console.log('patched');
