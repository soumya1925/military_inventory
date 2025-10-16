#  Military Asset Management System

A comprehensive web application for managing military assets, inventory, and consignments across multiple bases with role-based access control.

##  Live Deployment

[** Live Demo Link**](https://military-inventory-1dnnc7r5u-soumya-rouls-projects.vercel.app) 

##  Project Overview

This system provides a centralized platform for military personnel to manage assets, track inventory movements, and handle consignments between different military bases. Built with modern web technologies for reliability and security.

##  User Roles & Features

###  System Admin
- **Full system access and user management**
- Create and manage military bases
- View all users, inventory, and consignments
- Admin can view the purchase order made by a base commander and inject it into the inventory  for 
  inventory manipulation and current stock updates for a particular base

###  Base Commander  
- **Base-level oversight and command**
- Monitor base inventory and stock levels
- Can create and submit consignment making the purchase order

###  Logistics Officer
- **Inventory and consignment management**(Read-only)
- Can check consignment data
- Can check inventory data 


###  Military Personnel
- **Asset utilization and basic operations**(Read-Only)
- Can have acess to basic information
- Can see the base , personnel belongs to name . location and base code
- Can see the inventory details stock model and category

##  Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Deployment**: Vercel/Netlify

##  Key Features

###  Authentication & Authorization
- Secure role-based login system
- Protected routes for different user levels
- Session management with Supabase Auth

###  Base Management
- Create and manage military bases
- Base information (name, code, location)
- Multi-base inventory tracking

### Inventory System
- Real-time stock tracking
- Transfer management (in/out)
- Automated current stock calculations
- Category and model-based organization

###  Consignment Management
- Inter-base transfer tickets
- Purchase order tracking
- Delivery status updates (assigned, delivered, expired, damaged)
- Automated inventory updates on delivery

###  Real-time Calculations
- Automatic net movement calculations
- Current stock = Stock + Net Movement
- Live inventory updates with delayed synchronization

## Demo Credentials

| Role | Email | Password | Name |
|------|-------|----------|------|
| System Admin | `sysadmin1@defensehq.mil` | `admin` | System Administrator |
| Base Commander | `e.johansen@baseironclad.mil` | `hashed_pw` | Erik Johansen |
| Military Personnel | `l.park@campsentinel.mil` | `hashed_pw` | Lisa Park |
| Logistics Officer | `o.saleh@outpostfalcon.mil` | `hashed_pw` | Omar Saleh |

##  Quick Start

### Prerequisites
- Node.js 16+
- Supabase account
-tailwind css
- react-dom@19.2.0
-react-hook-form@7.65.0
- react@19.2.0 
- react-router-dom@7.9.4

# Database Schema

![Database Schema](https://raw.githubusercontent.com/soumya1925/military_inventory/master/supabase-schema-yixhgrlhdgeekvbozzjm%20(1).svg)

## Database Overview
This diagram shows the relationships between all tables in our Supabase PostgreSQL database.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/military-asset-management.git
   cd military-asset-management


