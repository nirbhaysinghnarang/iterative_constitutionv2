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
    { field: 'match', headerName: 'Alignment', width: 100, valueGetter: getValueMatch, renderCell: RenderMatchChip }
];

export default function FinalComponent({ c, iterations, testIndices, dataset, baseline }: FinalComponentProps) {
    
    const [rows, setRows] = useState<Row[]>(baseline.filter((b, i) => testIndices.includes(i)).map(r => {
        return { ...r, lmResponse: null }
    }));
    const [loading, setLoading] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);

    const [res, setRes] = useState<SurveyResults|null>(null);

    const calculateAccuracy = (rows: Row[]) => {
        const total = rows.length;
        const correct = rows.filter(row => row.lmResponse?.choice === row.userResponse).length;
        return total > 0 ? (correct / total) * 100 : 0;
    };

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
        setAccuracy(calculateAccuracy(updatedRows));
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

            {accuracy !== null && (
                <Typography variant="h6" style={{ marginTop: 20 }}>
                    Model Accuracy: {accuracy.toFixed(2)}%
                </Typography>

            )}


            {accuracy !== null && res && (
                <Button className="bg-purple-950 text-white hover:bg-purple-1000" variant="contained"
                onClick={()=>{publishResults(res)}}
                >
                    Publish results

                </Button>
            )}

            {rows.length > 0 && (
                <DataGrid
                    rows={rows}
                    columns={datagridCols}
                    pagination={true}
                    rowHeight={300}
                />
            )}
        </div>
    );
}
