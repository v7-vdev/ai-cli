const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const html2pptx = require('d:\\ai-cli\\.agents\\skills\\powerpoint\\scripts\\html2pptx.js');

const GLOBAL_STYLE = `
  body { width: 720pt; height: 405pt; margin: 0; padding: 0; background: #0F172A; font-family: Arial, sans-serif; display: flex; flex-direction: column; color: #F8FAFC; padding-left: 40pt; padding-right: 40pt; padding-top: 30pt; box-sizing: border-box; }
  h1.header { font-size: 32pt; font-weight: bold; color: #F8FAFC; margin-bottom: 10pt; border-bottom: 2pt solid #334155; padding-bottom: 10pt; }
  h2.subtitle { font-size: 16pt; color: #94A3B8; margin-bottom: 25pt; font-weight: normal; }
  .content { display: flex; flex-direction: column; flex-grow: 1; }
  ul { margin-top: 10pt; margin-bottom: 10pt; padding-left: 20pt; }
  li { font-size: 18pt; color: #CBD5E1; margin-bottom: 12pt; line-height: 1.4; }
  .box { background: #1E293B; border: 2pt solid #334155; padding: 20pt; border-radius: 8pt; margin-bottom: 15pt; }
  .code { font-family: Consolas, monospace; color: #38BDF8; font-size: 16pt; }
  .row { display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 20pt; }
  .col { flex: 1; display: flex; flex-direction: column; }
  .flow-box { background: #1E293B; border: 2pt solid #38BDF8; padding: 15pt; border-radius: 4pt; text-align: center; margin-bottom: 10pt; }
  .flow-arrow { text-align: center; color: #64748B; font-size: 20pt; margin-bottom: 10pt; }
  .terminal { background: #020617; border: 2pt solid #1E293B; padding: 15pt; border-radius: 6pt; font-family: Consolas, monospace; }
  .term-text { color: #E2E8F0; font-size: 12pt; line-height: 1.5; margin: 0; font-family: Consolas, monospace; }
  .term-green { color: #4ADE80; }
  .term-blue { color: #38BDF8; }
`;

const slides = [
  // SLIDE 1
  {
    name: 's1.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      body { justify-content: center; align-items: center; text-align: center; padding: 0; }
      .title { font-size: 54pt; font-weight: bold; margin-bottom: 20pt; color: #F8FAFC; }
      .st { font-size: 24pt; color: #94A3B8; margin-bottom: 40pt; }
      .motto { font-size: 18pt; color: #E2E8F0; line-height: 1.5; margin-bottom: 40pt; }
      .badge { background: #1E293B; border: 2pt solid #334155; padding: 8pt 16pt; border-radius: 6pt; }
      .badge p { font-family: Consolas, monospace; font-size: 14pt; color: #38BDF8; margin: 0; }
    </style></head>
    <body>
      <h1 class="title">ORK</h1>
      <p class="st">Trust-Oriented Orchestration Runtime</p>
      <p class="motto">AI proposes.<br>Humans approve.</p>
      <div class="badge"><p>v0.9.0-beta</p></div>
    </body></html>`
  },
  // SLIDE 2
  {
    name: 's2.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body>
      <h1 class="header">The Problem</h1>
      <h2 class="subtitle">Many AI tools execute too much automatically, hiding execution details.</h2>
      <div class="row content">
        <div class="col box">
          <p style="font-size: 20pt; font-weight: bold; color: #EF4444; margin-bottom: 15pt;">Problems</p>
          <ul>
            <li>Hidden execution paths</li>
            <li>Excessive autonomy</li>
            <li>Difficult debugging</li>
            <li>Reduced operator control</li>
          </ul>
        </div>
        <div class="col box">
          <p style="font-size: 20pt; font-weight: bold; color: #4ADE80; margin-bottom: 15pt;">Engineers Need</p>
          <ul>
            <li>Explicit approval</li>
            <li>Deterministic behavior</li>
            <li>Clear execution visibility</li>
            <li>Hard trust boundaries</li>
          </ul>
        </div>
      </div>
    </body></html>`
  },
  // SLIDE 3
  {
    name: 's3.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body>
      <h1 class="header">What is ORK?</h1>
      <h2 class="subtitle">Local-first orchestration runtime designed for reviewable and controlled execution.</h2>
      <div class="content box" style="margin-top: 20pt;">
        <ul>
          <li><b>AI-assisted planning:</b> Complex shell/file operations generated locally.</li>
          <li><b>Human approval gates:</b> Interactive TUI requiring explicit Y/n validation.</li>
          <li><span class="code">SAFE MODE</span> <b>by default:</b> Immutable operations until authorized.</li>
          <li><b>Deterministic execution:</b> Predictable, step-by-step pipeline resolution.</li>
          <li><b>Telemetry-free operation:</b> No tracking, no cloud abstractions.</li>
        </ul>
      </div>
    </body></html>`
  },
  // SLIDE 4
  {
    name: 's4.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .flow-box { border-color: #475569; padding: 12pt; width: 300pt; margin: 0 auto 10pt auto; }
      .flow-box p { font-size: 16pt; font-weight: bold; margin: 0; color: #F8FAFC; }
      .flow-arrow p { margin: 0; font-size: 16pt; }
      .callout { background: #38BDF8; color: #0F172A; padding: 12pt; font-weight: bold; font-size: 16pt; text-align: center; border-radius: 4pt; margin-top: 20pt; }
    </style></head>
    <body>
      <h1 class="header">Core Philosophy</h1>
      <h2 class="subtitle">SAFE MODE by default.</h2>
      <div class="content" style="text-align: center; width: 100%;">
        <div class="flow-box" style="border-color: #38BDF8;"><p>AI Proposal</p></div>
        <div class="flow-arrow"><p>↓</p></div>
        <div class="flow-box" style="border-color: #F59E0B;"><p>Human Review</p></div>
        <div class="flow-arrow"><p>↓</p></div>
        <div class="flow-box" style="border-color: #4ADE80;"><p>Explicit Approval</p></div>
        <div class="flow-arrow"><p>↓</p></div>
        <div class="flow-box" style="border-color: #94A3B8;"><p>Execution</p></div>
        
        <div class="callout"><p>Execution never occurs silently.</p></div>
      </div>
    </body></html>`
  },
  // SLIDE 5
  {
    name: 's5.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .arch-box { background: #1E293B; border: 2pt solid #475569; padding: 10pt; border-radius: 4pt; margin-bottom: 5pt; display: flex; flex-direction: row; justify-content: space-between; align-items: center; }
      .arch-title { font-size: 16pt; font-weight: bold; margin: 0; color: #F8FAFC; width: 250pt; }
      .arch-desc { font-size: 14pt; color: #94A3B8; margin: 0; font-family: Consolas, monospace; }
      .arr { text-align: center; color: #64748B; margin-bottom: 5pt; font-size: 14pt; }
      .arr p { margin: 0; }
    </style></head>
    <body>
      <h1 class="header">System Architecture</h1>
      <h2 class="subtitle">Rigid, transparent infrastructure.</h2>
      <div class="content" style="width: 100%; padding-left: 40pt; padding-right: 40pt;">
        
        <div class="arch-box" style="background: transparent; border: none; justify-content: center;"><p class="arch-title" style="text-align: center; width: 100%;">User</p></div>
        <div class="arr"><p>↓</p></div>
        <div class="arch-box" style="border-color: #F8FAFC;"><p class="arch-title" style="text-align: center; width: 100%;">ORK Runtime</p></div>
        <div class="arr"><p>↓</p></div>
        <div class="arch-box" style="border-left: 6pt solid #38BDF8;">
          <p class="arch-title">Planning Engine</p>
          <p class="arch-desc">→ AI proposes</p>
        </div>
        <div class="arr"><p>↓</p></div>
        <div class="arch-box" style="border-left: 6pt solid #F59E0B;">
          <p class="arch-title">Approval Gate</p>
          <p class="arch-desc">→ Human approves</p>
        </div>
        <div class="arr"><p>↓</p></div>
        <div class="arch-box" style="border-left: 6pt solid #4ADE80;">
          <p class="arch-title">Execution Pipeline</p>
          <p class="arch-desc">→ Deterministic execution</p>
        </div>
        <div class="arr"><p>↓</p></div>
        <div class="arch-box" style="background: transparent; border: 2pt dashed #64748B; justify-content: center;"><p class="arch-title" style="text-align: center; width: 100%; color: #94A3B8;">System Tools (File System, Git, NPM)</p></div>

      </div>
    </body></html>`
  },
  // SLIDE 6
  {
    name: 's6.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body>
      <h1 class="header">Security Hardening</h1>
      <h2 class="subtitle">Operational safeguards designed to reduce unintended execution risk.</h2>
      <div class="content box" style="margin-top: 20pt;">
        <ul>
          <li><b>Workspace Boundaries:</b> Strict directory limits prevent path traversal.</li>
          <li><b>Secret Redaction:</b> Active filtering of `.env` strings in stdout.</li>
          <li><b>Atomic Writes:</b> Safe configuration persistence dodging OS locks.</li>
          <li><b>Process Cleanup:</b> Aggressive SIGKILL/taskkill on orphaned execution trees.</li>
        </ul>
      </div>
    </body></html>`
  },
  // SLIDE 7
  {
    name: 's7.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body>
      <h1 class="header">Reliability Hardening</h1>
      <h2 class="subtitle">Designed to survive interruption, corruption, and runtime instability.</h2>
      <div class="content box" style="margin-top: 20pt;">
        <ul>
          <li><b>Execution Limiter:</b> Global semaphores prevent parallel OOM crashes.</li>
          <li><b>Config Recovery:</b> Automatic `.corrupt` isolation and self-healing keys.</li>
          <li><b>Terminal Restoration:</b> Guaranteed ANSI cursor reset on fatal exit.</li>
          <li><b>Provider Resilience:</b> Async streams survive malformed JSON payloads.</li>
        </ul>
      </div>
    </body></html>`
  },
  // SLIDE 8
  {
    name: 's8.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body>
      <h1 class="header">Real Execution Flow</h1>
      <h2 class="subtitle">Terminal-native visibility.</h2>
      <div class="content terminal">
        <p class="term-text"><span class="term-blue">$</span> ork init</p>
        <p class="term-text">[ORK] Initializing workspace... <span class="term-green">Done.</span></p>
        <br>
        <p class="term-text"><span class="term-blue">$</span> ork "Install express and run dev server"</p>
        <p class="term-text">[ORK] <span class="term-green">SAFE MODE</span> enabled. Planning execution...</p>
        <p class="term-text">[ORK] Proposed Action: <span class="term-blue">runCommand(npm install express)</span></p>
        <p class="term-text">[ORK] Awaiting approval (Y/n): Y</p>
        <p class="term-text">[ORK] Execution complete.</p>
        <br>
        <p class="term-text"><span class="term-blue">^C</span></p>
        <p class="term-text">[ORK] Interruption trapped. Cleaning up subprocesses... <span class="term-green">Clean exit.</span></p>
      </div>
    </body></html>`
  },
  // SLIDE 9
  {
    name: 's9.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .stat-badge { background: #38BDF8; color: #0F172A; padding: 4pt 12pt; font-family: Consolas, monospace; font-size: 16pt; font-weight: bold; border-radius: 4pt; display: inline-block; margin-bottom: 20pt; }
    </style></head>
    <body>
      <h1 class="header">Public Technical Validation</h1>
      <h2 class="subtitle">Current project state and testing priorities.</h2>
      <div class="content box">
        <div style="margin-bottom: 20pt;">
          <p style="color: #94A3B8; font-size: 14pt; font-weight: bold; margin-bottom: 5pt; text-transform: uppercase;">Version</p>
          <div class="stat-badge"><p style="margin: 0;">v0.9.0-beta</p></div>
        </div>
        <div>
          <p style="color: #94A3B8; font-size: 14pt; font-weight: bold; margin-bottom: 10pt; text-transform: uppercase;">Current Focus</p>
          <ul>
            <li>Windows Testing (Antivirus locks, taskkill)</li>
            <li>Runtime Stability (Event-loop non-blocking)</li>
            <li>Large Repositories (100k+ file symlink resolution)</li>
            <li>Provider Switching (Groq, Anthropic, Gemini)</li>
            <li>Reliability Feedback</li>
          </ul>
        </div>
      </div>
    </body></html>`
  },
  // SLIDE 10
  {
    name: 's10.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .link-text { font-family: Consolas, monospace; color: #38BDF8; font-size: 18pt; margin: 0; }
    </style></head>
    <body>
      <h1 class="header">Public Technical Validation</h1>
      <h2 class="subtitle">Help validate ORK in real-world environments.</h2>
      <div class="row content">
        <div class="col box">
          <p style="color: #94A3B8; font-size: 14pt; font-weight: bold; margin-bottom: 10pt; text-transform: uppercase;">Resources</p>
          <p style="font-size: 16pt; color: #F8FAFC; margin-bottom: 5pt;">GitHub:</p>
          <p class="link-text" style="margin-bottom: 20pt;">https://github.com/v7-vdev/ai-cli</p>
          
          <p style="font-size: 16pt; color: #F8FAFC; margin-bottom: 5pt;">Discord:</p>
          <p class="link-text">https://discord.gg/mJWFajpfgk</p>
        </div>
        <div class="col box" style="border-color: #38BDF8;">
          <p style="color: #94A3B8; font-size: 14pt; font-weight: bold; margin-bottom: 10pt; text-transform: uppercase;">Looking For</p>
          <ul style="margin-top: 0;">
            <li>Technical Testers</li>
            <li>Bug Reports</li>
            <li>Reliability Feedback</li>
            <li>Open-Source Contributors</li>
          </ul>
        </div>
      </div>
    </body></html>`
  }
];

async function generate() {
  const tmpDir = path.join(__dirname, 'tmp_slides');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = 'ORK Core Team';
  pptx.title = 'ORK Technical Presentation';

  for (const s of slides) {
    const filePath = path.join(tmpDir, s.name);
    fs.writeFileSync(filePath, s.html);
    await html2pptx(filePath, pptx);
  }

  const outPath = path.join(process.cwd(), 'ORK_Technical_Deck.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log('Created presentation at ' + outPath);
}

generate().catch(console.error);
