const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'starcast-employee-login-2/app/community/page.tsx');
let content = fs.readFileSync(p, 'utf8');

// Change "No band pages yet..." text
content = content.replace(
  `"No band pages yet. Create one from your dashboard's Artist Portal."`,
  `"No creator pages yet. Create one from your dashboard's Portal."`
);

// Add Badge for type
const targetRender = `<Link href={\`/bands/\${b.slug}\`} className="flex items-center gap-3 group">
                            {b.logo_url ? (
                              <Image
                                src={b.logo_url || "/placeholder.svg"}
                                alt={b.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-xl object-cover border border-[#20205a] flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-[#20205a]/50 border border-[#20205a] flex items-center justify-center flex-shrink-0">
                                <Music className="w-5 h-5 text-[#9a9fc4]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[#f5f7ff] group-hover:text-[#ea6f2a] transition-colors truncate">
                                {b.name}
                              </h3>`;

const replaceRender = `<Link href={\`/bands/\${b.slug}\`} className="flex items-center gap-3 group">
                            {b.logo_url ? (
                              <Image
                                src={b.logo_url || "/placeholder.svg"}
                                alt={b.name}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-xl object-cover border border-[#20205a] flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-[#20205a]/50 border border-[#20205a] flex items-center justify-center flex-shrink-0">
                                <Music className="w-5 h-5 text-[#9a9fc4]" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-[#f5f7ff] group-hover:text-[#ea6f2a] transition-colors truncate">
                                  {b.name}
                                </h3>
                                {b.type && b.type !== "band" && (
                                  <Badge className="px-1.5 py-0 text-[10px] uppercase tracking-wider bg-[#20205a]/60 text-[#9a9fc4] hover:bg-[#20205a]">
                                    {b.type}
                                  </Badge>
                                )}
                              </div>`;
                              
if (content.includes(targetRender)) {
  content = content.replace(targetRender, replaceRender);
  fs.writeFileSync(p, content, 'utf8');
  console.log('patched');
} else {
  console.log('Could not find target block to patch');
}
