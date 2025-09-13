'use client';

import { useState, useEffect } from 'react';
import { 
  Modal, Box, Typography, TextField, Button, 
  Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, CircularProgress 
} from '@mui/material';
import { Referral, NewReferralInput } from '@/types';

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 400 }, // Responsive width
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface NewReferralModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (referral: NewReferralInput) => void;
  userDepartment: string | undefined;
}

export default function NewReferralModal({ open, onClose, onSave, userDepartment }: NewReferralModalProps) {
  const [ward, setWard] = useState('');
  const [bed, setBed] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const fetchDepartments = async () => {
        try {
          setLoading(true);
          const res = await fetch('/api/departments');
          const data = await res.json();
          setDepartments(data);
        } catch (error) {
          console.error("Failed to fetch departments", error);
        } finally {
          setLoading(false);
        }
      };
      fetchDepartments();
    }
  }, [open]);

  const handleSubmit = () => {
    const newReferral: NewReferralInput = {
      ward,
      bed,
      targetDepartment,
      notes,
    };
    onSave(newReferral);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="new-referral-modal-title"
    >
      <Box sx={style}>
        <Typography id="new-referral-modal-title" variant="h6" component="h2">
          Create New Referral
        </Typography>
        <TextField margin="normal" required fullWidth id="ward" label="Ward" name="ward" autoFocus value={ward} onChange={(e) => setWard(e.target.value)} />
        <TextField margin="normal" required fullWidth id="bed" label="Bed" name="bed" value={bed} onChange={(e) => setBed(e.target.value)} />
        <FormControl fullWidth margin="normal">
          <InputLabel id="target-department-label">Target Department</InputLabel>
          {loading ? <CircularProgress size={24} /> : (
            <Select
              labelId="target-department-label"
              id="target-department"
              value={targetDepartment}
              label="Target Department"
              onChange={(e: SelectChangeEvent) => setTargetDepartment(e.target.value)}
            >
              {departments.filter(d => d !== userDepartment).map(dep => (
                <MenuItem key={dep} value={dep}>{dep}</MenuItem>
              ))}
            </Select>
          )}
        </FormControl>
        <TextField margin="normal" required fullWidth id="notes" label="Referral Notes" name="notes" multiline rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </Box>
      </Box>
    </Modal>
  );
}