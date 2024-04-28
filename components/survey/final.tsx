import { invokeLLM } from "@/app/lm/invokeLM";
import { Baseline, Dataset, Iteration, LMResponse, Row, SurveyResults, constitution } from "@/app/typing/types";
import { TextField, Typography, Button, Chip, CircularProgress } from "@mui/material";
import { useState } from "react";
import Box from "@mui/material/Box";
import { RenderChipCell, EditableChipCell } from "./step-1";
import { GridRenderEditCellParams } from "@mui/x-data-grid/models/params/gridCellParams";
import { capitalizeFirstLetter } from "./iteration";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { publishResults } from "@/app/publish/publish.client";

function RenderMetricsCell(params: any) {
    return (
        <div>
            <Typography variant="body2">Accuracy: {params.value.accuracy.toFixed(2)}</Typography>
            <Typography variant="body2">Precision: {params.value.precision.toFixed(2)}</Typography>
            <Typography variant="body2">Recall: {params.value.recall.toFixed(2)}</Typography>
            <Typography variant="body2">F1 Score: {params.value.f1Score.toFixed(2)}</Typography>
        </div>
    );
}

function calculateMetrics(rows: Row[]) {
    // Placeholder for metrics calculation logic
    return {
        accuracy: 0, // Placeholder for accuracy calculation
        precision: 0, // Placeholder for precision calculation
        recall: 0 // Placeholder for recall calculation
    };
}

interface FinalComponentProps {
    c: constitution,
    iterations: Iteration[],
    testIndices: number[],
    dataset: Dataset,
    baseline: Baseline[]
}

function RenderDescriptionCell(params: any) {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxHeight: '100%',
            overflow: 'auto',
            textAlign: 'left',
            lineHeight: '5px',
            whiteSpace: 'normal',
            padding:'20px',
            px: 1,
        }}>
            {params.value}
        </Box>
    );
}

function RenderChoiceCell(params: any) {
    return (
        <Box sx={{ overflowY: 'scroll', whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {params.value}
        </Box>
    );
}

function getValueChoice(_: any, row: any) {

    return row && row.lmResponse ? row.lmResponse.choice : null;
}

function getValueRationale(_: any, row: any) {
    return row && row.lmResponse ? row.lmResponse.rationale : null;
}

function getValueMatch(_: any, row: any) {
    return row && row.lmResponse && row.userResponse ? row.lmResponse.choice === row.userResponse : false;
}

function RenderMatchChip(params: any) {
    return (
        <Chip
            style={{
                backgroundColor: params.value ? "green" : "red",
                color: "white"
            }}
            label={capitalizeFirstLetter(params.value ? 'True' : 'False')}
        />
    );
}

const datagridCols: GridColDef<Row>[] = [
    { field: 'description', headerName: 'Description', width: 300, renderCell: RenderDescriptionCell },
    { field: 'choiceA', headerName: 'Choice A', width: 300, renderCell: RenderChoiceCell },
    { field: 'choiceB', headerName: 'Choice B', width: 300, renderCell: RenderChoiceCell },
    { field: 'userResponse', headerName: 'Your Choice', width: 100, editable: true, renderCell: RenderChipCell },
    { field: 'lmResponseChoice', headerName: 'Model Choice', width: 100, valueGetter: getValueChoice, renderCell: RenderChipCell },
    { field: 'lmResponseRationale', headerName: 'Model Explanation', width: 300, valueGetter: getValueRationale, renderCell: RenderDescriptionCell },
    { field: 'match', headerName: 'Alignment', width: 100, valueGetter: getValueMatch, renderCell: RenderMatchChip },
    { field: 'metrics', headerName: 'Metrics', width: 200, renderCell: RenderMetricsCell, valueGetter: (params: any) => params.row.metrics }
];

export default function FinalComponent({ c, iterations, testIndices, dataset, baseline }: FinalComponentProps) {
    const [rows, setRows] = useState<Row[]>(baseline.filter((b, i) => testIndices.includes(i)).map(r => {
        return { ...r, lmResponse: null }
    }));
    const [loading, setLoading] = useState(false);

    const [res, setRes] = useState<SurveyResults|null>(null);
    const [metrics, setMetrics] = useState<{ accuracy: number; precision: number; recall: number; f1Score: number; } | null>(null);


    const handleRunTestSet = async () => {
        setLoading(true);
        const responses = await Promise.all(rows.map(row => invokeLLM({
            scenario: row.description,
            constitution: c,
            actionA: row.choiceA,
            actionB: row.choiceB
        }))) as LMResponse[];

        const updatedRows = rows.map((row, index) => ({
            ...row,
            lmResponse: responses[index]
        }));

        setRows(updatedRows);
        setLoading(false);

        setRes(
            {
                iterations:iterations,
                constitution:c,
                initialRows:baseline,
                modelAccuracy:calculateAccuracy(updatedRows)
            }
        )


    };

    return (
        <div className="flex-1 w-full flex flex-col gap-20 items-center p-10">
            <TextField
                multiline
                rows={10}
                fullWidth
                value={c}
                label="Final Constitution"
                variant="outlined"
                InputProps={{ readOnly: true }}
            />

            <Button
                variant="contained"
                className="bg-purple-950 text-white hover:bg-purple-1000"
                onClick={handleRunTestSet}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : "Run on Test Set"}
            </Button>



            {accuracy !== null && res && (
                <Button className="bg-purple-950 text-white hover:bg-purple-1000" variant="contained"
                onClick={()=>{publishResults(res)}}
                >
                    Publish results

                </Button>
            )}

            {metrics && (
                <div>
                    <Typography variant="h6">Accuracy: {metrics.accuracy}</Typography>
                    <Typography variant="h6">Precision: {metrics.precision}</Typography>
                    <Typography variant="h6">Recall: {metrics.recall}</Typography>
                    <Typography variant="h6">F1 Score: {metrics.f1Score}</Typography>
                </div>
            )}
            {rows.length > 0 && (
                <DataGrid
                    rows={rows}
                    columns={datagridCols}
                    pagination={true}
                    rowHeight={150}
                />
            )}
        </div>
    );
}
