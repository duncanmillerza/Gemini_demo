'use client';

import { useState, useEffect, useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  AppBar, Toolbar, Typography, Container, Tabs, Tab, Box, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip, Badge,
  useTheme, useMediaQuery, Card, CardContent, CardActions, IconButton, Skeleton, Fade, Grow
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import { Referral, NewReferralInput } from '@/types';
import NewReferralModal from '@/components/NewReferralModal';
import ViewReferralModal from '@/components/ViewReferralModal';
import UserOnboarding from '@/components/UserOnboarding';
import { ColorModeContext } from '@/app/components/ThemeRegistry';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function Home() {
  const { data: session, status } = useSession();
  const [tabIndex, setTabIndex] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userNeedsOnboarding, setUserNeedsOnboarding] = useState(false);

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const MY_DEPARTMENT = (session?.user as any)?.department;

  const checkUserRegistration = async () => {
    console.log('🔍 checkUserRegistration called', { email: session?.user?.email });
    if (!session?.user?.email) return;
    
    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(session.user.email)}`);
      console.log('📡 User check response:', { status: res.status, ok: res.ok });
      
      if (res.status === 404) {
        // User not found in sheets, needs onboarding
        console.log('❌ User not found, setting up onboarding');
        setUserNeedsOnboarding(true);
        setShowOnboarding(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to check user registration');
      
      // User exists, proceed to fetch referrals
      console.log('✅ User found, proceeding to fetch referrals');
      setUserNeedsOnboarding(false);
      fetchReferrals();
    } catch (e: unknown) {
      console.error('💥 Error in checkUserRegistration:', e);
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/referrals');
      if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
      const data: Referral[] = await res.json();
      setReferrals(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 Auth status changed:', { status, email: session?.user?.email });
    if (status === 'authenticated') {
      checkUserRegistration();
    }
  }, [status]);

  // Debug state changes
  useEffect(() => {
    console.log('🎭 State update:', { 
      showOnboarding, 
      userNeedsOnboarding, 
      loading,
      status
    });
  }, [showOnboarding, userNeedsOnboarding, loading, status]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => setTabIndex(newValue);
  const handleOpenViewModal = (referral: Referral) => { setSelectedReferral(referral); setIsViewModalOpen(true); };

  const handleSaveNewReferral = async (newReferralData: NewReferralInput) => {
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newReferralData, referringDepartment: MY_DEPARTMENT, referringClinician: session?.user?.name }),
      });
      if (!res.ok) throw new Error('Failed to create referral');
      setIsNewModalOpen(false);
      fetchReferrals();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleUpdateReferral = async (updatedReferral: Referral) => {
    try {
      const res = await fetch('/api/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedReferral),
      });
      if (!res.ok) throw new Error('Failed to update referral');
      setIsViewModalOpen(false);
      setSelectedReferral(null);
      fetchReferrals();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleOnboardingComplete = (userData: { email: string; name: string; department: string }) => {
    setShowOnboarding(false);
    setUserNeedsOnboarding(false);
    // Only refresh if it's not a demo and user actually needs onboarding
    if (userNeedsOnboarding && status === 'authenticated') {
      window.location.reload();
    }
  };

  const getStatusChip = (status: string) => {
    const colorMap = { Pending: 'warning', Viewed: 'info', Completed: 'success' } as const;
    const color: ChipProps['color'] = (colorMap as Record<string, ChipProps['color']>)[status] ?? 'default';
    return <Chip label={status} color={color} size="small" />;
  };

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={48} thickness={4} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        bgcolor: 'background.default',
        px: 3
      }}>
        <Fade in timeout={800}>
          <Card sx={{ p: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
              Referral System
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              Sign in with Google to get started. New users will be guided through a quick setup process.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              fullWidth
              onClick={() => signIn('google')}
              sx={{ py: 1.5, mb: 2 }}
            >
              Sign in with Google
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              For demo purposes
            </Typography>
            <Button 
              variant="outlined" 
              size="small"
              fullWidth
              onClick={() => {
                setShowOnboarding(true);
                setUserNeedsOnboarding(true);
              }}
              sx={{ py: 1 }}
            >
              Preview Registration Flow
            </Button>
          </Card>
        </Fade>
      </Box>
    );
  }

  // Show onboarding for new users who actually need it (not demo)
  if (showOnboarding && userNeedsOnboarding) {
    console.log('🎭 Rendering onboarding for new user', { 
      showOnboarding, 
      userNeedsOnboarding 
    });
    return (
      <>
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }} />
        <UserOnboarding
          open={showOnboarding}
          userEmail={session?.user?.email || ''}
          userName={session?.user?.name || ''}
          onComplete={handleOnboardingComplete}
          onClose={() => {
            console.log('🚪 Onboarding modal closed');
            setShowOnboarding(false);
          }}
          demoMode={false}
        />
      </>
    );
  }

  const incomingCount = referrals.filter(r => r.status !== 'Completed' && r.targetDepartment === MY_DEPARTMENT && !r.feedback).length;
  const feedbackCount = referrals.filter(r => r.status !== 'Completed' && r.referringDepartment === MY_DEPARTMENT && !!r.feedback).length;

  const filteredReferrals = referrals.filter(r => {
    if (tabIndex === 3) return r.status === 'Completed' && (r.referringDepartment === MY_DEPARTMENT || r.targetDepartment === MY_DEPARTMENT);
    if (r.status === 'Completed') return false;
    if (tabIndex === 0) return r.targetDepartment === MY_DEPARTMENT && !r.feedback;
    if (tabIndex === 1) return r.referringDepartment === MY_DEPARTMENT && !r.feedback;
    if (tabIndex === 2) return r.referringDepartment === MY_DEPARTMENT && !!r.feedback;
    return false;
  });

  const renderLoadingSkeleton = () => {
    if (isMobile) {
      return (
        <Box>
          {[...Array(3)].map((_, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="rounded" width={80} height={28} />
                </Box>
                <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="40%" height={20} />
              </CardContent>
              <CardActions>
                <Skeleton variant="rounded" width={100} height={32} />
              </CardActions>
            </Card>
          ))}
        </Box>
      );
    }

    return (
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                  <TableCell><Skeleton variant="text" width="100%" height={20} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={80} height={28} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={60} height={32} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  const renderReferralList = () => {
    if (loading) return renderLoadingSkeleton();
    
    if (error) {
      return (
        <Card sx={{ p: 4, textAlign: 'center', bgcolor: 'error.main', color: 'error.contrastText' }}>
          <Typography variant="h6" gutterBottom>Error Loading Referrals</Typography>
          <Typography variant="body2">{error}</Typography>
          <Button 
            variant="outlined" 
            sx={{ mt: 2, borderColor: 'currentColor', color: 'inherit' }}
            onClick={fetchReferrals}
          >
            Try Again
          </Button>
        </Card>
      );
    }
    
    if (filteredReferrals.length === 0) {
      return (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            No referrals found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabIndex === 0 ? 'No incoming referrals at the moment' : 
             tabIndex === 1 ? 'You haven\'t sent any referrals yet' :
             tabIndex === 2 ? 'No feedback pending' : 'No completed referrals'}
          </Typography>
        </Card>
      );
    }

    if (isMobile) {
      return (
        <Box>
          {filteredReferrals.map((referral, index) => (
            <Grow key={referral.id} in timeout={300 + index * 100}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {referral.ward} - Bed {referral.bed}
                    </Typography>
                    {getStatusChip(referral.status)}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {tabIndex === 0 ? `From: ${referral.referringDepartment}` : `To: ${referral.targetDepartment}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ pt: 0 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => handleOpenViewModal(referral)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grow>
          ))}
        </Box>
      );
    }

    return (
      <Fade in timeout={500}>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Ward</TableCell>
                  <TableCell>Bed</TableCell>
                  <TableCell>{tabIndex === 0 ? 'From' : 'To'}</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReferrals.map((referral, index) => (
                  <Grow key={referral.id} in timeout={300 + index * 50}>
                    <TableRow hover sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{referral.ward}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{referral.bed}</TableCell>
                      <TableCell>{tabIndex === 0 ? referral.referringDepartment : referral.targetDepartment}</TableCell>
                      <TableCell>{getStatusChip(referral.status)}</TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleOpenViewModal(referral)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  </Grow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Fade>
    );
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ py: 1 }}>
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Referral System
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', mr: 2 }}>
              <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {session?.user?.name}
              </Typography>
            </Box>
            <IconButton 
              onClick={colorMode.toggleColorMode} 
              color="inherit"
              size="small"
              sx={{ mr: 1 }}
            >
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Button 
              color="inherit" 
              onClick={() => signOut()}
              size="small"
              startIcon={<ExitToAppIcon />}
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              Sign Out
            </Button>
            <IconButton 
              color="inherit" 
              onClick={() => signOut()}
              size="small"
              sx={{ display: { xs: 'flex', sm: 'none' } }}
            >
              <ExitToAppIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Manage your referrals and track their progress
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tabIndex} 
              onChange={handleTabChange} 
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab 
                label={
                  <Badge badgeContent={incomingCount} color="error">
                    <Box sx={{ px: 1 }}>Incoming</Box>
                  </Badge>
                } 
              />
              <Tab label="Sent" />
              <Tab 
                label={
                  <Badge badgeContent={feedbackCount} color="primary">
                    <Box sx={{ px: 1 }}>Feedback</Box>
                  </Badge>
                } 
              />
              <Tab label="Completed" />
            </Tabs>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {tabIndex === 0 ? 'Incoming Referrals' : 
               tabIndex === 1 ? 'Sent Referrals' :
               tabIndex === 2 ? 'Pending Feedback' : 'Completed Referrals'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  console.log('🖱️ Demo Registration button clicked');
                  setShowOnboarding(true);
                  console.log('✅ setShowOnboarding(true) called');
                }}
                sx={{ 
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem'
                }}
              >
                Demo Registration
              </Button>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setIsNewModalOpen(true)}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                }}
              >
                New Referral
              </Button>
            </Box>
          </Box>
        </Box>
        
        {renderReferralList()}
      </Container>

      <NewReferralModal 
        open={isNewModalOpen} 
        onClose={() => setIsNewModalOpen(false)} 
        onSave={handleSaveNewReferral} 
        userDepartment={MY_DEPARTMENT ?? undefined} 
      />
      <ViewReferralModal 
        referral={selectedReferral} 
        open={isViewModalOpen} 
        onClose={() => { setIsViewModalOpen(false); setSelectedReferral(null); }} 
        onSave={handleUpdateReferral} 
        userDepartment={MY_DEPARTMENT ?? undefined} 
        activeTab={tabIndex} 
      />
      
      {/* Demo Onboarding Modal */}
      <UserOnboarding
        open={showOnboarding && !userNeedsOnboarding}
        userEmail="demo@example.com"
        userName="Demo User"
        onComplete={handleOnboardingComplete}
        onClose={() => {
          console.log('🚪 Demo onboarding modal closed');
          setShowOnboarding(false);
        }}
        demoMode={true}
      />
    </Box>
  );
}