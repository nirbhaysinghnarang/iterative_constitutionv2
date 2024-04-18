"use client"
import { Baseline, Dataset } from "@/app/typing/types"
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams, GridRowModel, useGridApiContext } from '@mui/x-data-grid';
import { useState, useEffect } from "react"
import { Box, TextField, Typography, Chip, Button } from "@mui/material"
import Stack from "@mui/material/Stack";


type Step1ComponentProps = {
    dataset: Dataset,
    passUpResults:(res:Baseline[])=>void
}

interface EditableChipCellProps {
    id: GridRenderEditCellParams['id'];
    value: string;
    field: string;
}

export const EditableChipCell: React.FC<EditableChipCellProps> = ({ id, value, field }) => {
    const apiRef = useGridApiContext();
    const [inputValue, setInputValue] = useState(value);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value.toUpperCase();
        if (newValue === 'A' || newValue === 'B') {
            apiRef.current.setEditCellValue({ id, field, value: newValue });
            apiRef.current.stopCellEditMode({ id, field });
        }
        setInputValue(newValue);
    };

    return (
        <TextField
            value={inputValue}
            sx={{ padding: '10px' }}
            onChange={handleChange}
            inputProps={{ maxLength: 1 }}  // Limits input to 1 character
            variant="outlined"
            autoFocus
            fullWidth
        />
    );
};

export const RenderChipCell = (params: GridRenderCellParams<any>) => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {params.value ? <Chip label={params.value} color="primary" /> : <Chip label="Invalid" color="error" />}
        </Box>
    );
};


export default function Step1Component({ dataset,passUpResults }: Step1ComponentProps) {

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
            field: 'userResponse', headerName: 'Your choice', width: 300, editable: true,
            innerHeight: 400,
            renderCell: RenderChipCell,
            renderEditCell: (params: GridRenderEditCellParams) => (
                <EditableChipCell id={params.id} value={params.value?.toString() || ''} field={params.field} />
            )
        },

    ]

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
            {dataset && <DataGrid
                rows={baselineResults}
                rowHeight={150}
                columns={datagridCols}
                initialState={{
                    pagination: { paginationModel: { pageSize: 5 } },
                }}
                pagination={true}
                processRowUpdate={handleProcessRowUpdate}
            />}
            <Stack direction="row" alignItems={"center"} justifyContent={"center"} spacing={1}> 
                <Typography sx={{color:"purple"}}>{numFilled}/{baselineResults.length} filled </Typography>
                <Button
                    onClick={()=>{passUpResults(baselineResults)}}
                    disabled={numFilled !== baselineResults.length}
                    className="bg-purple-950 text-white hover:bg-purple-1000"
                    variant="contained">
                    Continue to next step
                </Button>
            </Stack>

        </div>
    );
}
