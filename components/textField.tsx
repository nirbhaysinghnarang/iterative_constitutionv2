import React, { useState } from 'react';
import { TextField, Modal, Box, Typography, Button } from '@mui/material';

function ExpandableTextField({ value, onChange }:any) {
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: "70%",
        height:"70%",
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
    };

    return (
        <div>
            <TextField
                multiline
                rows={10}
                
                variant="outlined"
                placeholder="Enter your moral constitution here..."
                value={value}
                fullWidth
                onClick={handleOpen}
                sx={{ mb: 2, width:'100%' }}
            />
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Edit Your Moral Constitution
                    </Typography>
                    <TextField
                        multiline
                        fullWidth
                        rows={20}
                        variant="outlined"
                        placeholder="Enter your moral constitution here..."
                        value={value}
                        onChange={onChange}
                        sx={{ mt: 2}}
                    />
                    <Button onClick={handleClose} sx={{ mt: 2 }}>
                        Save
                    </Button>
                </Box>
            </Modal>
        </div>
    );
}

export default ExpandableTextField;