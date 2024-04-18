import Papa from 'papaparse';
import { promises as fs } from 'fs';
import { Dataset } from '../typing/types';


export async function getData(): Promise<Dataset> {
  try {
    const filePath = `${process.cwd()}/app/data/dataset.csv`;
    const fileContent = await fs.readFile(filePath, 'utf8');
    const parsedData = Papa.parse(fileContent, { header: true }).data;
    const extractedData = parsedData.slice(0,100).map((row: any, index) => ({
      description: row['context'],
      choiceA: row['action1'],
      choiceB: row['action2'],
      id:row["scenario_id"]
    }));

    return extractedData;
  } catch (error) {
    console.error('Failed to read or parse the dataset:', error);
    throw error;  
  }
}
