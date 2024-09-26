import Papa from "papaparse";
import { promises as fs } from "fs";
import { Dataset, GenerationRule, scenario } from "../typing/types";
export async function getData(): Promise<Dataset> {
  const trainSize = 5;
  const testSize = 5;
  try {
    const filePath = `${process.cwd()}/app/data/refined_dataset.csv`;
    const fileContent = await fs.readFile(filePath, "utf8");
    const parsedData = Papa.parse(fileContent, { header: true }).data;
    const scenarios: scenario[] = parsedData.slice(0,10).map((row: any) => ({
      description: row["context"],
      choiceA: row["action1"],
      choiceB: row["action2"],
      id: row["scenario_id"],
      generationRule: row["generation_rule"] as GenerationRule,
    }));
    // Shuffle the scenarios
    const shuffledIndices = scenarios.map((_, index) => index).sort(() => Math.random() - 0.5);
    // Split into train and test indices
    const trainIndices = shuffledIndices.slice(0, trainSize);
    const testIndices = shuffledIndices.slice(trainSize, trainSize + testSize);
    return {
      scenarios: scenarios,
      trainIdx: trainIndices,
      testIdx: testIndices,
    };
  } catch (error) {
    console.error("Failed to read or parse the dataset:", error);
    throw error;
  }
}