# Application Specification: Simple Referral System

## 1. High-Level Summary

A web application that allows clinicians to create, view, and manage patient referrals. The application will feature a simple, clean interface where users can see referrals they've sent and referrals sent to their department. All data will be stored and retrieved from a single Google Sheet.

## 2. Technology Stack

*   **Frontend:** Next.js (React)
*   **Backend API:** Next.js API Routes (Node.js)
*   **Database:** Google Sheets
*   **Styling:** Material-UI (MUI)
*   **Deployment:** Vercel

## 3. Google Sheets Setup

1.  **Create the Sheet:** A Google Sheet named "Referrals" with the columns:
    *   `ID`
    *   `Ward`
    *   `Bed`
    *   `ReferringDepartment`
    *   `TargetDepartment`
    *   `Notes`
    *   `Status` (e.g., "Pending", "Viewed", "Completed")
    *   `Feedback`
    *   `CreatedAt`
    *   `UpdatedAt`

2.  **Google Cloud & Service Account:**
    *   Create a GCP project.
    *   Enable the Google Sheets API.
    *   Create a Service Account.
    *   Generate a JSON key file.
    *   Share the Google Sheet with the service account's email.

## 4. Application Structure

*   `pages/index.js`: Main application dashboard.
*   `pages/api/referrals.js`: Backend API for CRUD operations.
*   `components/`: Folder for reusable React components.
*   `lib/sheets.js`: Helper file for Google Sheets API interaction.
*   `.env.local`: To store secret credentials.

## 5. User Interface (UI) and Workflow

1.  **Main View:** A dashboard with two tabs: "My Sent Referrals" and "Incoming Referrals".
2.  **Creating a Referral:** A "New Referral" button opens a form.
3.  **Viewing/Updating:** Clicking a referral updates its status and allows adding feedback.
4.  **Completing:** The original referrer can mark the referral as "Complete".
