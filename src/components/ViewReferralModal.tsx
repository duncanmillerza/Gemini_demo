'use client';

import { useState, useEffect } from 'react';
import { 
  Modal, Box, Typography, TextField, Button, Grid, Paper 
} from '@mui/material';
import { Referral } from '@/types';

const style = {
  position: 'absolute' as const,
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 600 }, // Responsive width
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

interface ViewReferralModalProps {
  referral: Referral | null;
  open: boolean;
  onClose: () => void;
  onSave: (referral: Referral) => void;
  userDepartment: string | undefined;
  activeTab: number;
}

export default function ViewReferralModal({ referral, open, onClose, onSave, userDepartment, activeTab }: ViewReferralModalProps) {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (referral) {
      setFeedback(referral.feedback || '');
    }
  }, [referral]);

  if (!referral) return null;

  const canEditFeedback = referral.targetDepartment === userDepartment && referral.status !== 'Completed';
  const canComplete = activeTab === 2;

  const handleSave = () => {
    const updatedReferral = { ...referral, feedback, status: 'Viewed' };
    onSave(updatedReferral);
  };

  const handleComplete = () => {
    const updatedReferral = { ...referral, status: 'Completed' };
    onSave(updatedReferral);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="view-referral-modal-title"
    >
      <Box sx={style}>
        <Typography id="view-referral-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
          Referral Details
        </Typography>
        
        <Grid container spacing={2}>
          <Grid xs={6}><Typography variant="body2"><strong>From:</strong> {referral.referringDepartment} ({referral.referringClinician})</Typography></Grid>
          <Grid xs={6}><Typography variant="body2"><strong>To:</strong> {referral.targetDepartment}</Typography></Grid>
          <Grid xs={6}><Typography variant="body2"><strong>Ward:</strong> {referral.ward}</Typography></Grid>
          <Grid xs={6}><Typography variant="body2"><strong>Bed:</strong> {referral.bed}</Typography></Grid>
          <Grid xs={12}><Typography variant="body2"><strong>Status:</strong> {referral.status}</Typography></Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1">Notes</Typography>
          <Typography variant="body1">{referral.notes}</Typography>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1">Feedback (from {referral.feedbackClinician})</Typography>
          {canEditFeedback ? (
            <TextField
              margin="normal"
              fullWidth
              id="feedback"
              label="Add your feedback"
              name="feedback"
              multiline
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          ) : (
            <Typography variant="body1">{referral.feedback || 'No feedback yet.'}</Typography>
          )}
        </Paper>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={onClose}>Close</Button>
          <div>
            {canEditFeedback && <Button onClick={handleSave} variant="contained" sx={{ mr: 1 }}>Save Feedback</Button>}
            {canComplete && <Button onClick={handleComplete} variant="contained" color="success">Mark as Complete</Button>}
          </div>
        </Box>
      </Box>
    </Modal>
  );
}