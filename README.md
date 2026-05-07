# CogniScreen — Domain 2: Clock Drawing Test

AI-powered Clock Drawing Test scorer using Flask + Anthropic Claude Vision.

## Project Structure

```
cogniscreen-domain2/
├── app.py                  ← Flask backend (run this)
├── requirements.txt        ← Python dependencies
├── .env.example            ← Copy to .env and add your API key
├── templates/
│   └── index.html          ← Main UI
└── static/
    ├── css/style.css       ← Stylesheet
    └── js/app.js           ← Canvas drawing + API calls
```

## Setup (VS Code)

### Step 1 — Open the folder in VS Code
```
File → Open Folder → select cogniscreen-domain2
```

### Step 2 — Create a virtual environment
Open the VS Code terminal (Ctrl + `) and run:
```bash
python -m venv venv
```

Activate it:
- **Windows:**   `venv\Scripts\activate`
- **Mac/Linux:** `source venv/bin/activate`

### Step 3 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4 — Set your Anthropic API key
**Windows (Command Prompt):**
```cmd
set ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Windows (PowerShell):**
```powershell
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

**Mac/Linux:**
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

> Get your key at: https://console.anthropic.com/

### Step 5 — Run the app
```bash
python app.py
```

You should see:
```
✅  API key loaded (sk-ant-api03...)
 * Running on http://127.0.0.1:5000
```

### Step 6 — Open in browser
Go to: **http://localhost:5000**

## How It Works

1. Patient draws a clock on the canvas (or you upload a photo)
2. Click **"Analyze drawing with AI"**
3. Canvas is sent to Flask backend as base64 PNG
4. Flask sends it to Claude Vision API with CLOX scoring instructions
5. AI returns 6 sub-scores + clinical flags + summary
6. Results are displayed with severity tier and color-coded scores

## CLOX Scoring (15 points total)

| Dimension         | Max |
|-------------------|-----|
| Circle            | 2   |
| Numbers present   | 3   |
| Number placement  | 4   |
| Hands present     | 2   |
| Hand length       | 2   |
| Time accuracy     | 2   |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Could not connect to Flask server` | Make sure `python app.py` is running |
| `Invalid API key` | Re-check your ANTHROPIC_API_KEY |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` inside venv |
| Port 5000 in use | Change `port=5000` to `port=5001` in app.py, then visit localhost:5001 |
