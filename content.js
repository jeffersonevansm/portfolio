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
    location: "Berlin, DE",
    email: "jeffersonevansm@gmail.com",

    // YOUR PHOTOS — the brush reveals photo2 from under photo1.
    // Put your image files in the SAME folder as these two files,
    // then write the file names here. Leave "" to use placeholders.
    photo:       "",   // e.g. "me-1.jpg"  (the cover photo)
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
      "My academic foundation is in Mechanical Engineering, but my curiosity extends beyond engineering into finance and business. Through internships in both the manufacturing and banking industries, I've developed a passion for solving problems from both technical and commercial perspectives.

From optimizing production processes in a flexible packaging factory to learning about financial services and treasury operations at CIMB Niaga, I enjoy exploring how different industries create value and drive innovation.
",
      "What drives me is curiosity. I'd rather take on an unfamiliar problem and learn my way through it than repeat something I've already solved."
    ],
    focus: ["Systems & backend", "Interfaces & web", "Embedded & hardware"],
    tools: ["TypeScript", "Go", "Rust", "Python", "React", "Node", "PostgreSQL", "Docker", "AWS"]
  },

  // YOUR PROJECTS — drag through them on the site. Copy a block to add more.
  projects: [
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
    { label: "LinkedIn", url: "https://linkedin.com" },
    { label: "X / Twitter", url: "https://x.com" }
  ],

  contact: {
    heading: "Let's build something.",
    sub: "Open to new opportunities and good collaborations. Email is the fastest way to reach me."
  }

};
