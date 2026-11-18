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
    tagline: "I’m a third-year mechanical engineering student at the University of Toronto. I like getting hands-on with problems I’m still figuring out, whether that means printing a gearbox or building a better way to follow currency markets.",
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
    heading: "What I like to figure out",
    paragraphs: [
      "At a packaging plant, I looked at what would happen if a production line switched to a closed-loop cooling system. At a treasury desk, I built a dashboard to make it easier to follow currency moves month by month.",
      "The mechanical projects here show another side of how I work. On our camera arm, I looked for a way to get more torque from smaller motors. On our gearbox, the first print jammed, so I went back to the parts that had to fit together."
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
      summary: "I built an FX dashboard to follow currency movements month by month. I also compared how banks priced and positioned their treasury products.",
      highlights: [],
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
      summary: "I worked with the drivetrain team on CAD models for the mechanical components and helped put together the bill of materials.",
      highlights: [],
      skills: ["CAD Modeling", "Mechanical Components", "Engineering Collaboration"]
    },
    {
      role: "Maintenance Engineering Intern",
      org: "PT Toppan Plasindo Lestari",
      logo: "logo-toppan.webp",
      type: "Flexible Packaging Manufacturing",
      period: "Jun – Aug 2025",
      location: "",
      summary: "I compared open- and closed-loop cooling for a blown-film line. I used operating data and piping layouts to assess how the change could affect energy use and whether it could pay for itself.",
      highlights: [],
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
      summary: "Could we move a camera through six axes on a beginner’s budget? I proposed using lead-screw linkages at the two joints that had the most to lift.",
      cover: "robotic-arm-cover.png",
      images: ["robotic-arm-right-view.webp", "robotic-arm-exploded-wrist.webp"],
      description: [
        "Our MIE243 team wanted to design a six-axis camera arm for beginner filmmakers. We set a target payload of 1.5 kg and wanted to keep the cost down. When we compared concepts, I kept coming back to the shoulder and elbow. Those joints had to lift the camera and parts of the arm, and I expected a direct-drive design to need higher-torque motors.",
        "I brought a lead-screw linkage to the team and led the push to use it at those two joints. The screw moves a sliding block that pivots the joint. I was willing to give up some speed to get more mechanical advantage where the arm needed it. At the wrist, we used timing-belt reductions. The belts were easier to route and package for continuous wrist rotation.",
        "The final design had six axes and a maximum reach of 1.2 m. We estimated CAD 814 for the design before electronics. The existing drawings show how the mechanisms fit together."
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
      summary: "I started with a dashboard for tracking currencies at CIMB Niaga, then rebuilt it for the web so I could share the tracker and its monthly reports.",
      description: [
        "Forex Analyst started as a Streamlit dashboard I built during my treasury internship at CIMB Niaga. I wanted a clearer way to see how currencies had moved over the month. I later moved it to Cloudflare and added monthly market write-ups.",
        "The site runs on a single Cloudflare Worker. It pulls daily OHLC data from Yahoo Finance, computes RSI, MACD, moving averages, market structure and pivot levels server-side, and renders interactive charts in the browser. I draft each month's write-up with Claude's help, using web-verified event data. The finished editions are stored in Cloudflare KV and served as static pages instead of being generated on every visit.",
        "For the web version I rebuilt the front end as a dependency-free vanilla JS site with its own design system, deployed from GitHub to Cloudflare on a custom domain."
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
      summary: "I wanted a 15:1 gearbox that snapped together like LEGO. The first print jammed, so I went back to the clearances and how I printed the shaft.",
      cover: "gearbox-cover.webp",
      heroImage: "gearbox-cover.webp",   // design shown as a short banner at the top of the popup
      video: "https://youtube.com/shorts/u5MWhvxsApc?feature=share",   // functional test run
      videoBelow: true,                  // show the video under the text instead of in the banner
      videoLabel: "Design & testing",
      description: [
        "I liked how LEGO pieces click together, and I wanted our gearbox to feel that easy to assemble. Our design used two stages of helical gears to get a 15:1 speed reduction.",
        "The first print jammed when I tried to turn it. I had left too little clearance for the gears, and the way I oriented the shaft on the print bed left it slightly out of round. I opened up the clearances in the redesign and got the next version assembled and turning.",
        "That first print changed what I pay attention to before printing a mechanism. Now I look more closely at the surfaces that have to fit or move against each other, and at how print orientation might affect them. The video below shows the revised gearbox running."
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
