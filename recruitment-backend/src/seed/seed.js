const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { BASE_SEED, generateSyntheticData } = require("./generateSynthetic");
const validateSyntheticData = require("./validateSynthetic");

const ENTITY_NAMES = [
  "departments",
  "skills",
  "requisitions",
  "screeningRules",
  "candidates",
  "candidateSkills",
  "resumeArtifacts",
  "applications",
  "interviewers",
  "interviews",
  "feedback",
  "offers",
];
const ID_FIELDS = {
  departments: "departmentId",
  skills: "skillId",
  requisitions: "requisitionId",
  screeningRules: "ruleId",
  candidates: "candidateId",
  candidateSkills: "candidateSkillId",
  resumeArtifacts: "resumeId",
  applications: "applicationId",
  interviewers: "interviewerId",
  interviews: "interviewId",
  feedback: "feedbackId",
  offers: "offerId",
};

const csvValue = (value) => {
  if (value == null) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const toCsv = (rows) => {
  const columns = Array.from(
    rows.reduce((keys, row) => {
      Object.keys(row).forEach((key) => keys.add(key));
      return keys;
    }, new Set())
  );
  return [
    columns.map(csvValue).join(","),
    ...rows.map((row) => columns.map((column) => csvValue(row[column])).join(",")),
  ].join("\r\n") + "\r\n";
};

const sqlValue = (value) => {
  if (value == null) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `'${text.replace(/'/g, "''")}'`;
};

const toSql = (data) => {
  const statements = [
    "CREATE TABLE IF NOT EXISTS synthetic_records (entity TEXT NOT NULL, record_id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (entity, record_id));",
  ];
  for (const entity of ENTITY_NAMES) {
    for (const row of data[entity]) {
      statements.push(
        `INSERT INTO synthetic_records (entity, record_id, payload) VALUES (${sqlValue(entity)}, ${sqlValue(row[ID_FIELDS[entity]])}, ${sqlValue(row)});`
      );
    }
  }
  return `${statements.join("\n")}\n`;
};

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const writeDataset = ({ outputDir, seed = BASE_SEED, scale = "starter" }) => {
  const data = generateSyntheticData({ seed, scale });
  const validation = validateSyntheticData(data);
  if (!validation.passed) {
    throw new Error(
      `Generated dataset validation failed: ${validation.issues.join("; ")}`
    );
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const { groundTruth, ...inputData } = data;
  const outputs = {
    "data.json": `${JSON.stringify(inputData, null, 2)}\n`,
    "ground_truth.json": `${JSON.stringify(groundTruth, null, 2)}\n`,
    "ground_truth.csv": toCsv(groundTruth),
    "seed-data.sql": toSql(data),
    "validation-summary.json": `${JSON.stringify(validation, null, 2)}\n`,
  };
  for (const entity of ENTITY_NAMES) {
    outputs[`${entity}.csv`] = toCsv(data[entity]);
  }
  for (const [name, content] of Object.entries(outputs)) {
    fs.writeFileSync(path.join(outputDir, name), content, "utf8");
  }

  const manifest = {
    formatVersion: 1,
    seed,
    scale,
    dataAsOf: data.metadata.dataAsOf,
    source: data.metadata.source,
    generator: "node src/seed/seed.js",
    counts: validation.counts,
    anomalies: data.groundTruth.map((item) => item.issue_type),
    sha256: Object.fromEntries(
      Object.entries(outputs).map(([name, content]) => [name, sha256(content)])
    ),
  };
  fs.writeFileSync(
    path.join(outputDir, "source_manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );
  return { data, validation, manifest };
};

const parseArgs = (args) => {
  const options = { seed: BASE_SEED, scale: "starter", outputDir: "generated-data" };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--seed") options.seed = Number(args[++index]);
    else if (flag === "--scale") options.scale = args[++index];
    else if (flag === "--out") options.outputDir = args[++index];
    else if (flag === "--help") options.help = true;
    else throw new Error(`Unknown argument: ${flag}`);
  }
  if (!Number.isInteger(options.seed)) throw new Error("--seed must be an integer");
  return options;
};

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(
        "Usage: node src/seed/seed.js [--scale starter|full] [--seed 20261022] [--out generated-data]"
      );
      process.exit(0);
    }
    const outputDir = path.resolve(process.cwd(), options.outputDir);
    const result = writeDataset({ ...options, outputDir });
    console.log(
      JSON.stringify(
        {
          outputDir,
          passed: result.validation.passed,
          counts: result.validation.counts,
          anomalies: result.data.groundTruth.length,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { parseArgs, toCsv, toSql, writeDataset };
