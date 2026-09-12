const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'app/portal/page.tsx');
let content = fs.readFileSync(p, 'utf8');

const oldTypeButtons = `<div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setBandForm({ ...bandForm, type: "band" })}
                    className={\`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors \${
                      bandForm.type !== "artist"
                        ? "border-[#ea6f2a] bg-[#ea6f2a]/10 text-[#ea6f2a]"
                        : "border-[#20205a] text-[#9a9fc4] hover:border-[#9a9fc4]/50"
                    }\`}
                  >
                    Band
                  </button>
                  <button
                    type="button"
                    onClick={() => setBandForm({ ...bandForm, type: "artist" })}
                    className={\`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors \${
                      bandForm.type === "artist"
                        ? "border-[#ea6f2a] bg-[#ea6f2a]/10 text-[#ea6f2a]"
                        : "border-[#20205a] text-[#9a9fc4] hover:border-[#9a9fc4]/50"
                    }\`}
                  >
                    Solo Artist
                  </button>
                </div>`;

const newTypeButtons = `<div className="grid grid-cols-3 gap-2 mt-1.5">
                  {[
                    { id: "band", label: "Band" },
                    { id: "artist", label: "Artist" },
                    { id: "producer", label: "Producer" },
                    { id: "dj", label: "DJ" },
                    { id: "podcast", label: "Podcast" },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBandForm({ ...bandForm, type: t.id })}
                      className={\`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors \${
                        (bandForm.type || "band") === t.id
                          ? "border-[#ea6f2a] bg-[#ea6f2a]/10 text-[#ea6f2a]"
                          : "border-[#20205a] text-[#9a9fc4] hover:border-[#9a9fc4]/50"
                      }\`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>`;

content = content.replace(oldTypeButtons, newTypeButtons);
fs.writeFileSync(p, content, 'utf8');
console.log('patched');
