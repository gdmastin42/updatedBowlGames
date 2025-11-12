# 2024-25 Bowl Season Predictions Website

This is a full-stack web application that allows users to log in, make predictions for college football bowl games, and track progress on a leaderboard. Game data is pulled from the CollegeFootballData.com API and stored in a SQLite database.
 **Live Site Hosted on AWS Lightsail**

## Features

- Simple login with first and last name
- Submit predictions for each bowl game
- Leaderboard showing user scores
- View actual game results
- View all predictions (highlighted correct/incorrect)

## Getting Started

### 1. Clone the Repository

```
git https://github.com/yourUsername/updatedBowlGames.git
```
```
cd updatedBowlGames
```

### 2. Install Dependencies
```
npm install express sqlite3 cors dotenv axios body-parser
```

### 3. Configure Environment Variables

Create a `.env` file in the root folder and add the varible "API_KEY
```
API_KEY=your_cfbd_api_key_here
```
Get a free key at: https://collegefootballdata.com/key

### 4. Hosting website

You can run this local or you can put these files into your perfered website hosting platform.

## Technologies Used

**Frontend:**

- HTML5, CSS3, JavaScript
- Bootstrap 5
- jQuery
- DataTables
- SweetAlert2

**Backend:**

- Node.js
- Express
- SQLite3
- Axios
- dotenv

## Notes

- This is just a fun website for use in my family. It is only meant for personal use.
- Predictions can be submitted only once per user.
- Login session is stored in localStorage.
- Leaderboard ranks users by number of correct predictions.
- Results are automatically computed from actual scores.
- The User with the username "garrett_mastin" is the "admin" this is a unsecure solution and the only benifit the "admin" has is they can see a button that does a curl to refresh the games scores incase of failure of auto refresh.

## Author 

- Garrett Mastin 
- Devloped for 2024-2025 NCAA Bowl Season
- Hosted on AWS Lightsail
- Feel free to fork and improve it for your own use

