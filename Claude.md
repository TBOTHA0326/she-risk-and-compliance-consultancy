SHE Risk & Compliance Management System
1. Project Overview

This system is a centralized web-based dashboard designed for managing SHE (Safety, Health, and Environment) compliance operations, client companies, financial documents (invoices and quotes), safety files, and related documentation.

The platform replaces manual tracking (Excel, WhatsApp, paper-based systems) with a structured, auditable, and scalable digital system.

2. Core Objectives
Centralize all company-related compliance and financial data
Enable fast creation and tracking of invoices and quotes
Maintain structured safety file management per company
Provide document storage with categorization and expiry tracking
Offer a clean, modern dashboard for operational visibility
Ensure full traceability between companies and all related records
3. System Architecture Overview

The system is built around a central entity model:

Companies are the core entity
All modules link back to a company
Each module is independently manageable but relationally connected

Core modules:

Dashboard
Companies
Invoices
Quotes
Documents
Safety Files
4. Dashboard (Home View)
Purpose

Provide a high-level operational overview.

Components
KPI Cards
Total Companies
Active Quotes
Outstanding Invoices
Overdue Invoices
Safety Files In Progress
Expiring Documents
Charts
Monthly Revenue Trend
Invoice Status Distribution
Quote Conversion Rate
Safety File Completion Status
Activity Feed
Recent invoice creation
Quote updates
Safety file changes
Document uploads
Quick Actions
Create Company
Create Invoice
Create Quote
Upload Document
Create Safety File
5. Companies Module
Purpose

Central hub entity linking all operational data.

Company Fields
Company Name
Registration Number (optional)
Contact Person
Email
Phone Number
Address
Industry Type
Status (Active / Inactive)
Notes
Company Detail View

Each company has its own tabbed interface:

Tabs
Overview
Invoices
Quotes
Documents
Safety Files
Activity Log
Company Overview Tab
Total invoices
Outstanding balances
Active safety files
Recent activity
Document count
6. Invoices Module
Purpose

Manage financial billing records.

Invoice Fields
Invoice Number (FULLY EDITABLE)
Linked Company
Issue Date
Due Date
Line Items:
Description
Quantity
Unit Price
Line Total (auto-calculated)
VAT toggle (optional)
Total Amount
Status:
Draft
Sent
Paid
Overdue
Cancelled
Notes
PDF Export
Invoice Rules
Invoice numbers must be:
Editable at creation and after creation (with audit logging)
Unique per system (validation enforced)
System must prevent duplicates unless explicitly overridden by admin
Invoice number format is configurable (e.g. INV-0001 or custom formats)
Invoice Features
Full CRUD
Duplicate invoice
Convert from quote
PDF export
Auto overdue detection
Manual override allowed
7. Quotes Module
Purpose

Handle proposals and estimates.

Quote Fields
Quote Number (FULLY EDITABLE)
Linked Company
Issue Date
Valid Until Date
Line Items
Total Estimate
Status:
Draft
Sent
Accepted
Rejected
Expired
Notes
PDF Export
Quote Rules
Quote numbers must be:
Editable at all stages
Unique unless overridden by admin
Flexible formatting allowed
Quote Features
Full CRUD
Convert to invoice
PDF export
Status tracking
8. Documents Module
Purpose

General document storage system.

Categories
Compliance Certificates
Safety Policies
Audit Reports
Training Records
Legal Documents
Inspection Reports
Internal Templates
Miscellaneous
Document Fields
Title
Description
Category
Linked Company (optional)
File Upload
Tags
Upload Date
Expiry Date
Features
File storage
Category filtering
Expiry alerts
Search functionality
9. Safety Files Module
Purpose

Manage SHE compliance documentation.

Safety File Fields
Safety File ID
Linked Company
Project / Site Name
Status
Assigned Date
Due Date
Last Updated
Notes
Sections
Risk Assessments
Method Statements
PPE Compliance
Training Records
Induction Records
Emergency Procedures
Site Inspections

Each section includes:

Document uploads
Status
Notes
Features
Progress tracking
Status workflow
Expiry monitoring
Audit trail
10. Data Relationships
Company
Invoices
Quotes
Documents
Safety Files

All relationships must enforce referential integrity.

11. Notifications System
Types
Invoice overdue
Quote updates
Safety file expiry
Document expiry
Activity updates
Delivery
In-app notifications
Email (future support)
12. Activity Logging

All key actions must be logged:

Create / Update / Delete
Invoice number edits
Quote changes
Document uploads
Safety file updates
13. User Roles
Admin
Manager
Compliance Officer
Finance

Role-based access must be enforced at backend level.

14. Reporting Module
Reports
Revenue reports
Outstanding invoices
Quote conversion
Compliance status
Expiry tracking
Export
PDF
Excel
15. Global Features
Search

Global search across all modules

Filters
Date
Company
Status
Category
16. Tech Stack

Frontend:

React (with TypeScript)
Next.js (App Router)
TailwindCSS

Backend:

Supabase (PostgreSQL, API, Auth)

Storage:

Supabase Storage
17. Authentication
Requirement

The system must include a simple login page that authenticates users using Supabase Authentication.

Features
Email and password login
Session handling via Supabase
Protected routes (dashboard requires authentication)
Redirect unauthenticated users to login page
Optional Enhancements (Future)
Password reset
Invite users
Role-based access via Supabase policies
18. Security Requirements
Role-based access control
Row-level security (Supabase RLS)
Secure file access
Audit logging
19. Design Principles
Minimal + Modern + Fast UI
Mobile responsive
Company-centric navigation
Scalable architecture
Clean and structured UX