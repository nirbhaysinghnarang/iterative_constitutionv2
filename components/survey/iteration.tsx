"use client"
import { Baseline, Dataset, Iteration, LMResponse, Row } from "@/app/typing/types"
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams, GridRowModel, useGridApiContext } from '@mui/x-data-grid';
import { useState, useEffect, useMemo } from "react"
import { Box, List, ListItem, ListItemText, TextField, Typography, Chip, Button, Tooltip, styled } from "@mui/material"
import Stack from "@mui/material/Stack";
import { EditableChipCell, RenderChipCell } from "./step-1";
import { invokeLLM } from "@/app/lm/invokeLM";
import { CircularProgress } from "@mui/material";
import ExpandableTextField from "../textField";


type IterationProps = {
    trainDataset: Baseline[],
    testDataset: Baseline[],
    c: string | null
    count: number, //index+1
    nextIteration: (i:Iteration)=>void,
    finalIteration: (i:Iteration)=>void,
    setIterations: (i: Iteration[]) =>void

    //when we change a choice
    //iterations[count-1].choice = new choice

}
export const IterationStepsComponent = ({ count }: { count: string }) => {
    return (
        <div style={{ width: "100%" }}>


            <Stack direction="row" justifyContent={"space-between"} sx={{py:2}}>
                <Typography variant="h6" gutterBottom component="div">
                    Iteration Steps
                </Typography>
                <Chip className="bg-purple-950 bold" label={`Iteration ${count}`} color="primary" />

            </Stack>



            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                <ListItem>
                    <ListItemText primary="1. Check your moral constitution for any Inconsistencies" />
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




export const renderCellWithTooltip = (params: any) => (
    <Tooltip title={params.value || ''} placement="top-start" arrow>
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                height: '100%',
                overflow: 'hidden',
                textAlign: 'left',
                lineHeight: '20px',
                whiteSpace: 'normal',
                px: 1,
                py: 2,
            }}
        >
            <Typography
                sx={{
                    height: '100%',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'scroll',
                }}
            >
                {params.value?.toString()}
            </Typography>
        </Box>
    </Tooltip>
);


export function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function IterationComponent({ 
    trainDataset,
     testDataset, 
     count, 
     c, 
     nextIteration, 
     finalIteration,
     setIterations

}: IterationProps) {

    const [hasRun, setHasRun] = useState(false);


    const [constitution, setConstitution] = useState(c ? c : "")
    const init_const = c ? c : ""
    const [trainRows, setTrainRows] = useState<Row[]>(trainDataset.map((scenario, index) => { return { ...scenario, lmResponse: null } }));
    const [testRows, setTestRows] = useState<Row[]>(testDataset.map((scenario, index) => { return { ...scenario, lmResponse: null } }));


    
    const [numFilled, setNumFilled] = useState(0);

    const [filter, setFilter] = useState('all');

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
    };

    const filteredRows = useMemo(() => {
        switch (filter) {
            case 'yes':
                return trainRows.filter(row => row.lmResponse && row.userResponse && row.lmResponse.choice === row.userResponse);
            case 'no':
                return trainRows.filter(row => row.lmResponse && row.userResponse && row.lmResponse.choice !== row.userResponse);
            default:
                return trainRows;
        }
    }, [trainRows, filter]);


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



    const [testAcc, setTestAcc] = useState(0)

    useEffect(()=>{
        if(testAcc!=0){
            alert(testAcc)
        }
    })

    const handleRunModel = async () => {
        setLoading(true)
        setHasRun(true);
        try {
            const responses = await Promise.all(trainDataset.map((scenario: any) => {
                return invokeLLM({
                    scenario: scenario.description,
                    constitution: constitution,
                    actionA: scenario.choiceA,
                    actionB: scenario.choiceB,
                });
            }));
            const updatedRows = trainRows.map((row, index) => ({
                ...row,
                lmResponse: {
                    choice: responses[index].choice,  // Directly using parsed JSON field
                    rationale: responses[index].rationale  // Directly using parsed JSON field
                }
            }));



            setTrainRows(updatedRows);
            setLoading(false)



        } catch (error) {
            console.error("Failed to run model:", error);
            // Handle errors appropriately in your UI
        }


        try {
            //MARK:Change to testDataset
            const responses = await Promise.all(testDataset.map((scenario: any) => {
                return invokeLLM({
                    scenario: scenario.description,
                    constitution: constitution,
                    actionA: scenario.choiceA,
                    actionB: scenario.choiceB,
                });
            }));

            //MARK:Change to testRows
            const updatedTestRows = testRows.map((row, index) => ({
                ...row,
                lmResponse: {
                    choice: responses[index].choice,  // Directly using parsed JSON field
                    rationale: responses[index].rationale  // Directly using parsed JSON field
                }
            }));


            console.log(updatedTestRows)
            setTestAcc(calculateAccuracy(updatedTestRows))
            setTestRows(updatedTestRows)


        } catch (error) {
            console.error("Failed to run model:", error);
            // Handle errors appropriately in your UI
        }




    };

    const [loading, setLoading] = useState(false);

    const [modelAccuracy, setModelAccuracy] = useState<number | null>(null);

    const calculateAccuracy = (rows: Row[]) => {
        const total = rows.length;
        const correct = rows.filter(row => row.lmResponse?.choice === row.userResponse).length;
        const incorrect = rows.filter(row => row.lmResponse?.choice != row.userResponse).length;
        return total > 0 ? (correct / total) * 100 : 0;
    };
    
    const calculateModelAccuracy = () => {
        const matchingResponses = trainRows.filter(row => row.lmResponse && row.userResponse && row.lmResponse.choice === row.userResponse).length;
        const totalResponses = trainRows.filter(row => row.userResponse != null).length; // Only consider rows where user has responded
        const accuracy = totalResponses > 0 ? (matchingResponses / totalResponses) * 100 : 0;
        setModelAccuracy(accuracy);
    };

    useEffect(() => {
        if (hasRun) {
            calculateModelAccuracy();
        }
    }, [trainRows, hasRun]);




    const handleProcessRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
        const updatedRows = trainRows.map(row => row.id === newRow.id ? newRow : row);
        setTrainRows(updatedRows as Row[])
        return newRow;
    };





    return (
        <div className="flex-1 w-full flex flex-col gap-20 items-center p-10">
            <IterationStepsComponent count={count.toString()} ></IterationStepsComponent>
            <Stack direction="column" spacing={2} sx={{ width: "50%" }}>
                <ExpandableTextField
                    value={constitution}
                    onChange={(e: any) => setConstitution(e.target.value)}
                />
                <Button
                    variant="contained"
                    className="bg-purple-950 text-white hover:bg-purple-1000"
                    onClick={handleRunModel}
                    disabled={hasRun}

                >
                    Run Model
                </Button>
                {hasRun && loading && <CircularProgress sx={{ flex: 1, justifyContent: "center" }}></CircularProgress>}
                {hasRun && !loading && (
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
            {trainDataset && <DataGrid
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
                    disabled={!hasRun && !modelAccuracy}
                    onClick={() => {
                        console.log({
                            responses: trainRows,
                            test_responses: testRows,
                            count: 1,
                            const: constitution,
                            accuracy: modelAccuracy!,
                            test_accuracy: testAcc,
                            init_const: init_const

                        });
                        nextIteration(
                            {
                                responses: trainRows,
                                test_responses: testRows,
                                count: 1,
                                const: constitution,
                                accuracy: modelAccuracy!,
                                test_accuracy: testAcc,
                                init_const: init_const

                            }
                        );
                        
                    }}
                >
                    Continute Iterating on the Constitution
                </Button>
                <Button
                    className="bg-purple-950 text-white hover:bg-purple-1000"
                    variant="contained"
                    disabled={!hasRun && !modelAccuracy}
                    onClick={() => {
                        console.log({
                            responses: trainRows,
                            test_responses: testRows,
                            count: 1,
                            const: constitution,
                            accuracy: modelAccuracy!,
                            test_accuracy: testAcc,
                            init_const: init_const

                        });
                        finalIteration(
                            {
                                responses: trainRows,
                                test_responses: testRows,
                                count: 1,
                                const: constitution,
                                accuracy: modelAccuracy!,
                                test_accuracy: testAcc,
                                init_const: init_const
                            }
                        );
                    }}

                >
                    Finished Iterating on the Constitution
                </Button>
            </Stack>

        </div>
    );
}
