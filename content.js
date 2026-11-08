/* ============================================================
   YOUR WEBSITE CONTENT  ✏️
   ------------------------------------------------------------
   This is the ONLY file you edit to change your website.
   Just change the text between the "quotation marks", save,
   and re-upload this file. No code knowledge needed.

   • To change a sentence → edit the text inside the "quotes".
   • To add a project / link → copy a { ... } block, comma after it.
   • Lines starting with //  are notes to you and are ignored.
   ============================================================ */

window.SITE_CONTENT = {

  // Your one bold colour (anything you like). Examples:
  // "#2440FF" blue · "#FF2E63" pink · "#FF3D00" orange · "#7C3AED" violet · "#0FA958" green
  accentColor: "#2440FF",

  profile: {
    name: "Jefferson Evans Manadi",
    initials: "J",                 // shown in the logo + photo placeholder
    role: "Mechanical Engineering Student",
    tagline: "Third-year Mechanical Engineering student at the University of Toronto. I love learning something new, from designing machines to understanding how markets move.",
    location: "Toronto, ON",
    email: "jeffersonevansm@gmail.com",

    // YOUR PHOTOS — the brush reveals photo2 from under photo1.
    // Put your image files in the SAME folder as these two files,
    // then write the file names here. Leave "" to use placeholders.
    photo:       "me.jpg",   // e.g. "me-1.jpg"  (the cover photo)
    photoReveal: ""    // e.g. "me-2.jpg"  (revealed as you brush over it)
  },

  // The big "hello" you see when the site first loads
  intro: {
    hello: "Hello",
    sub: "Welcome"
  },

  about: {
    heading: "Exploring Beyond Boundaries.",
    paragraphs: [
      "My academic foundation is in Mechanical Engineering, but my curiosity extends beyond engineering into finance and business. Through internships in both the manufacturing and banking industries, I've developed a passion for solving problems from both technical and commercial perspectives. From analyzing cooling-system energy efficiency at a flexible packaging plant to supporting treasury sales at CIMB Niaga, I enjoy exploring how different industries create value and drive innovation.",
      "What drives me is curiosity. I'd rather take on an unfamiliar problem and learn my way through it than repeat something I've already solved."
    ],
    focus: ["Mechatronics & Robotics", "Manufacturing", "Global Markets"],
    tools: ["SOLIDWORKS", "Ansys Benchmark", "MATLAB", "Excel", "Python"]
  },

  /* ============================================================
     MY BACKGROUND (education) → shown in its own section and used
     by the Portfolio Guider assistant.
     ============================================================ */
  education: {
    school: "University of Toronto",
    badge: "UofT",                 // fallback text badge if no logo
    logo: "logo-uoft.webp",        // thumbnail on the card
    banner: "uoft-engineering-banner.webp",   // banner at the top of the popup
    degree: "BASc, Mechanical Engineering",
    minor: "Minor in Engineering Business",
    year: "Third year",
    period: "2024 – Present",
    location: "Toronto, ON",
    notes: [
      "The minor lets me pair the technical side of engineering with the business side, which is the same mix behind my internships in manufacturing at Toppan and in treasury at CIMB Niaga."
    ]
  },

  /* ============================================================
     WORK EXPERIENCE  →  used by the site AND by the Portfolio Guider assistant.
     Copy a { ... } block to add another role. Put a comma after it.
     ============================================================ */
  experience: [
    {
      role: "Treasury & Capital Markets Intern",
      org: "CIMB Niaga",
      logo: "logo-cimb-niaga.webp",
      type: "Banking / Treasury Sales",
      period: "Jun – Sep 2026",
      location: "",
      summary: "Supported Treasury Sales operations through financial market research, foreign exchange analysis, and competitor benchmarking.",
      highlights: [
        "Developed an interactive FX tracking dashboard using Python and Streamlit to visualize currency market movements and support data-driven analysis — the prototype that grew into Forex Analyst.",
        "Conducted comparative research on banking products, treasury services, and pricing structures to identify market opportunities."
      ],
      skills: ["Python", "Streamlit", "Microsoft Excel", "Financial Analysis", "Data Visualization", "Market Research"],
      project: "Forex Analyst"       // links this role to a project card (use the exact project title)
    },
    {
      role: "Drivetrain Team Member",
      org: "UTWind",
      logo: "logo-utwind.webp",
      type: "Student Design Team",
      period: "Jan – May 2026",
      location: "",
      summary: "Member of the drivetrain team, contributing CAD models of mechanical drivetrain components.",
      highlights: [
        "Modeled mechanical drivetrain components in CAD.",
        "Collaborated with teammates across the design process."
      ],
      skills: ["CAD Modeling", "Mechanical Components", "Engineering Collaboration"]
    },
    {
      role: "Maintenance Engineering Intern",
      org: "PT Toppan Plasindo Lestari",
      logo: "logo-toppan.webp",
      type: "Flexible Packaging Manufacturing",
      period: "Jun – Aug 2025",
      location: "",
      summary: "Analyzed industrial cooling system performance and energy efficiency in a flexible packaging manufacturing facility.",
      highlights: [
        "Evaluated open-loop and closed-loop cooling configurations, collected operational data, and assessed system performance improvements.",
        "Reviewed and interpreted AutoCAD piping layouts and technical drawings to understand cooling system configurations, component arrangements, and industrial piping networks."
      ],
      skills: ["Technical Drawing Interpretation", "Industrial Cooling Systems", "Energy Efficiency Analysis", "Data Analysis", "Microsoft Excel", "AutoCAD"],
      images: ["toppan-cooling-pid.webp", "toppan-cooling-layout.webp"]
    }
  ],

  /* Skills grouped by category — the assistant uses these to answer
     "does he know X?" and "what languages does he use?" */
  skills: {
    "Engineering & CAD": ["SOLIDWORKS", "Ansys", "Mechanical Design", "GD&T", "3D Printing", "CNC"],
    "Programming": ["Python", "JavaScript", "MATLAB"],
    "Web & Cloud": ["Cloudflare Workers", "Cloudflare KV", "Serverless", "Chart.js", "Claude API", "Streamlit", "GitHub CI/CD"],
    "Finance & Business": ["Treasury Operations", "Financial Services", "Technical Analysis", "Excel", "Financial Analysis", "Market Research"],
    "Other": ["AutoCAD", "Technical Drawing", "Industrial Cooling Systems", "Energy Efficiency Analysis", "Robotics"]
  },

  /* Resume + profiles. Put your resume PDF in this folder and name it here. */
  resume: {
    label: "Download resume (PDF)",
    url: ""                          // e.g. "Jefferson-Evans-Manadi-Resume.pdf"  ← leave "" if you don't have one yet
  },

  // YOUR PROJECTS — drag through them on the site. Copy a block to add more.
  //
  // Optional media fields per project:
  //   cover:  "filename.jpg"  → thumbnail shown on the project card
  //   logo:   "logo.png"      → project logo, shown on the card + popup (transparent PNG works best)
  //   backdrop: "preview.jpg" → screenshot shown dimmed behind the logo (card) and at the top of the popup
  //   video:  a YouTube link, a Vimeo link, or a local file like "demo.mp4"
  //   images: ["shot1.jpg", "shot2.jpg"] → gallery shown inside the project popup
  // Local files (images/video) go in the SAME folder as content.js.
  projects: [
    {
      title: "Robotic Arm",
      category: "Mechanical",
      year: "2026",
      summary: "I designed a low-cost, long-reach robotic arm that gives beginner cinematographers smooth, repeatable camera moves without a $100K+ rig.",
      cover: "robotic-arm-cover.png",
      images: ["robotic-arm-right-view.webp", "robotic-arm-exploded-wrist.webp"],
      description: [
        "I designed a camera arm for a client who wanted sweeping, cinematic shots on a hobbyist budget, where professional dollies and Steadicam rigs cost $100K or more.",
        "I benchmarked commercial and open-source arms to set a spec for reach, payload, degrees of freedom and cost, then compared several arm geometries and joint layouts before settling on the final design.",
        "To keep it affordable I built the structure from standard aluminum extrusion and drove the wrist with NEMA 17 stepper motors through belts and pulleys, using custom 3D-printed (PLA) parts only where fit mattered most.",
        "I delivered the full SOLIDWORKS assembly, a six-sheet engineering drawing package (including the arm assembly and an exploded wrist with its bill of materials), and calculations showing the design meets the client's targets."
      ],
      tags: ["SOLIDWORKS", "Mechanical Design", "Robotics"],
      links: [
        { label: "Case study ↗", url: "robotic-arm-case-study.html" }
      ]
    },
    {
      title: "Forex Analyst",
      category: "Web",
      year: "2026",
      logo: "FA-Logo-crop.png",
      backdrop: "FA-Preview.jpeg",
      summary: "I built a serverless FX research platform that computes live market analytics at the edge and publishes AI-written monthly reports at zero marginal cost.",
      description: [
        "I built ForexAnalyst (forexanalyst.org) to publish institutional-style monthly research on six currency pairs: price action, technical indicators, macro drivers and a forward outlook.",
        "I run the whole platform on a single Cloudflare Worker. It pulls daily OHLC data from Yahoo Finance, computes RSI, MACD, moving averages, market structure and pivot levels server-side, and renders interactive charts in the browser. I generate each month's research notes once with Claude using web-verified event data and store them in Cloudflare KV, so readers never trigger per-request AI costs.",
        "It started as a Streamlit FX dashboard during my CIMB Niaga internship. I rebuilt it as a dependency-free vanilla JS site with its own design system, deployed from GitHub to Cloudflare on a custom domain."
      ],
      tags: ["JavaScript", "Cloudflare Workers", "KV", "Chart.js", "Claude API", "Serverless"],
      links: [
        { label: "Visit forexanalyst.org ↗", url: "https://forexanalyst.org" }
      ]
    },
    {
      title: "Gearbox Prototype",
      category: "Mechanical",
      year: "2025",
      summary: "I designed a working gearbox in SOLIDWORKS, 3D-printed it, assembled it and tested gear engagement, shaft alignment and rotation.",
      cover: "gearbox-cover.webp",
      video: "https://youtube.com/shorts/u5MWhvxsApc?feature=share",   // functional test run
      description: [
        "I designed a functional gearbox in SOLIDWORKS, including the gears, shafts and supporting housing, and produced detailed engineering drawings for the parts and assembly.",
        "I 3D-printed the components, assembled the physical prototype and ran functional tests to check gear engagement, shaft alignment and smooth rotation. The video above shows one of those test runs."
      ],
      tags: ["SOLIDWORKS", "Engineering Drawing", "Mechanical Design", "3D Printing", "Prototyping", "Assembly", "Functional Testing"],
      links: []
    },
    // 👉 TO ADD A NEW PROJECT: copy the entire { ... } block above (Robotic Arm),
    // paste it here as a new block, and change the text inside the quotes.
    // No coding needed — just copy, paste, and edit. Add a comma after each
    // block except the very last one in the list.
  ],

  // Footer / contact links. Copy a line to add more (Dribbble, Instagram, etc.)
  links: [
    { label: "GitHub", url: "https://github.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/jeffersonem/" },
    { label: "X / Twitter", url: "https://x.com" }
  ],

  contact: {
    heading: "Let's build something.",
    sub: "Open to new opportunities and good collaborations. Email is the fastest way to reach me."
  }

};
