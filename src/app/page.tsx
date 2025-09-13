'use client';

import { useState, useEffect, useContext } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { 
  AppBar, Toolbar, Typography, Container, Tabs, Tab, Box, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip, Badge,
  useTheme, useMediaQuery, Card, CardContent, CardActions, IconButton
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import { Referral, NewReferralInput } from '@/types';
import NewReferralModal from '@/components/NewReferralModal';
import ViewReferralModal from '@/components/ViewReferralModal';
import { ColorModeContext } from '@/app/components/ThemeRegistry';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function Home() {
  const { data: session, status } = useSession();
  const [tabIndex, setTabIndex] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);

  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const MY_DEPARTMENT = (session?.user as any)?.department;

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
    if (status === 'authenticated') fetchReferrals();
  }, [status]);

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

  const getStatusChip = (status: string) => {
    const colorMap = { Pending: 'warning', Viewed: 'info', Completed: 'success' } as const;
    const color: ChipProps['color'] = (colorMap as Record<string, ChipProps['color']>)[status] ?? 'default';
    return <Chip label={status} color={color} size="small" />;
  };

  if (status === 'loading') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (status === 'unauthenticated') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h4" gutterBottom>Referral System</Typography>
        <Typography sx={{ mb: 2 }}>Access Denied. Please sign in.</Typography>
        <Button variant="contained" onClick={() => signIn('google')}>Sign in with Google</Button>
      </Box>
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

  const renderReferralList = () => {
    if (loading) return <Box sx={{ textAlign: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error) return <Typography color="error" sx={{ textAlign: 'center', p: 4 }}>{error}</Typography>;
    if (filteredReferrals.length === 0) return <Typography sx={{ textAlign: 'center', p: 4 }}>No referrals found.</Typography>;

    if (isMobile) {
      return (
        <Box>
          {filteredReferrals.map((referral) => (
            <Card key={referral.id} sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6">{referral.ward} - Bed {referral.bed}</Typography>
                  {getStatusChip(referral.status)}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {tabIndex === 0 ? `From: ${referral.referringDepartment}` : `To: ${referral.targetDepartment}`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Date: {referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleOpenViewModal(referral)}>View Details</Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      );
    }

    return (
      <Paper sx={{ bgcolor: 'background.paper' }}>
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
              {filteredReferrals.map((referral) => (
                <TableRow key={referral.id} hover>
                  <TableCell>{referral.createdAt ? new Date(referral.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{referral.ward}</TableCell>
                  <TableCell>{referral.bed}</TableCell>
                  <TableCell>{tabIndex === 0 ? referral.referringDepartment : referral.targetDepartment}</TableCell>
                  <TableCell>{getStatusChip(referral.status)}</TableCell>
                  <TableCell><Button size="small" onClick={() => handleOpenViewModal(referral)}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Referrals
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ display: { xs: 'none', sm: 'block' }, mr: 2 }}>{session?.user?.name}</Typography>
            <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Button color="inherit" onClick={() => signOut()}>Sign Out</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange} 
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label={<Badge badgeContent={incomingCount} color="error">Incoming</Badge>} />
            <Tab label="Sent" />
            <Tab label={<Badge badgeContent={feedbackCount} color="primary">Feedback</Badge>} />
            <Tab label="Completed" />
          </Tabs>
        </Box>
        <Button variant="contained" color="primary" onClick={() => setIsNewModalOpen(true)} sx={{ mb: 2 }}>
          + New Referral
        </Button>
        {renderReferralList()}
      </Container>

      <NewReferralModal open={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} onSave={handleSaveNewReferral} userDepartment={MY_DEPARTMENT ?? undefined} />
      <ViewReferralModal referral={selectedReferral} open={isViewModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedReferral(null); }} onSave={handleUpdateReferral} userDepartment={MY_DEPARTMENT ?? undefined} activeTab={tabIndex} />
    </Box>
  );
}