'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Autocomplete,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Fade,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface UserOnboardingProps {
  open: boolean;
  userEmail: string;
  userName: string;
  onComplete: (userData: { email: string; name: string; department: string }) => void;
  onClose: () => void;
  demoMode?: boolean;
}

const commonDepartments = [
  'Emergency Department',
  'Intensive Care Unit',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'General Surgery',
  'Internal Medicine',
  'Pediatrics',
  'Obstetrics & Gynecology',
  'Psychiatry',
  'Radiology',
  'Anesthesiology',
  'Pathology',
  'Oncology',
  'Nephrology',
  'Dermatology',
  'Ophthalmology',
  'ENT',
  'Pharmacy',
  'Physical Therapy',
  'Social Work',
  'Administration',
];

export default function UserOnboarding({ open, userEmail, userName, onComplete, onClose, demoMode = false }: UserOnboardingProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: userName || '',
    email: userEmail || '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>(commonDepartments);

  const steps = ['Welcome', 'Profile Setup', 'Department Selection', 'Complete'];

  useEffect(() => {
    // Fetch existing departments from the API
    const fetchDepartments = async () => {
      try {
        const response = await fetch('/api/departments');
        if (response.ok) {
          const existingDepts = await response.json();
          // Combine existing departments with common ones, removing duplicates
          const allDepts = [...new Set([...commonDepartments, ...existingDepts])];
          setDepartments(allDepts.sort());
        }
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };

    if (open) {
      fetchDepartments();
      setFormData(prev => ({
        ...prev,
        name: userName || '',
        email: userEmail || '',
      }));
    }
  }, [open, userName, userEmail]);

  const handleNext = () => {
    if (activeStep === 1 && (!formData.name.trim() || !formData.email.trim())) {
      setError('Please fill in all required fields');
      return;
    }
    if (activeStep === 2 && !formData.department.trim()) {
      setError('Please select a department');
      return;
    }
    setError(null);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (demoMode) {
        // For demo mode, just simulate the flow without actual API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        setActiveStep(3); // Move to completion step
        
        setTimeout(() => {
          onComplete(formData);
        }, 2000);
      } else {
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to register user');
        }

        const userData = await response.json();
        setActiveStep(3); // Move to completion step
        
        setTimeout(() => {
          onComplete(userData);
        }, 2000);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={500}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonAddIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                Welcome to Referral System
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                {demoMode ? 'This is a demonstration of the registration flow for new users.' : 'Let\'s set up your profile so you can start managing referrals with your team.'}
              </Typography>
              {demoMode && (
                <Typography variant="caption" sx={{ 
                  display: 'inline-block',
                  backgroundColor: 'warning.light',
                  color: 'warning.contrastText',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  mb: 2
                }}>
                  DEMO MODE
                </Typography>
              )}
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in timeout={500}>
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Profile Information
              </Typography>
              <TextField
                fullWidth
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
                required
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email Address"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                margin="normal"
                required
                type="email"
                variant="outlined"
                disabled={!!userEmail}
                helperText={userEmail ? "Email from your Google account" : ""}
              />
            </Box>
          </Fade>
        );

      case 2:
        return (
          <Fade in timeout={500}>
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Department Selection
              </Typography>
              <Autocomplete
                options={departments}
                value={formData.department}
                onChange={(_, newValue) => setFormData(prev => ({ ...prev, department: newValue || '' }))}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Department"
                    required
                    variant="outlined"
                    helperText="Select your department or type a new one"
                  />
                )}
                sx={{ mb: 2 }}
              />
              <Typography variant="body2" color="text.secondary">
                This helps organize referrals and ensures they reach the right team members.
              </Typography>
            </Box>
          </Fade>
        );

      case 3:
        return (
          <Fade in timeout={500}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                Registration Complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Welcome to the referral system, {formData.name}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You'll be redirected to the dashboard in a moment...
              </Typography>
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {activeStep < 3 && (
          <>
            <Button 
              onClick={onClose} 
              color="inherit"
              disabled={loading}
            >
              Cancel
            </Button>
            {activeStep > 0 && (
              <Button 
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
            )}
            {activeStep < 2 ? (
              <Button 
                onClick={handleNext}
                variant="contained"
                disabled={loading}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                variant="contained"
                disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.department.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Creating Account...' : 'Complete Registration'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}