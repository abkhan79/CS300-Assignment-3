# Recipe Finder (Vanilla JS)

This project is an interactive **Recipe Finder** using TheMealDB API and vanilla JavaScript.

## Features
- Search meals by **name** or **ingredient**
- Fetch data with `async/await` and `try/catch`
- Dynamically render meal cards (image, name, category)
- Click a meal card to view full instructions in a dialog
- Optional category filter after results load
- UI states: initial, loading, success, empty, error
- Responsive layout using CSS Grid/Flexbox

## Files
- `index.html` — semantic structure and UI containers
- `styles.css` — responsive styles and state styling
- `script.js` — fetch logic, DOM manipulation, and interactions

## Run locally
Use any static file server. Example:

```bash
cd /Users/aliyakhan/Desktop/CS300-Assignment-3
python3 -m http.server 5500
```

Then open:
- `http://localhost:5500`

## API Used
- TheMealDB: `https://www.themealdb.com/api/json/v1/1`
