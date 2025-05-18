# LoreKeep

A comprehensive campaign management tool for Dungeon Masters running D&D 5e campaigns.

## Project Overview

LoreKeep helps DMs track and visualize their campaign's plot points, NPCs, and worldbuilding elements. The central feature is the Lore Map, an interactive flowchart that visualizes campaign events and their connections.

## Features

- **User Authentication**: Create accounts, login/logout functionality
- **Campaign Management**: Create, edit, and delete campaigns
- **Lore Map System**: Visual editor for creating interconnected campaign events
- **Character Management**: Create and manage PCs, NPCs, and monsters
- **Connection System**: Link characters to events and create event dependencies
- **Export/Import**: Save campaign data for backup or sharing

## Technologies Used

- **Frontend**: React, React Router, CSS
- **Backend**: Flask, SQLAlchemy, SQLite
- **Authentication**: Session-based authentication

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 14+
- pip
- npm

### Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the backend: `python app.py`

### Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the frontend: `npm start`
4. Open your browser to `http://localhost:3000`

## Current Limitations

- Limited to D&D 5e gameplay mechanics
- No multi-user collaboration yet
- No image upload capabilities for maps
- No built-in dice roller
- Limited pre-built content (monsters, items, etc.)

## Future Development

- Implement dice rolling functionality
- Add image upload for maps and characters
- Create a compendium of D&D 5e monsters, items, and spells
- Add timeline view for tracking campaign progression
- Implement campaign sharing and collaboration features

## Project Status

This is a technology prototype for CSE 499. Development is ongoing.