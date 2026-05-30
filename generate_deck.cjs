const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const html2pptx = require('./html2pptx');

const GLOBAL_STYLE = `
  body { width: 720pt; height: 405pt; margin: 0; padding: 0; background: #0F172A; overflow: hidden; }
  .slide { width: 100%; height: 100%; box-sizing: border-box; background: #0F172A; font-family: Arial, sans-serif; display: flex; flex-direction: column; color: #F8FAFC; padding: 30pt 40pt; overflow: hidden; position: relative; }
  h1.header { font-size: 32pt; font-weight: bold; color: #F8FAFC; margin-bottom: 10pt; font-family: Arial, sans-serif; }
  h2.subtitle { font-size: 16pt; color: #94A3B8; margin-bottom: 20pt; font-weight: normal; }
  .content { display: flex; flex-direction: column; flex-grow: 1; }
  ul { margin-top: 5pt; margin-bottom: 5pt; padding-left: 20pt; }
  li { font-size: 16pt; color: #CBD5E1; margin-bottom: 10pt; line-height: 1.3; }
  .li { font-size: 16pt; color: #CBD5E1; margin: 0 0 10pt 20pt; line-height: 1.3; }
  .box { background: #1E293B; border: 2pt solid #334155; padding: 15pt; border-radius: 8pt; margin-bottom: 15pt; }
  .code { font-family: Consolas, monospace; color: #38BDF8; font-size: 15pt; }
  .row { display: flex; flex-direction: row; justify-content: space-between; width: 100%; gap: 20pt; }
  .col { flex: 1; display: flex; flex-direction: column; }
  .terminal { background: #020617; border: 2pt solid #1E293B; padding: 12pt; border-radius: 6pt; font-family: Consolas, monospace; }
  .term-text { color: #E2E8F0; font-size: 12pt; line-height: 1.5; margin: 0; font-family: Consolas, monospace; }
  .term-green { color: #4ADE80; }
  .term-blue { color: #38BDF8; }
`;

const slides = [
  // SLIDE 1
  {
    name: 's1.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .title-center { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; }
      h1.main-title { font-size: 72pt; font-weight: bold; margin: 0; color: #F8FAFC; letter-spacing: 5pt; }
      h2.main-subtitle { font-size: 24pt; color: #38BDF8; margin-top: 10pt; font-weight: normal; font-family: Consolas, monospace; }
      p.tagline { font-size: 20pt; color: #94A3B8; margin-top: 30pt; }
      .badge { background: #1E293B; border: 2pt solid #334155; padding: 5pt 15pt; border-radius: 20pt; margin-top: 20pt; font-family: Consolas, monospace; color: #F8FAFC; }
    </style></head>
    <body><div class="slide title-center">
      <h1 class="main-title" data-animate="fade">ORK</h1>
      <h2 class="main-subtitle" data-animate="fade" data-animate-delay="0.5">Trust-Oriented Orchestration Runtime</h2>
      <p class="tagline" data-animate="fade" data-animate-delay="1.0">AI proposes. Humans approve.</p>
      <div class="badge" data-animate="fade" data-animate-delay="1.5"><p style="margin: 0;">v0.9.0-beta</p></div>
    </div></body></html>`
  },
  // SLIDE 2
  {
    name: 's2.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body><div class="slide">
      <h1 class="header">The Problem</h1>
      <h2 class="subtitle">Developers increasingly rely on AI-assisted tooling, but many systems lack visibility.</h2>
      <div class="row content">
        <div class="col box">
          <p style="font-size: 18pt; font-weight: bold; color: #EF4444; margin-bottom: 10pt;">Problems</p>
          <p class="li" data-animate="fade" data-animate-delay="0.5">• Hidden execution paths</p>
          <p class="li" data-animate="fade" data-animate-delay="1.0">• Excessive autonomy</p>
          <p class="li" data-animate="fade" data-animate-delay="1.5">• Difficult debugging</p>
          <p class="li" data-animate="fade" data-animate-delay="2.0">• Reduced operator control</p>
        </div>
        <div class="col box" data-animate="fade" data-animate-delay="2.5">
          <p style="font-size: 18pt; font-weight: bold; color: #4ADE80; margin-bottom: 10pt;" data-animate="fade" data-animate-delay="2.5">Engineers Need</p>
          <p class="li" data-animate="fade" data-animate-delay="2.5">• Explicit approval</p>
          <p class="li" data-animate="fade" data-animate-delay="2.5">• Deterministic behavior</p>
          <p class="li" data-animate="fade" data-animate-delay="2.5">• Clear execution visibility</p>
          <p class="li" data-animate="fade" data-animate-delay="2.5">• Hard trust boundaries</p>
        </div>
      </div>
    </div></body></html>`
  },
  // SLIDE 3
  {
    name: 's3.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body><div class="slide">
      <h1 class="header">What is ORK?</h1>
      <h2 class="subtitle">Local-first orchestration runtime designed for reviewable and controlled execution.</h2>
      <div class="content box" style="margin-top: 10pt;">
        <p class="li" data-animate="fade" data-animate-delay="0.5">• <b>AI-assisted planning:</b> Complex shell/file operations generated locally.</p>
        <p class="li" data-animate="fade" data-animate-delay="1.0">• <b>Human approval gates:</b> Interactive TUI requiring explicit validation.</p>
        <p class="li" data-animate="fade" data-animate-delay="1.5">• <span class="code">SAFE MODE</span> <b>by default:</b> Immutable operations until authorized.</p>
        <p class="li" data-animate="fade" data-animate-delay="2.0">• <b>Deterministic execution:</b> Predictable, step-by-step pipeline resolution.</p>
        <p class="li" data-animate="fade" data-animate-delay="2.5">• <b>Telemetry-free operation:</b> No tracking, no cloud abstractions.</p>
      </div>
    </div></body></html>`
  },
  // SLIDE 4
  {
    name: 's4.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .flow-box { border: 2pt solid #475569; padding: 4pt; width: 300pt; margin: 0 auto 2pt auto; background: #1E293B; border-radius: 4pt; }
      .flow-box p { font-size: 13pt; font-weight: bold; margin: 0; color: #F8FAFC; text-align: center; }
      .flow-arrow p { margin: 0; font-size: 12pt; text-align: center; color: #64748B; margin-bottom: 2pt; }
      .callout { background: #38BDF8; padding: 6pt; text-align: center; border-radius: 4pt; margin-top: 5pt; width: 400pt; margin-left: auto; margin-right: auto; }
      .callout p { font-weight: bold; font-size: 14pt; color: #0F172A; margin: 0; }
    </style></head>
    <body><div class="slide">
      <h1 class="header">Core Philosophy</h1>
      <h2 class="subtitle">SAFE MODE by default.</h2>
      <div class="content" style="width: 100%;">
        <div class="flow-box" data-animate="fade" data-animate-delay="0.5"><p data-animate="fade" data-animate-delay="0.5">AI Proposal</p></div>
        <div class="flow-arrow" data-animate="fade" data-animate-delay="1.0"><p data-animate="fade" data-animate-delay="1.0">↓</p></div>
        <div class="flow-box" data-animate="fade" data-animate-delay="1.5"><p data-animate="fade" data-animate-delay="1.5">Human Review</p></div>
        <div class="flow-arrow" data-animate="fade" data-animate-delay="2.0"><p data-animate="fade" data-animate-delay="2.0">↓</p></div>
        <div class="flow-box" data-animate="fade" data-animate-delay="2.5"><p data-animate="fade" data-animate-delay="2.5">Explicit Approval</p></div>
        <div class="flow-arrow" data-animate="fade" data-animate-delay="3.0"><p data-animate="fade" data-animate-delay="3.0">↓</p></div>
        <div class="flow-box" data-animate="fade" data-animate-delay="3.5"><p data-animate="fade" data-animate-delay="3.5">Execution</p></div>
        
        <div class="callout" data-animate="fade" data-animate-delay="4.5"><p data-animate="fade" data-animate-delay="4.5">Execution never occurs silently.</p></div>
      </div>
    </div></body></html>`
  },
  // SLIDE 5
  {
    name: 's5.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .arch-box { background: #1E293B; border: 2pt solid #475569; padding: 4pt; border-radius: 4pt; margin-bottom: 2pt; display: flex; flex-direction: row; justify-content: space-between; align-items: center; }
      .arch-title { font-size: 12pt; font-weight: bold; margin: 0; color: #F8FAFC; width: 220pt; }
      .arch-desc { font-size: 11pt; color: #94A3B8; margin: 0; font-family: Consolas, monospace; }
      .arr { text-align: center; color: #64748B; margin-bottom: 2pt; font-size: 12pt; }
      .arr p { margin: 0; }
    </style></head>
    <body><div class="slide">
      <h1 class="header">System Architecture</h1>
      <h2 class="subtitle">Rigid, transparent infrastructure.</h2>
      <div class="content" style="width: 100%; padding-left: 20pt; padding-right: 20pt;">
        
        <div class="arch-box" style="background: transparent; border: none; justify-content: center;" data-animate="fade" data-animate-delay="0.5"><p class="arch-title" style="text-align: center; width: 100%;" data-animate="fade" data-animate-delay="0.5">User</p></div>
        <div class="arr" data-animate="fade" data-animate-delay="0.8"><p data-animate="fade" data-animate-delay="0.8">↓</p></div>
        <div class="arch-box" style="border-color: #F8FAFC;" data-animate="fade" data-animate-delay="1.1"><p class="arch-title" style="text-align: center; width: 100%;" data-animate="fade" data-animate-delay="1.1">ORK Runtime</p></div>
        <div class="arr" data-animate="fade" data-animate-delay="1.4"><p data-animate="fade" data-animate-delay="1.4">↓</p></div>
        <div class="arch-box" style="border-left: 6pt solid #38BDF8;" data-animate="fade" data-animate-delay="1.7">
          <p class="arch-title" data-animate="fade" data-animate-delay="1.7">Planning Engine</p>
          <p class="arch-desc" data-animate="fade" data-animate-delay="4.0">→ AI proposes</p>
        </div>
        <div class="arr" data-animate="fade" data-animate-delay="2.0"><p data-animate="fade" data-animate-delay="2.0">↓</p></div>
        <div class="arch-box" style="border-left: 6pt solid #F59E0B;" data-animate="fade" data-animate-delay="2.3">
          <p class="arch-title" data-animate="fade" data-animate-delay="2.3">Approval Gate</p>
          <p class="arch-desc" data-animate="fade" data-animate-delay="4.5">→ Human approves</p>
        </div>
        <div class="arr" data-animate="fade" data-animate-delay="2.6"><p data-animate="fade" data-animate-delay="2.6">↓</p></div>
        <div class="arch-box" style="border-left: 6pt solid #4ADE80;" data-animate="fade" data-animate-delay="2.9">
          <p class="arch-title" data-animate="fade" data-animate-delay="2.9">Execution Pipeline</p>
          <p class="arch-desc" data-animate="fade" data-animate-delay="5.0">→ Deterministic execution</p>
        </div>
        <div class="arr" data-animate="fade" data-animate-delay="3.2"><p data-animate="fade" data-animate-delay="3.2">↓</p></div>
        <div class="arch-box" style="background: transparent; border: 2pt dashed #64748B; justify-content: center;" data-animate="fade" data-animate-delay="3.5"><p class="arch-title" style="text-align: center; width: 100%; color: #94A3B8;" data-animate="fade" data-animate-delay="3.5">System Tools (File System, Git, NPM)</p></div>

      </div>
    </div></body></html>`
  },
  // SLIDE 6
  {
    name: 's6.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body><div class="slide">
      <h1 class="header">Security Hardening</h1>
      <h2 class="subtitle">Operational safeguards designed to reduce unintended execution risk.</h2>
      <div class="content box" style="margin-top: 10pt;">
        <p class="li" data-animate="fade" data-animate-delay="0.5">• <b>Workspace Boundaries:</b> Strict directory limits prevent path traversal escapes.</p>
        <p class="li" data-animate="fade" data-animate-delay="1.0">• <b>Secret Redaction:</b> Active filtering of \`.env\` strings in stdout.</p>
        <p class="li" data-animate="fade" data-animate-delay="1.5">• <b>Atomic Writes:</b> Safe configuration persistence dodging OS locks.</p>
        <p class="li" data-animate="fade" data-animate-delay="2.0">• <b>Process Cleanup:</b> Aggressive SIGKILL/taskkill on orphaned execution trees.</p>
      </div>
    </div></body></html>`
  },
  // SLIDE 7
  {
    name: 's7.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body><div class="slide">
      <h1 class="header">Reliability Hardening</h1>
      <h2 class="subtitle">Designed to survive interruption, corruption, and runtime instability.</h2>
      <div class="content box" style="margin-top: 10pt;">
        <p class="li" data-animate="fade" data-animate-delay="0.5">• <b>Execution Limiter:</b> Global semaphores prevent parallel OOM crashes.</p>
        <p class="li" data-animate="fade" data-animate-delay="1.0">• <b>Config Recovery:</b> Automatic isolation and self-healing \`.corrupt\` configurations.</p>
        <p class="li" data-animate="fade" data-animate-delay="1.5">• <b>Terminal Restoration:</b> Guaranteed ANSI cursor reset on fatal exit.</p>
        <p class="li" data-animate="fade" data-animate-delay="2.0">• <b>Provider Resilience:</b> Async streams survive malformed JSON payloads.</p>
      </div>
    </div></body></html>`
  },
  // SLIDE 8
  {
    name: 's8.html',
    html: `<html><head><style>${GLOBAL_STYLE}</style></head>
    <body><div class="slide">
      <h1 class="header">Real Execution Flow</h1>
      <h2 class="subtitle">Terminal-native visibility.</h2>
      <div class="content terminal">
        <p class="term-text" data-animate="fade" data-animate-delay="0.5"><span class="term-blue">$</span> ork init</p>
        <p class="term-text" data-animate="fade" data-animate-delay="0.5">[ORK] Initializing workspace... <span class="term-green">Done.</span></p>
        <br data-animate="fade" data-animate-delay="0.5">
        <p class="term-text" data-animate="fade" data-animate-delay="1.0"><span class="term-blue">$</span> ork "Install express and run dev server"</p>
        <p class="term-text" data-animate="fade" data-animate-delay="1.5">[ORK] <span class="term-green">SAFE MODE</span> enabled. Planning execution...</p>
        <p class="term-text" data-animate="fade" data-animate-delay="2.0">[ORK] Proposed Action: <span class="term-blue">runCommand(npm install express)</span></p>
        <p class="term-text" data-animate="fade" data-animate-delay="2.5">[ORK] Awaiting approval (Y/n): Y</p>
        <p class="term-text" data-animate="fade" data-animate-delay="3.0">[ORK] Execution complete.</p>
        <br data-animate="fade" data-animate-delay="3.0">
        <p class="term-text" data-animate="fade" data-animate-delay="3.5"><span class="term-blue">^C</span></p>
        <p class="term-text" data-animate="fade" data-animate-delay="4.0">[ORK] Interruption trapped. Cleaning up subprocesses... <span class="term-green">Clean exit.</span></p>
      </div>
    </div></body></html>`
  },
  // SLIDE 9
  {
    name: 's9.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .stat-badge { background: #38BDF8; color: #0F172A; padding: 4pt 12pt; font-family: Consolas, monospace; font-size: 14pt; font-weight: bold; border-radius: 4pt; display: inline-block; margin-bottom: 5pt; }
    </style></head>
    <body><div class="slide">
      <h1 class="header">Public Technical Validation</h1>
      <h2 class="subtitle">Current project state and testing priorities.</h2>
      <div class="content">
        <div style="margin-bottom: 5pt;">
          <p style="color: #94A3B8; font-size: 12pt; font-weight: bold; margin-bottom: 5pt; text-transform: uppercase;" data-animate="fade" data-animate-delay="0.5">Version</p>
          <div class="stat-badge" data-animate="fade" data-animate-delay="0.5"><p style="margin: 0;" data-animate="fade" data-animate-delay="0.5">v0.9.0-beta</p></div>
        </div>
        <div>
          <p style="color: #94A3B8; font-size: 12pt; font-weight: bold; margin-bottom: 5pt; text-transform: uppercase;" data-animate="fade" data-animate-delay="1.0">Current Focus</p>
          <p class="li" data-animate="fade" data-animate-delay="1.5">• Windows Testing (Antivirus locks, taskkill)</p>
          <p class="li" data-animate="fade" data-animate-delay="2.0">• Runtime Stability (Event-loop non-blocking)</p>
          <p class="li" data-animate="fade" data-animate-delay="2.5">• Large Repositories (100k+ file symlink resolution)</p>
          <p class="li" data-animate="fade" data-animate-delay="3.0">• Provider Switching (Groq, Anthropic, Gemini)</p>
          <p class="li" data-animate="fade" data-animate-delay="3.5">• Reliability Feedback</p>
        </div>
      </div>
    </div></body></html>`
  },
  // SLIDE 10
  {
    name: 's10.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .link-text { font-family: Consolas, monospace; color: #38BDF8; font-size: 14pt; margin: 0; margin-bottom: 10pt; }
    </style></head>
    <body><div class="slide">
      <h1 class="header">Public Technical Validation</h1>
      <h2 class="subtitle">Help validate ORK in real-world environments.</h2>
      <div class="row content">
        <div class="col">
          <p style="color: #94A3B8; font-size: 12pt; font-weight: bold; margin-bottom: 10pt; text-transform: uppercase;" data-animate="fade" data-animate-delay="2.5">Resources</p>
          <p style="font-size: 14pt; color: #F8FAFC; margin-bottom: 5pt; font-weight: bold;" data-animate="fade" data-animate-delay="3.0">GitHub:</p>
          <p class="link-text" data-animate="fade" data-animate-delay="3.0">https://github.com/v7-vdev/ai-cli</p>
          
          <p style="font-size: 14pt; color: #F8FAFC; margin-bottom: 5pt; font-weight: bold; margin-top: 10pt;" data-animate="fade" data-animate-delay="3.5">Discord:</p>
          <p class="link-text" data-animate="fade" data-animate-delay="3.5">https://discord.gg/mJWFajpfgk</p>
        </div>
        <div class="col" style="border-left: 2pt solid #38BDF8; padding-left: 20pt;">
          <p style="color: #94A3B8; font-size: 12pt; font-weight: bold; margin-bottom: 10pt; text-transform: uppercase;" data-animate="fade" data-animate-delay="0.5">Looking For</p>
          <p class="li" data-animate="fade" data-animate-delay="1.0">• Technical Testers</p>
          <p class="li" data-animate="fade" data-animate-delay="1.5">• Bug Reports</p>
          <p class="li" data-animate="fade" data-animate-delay="2.0">• Reliability Feedback</p>
          <p class="li" data-animate="fade" data-animate-delay="2.5">• Open-Source Contributors</p>
        </div>
      </div>
    </div></body></html>`
  },
  // SLIDE 11
  {
    name: 's11.html',
    html: `<html><head><style>${GLOBAL_STYLE}
      .title-center { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; text-align: center; }
      h1.main-title { font-size: 64pt; font-weight: bold; margin: 0; color: #F8FAFC; margin-bottom: 20pt; }
      h2.main-subtitle { font-size: 20pt; color: #38BDF8; margin-top: 10pt; font-weight: normal; font-family: Consolas, monospace; }
      p.tagline { font-size: 16pt; color: #94A3B8; margin-top: 15pt; margin-bottom: 20pt; }
      p.link { font-family: Consolas, monospace; color: #F8FAFC; font-size: 14pt; margin: 5pt 0; }
      .footer { position: absolute; bottom: 20pt; left: 0; right: 0; text-align: center; }
      .footer p { color: #475569; font-size: 12pt; font-family: Consolas, monospace; margin: 0; }
    </style></head>
    <body><div class="slide title-center">
      <h1 class="main-title" data-animate="fade" data-animate-delay="0.5">Thank You</h1>
      <h1 class="main-title" style="letter-spacing: 5pt; font-size: 72pt; margin-bottom: 0;" data-animate="fade" data-animate-delay="1.0">ORK</h1>
      <h2 class="main-subtitle" data-animate="fade" data-animate-delay="1.5">Trust-Oriented Orchestration Runtime</h2>
      <p class="tagline" data-animate="fade" data-animate-delay="1.5">AI proposes. Humans approve.</p>
      
      <p class="link" data-animate="fade" data-animate-delay="2.0">GitHub: https://github.com/v7-vdev/ai-cli</p>
      <p class="link" data-animate="fade" data-animate-delay="2.5">Discord: https://discord.gg/mJWFajpfgk</p>

      <div class="footer"><p>Public Technical Validation</p></div>
    </div></body></html>`
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
  
  // Also copy it to the user's ai-cli folder
  const destPath = 'D:\\\\ai-cli\\\\ORK_Technical_Deck.pptx';
  fs.copyFileSync(outPath, destPath);
  console.log('Copied presentation to ' + destPath);
}

generate().catch(console.error);
