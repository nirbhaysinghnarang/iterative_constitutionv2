"use client"
import { Baseline, Dataset, Iteration, LMResponse, Row } from "@/app/typing/types"
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams, GridRowModel, useGridApiContext } from '@mui/x-data-grid';
import { useState, useEffect } from "react"
const [filter, setFilter] = useState('all');
import { Box, List, ListItem, ListItemText, TextField, Typography, Chip, Button } from "@mui/material"
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

    const datagridCols = [
        {
            field: 'description', headerName: 'Description', width: 300, editable: false,
            innerHeight: 600,
            renderCell: (params: any) => (
                <Box sx={{
                    display: 'flex',       // Use flexbox to align items
                    flexDirection: 'column', // Stack children vertically
                    justifyContent: 'center', // Center vertically
                    maxHeight: '100%',
                    padding:'20px',
                    overflow: 'auto',
                    textAlign: 'left',   // Ensures text aligns to the left
                    lineHeight: '20px',  // Sets line height for a bit of control over text spacing
                    whiteSpace: 'normal', // Allows word wrapping
                    px: 1,               // Padding on the left and right for some space within the cell
                }}>
                    {params.value}
                </Box>
            )
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
            renderCell: (params) => params.isEditable ? (
                <EditableChipCell id={params.id} value={params.value?.toString() || ''} field={params.field} />
            ) : (
                RenderChipCell(params)
            ),
            renderEditCell: (params: GridRenderEditCellParams) => (
                <EditableChipCell id={params.id} value={params.value?.toString() || ''} field={params.field} />
            )
        },
        {
            field: 'lmResponseChoice',  // Custom field key, not directly mapping to data structure
            headerName: 'Model choice',
            width: 100,
            valueGetter: (_:any, row:any) => { return row.lmResponse ? row.lmResponse.choice : null},
            renderCell: (params) => params.isEditable ? (
                <EditableChipCell id={params.id} value={params.value?.toString() || ''} field="lmResponse.choice" />
            ) : (
                RenderChipCell(params)
            ),
            renderEditCell: (params: GridRenderEditCellParams) => (
                <EditableChipCell id={params.id} value={params.value?.toString() || ''} field="lmResponse.choice" />
            )
        },
        {
            field: 'lmResponseRationale',  // Custom field key, not directly mapping to data structure
            headerName: 'Model explanation',
            width: 300,
            valueGetter: (_:any, row:any) => { return row.lmResponse ? row.lmResponse.rationale : null},

            renderCell: (params: any) => params.isEditable ? (
                <TextField
                    fullWidth
                    variant="outlined"
                    value={params.value?.toString() || ''}
                    onChange={(e) => params.api.setEditCellValue({ id: params.id, field: 'lmResponseRationale', value: e.target.value }, e)}
                />
            ) : (
                <Box sx={{
                    display: 'flex',       // Use flexbox to align items
                    flexDirection: 'column', // Stack children vertically
                    justifyContent: 'center', // Center vertically
                    maxHeight: '100%',
                    overflow: 'auto',
                    textAlign: 'left',   // Ensures text aligns to the left
                    lineHeight: '20px',  // Sets line height for a bit of control over text spacing
                    whiteSpace: 'normal', // Allows word wrapping
                    px: 1,               // Padding on the left and right for some space within the cell
                }}>
                    {params.value?.toString()}
                </Box>
            )
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
        },
        {
            field: 'correctness',
            headerName: 'Correctness',
            width: 100,
            valueGetter: (params) => { return params.row.lmResponse?.choice === params.row.userResponse; },
            renderCell: (params) => (
                <Chip label={params.value ? "Correct" : "Incorrect"} style={{backgroundColor: params.value ? "green" : "red", color: "white"}} />
            )
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
            </Stack>
            <Stack direction="row" spacing={2}>
                <Button onClick={() => setFilter('all')} color="primary">All</Button>
                <Button onClick={() => setFilter('correct')} color="secondary">Correct</Button>
                <Button onClick={() => setFilter('incorrect')} color="error">Incorrect</Button>
            </Stack>
            {dataset && <DataGrid
                rows={rows.filter(row => filter === 'all' || (filter === 'correct' && row.correctness) || (filter === 'incorrect' && !row.correctness))}
                rowHeight={150}
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
