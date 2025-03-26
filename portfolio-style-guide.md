# Portfolio Style Guide

## Typography System

```mermaid
graph LR
    A[Typography] --> B[Primary: Inter]
    A --> C[Secondary: Playfair Display]
    A --> D[Scale]
    
    B --> B1[Regular 400]
    B --> B2[Medium 500]
    B --> B3[Semi-bold 600]
    
    C --> C1[Regular 400]
    C --> C2[Italic 400]
    C --> C3[Bold 700]
    
    D --> D1[Base: 16px]
    D --> D2[H1: 3.052rem]
    D --> D3[H2: 2.441rem]
    D --> D4[H3: 1.953rem]
    D --> D5[H4: 1.563rem]
    D --> D6[Body: 1rem]
    D --> D7[Small: 0.8rem]
```

## Color Palette

```mermaid
pie
    title Color Usage
    "Primary (Navy)" : 40
    "Secondary (Light Gray)" : 30
    "Accent (Teal)" : 20
    "Background (Off-white)" : 10
```

- **Primary**: `#0a192f` (Deep Navy)
- **Secondary**: `#e6f1ff` (Light Gray)
- **Accent**: `#64ffda` (Soft Teal)
- **Background**: `#f8f8f8` (Off-white)

## Spacing & Layout

```mermaid
graph TD
    S[Spacing Scale] --> S1[Base: 8px]
    S --> S2[Small: 4px]
    S --> S3[Medium: 16px]
    S --> S4[Large: 32px]
    S --> S5[X-Large: 64px]
    
    L[Layout] --> L1[Max-width: 1200px]
    L --> L2[Gutter: 24px]
    L --> L3[Section Padding: 80px]
    L --> L4[Mobile Padding: 24px]
```

## Interactive Elements

```mermaid
stateDiagram-v2
    [*] --> Normal
    Normal --> Hover: mouseover
    Hover --> Active: mousedown
    Active --> Normal: mouseup
    Hover --> Normal: mouseout
    
    state Normal {
        fill: #0a192f
        text: #e6f1ff
    }
    
    state Hover {
        fill: #112240
        transform: translateY(-2px)
        shadow: 0 4px 8px rgba(0,0,0,0.1)
    }
    
    state Active {
        fill: #020c1b
        transform: translateY(0)
    }
```

## Image Treatment

- **Project Thumbnails**:
  - Aspect ratio: 16:9
  - Border radius: 8px
  - Shadow: 0 4px 6px rgba(0,0,0,0.1)
  - Hover effect: scale(1.02) with shadow elevation

- **Modal Images**:
  - Max-height: 60vh
  - Maintain aspect ratio
  - Lazy loading
  - Optional: subtle zoom on hover

## Breakpoints

```mermaid
gantt
    title Responsive Breakpoints
    dateFormat  px
    axisFormat %s
    
    section Views
    Mobile : 0, 576
    Tablet : 576, 768
    Desktop : 768, 1200
    Wide : 1200, 9999
```

## Animation Principles

```mermaid
journey
    title Animation Timeline
    section Page Load
      Fade in: 5: Elements
      Stagger: 3: Content
    section Interactions
      Hover: 2: Buttons
      Click: 1: Feedback
    section Scrolling
      Parallax: 4: Backgrounds
      Reveal: 3: Sections
```

## Implementation Notes

1. **Font Loading**:
   ```html
   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
   ```

2. **CSS Variables**:
   ```css
   :root {
     --primary: #0a192f;
     --secondary: #e6f1ff;
     --accent: #64ffda;
     --bg: #f8f8f8;
     --spacing-base: 8px;
     --max-width: 1200px;
   }
   ```

3. **Transition Defaults**:
   ```css
   * {
     transition: all 0.3s ease-out;
   }