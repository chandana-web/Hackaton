const { generateSyntheticData } = require("../src/seed/generateSynthetic");
const validateSyntheticData = require("../src/seed/validateSynthetic");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { writeDataset } = require("../src/seed/seed");

describe("synthetic dataset generator", () => {
  test("is deterministic for the same seed and scale", () => {
    const first = generateSyntheticData({ seed: 20261022, scale: "starter" });
    const second = generateSyntheticData({ seed: 20261022, scale: "starter" });
    expect(first).toEqual(second);
  });

  test("starter scale includes all five labelled anomalies and reconciles", () => {
    const data = generateSyntheticData({ seed: 20261022, scale: "starter" });
    const result = validateSyntheticData(data);

    expect(data.requisitions).toHaveLength(10);
    expect(data.candidates).toHaveLength(200);
    expect(data.applications).toHaveLength(300);
    expect(data.interviews).toHaveLength(60);
    expect(data.offers).toHaveLength(15);
    expect(data.groundTruth.map((item) => item.issue_type).sort()).toEqual([
      "closed_role_with_active_applications",
      "duplicate_application",
      "interviewer_conflict",
      "offer_outside_approved_band",
      "stage_advanced_without_feedback",
    ]);
    expect(result.passed).toBe(true);
  });

  test("full scale meets the requested baseline volumes", () => {
    const data = generateSyntheticData({ seed: 20261022, scale: "full" });
    expect(data.requisitions).toHaveLength(100);
    expect(data.candidates).toHaveLength(2000);
    expect(data.applications).toHaveLength(3000);
    expect(data.interviews).toHaveLength(600);
    expect(data.offers).toHaveLength(150);
    expect(validateSyntheticData(data).passed).toBe(true);
  });

  test("writes ground truth separately and deterministic checksums", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "recruitment-seed-test-"));
    try {
      const first = writeDataset({
        seed: 20261022,
        scale: "starter",
        outputDir: path.join(root, "first"),
      });
      const second = writeDataset({
        seed: 20261022,
        scale: "starter",
        outputDir: path.join(root, "second"),
      });
      const input = JSON.parse(
        fs.readFileSync(path.join(root, "first", "data.json"), "utf8")
      );
      const labels = JSON.parse(
        fs.readFileSync(path.join(root, "first", "ground_truth.json"), "utf8")
      );

      expect(input.groundTruth).toBeUndefined();
      expect(labels).toHaveLength(5);
      expect(first.manifest.sha256).toEqual(second.manifest.sha256);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
