import React from 'react';
import { Select, MenuItem, Typography } from "@mui/material"

interface ValueSelectorProps {
    selectedValues: {
        topThree: string[];
        bottomTwo: string[];
    };
    handleDropdownChange: (type: 'topThree' | 'bottomTwo', index: number, event: any) => void;
    schwartzValues: string[];
}

const ValueSelector: React.FC<ValueSelectorProps> = ({ selectedValues, handleDropdownChange, schwartzValues }) => {
    return (
        <>
            <Typography variant="h6" style={{ marginBottom: '20px' }}>Top 3 Values</Typography>
            {selectedValues.topThree.map((value, index) => (
                <Select
                    key={`top-${index}`}
                    value={value || ''}
                    onChange={(event) => handleDropdownChange('topThree', index, event)}
                    displayEmpty
                    style={{ width: '300px', marginBottom: '10px' }}
                >
                    <MenuItem value="" disabled>Select a value for position {index + 1}</MenuItem>
                    {schwartzValues
                        .filter(val => !selectedValues.topThree.includes(val) || val === value)
                        .map((val) => (
                            <MenuItem key={val} value={val}>{val}</MenuItem>
                        ))}
                </Select>
            ))}

            <Typography variant="h6" style={{ marginTop: '20px', marginBottom: '20px' }}>Bottom 2 Values</Typography>
            {selectedValues.bottomTwo.map((value, index) => (
                <Select
                    key={`bottom-${index}`}
                    value={value || ''}
                    onChange={(event) => handleDropdownChange('bottomTwo', index, event)}
                    displayEmpty
                    style={{ width: '300px', marginBottom: '10px' }}
                >
                    <MenuItem value="" disabled>Select a value for position {index + 1}</MenuItem>
                    {schwartzValues
                        .filter(val => !selectedValues.bottomTwo.includes(val) || val === value)
                        .map((val) => (
                            <MenuItem key={val} value={val}>{val}</MenuItem>
                        ))}
                </Select>
            ))}
        </>
    );
};

export default ValueSelector;