"use client"
import { Baseline, Dataset, Iteration, LMResponse, Row } from "@/app/typing/types"
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams, GridRowModel, useGridApiContext } from '@mui/x-data-grid';
import { useState, useEffect, useMemo } from "react"
import { Box, List, ListItem, ListItemText, TextField, Typography, Chip, Button, Tooltip } from "@mui/material"
import Stack from "@mui/material/Stack";
import { EditableChipCell, RenderChipCell } from "./step-1";
import { invokeLLM } from "@/app/lm/invokeLM";

type IterationProps = {
    dataset: Baseline[],
    c:string|null
    count: number,
    setIterations: React.Dispatch<React.SetStateAction<Iteration[]>>

}
export const IterationStepsComponent = () => {
    return (
        <div style={{ width: "50%" }}>
            <Typography variant="h6" gutterBottom component="div">
                Iteration Steps
            </Typography>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                <ListItem>
                    <ListItemText primary="1. Enter your moral constitution" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="2. Run the LM" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="3. (Optional) Edit your existing answers based on the LM's output" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="4. (Optional) Edit your existing constitution based on the LM's output" />
                </ListItem>
                <ListItem>
                    <ListItemText primary="5. Once satisfied, continue to next iteration." />
                </ListItem>
            </List>
        </div>)
}

export const renderCellWithTooltip = (params:any) => (
    <Tooltip title={params.value || ''} placement="top-start" arrow>
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxHeight: '100%',  // Ensures the cell doesn't grow beyond the row height
            overflow: 'auto',   // Adds scroll only when necessary
            textAlign: 'left',
            lineHeight: '20px',
            whiteSpace: 'normal',  // Allows text to wrap within the cell
            px: 1, 
            py:10,              // Padding for some breathing space around text
        }}>
            {params.value?.toString()}
        </Box>
    </Tooltip>
);

export function capitalizeFirstLetter(string:string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function IterationComponent({ dataset, count, c, setIterations}: IterationProps) {

    const [hasRun, setHasRun] = useState(false);


    const [constitution, setConstitution] = useState(c ? c : "")
    const [rows, setRows] = useState<Row[]>(dataset.map((scenario,index) => { return { ...scenario , lmResponse: null} }));
    const [baselineResults, setBaselineResults] = useState<Baseline[]>(
        dataset.map(row => { return { ...row, userResponse: null } })
    );
    const [numFilled, setNumFilled] = useState(0);

    const [filter, setFilter] = useState('all'); 

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
    };

    const filteredRows = useMemo(() => {
        switch (filter) {
            case 'yes':
                return rows.filter(row => row.lmResponse && row.userResponse && row.lmResponse.choice === row.userResponse);
            case 'no':
                return rows.filter(row => row.lmResponse && row.userResponse && row.lmResponse.choice !== row.userResponse);
            default:
                return rows;
        }
    }, [rows, filter]);


    const datagridCols = [
        {
            field: 'description', headerName: 'Description', width: 300, editable: false,
            innerHeight: 600,
            renderCell: (params: any) => (renderCellWithTooltip(params))
        },
        {
            field: 'choiceA', headerName: 'Choice A', width: 300, editable: false,
            innerHeight: 400,
            renderCell: (params: any) => (
                <Box sx={{ overflowY: 'scroll', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    {params.value}
                </Box>
            )
        }, {
            field: 'choiceB', headerName: 'Choice B', width: 300, editable: false,
            innerHeight: 400,
            renderCell: (params: any) => (
                <Box sx={{ overflowY: 'scroll', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    {params.value}
                </Box>
            )
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
            valueGetter: (_:any, row:any) => { return row.lmResponse ? row.lmResponse.choice : null},
            renderCell: RenderChipCell,
            renderEditCell: (params: GridRenderEditCellParams) => (
                <EditableChipCell id={params.id} value={params.value?.toString() || ''} field="lmResponse.choice" />
            )
        },
        {
            field: 'lmResponseRationale',  // Custom field key, not directly mapping to data structure
            headerName: 'Model explanation',
            width: 300,
            valueGetter: (_:any, row:any) => { return row.lmResponse ? row.lmResponse.rationale : null},
            renderCell: (params: any) => (renderCellWithTooltip(params))
            
        },
        {
            field:'match',
            headerName:'Alignment',
            width:100,
            valueGetter: (_:any, row:any) => {return row.lmResponse && row.userResponse ? row.lmResponse.choice === row.userResponse : false},
            renderCell:(params:any)=> {
                return <Chip sx={{
                    backgroundColor:params.value ? "green" : "red",
                    color:"white"
                }}
                label={capitalizeFirstLetter(params.value?.toString())}
                ></Chip>
            }
        }


    ]

    
    
    const handleRunModel = async () => {
        setHasRun(true);
        try {
            const responses = await Promise.all(dataset.map((scenario:any) => {
                return invokeLLM({
                    scenario: scenario.description,
                    constitution: constitution,
                    actionA: scenario.choiceA,
                    actionB: scenario.choiceB,
                });
            }));
            const updatedRows = rows.map((row, index) => ({
                ...row,
                lmResponse: {
                    choice: responses[index].choice,  // Directly using parsed JSON field
                    rationale: responses[index].rationale  // Directly using parsed JSON field
                }
            }));
    
            setRows(updatedRows);
        } catch (error) {
            console.error("Failed to run model:", error);
            // Handle errors appropriately in your UI
        }
    };

    const [modelAccuracy, setModelAccuracy] = useState<number | null>(null);

    const calculateModelAccuracy = () => {
        const matchingResponses = rows.filter(row => row.lmResponse && row.userResponse && row.lmResponse.choice === row.userResponse).length;
        const totalResponses = rows.filter(row => row.userResponse != null).length; // Only consider rows where user has responded
        const accuracy = totalResponses > 0 ? (matchingResponses / totalResponses) * 100 : 0;
        setModelAccuracy(accuracy);
    };

    useEffect(() => {
        if (hasRun) {
            calculateModelAccuracy();
        }
    }, [rows, hasRun]);


    useEffect(() => {
        if (baselineResults) {
            setNumFilled(baselineResults.filter(r => r.userResponse !== null).length)
        }
    }, [baselineResults])

    const handleProcessRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updatedRows = baselineResults.map(row =>
            row.id === newRow.id ? { ...row, ...newRow } : row
        );
        setBaselineResults(updatedRows);
        return newRow;
    };
    return (
        <div className="flex-1 w-full flex flex-col gap-20 items-center p-10">
            <IterationStepsComponent></IterationStepsComponent>
            <Stack direction="column" spacing={2} sx={{ width: "50%" }}>
                <TextField
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="Enter your moral constitution here..."
                    value={constitution}
                    onChange={(e) => setConstitution(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <Button
                    variant="contained"
                    className="bg-purple-950 text-white hover:bg-purple-1000"
                    onClick={handleRunModel}
                    disabled={hasRun}
                >
                    Run Model
                </Button>

                {hasRun && (
                    <Stack direction={"column"} spacing={1}>
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Model Accuracy: {modelAccuracy !== null ? `${modelAccuracy.toFixed(2)}%` : 'Calculating...'}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" onClick={() => handleFilterChange('all')} color="primary">
                                All
                            </Button>
                            <Button variant="outlined" onClick={() => handleFilterChange('yes')} color="secondary">
                                Match
                            </Button>
                            <Button variant="outlined" onClick={() => handleFilterChange('no')} color="error">
                                No Match
                            </Button>
                        </Stack>
                    </Stack>
                )}
            </Stack>
            {dataset && <DataGrid
                rows={filteredRows}
                rowHeight={300}
                columns={datagridCols}
                initialState={{
                    pagination: { paginationModel: { pageSize: 5 } },
                }}
                pagination={true}
                processRowUpdate={handleProcessRowUpdate}
            />}
            <Stack direction="row" alignItems={"center"} justifyContent={"center"} spacing={1}>
                <Button
                    className="bg-purple-950 text-white hover:bg-purple-1000"
                    variant="contained"
                    disabled={!hasRun}
                    onClick={() => {
                        setIterations((p) => [
                            ...p,
                            {
                                responses: rows,
                                count:1,
                                const: constitution
                            }
                        ]);
                    }}
                    
                    >
                    Continue to next step
                </Button>
            </Stack>

        </div>
    );
}
