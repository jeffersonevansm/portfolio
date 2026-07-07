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
    role: "Mechanical Engineer",
    tagline: "I build things that feel effortless — from the systems underneath to the surface you touch. Curious by default, happiest when learning something new.",
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
      "My academic foundation is in Mechanical Engineering, but my curiosity extends beyond engineering into finance and business. Through internships in both the manufacturing and banking industries, I've developed a passion for solving problems from both technical and commercial perspectives. From optimizing production processes in a flexible packaging factory to learning about financial services and treasury operations at CIMB Niaga, I enjoy exploring how different industries create value and drive innovation.",
      "What drives me is curiosity. I'd rather take on an unfamiliar problem and learn my way through it than repeat something I've already solved."
    ],
    focus: ["Mechatronics & Robotics", "Manufacturing", "Global Markets"],
    tools: ["SOLIDWORKS", "Ansys Benchmark", "MATLAB", "Excel", "Python"]
  },

  // YOUR PROJECTS — drag through them on the site. Copy a block to add more.
  //
  // Optional media fields per project:
  //   cover:  "filename.jpg"  → thumbnail shown on the project card
  //   video:  a YouTube link, a Vimeo link, or a local file like "demo.mp4"
  //   images: ["shot1.jpg", "shot2.jpg"] → gallery shown inside the project popup
  // Local files (images/video) go in the SAME folder as content.js.
  projects: [
    {
      title: "Robotic Arm",
      category: "Mechanical",
      year: "2026",
      summary: "A low-cost, long-reach robotic arm that gives hobbyist and beginner cinematographers smooth, sweeping camera moves without a $100K+ rig.",
      cover: "robotic-arm-cover.png",
      video: "https://www.youtube.com/watch?v=REPLACE_WITH_YOUR_VIDEO_ID",
      images: ["robotic-arm-1.jpg", "robotic-arm-2.jpg"],
      description: [
        "The client wanted a way for hobbyist and beginner cinematographers to get smooth, sweeping camera moves without paying for professional equipment. Track dollies and Steadicam rigs cost $100K-$500K+, are heavy, and need multiple operators to run — completely out of reach for someone shooting on a modest budget. They needed a robotic arm that could mount a lightweight camera, cover a large working area, and repeat those cinematic moves reliably, at a fraction of the cost.",
        "I started by surveying commercial and open-source/hobby arm designs, benchmarking reach, payload, and cost against what the DIY community was already building. That research set the engineering specification — reach, payload, degrees of freedom, motion precision, and target budget — so every later decision could be checked against a concrete target instead of guesswork.",
        "From there I developed and compared several candidate arm geometries and joint configurations, iterating toward a final design that balances reach, motion smoothness, and cost. Where possible I specified standardized structural extrusion and hobby-grade motors to keep the bill of materials low; custom 3D-printed and CNC parts were reserved for the joints where fit and function mattered most.",
        "The deliverable is a full CAD assembly with detailed engineering drawings, a parts list referencing standard components, and supporting calculations validating that the design meets the client's reach, payload, and cost targets."
      ],
      tags: ["SOLIDWORKS", "Mechanical Design", "Robotics"],
      links: [
        { label: "Case study ↗", url: "robotic-arm-case-study.html" }
      ]
    },
    {
      title: "Atlas Dashboard",
      category: "Web",
      year: "2025",
      summary: "Real-time analytics handling 50k live connections with sub-100ms updates.",
      description: [
        "Atlas visualises high-volume event streams as they happen. The challenge was keeping the interface responsive while ingesting tens of thousands of events per second.",
        "I built a WebSocket layer with smart batching and a virtualised renderer, so the UI holds 60fps under heavy load."
      ],
      tags: ["TypeScript", "React", "WebSocket", "Redis"],
      links: [
        { label: "Live demo ↗", url: "#" },
        { label: "Source ↗", url: "#" }
      ]
    },
    {
      title: "Quill Engine",
      category: "Systems",
      year: "2024",
      summary: "A distributed task scheduler with exactly-once delivery, written in Go.",
      description: [
        "Quill is a fault-tolerant scheduler for jobs that absolutely cannot run twice. It coordinates work across a cluster and persists state durably.",
        "I implemented leader-election, the dedup layer, and graceful back-pressure under load."
      ],
      tags: ["Go", "gRPC", "etcd", "PostgreSQL"],
      links: [
        { label: "Source ↗", url: "#" }
      ]
    },
    {
      title: "Pulse Monitor",
      category: "Hardware",
      year: "2024",
      summary: "Low-power IoT sensor running on-device ML for anomaly detection.",
      description: [
        "Pulse runs a lightweight model directly on a microcontroller to flag anomalies without a constant network connection.",
        "I designed the firmware and power scheme that pushed battery life past six months."
      ],
      tags: ["C", "Rust", "TensorFlow Lite"],
      links: [
        { label: "Case study ↗", url: "#" }
      ]
    },
    {
      title: "Drift CMS",
      category: "Web",
      year: "2023",
      summary: "A headless content platform with a block editor and instant preview.",
      description: [
        "Drift models content as composable, fully-typed blocks with a focus on editor ergonomics.",
        "I built the collaborative editor with conflict-free merging and live cross-device preview."
      ],
      tags: ["TypeScript", "Node", "CRDT"],
      links: [
        { label: "Live demo ↗", url: "#" }
      ]
    },
    {
      title: "Relay",
      category: "Open Source",
      year: "2022",
      summary: "A CLI for reproducible local dev environments. 2k+ stars.",
      description: [
        "Relay spins up reproducible dev environments from one config file, so 'works on my machine' stops being a problem.",
        "I created the dependency-resolution engine and the plugin system the community builds on."
      ],
      tags: ["Go", "Docker", "CLI"],
      links: [
        { label: "GitHub ↗", url: "#" }
      ]
    }
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
