"use client"
import { Baseline, Dataset } from "@/app/typing/types"
import { DataGrid, GridColDef, GridRenderCellParams, GridRenderEditCellParams, GridRowModel, useGridApiContext } from '@mui/x-data-grid';
import { useState, useEffect } from "react"
import { Box, TextField, Typography, Chip, Button, MenuItem, Select, CircularProgress } from "@mui/material"
import Stack from "@mui/material/Stack";
import { Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';
import { renderCellWithTooltip } from "./iteration";
import { invokeLLMForConstitution } from "@/app/lm/invokeLM";
import ValueSelector from "../ValueSelector";
import { generateConstitution } from "@/app/constitution/generateConstitution";

type Step1ComponentProps = {
    dataset: Dataset,
    passUpResults: (res: Baseline[]) => void,
    setConstitution: (c: string) => void
}

interface EditableChipCellProps {
    id: GridRenderEditCellParams['id'];
    value: string;
    field: string;
}

export interface SelectedValues {
    topThree: string[];
    bottomTwo: string[];
}

export const valuesDictionary: { [key: string]: string } = {
    "Self-Direction": "Valuing the freedom to make your own choices and follow your personal ideas and dreams. People high in this value prioritize independence and creativity.",
    "Stimulation": "Seeking excitement, variety, and challenges in life. This value is important for those who desire an adventurous and active life.",
    "Hedonism": "Pursuing pleasure and sensuous gratification for oneself. People who prioritize hedonism enjoy life's pleasures and luxuries.",
    "Achievement": "Having an emphasis on personal success through demonstrating competence according to social standards. This value is about ambition and the recognition of one's efforts.",
    "Power": "Focusing on attaining social status and prestige, and control or dominance over people and resources. This value is often associated with leadership and influence.",
    "Security": "Valuing safety, harmony, and stability of society, of relationships, and of self. People high in this value seek a secure and safe environment.",
    "Conformity": "Restraining actions, inclinations, and impulses likely to upset or harm others and violate social expectations or norms. This value emphasizes self-discipline and politeness in social conduct.",
    "Tradition": "Respect, commitment, and acceptance of the customs and ideas that traditional culture or religion provide. This value focuses on preserving cultural, family, or religious traditions.",
    "Benevolence": "Preserving and enhancing the welfare of those with whom one is in frequent personal contact (the 'in-group'). This value is about loyalty, caring, and nurturing.",
    "Universalism": "Understanding, appreciation, tolerance, and protection for the welfare of all people and for nature. This value involves a broad concern for social justice, equality, and environmental protection."
};

export const EditableChipCell: React.FC<EditableChipCellProps> = ({ id, value, field }) => {
    const apiRef = useGridApiContext();
    const [selectedValue, setSelectedValue] = useState(value);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        apiRef.current.setEditCellValue({ id, field, value: newValue });
        apiRef.current.stopCellEditMode({ id, field });
        setSelectedValue(newValue);
    };

    return (
        <FormControl component="fieldset" fullWidth sx={{
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <RadioGroup
                row={false}
                value={selectedValue}
                onChange={handleChange}
                sx={{ justifyContent: 'center', alignItems: 'center' }}
            >
                <FormControlLabel
                    value="A"
                    control={<Radio color="primary" />}
                    label="A"
                    sx={{
                        margin: '5px', '&, &.Mui-checked': {
                            color: 'primary',
                        },
                    }}
                />
                <FormControlLabel
                    value="B"
                    control={<Radio color="secondary" />}
                    label="B"
                    sx={{
                        margin: '5px', '&, &.Mui-checked': {
                            color: 'secondary',
                        },
                    }}
                />
            </RadioGroup>
        </FormControl>
    );
};

export const RenderChipCell = (params: GridRenderCellParams<any>) => {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            {params.value ? <Chip label={params.value} color={params.value == 'A' ? "primary" : 'secondary'} /> : <Chip label="Double click cell to input" color="warning" />}
        </Box>
    );
};


export default function Step1Component({ dataset, passUpResults, setConstitution }: Step1ComponentProps) {






    const [loading, setLoading] = useState(false)

    const [baselineResults, setBaselineResults] = useState<Baseline[]>(
        dataset.scenarios.map(row => { return { ...row, userResponse: null } })
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
                    padding: '20px',
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
            renderCell: (params: any) =>
            (renderCellWithTooltip(params)
            )
        }, {
            field: 'choiceB', headerName: 'Choice B', width: 300, editable: false,
            innerHeight: 400,
            renderCell: (params: any) =>
            (renderCellWithTooltip(params)
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


    // State to keep track of user's selection for Schwartz values
    const [selectedValues, setSelectedValues] = useState<SelectedValues>({
        topThree: Array(3).fill(''),
        bottomTwo: Array(2).fill('')
    });

    const handleDropdownChange = (type: 'topThree' | 'bottomTwo', index: number, event: React.ChangeEvent<{ value: unknown }>) => {
        const newValues = { ...selectedValues };
        newValues[type][index] = event.target.value as string;
        setSelectedValues(newValues);
    };

    // State to track the current step in the process
    const [step, setStep] = useState(1);

    // Handle change for dropdowns


    // Check if all values are unique and selected
    const allValuesSelected = () => {
        const combinedValues = [...selectedValues.topThree, ...selectedValues.bottomTwo];
        const uniqueValues = new Set(combinedValues);
        return combinedValues.every(value => value !== '') && uniqueValues.size === combinedValues.length;
    };

    const handleConfirm = () => {
        if (allValuesSelected()) {
            setConstitution(generateConstitution(selectedValues));
            setStep(step=>step+1)
        }else{
            alert("There is an error with your inputs.")
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
        <div className="flex-1 w-full flex flex-col gap-5 items-center p-10">
            {step === 1 && (
                <>
                    <ValueSelector
                        selectedValues={selectedValues}
                        handleDropdownChange={handleDropdownChange}
                        schwartzValues={Object.keys(valuesDictionary)}
                    />
                    {loading && <CircularProgress></CircularProgress>}
                    <Button
                        onClick={handleConfirm}
                        disabled={!allValuesSelected && !loading}
                        variant="contained"
                        sx={{ backgroundColor: "purple" }}
                        style={{ marginTop: '20px' }}
                    >
                        Confirm Value Ordering
                    </Button>
                </>
            )}
            {step == 2 &&
                <>
                    {dataset && <DataGrid
                        rows={baselineResults}
                        rowHeight={300}
                        columns={datagridCols}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 5 } },
                        }}
                        pagination={true}
                        processRowUpdate={handleProcessRowUpdate}
                    />}
                    <Stack direction="row" alignItems={"center"} justifyContent={"center"} spacing={1}>
                        <Typography sx={{ color: "purple" }}>{numFilled}/{baselineResults.length} filled </Typography>
                        <Button
                            onClick={() => { passUpResults(baselineResults) }}
                            disabled={numFilled !== baselineResults.length}
                            className="bg-purple-950 text-white hover:bg-purple-1000"
                            variant="contained">
                            Continue to next step
                        </Button>
                    </Stack>
                </>}



        </div>
    );
}
