# CS300 Assignment 3 – Recipe Finder

## Student Information
- **Name:** Aliya Khan

## Project Option and API
- **Project Option:** Option C – Recipe Finder
- **API Chosen:** TheMealDB
- **API URL:** `https://www.themealdb.com/api/json/v1/1`

## Live Site URL
- **Live URL:** `file:///Users/aliyakhan/Desktop/CS300-Assignment-3/index.html`

## How to Run Locally
1. Open a terminal and go to the project folder:

```bash
cd /Users/aliyakhan/Desktop/CS300-Assignment-3
```

2. Start a local server:

```bash
python3 -m http.server 5500
```

3. Open the app in your browser:

`http://localhost:5500`

## Screenshots of UI States
Add screenshots to your repo (for example in a `screenshots/` folder), then link them below.

### Loading State
![Loading State](screenshots/loading-state.png)

### Success State
![Success State](screenshots/success-state.png)

### Empty State
![Empty State](screenshots/empty-state.png)

### Error State
![Error State](screenshots/error-state.png)

## Notes
- The app is built with **vanilla JavaScript** using `fetch` + `async/await`.
- Users can search by meal **name** or **ingredient**, filter by category, and open full meal details.
