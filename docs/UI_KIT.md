# 🎨 LNMIIT Hostel System: UI Component Guide

To ensure our project looks like a single unified system, please use the standard components defined in `public/css/style.css`.

---

## 1. Page Layout
Every page should follow this structure to ensure the navbar and content are aligned.
```html
<body>
    <!-- Navbar will be injected automatically by navbar.js -->
    
    <div class="container">
        <!-- Your content goes here -->
    </div>

    <script src="js/navbar.js"></script>
</body>
```

## 2. Page Titles (Headers)
Use the `.header` section at the top of your `container` for the page title.
```html
<div class="header">
    <h1>Student Management</h1>
    <p class="subtitle">Brief description of what this page does.</p>
</div>
```

## 3. Cards (Information Display)
Use `.card` to display information, forms, or navigation.
```html
<div class="card">
    <h3>Room Details</h3>
    <p>Room No: 101 | Status: Occupied</p>
</div>
```

## 4. Buttons
Always use the `.btn` class. Currently, we have one primary style.
```html
<button class="btn btn-primary">Save Changes</button>
```

## 5. Layout Grids
If you want to show multiple cards side-by-side (like the dashboard), wrap them in a `.grid`.
```html
<div class="grid">
    <div class="card">Card 1</div>
    <div class="card">Card 2</div>
    <div class="card">Card 3</div>
</div>
```

## 6. CSS Variables (Colors)
If you need to write custom CSS, use our shared variables:
- **Blue (Primary):** `var(--primary)`
- **Gold (Accent):** `var(--accent)`
- **Background:** `var(--bg)`



