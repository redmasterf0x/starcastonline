const { execSync } = require("child_process");

try {
  const out = execSync("netlify api listSiteDeploys --data \"{\\\"site_id\\\":\\\"e8452328-1b25-4f58-82cc-1c63a95c4c9c\\\"}\"", { encoding: "utf8" });
  const deploys = JSON.parse(out);
  console.log("Latest 5 Netlify Deploys:");
  deploys.slice(0, 5).forEach(d => {
    console.log({
      id: d.id,
      state: d.state,
      created_at: d.created_at,
      commit_ref: d.commit_ref,
      error_message: d.error_message,
      branch: d.branch
    });
  });
} catch (e) {
  console.error("Error:", e.stdout || e.message);
}
