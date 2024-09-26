import { invokeLLM } from "@/app/lm/invokeLM";
import { Baseline, Dataset, Iteration, LMResponse, Row, SurveyResults, constitution } from "@/app/typing/types";
import { TextField, Typography, Button, Chip, CircularProgress } from "@mui/material";
import { useState, useEffect, useMemo } from "react"
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { RenderChipCell, EditableChipCell } from "./step-1";
import { GridRenderEditCellParams } from "@mui/x-data-grid/models/params/gridCellParams";
import { capitalizeFirstLetter, renderCellWithTooltip } from "./iteration";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { publishResults } from "@/app/publish/publish.client";

interface FinalComponentProps {
    c: constitution,
    iterations: Iteration[],
    testIndices: number[],
    trainIndices: number[],
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
            padding: '20px',
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

const datagridCols = [
    {
        field: 'description', headerName: 'Description', width: 300, editable: false,
        innerHeight: 600,
        renderCell: (params: any) => (renderCellWithTooltip(params))
    },
    {
        field: 'choiceA', headerName: 'Choice A', width: 300, editable: false,
        innerHeight: 400,
        renderCell: (params: any) => (renderCellWithTooltip(params))
    }, {
        field: 'choiceB', headerName: 'Choice B', width: 300, editable: false,
        innerHeight: 400,
        renderCell: (params: any) => (renderCellWithTooltip(params))
    }, {
        field: 'userResponse', headerName: 'Your choice', width: 100, editable: true,
        innerHeight: 400,
        renderCell: RenderChipCell,
        renderEditCell: (params: GridRenderEditCellParams) => (
            <EditableChipCell id={params.id} value={params.value?.toString() || ''} field={params.field} />
        )
    },
    {
        field: 'lmResponseChoice',  // Custom field key, not directly mapping to data structure
        headerName: 'Model choice',
        width: 100,
        valueGetter: (_: any, row: any) => { return row.lmResponse ? row.lmResponse.choice : null },
        renderCell: RenderChipCell,
        renderEditCell: (params: GridRenderEditCellParams) => (
            <EditableChipCell id={params.id} value={params.value?.toString() || ''} field="lmResponse.choice" />
        )
    },
    {
        field: 'lmResponseRationale',  // Custom field key, not directly mapping to data structure
        headerName: 'Model explanation',
        width: 300,
        valueGetter: (_: any, row: any) => { return row.lmResponse ? row.lmResponse.rationale : null },
        renderCell: (params: any) => (renderCellWithTooltip(params))

    },
    {
        field: 'match',
        headerName: 'Alignment',
        width: 100,
        valueGetter: (_: any, row: any) => { return row.lmResponse && row.userResponse ? row.lmResponse.choice === row.userResponse : false },
        renderCell: (params: any) => {
            return <Chip sx={{
                backgroundColor: params.value ? "green" : "red",
                color: "white"
            }}
                label={capitalizeFirstLetter(params.value?.toString())}
            ></Chip>
        }
    }


]
export default function FinalComponent({ c, iterations, testIndices, trainIndices, dataset, baseline }: FinalComponentProps) {

    const [rows, setRows] = useState<Row[]>(baseline.map(r => {
        return { ...r, lmResponse: null }
    }));
    const [loading, setLoading] = useState(false);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [testAcc, setTestAcc] = useState<number | null>(null);
    const [trainAcc, setTrainAcc] = useState<number | null>(null);

    const [suc, setSuc] = useState(false)

    const [res, setRes] = useState<SurveyResults | null>(null);

    const calculateAccuracy = (rows: Row[]) => {
        const total = rows.length;
        const correct = rows.filter(row => row.lmResponse?.choice === row.userResponse).length;
        return total > 0 ? (correct / total) * 100 : 0;
    };

    const handleRunDataSet = async () => {
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
        setTestAcc(calculateAccuracy(updatedRows.filter((b, i) => testIndices.includes(i))));
        setTrainAcc(calculateAccuracy(updatedRows.filter((b, i) => trainIndices.includes(i))));
        setLoading(false);

        setRes(
            {
                iterations: iterations,
                constitution: c,
                initialRows: baseline,
                modelAccuracy: calculateAccuracy(updatedRows)
            }
        )



    };

    const [filter, setFilter] = useState('all');

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
    };

    const filteredRows = useMemo(() => {
        switch (filter) {
            case 'train':
                return rows.filter((b, i) => trainIndices.includes(i));
            case 'test':
                return rows.filter((b, i) => testIndices.includes(i));
            default:
                return rows;
        }
    }, [rows, filter]);

    if (suc) {
        return <div className="flex-1 w-full flex flex-col gap-20 items-center p-10">

            <Typography variant="h6" style={{ marginTop: 20 }}>
               Thank you for taking our survey
            </Typography>
        </div>

    }





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
                onClick={handleRunDataSet}
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : "Run on Full Data Set"}
            </Button>

            {accuracy !== null && (
                <div>
                <Typography variant="h6" style={{ marginTop: 20 }}>
                    Model Overall Accuracy: {accuracy.toFixed(2)}% {"\n"} 
                    Model Train Accuracy: {trainAcc!.toFixed(2)}%  {"\n"}
                    Model Test Accuracy: {testAcc!.toFixed(2)}%  {"\n"}
                </Typography>
                <Typography variant="h6" style={{ marginTop: 20 }}>
                    Iteration Based Accuracies:{"\n"}
                    <div>
                        {iterations.map((iteration, index) => (
                            <div key={index}>
                                <strong>Iteration {index}:</strong>{"\n"}
                                Train Accuracy: {iteration.accuracy}{"\n"}
                                Test Accuracy: {iteration.test_accuracy}{"\n"}
                            </div>
                        ))}
                    </div>
                </Typography>
                </div>

            )}


            {accuracy !== null && res && (
                <Button className="bg-purple-950 text-white hover:bg-purple-1000" variant="contained"
                    onClick={() => {
                        setLoading(true)
                        publishResults(res).then(() => {alert("Uploaded results!"); setSuc(true)}).catch(() => alert("An error occured while uploading")).finally(() => setLoading(false))

            }
                
                }
                >
            Publish results

        </Button>
    )
}

{
    
    rows.length > 0 && (
        <div>
        <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={() => handleFilterChange('all')} color="primary">
                All
            </Button>
            <Button variant="outlined" onClick={() => handleFilterChange('train')} color="secondary">
                Train
            </Button>
            <Button variant="outlined" onClick={() => handleFilterChange('test')} color="error">
                Test
            </Button>
        </Stack>
        <DataGrid
            rows={filteredRows}
            columns={datagridCols}
            pagination={true}
            rowHeight={300}
        />
        </div>
    )
}
                
        </div >
    );
}
