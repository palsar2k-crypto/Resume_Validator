/**
 * Resume Validator - Client Logic
 * Realistic front-end mock parsing engine & skill gap analyzer
 */

// Benchmark skill definitions per target role
const ROLE_BENCHMARKS = {
  fullstack: {
    title: "Full Stack Engineer",
    skills: [
      "React", "TypeScript", "Node.js", "Express", "Next.js", 
      "PostgreSQL", "MongoDB", "REST APIs", "GraphQL", "Docker", 
      "Git", "CI/CD", "Tailwind CSS", "Redis", "Jest"
    ]
  },
  frontend: {
    title: "Frontend Developer (React / Next.js)",
    skills: [
      "React", "TypeScript", "Next.js", "JavaScript (ES6+)", "HTML5", 
      "CSS3", "Tailwind CSS", "Redux", "Vite", "Responsive Design", 
      "Web Performance", "Jest", "Cypress", "Accessibility (a11y)", "Git"
    ]
  },
  backend: {
    title: "Backend Engineer (Node / Python / Go)",
    skills: [
      "Node.js", "Python", "Go", "PostgreSQL", "Redis", 
      "Docker", "Kubernetes", "Microservices", "REST APIs", "GraphQL", 
      "AWS", "Kafka", "SQL", "Unit Testing", "System Design"
    ]
  },
  devops: {
    title: "DevOps & Cloud Architect",
    skills: [
      "Kubernetes", "Docker", "Terraform", "AWS", "Linux", 
      "CI/CD Pipelines", "GitHub Actions", "Prometheus", "Grafana", 
      "Ansible", "Bash Scripting", "Helm", "Cloud Security", "Networking", "Git"
    ]
  },
  ai: {
    title: "AI / ML Engineer",
    skills: [
      "Python", "PyTorch", "TensorFlow", "Hugging Face", "LLMs", 
      "LangChain", "RAG Architecture", "Vector DBs", "NumPy", "Pandas", 
      "Scikit-learn", "MLOps", "Docker", "REST APIs", "Git"
    ]
  }
};

// Preset mock profiles for instant demonstration
const PRESET_DATA = {
  high: {
    fileName: "Senior_FullStack_Engineer_Resume.pdf",
    presentRate: 0.82,
    skillVariance: ["React", "TypeScript", "Node.js", "PostgreSQL", "REST APIs", "Git", "Next.js", "Tailwind CSS", "Docker", "Express", "MongoDB"],
    expScore: 92,
    formatScore: 94
  },
  mid: {
    fileName: "MidLevel_Developer_Resume.pdf",
    presentRate: 0.65,
    skillVariance: ["React", "JavaScript (ES6+)", "Node.js", "REST APIs", "Git", "HTML5", "CSS3", "Tailwind CSS"],
    expScore: 74,
    formatScore: 82
  },
  junior: {
    fileName: "Junior_Transition_Resume.pdf",
    presentRate: 0.40,
    skillVariance: ["HTML5", "CSS3", "JavaScript (ES6+)", "Git", "REST APIs"],
    expScore: 50,
    formatScore: 78
  }
};

// State Store
let currentScanState = {
  roleKey: "fullstack",
  fileName: "candidate_resume.pdf",
  fileSize: "1.4 MB",
  matchedSkills: [],
  missingSkills: [],
  score: 0,
  breakdown: {
    skillPct: 0,
    expPct: 0,
    formatPct: 0
  }
};

// DOM References
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("resume-file-input");
const browseBtn = document.getElementById("browse-btn");
const scanningState = document.getElementById("scanning-state");
const resultsDashboard = document.getElementById("results-dashboard");
const roleSelect = document.getElementById("target-role");

// Scanning DOM Elements
const scanStepTitle = document.getElementById("scan-step-title");
const scanStepDesc = document.getElementById("scan-step-desc");
const scanFileName = document.getElementById("scan-file-name");
const progressFill = document.getElementById("progress-fill");
const scanPercentage = document.getElementById("scan-percentage");

// Result DOM Elements
const resFileName = document.getElementById("res-file-name");
const resBenchmarkBadge = document.getElementById("res-benchmark-badge");
const scoreDisplay = document.getElementById("score-display");
const scoreStatusBadge = document.getElementById("score-status-badge");
const scoreVerdictText = document.getElementById("score-verdict-text");
const scoreGaugeCircle = document.getElementById("score-gauge-circle");

const metricSkillPct = document.getElementById("metric-skill-pct");
const meterSkills = document.getElementById("meter-skills");
const metricExpPct = document.getElementById("metric-exp-pct");
const meterExp = document.getElementById("meter-exp");
const metricFormatPct = document.getElementById("metric-format-pct");
const meterFormat = document.getElementById("meter-format");

const statPresentCount = document.getElementById("stat-present-count");
const statMissingCount = document.getElementById("stat-missing-count");
const badgePresentTotal = document.getElementById("badge-present-total");
const badgeMissingTotal = document.getElementById("badge-missing-total");

const presentTagsList = document.getElementById("present-tags-list");
const missingTagsList = document.getElementById("missing-tags-list");
const recommendationText = document.getElementById("recommendation-text");

const btnReupload = document.getElementById("btn-reupload");
const btnPrintSummary = document.getElementById("btn-print-summary");
const btnCopySummary = document.getElementById("btn-copy-summary");
const toastContainer = document.getElementById("toast-container");
const themeToggleBtn = document.getElementById("theme-toggle");

// SVG Icons Helpers
const CHECK_ICON_SVG = `
  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
`;

const CROSS_ICON_SVG = `
  <svg class="tag-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
`;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupEventListeners();
});

// Theme Management (Dark / Light)
function initTheme() {
  const savedTheme = localStorage.getItem("rv-theme");
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme ? savedTheme : (prefersDark ? "dark" : "dark");
  applyTheme(initialTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("rv-theme", theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  showToast(`Theme switched to ${newTheme.toUpperCase()} mode`, "info");
}

function setupEventListeners() {
  // Click browse button
  browseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  // Click entire drop zone
  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Drag & drop handlers
  ["dragenter", "dragover"].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("drag-over");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  // Preset buttons
  document.querySelectorAll(".btn-preset").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const presetKey = btn.dataset.preset;
      triggerPresetScan(presetKey);
    });
  });

  // Target role change
  roleSelect.addEventListener("change", (e) => {
    currentScanState.roleKey = e.target.value;
    // If results are already showing, dynamically re-calculate
    if (!resultsDashboard.classList.contains("hidden")) {
      recalculateCurrentResume();
    }
  });

  // Re-upload button
  btnReupload.addEventListener("click", resetToUploadZone);

  // Theme toggle button
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  // Print / Export button
  btnPrintSummary.addEventListener("click", () => {
    window.print();
  });

  // Copy Summary button
  btnCopySummary.addEventListener("click", copySummaryToClipboard);
}

// Handle User's PDF File
function handleFileSelected(file) {
  if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    showToast("Please upload a valid PDF document (.pdf)", "error");
    return;
  }

  const fileName = file.name;
  const fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB";

  startScanProcess(fileName, fileSize, null);
}

// Handle Quick Presets
function triggerPresetScan(presetKey) {
  const preset = PRESET_DATA[presetKey];
  if (!preset) return;

  startScanProcess(preset.fileName, "1.2 MB", preset);
}

// Simulated Parsing Pipeline
function startScanProcess(fileName, fileSize, customPreset) {
  // Update state
  currentScanState.fileName = fileName;
  currentScanState.fileSize = fileSize;
  scanFileName.textContent = `${fileName} (${fileSize})`;

  // Switch views
  dropZone.classList.add("hidden");
  resultsDashboard.classList.add("hidden");
  scanningState.classList.remove("hidden");

  // Step definitions
  const steps = [
    { pct: 18, title: "Extracting PDF streams & fonts...", desc: "Decompressing layout structure and text chunks" },
    { pct: 45, title: "Classifying sections & credentials...", desc: "Identifying Work Experience, Projects, and Education" },
    { pct: 75, title: "Cross-referencing technical skills...", desc: `Matching tokens against ${ROLE_BENCHMARKS[roleSelect.value].title}` },
    { pct: 95, title: "Synthesizing ATS score & skill gaps...", desc: "Calculating semantic weight and formatting integrity" },
    { pct: 100, title: "Scan complete!", desc: "Rendering final score breakdown" }
  ];

  let stepIdx = 0;
  progressFill.style.width = "0%";
  scanPercentage.textContent = "0%";

  const interval = setInterval(() => {
    if (stepIdx < steps.length) {
      const step = steps[stepIdx];
      progressFill.style.width = `${step.pct}%`;
      scanPercentage.textContent = `${step.pct}%`;
      scanStepTitle.textContent = step.title;
      scanStepDesc.textContent = step.desc;
      stepIdx++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        completeScan(customPreset);
      }, 350);
    }
  }, 380);
}

// Finish Parsing & Build Results
function completeScan(customPreset) {
  const roleKey = roleSelect.value;
  const benchmark = ROLE_BENCHMARKS[roleKey];
  const allBenchmarkSkills = [...benchmark.skills];

  let presentSkills = [];
  let missingSkills = [];
  let score = 0;
  let expScore = 80;
  let formatScore = 88;

  if (customPreset) {
    // Known preset logic
    allBenchmarkSkills.forEach(skill => {
      if (customPreset.skillVariance.includes(skill)) {
        presentSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });
    expScore = customPreset.expScore;
    formatScore = customPreset.formatScore;
  } else {
    // Dynamic mock for uploaded PDF: deterministic hash based on filename length
    const hashSeed = currentScanState.fileName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    allBenchmarkSkills.forEach((skill, index) => {
      // Deterministically split into matched or missing
      if ((hashSeed + index) % 3 !== 0) {
        presentSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    // Make sure at least a few skills are present and a few are missing
    if (presentSkills.length === 0) {
      presentSkills = allBenchmarkSkills.slice(0, 5);
      missingSkills = allBenchmarkSkills.slice(5);
    } else if (missingSkills.length === 0) {
      missingSkills = presentSkills.splice(-3);
    }

    expScore = 70 + (hashSeed % 25);
    formatScore = 80 + (hashSeed % 18);
  }

  // Calculate scores
  const skillRatio = presentSkills.length / allBenchmarkSkills.length;
  const skillCoveragePct = Math.round(skillRatio * 100);
  score = Math.round((skillCoveragePct * 0.55) + (expScore * 0.25) + (formatScore * 0.20));
  score = Math.min(98, Math.max(28, score));

  // Save to state
  currentScanState.matchedSkills = presentSkills;
  currentScanState.missingSkills = missingSkills;
  currentScanState.score = score;
  currentScanState.breakdown = {
    skillPct: skillCoveragePct,
    expPct: expScore,
    formatPct: formatScore
  };

  renderResultsUI();
}

// Re-evaluate if target role is changed while viewing
function recalculateCurrentResume() {
  const roleKey = roleSelect.value;
  const benchmark = ROLE_BENCHMARKS[roleKey];
  const allBenchmarkSkills = [...benchmark.skills];

  // Keep existing matched if in new benchmark, otherwise re-partition
  let present = [];
  let missing = [];

  allBenchmarkSkills.forEach(skill => {
    if (currentScanState.matchedSkills.includes(skill)) {
      present.push(skill);
    } else {
      missing.push(skill);
    }
  });

  // Guarantee minimum distribution
  if (present.length < 2) {
    present.push(...allBenchmarkSkills.slice(0, 4));
    missing = allBenchmarkSkills.filter(s => !present.includes(s));
  }

  currentScanState.matchedSkills = present;
  currentScanState.missingSkills = missing;

  const skillCoveragePct = Math.round((present.length / allBenchmarkSkills.length) * 100);
  const score = Math.round((skillCoveragePct * 0.55) + (currentScanState.breakdown.expPct * 0.25) + (currentScanState.breakdown.formatPct * 0.20));

  currentScanState.score = Math.min(98, Math.max(30, score));
  currentScanState.breakdown.skillPct = skillCoveragePct;

  renderResultsUI();
  showToast(`Updated analysis for ${benchmark.title}`, "info");
}

// Render Results to Screen
function renderResultsUI() {
  scanningState.classList.add("hidden");
  resultsDashboard.classList.remove("hidden");

  const benchmark = ROLE_BENCHMARKS[roleSelect.value];

  // Header info
  resFileName.textContent = currentScanState.fileName;
  resBenchmarkBadge.textContent = `Target Benchmark: ${benchmark.title}`;

  // Gauge & Verdict
  animateScoreGauge(currentScanState.score);

  // Status Badge
  updateStatusBadge(currentScanState.score);

  // Breakdown metrics
  metricSkillPct.textContent = `${currentScanState.breakdown.skillPct}%`;
  meterSkills.style.width = `${currentScanState.breakdown.skillPct}%`;

  metricExpPct.textContent = `${currentScanState.breakdown.expPct}%`;
  meterExp.style.width = `${currentScanState.breakdown.expPct}%`;

  metricFormatPct.textContent = `${currentScanState.breakdown.formatPct}%`;
  meterFormat.style.width = `${currentScanState.breakdown.formatPct}%`;

  // Counts
  const presentCount = currentScanState.matchedSkills.length;
  const missingCount = currentScanState.missingSkills.length;

  statPresentCount.textContent = presentCount;
  statMissingCount.textContent = missingCount;
  badgePresentTotal.textContent = `${presentCount} Detected`;
  badgeMissingTotal.textContent = `${missingCount} Gaps`;

  // Render Skill Tags
  renderSkillTags(presentTagsList, currentScanState.matchedSkills, "present");
  renderSkillTags(missingTagsList, currentScanState.missingSkills, "missing");

  // Recommendation message
  updateRecommendation(currentScanState.score, currentScanState.missingSkills);
}

// Animate Circular Gauge
function animateScoreGauge(targetScore) {
  const circle = scoreGaugeCircle;
  const radius = 68;
  const circumference = 2 * Math.PI * radius; // 427.26

  circle.style.strokeDasharray = `${circumference}`;
  
  // Color tone based on score
  let strokeColor = "#10b981"; // Emerald
  if (targetScore < 60) {
    strokeColor = "#f43f5e"; // Rose
  } else if (targetScore < 75) {
    strokeColor = "#f59e0b"; // Amber
  }
  circle.style.stroke = strokeColor;

  const targetOffset = circumference * (1 - targetScore / 100);
  
  // Trigger SVG offset animation
  setTimeout(() => {
    circle.style.strokeDashoffset = targetOffset;
  }, 50);

  // Animate counter number
  let currentNum = 0;
  const stepTime = 1400 / targetScore;
  const counterTimer = setInterval(() => {
    if (currentNum < targetScore) {
      currentNum++;
      scoreDisplay.textContent = currentNum;
    } else {
      clearInterval(counterTimer);
      scoreDisplay.textContent = targetScore;
    }
  }, Math.max(12, stepTime));
}

// Update Verdict and Badge
function updateStatusBadge(score) {
  scoreStatusBadge.className = "badge-status";

  if (score >= 80) {
    scoreStatusBadge.classList.add("high");
    scoreStatusBadge.textContent = "Strong Fit";
    scoreVerdictText.textContent = "This resume demonstrates high keyword density and strong alignment with standard ATS screening criteria.";
  } else if (score >= 60) {
    scoreStatusBadge.classList.add("moderate");
    scoreStatusBadge.textContent = "Moderate Match";
    scoreVerdictText.textContent = "A competitive baseline, but key technical competencies are missing to guarantee recruiter screening passes.";
  } else {
    scoreStatusBadge.classList.add("low");
    scoreStatusBadge.textContent = "Action Needed";
    scoreVerdictText.textContent = "Low keyword overlap detected for this role benchmark. High risk of ATS rejection without skill optimization.";
  }
}

// Render Skill Badges
function renderSkillTags(container, skills, type) {
  container.innerHTML = "";

  if (skills.length === 0) {
    const emptySpan = document.createElement("span");
    emptySpan.style.color = "var(--text-subtle)";
    emptySpan.style.fontSize = "0.85rem";
    emptySpan.textContent = type === "present" ? "No core benchmark skills detected." : "Zero gaps! Perfect coverage.";
    container.appendChild(emptySpan);
    return;
  }

  skills.forEach(skill => {
    const pill = document.createElement("div");
    pill.className = `skill-tag ${type}`;
    pill.innerHTML = `
      ${type === "present" ? CHECK_ICON_SVG : CROSS_ICON_SVG}
      <span>${skill}</span>
    `;
    container.appendChild(pill);
  });
}

// Recommendation Text
function updateRecommendation(score, missingSkills) {
  if (missingSkills.length === 0) {
    recommendationText.textContent = "Exceptional profile! Your resume covers every key technical requirement. Focus on quantifying recent career achievements and high-scale impact metrics.";
    return;
  }

  const sampleMissing = missingSkills.slice(0, 3).join(", ");
  if (score >= 80) {
    recommendationText.textContent = `You're in the top percentile! To push this resume into an unconditional interview call, add explicit examples incorporating ${sampleMissing} in your recent work history.`;
  } else if (score >= 60) {
    recommendationText.textContent = `Recommended action: Integrate high-priority keywords like ${sampleMissing} into your project descriptions, tech stack lists, and GitHub repositories.`;
  } else {
    recommendationText.textContent = `Critical skill gap detected: Modern screening filters expect proven competency in ${sampleMissing}. Consider adding relevant projects or hands-on implementations to your resume.`;
  }
}

// Reset to Upload Zone
function resetToUploadZone() {
  resultsDashboard.classList.add("hidden");
  scanningState.classList.add("hidden");
  dropZone.classList.remove("hidden");
  fileInput.value = "";
  scoreGaugeCircle.style.strokeDashoffset = "427.26";
  scoreDisplay.textContent = "0";
}

// Copy Summary to Clipboard
function copySummaryToClipboard() {
  const summary = `
=== Resume Validator Report ===
File: ${currentScanState.fileName}
Target Role: ${ROLE_BENCHMARKS[roleSelect.value].title}
Overall ATS Match Score: ${currentScanState.score} / 100

✅ SKILLS PRESENT (${currentScanState.matchedSkills.length}):
${currentScanState.matchedSkills.map(s => `- ${s}`).join("\n")}

❌ SKILLS MISSING (${currentScanState.missingSkills.length}):
${currentScanState.missingSkills.map(s => `- ${s}`).join("\n")}

Recommendation:
${recommendationText.textContent}
=========================================
  `.trim();

  navigator.clipboard.writeText(summary).then(() => {
    showToast("Resume analysis copied to clipboard!", "success");
  }).catch(() => {
    showToast("Unable to copy to clipboard", "error");
  });
}

// Toast System
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = "toast";
  
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "⚠️";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}

