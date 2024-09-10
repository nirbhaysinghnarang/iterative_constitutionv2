import Papa from "papaparse";
import { promises as fs } from "fs";
import { Dataset, GenerationRule, scenario } from "../typing/types";

export async function getData(): Promise<Dataset> {
  const trainSize = 40;
  const testSize = 12;

  try {
    const filePath = `${process.cwd()}/app/data/refined_dataset.csv`;
    const fileContent = await fs.readFile(filePath, "utf8");
    const parsedData = Papa.parse(fileContent, { header: true }).data;

    const scenarios: scenario[] = parsedData.slice(0,5).map((row: any) => ({
      description: row["context"],
      choiceA: row["action1"],
      choiceB: row["action2"],
      id: row["scenario_id"],
      generationRule: row["generation_rule"] as GenerationRule,
    }));

    // Create a map to hold scenarios by generationRule
    const categories = new Map<GenerationRule, scenario[]>();
    scenarios.forEach((scenario) => {
      const category = scenario.generationRule!;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)?.push(scenario);
    });

    let train: scenario[] = [];
    let test: scenario[] = [];
    let trainIndices: number[] = [];
    let testIndices: number[] = [];

    categories.forEach((scens, category) => {
      // Shuffle array to randomize selection
      scens.sort(() => Math.random() - 0.5);

      // Ensure each category is represented in both train and test
      const minPerCategory = 1;
      const numTrain = Math.max(
        minPerCategory,
        Math.floor(trainSize * (scens.length / scenarios.length))
      );
      const numTest = Math.max(
        minPerCategory,
        Math.floor(testSize * (scens.length / scenarios.length))
      );

      train = train.concat(scens.slice(0, numTrain));
      test = test.concat(scens.slice(numTrain, numTrain + numTest));

      // Capture the indices
      trainIndices = trainIndices.concat(
        scens.slice(0, numTrain).map((s) => scenarios.indexOf(s))
      );
      testIndices = testIndices.concat(
        scens
          .slice(numTrain, numTrain + numTest)
          .map((s) => scenarios.indexOf(s))
      );
    });

    // Shuffle the final arrays to avoid any category clustering
    train.sort(() => Math.random() - 0.5);
    test.sort(() => Math.random() - 0.5);
    trainIndices.sort(() => Math.random() - 0.5);
    testIndices.sort(() => Math.random() - 0.5);

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
