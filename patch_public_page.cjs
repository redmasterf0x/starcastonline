const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'starcast-employee-login-2/app/bands/[slug]/band-page-client.tsx');
let content = fs.readFileSync(p, 'utf8');

const targetStr = `                  <Button
                    variant="outline"
                    onClick={handleTogglePublic}
                    disabled={toggling}
                    className="border-[#20205a] text-[#f5f7ff] bg-transparent hover:bg-[#20205a]/30"
                  >
                    {isPublic ? "Make private" : "Make public"}
                  </Button>
                )}
              </div>
            </div>`;

const replaceStr = targetStr + `

            {/* Custom Links (Linktree style) */}
            {band.links && band.links.length > 0 && (
              <div className="mt-8 flex flex-col gap-3">
                {band.links.map((link: any, i: number) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-4 px-6 rounded-xl border border-[#20205a] bg-[#0c0c3f]/80 hover:bg-[#20205a]/60 text-[#f5f7ff] font-semibold text-lg transition-colors shadow-sm hover:border-[#ea6f2a]/50"
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync(p, content, 'utf8');
  console.log('patched');
} else {
  console.log('Could not find target string');
}
