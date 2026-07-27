const projects = {
  mytar: {
    title: "mytar - Tar Archive Utility",
    description: "A lightweight command-line tool for managing .tar archives with support for listing and extracting files.",
    overview: `
      <p><strong>mytar</strong> is a C implementation of a basic tar utility, compatible with standard GNU tar archives. 
      It supports listing and extracting files from <code>.tar</code> archives, 
      including optional verbose output and selective extraction of specific files.</p>

      <p>The project was part of a systems programming course assignment, focusing on 
      argument parsing, file handling, and understanding the tar format structure at the byte level.</p>

      <h3>Features</h3>
      <ul>
        <li><code>-t</code>: List archive contents.</li>
        <li><code>-x</code>: Extract files from the archive.</li>
        <li><code>-v</code>: Verbose output during extraction (works only with <code>-x</code>).</li>
        <li><code>-f &lt;archive_file&gt;</code>: Mandatory option specifying the archive file.</li>
      </ul>

      <h3>Compilation</h3>
      <pre><code>make</code></pre>

      <h3>Usage</h3>
      <pre><code>./mytar [options] -f &lt;archive_file&gt; [files_to_process...]</code></pre>

      <h3>Examples</h3>
      <pre><code>
# List all files in the archive
./mytar -t -f myarchive.tar

# Extract all files
./mytar -x -f myarchive.tar

# Extract specific files
./mytar -x -f myarchive.tar file1.txt

# Extract with verbose output
./mytar -x -v -f myarchive.tar
      </code></pre>
    `,
    tech: ["C programming", "Makefile", "File I/O", "UNIX command-line tools"],
    images: [
      
    ],
    links: {
      github: "https://github.com/stiborlukas/tar_implementation"
    }
  },

  boids: {
    title: "Swarm Intelligence (Boids)",
    description: "A WPF simulation of flocking behavior inspired by natural swarm intelligence, demonstrating autonomous agents (boids) following simple interaction rules.",
    overview: `
      <p><strong>Swarm Intelligence (Boids)</strong> is a C# project simulating collective behavior of autonomous agents, 
      inspired by natural flocking seen in birds or fish. Each agent (boid) moves according to local rules that produce emergent global behavior.</p>

      <h3>Project Idea</h3>
      <p>
        The goal of the program is to create a simulation of collective behavior using the "boids" model. 
        Simple agents follow local rules - separation, alignment, and cohesion - resulting in complex, lifelike movement patterns.
      </p>

      <h3>Core Algorithm</h3>
      <pre><code>
1. Initialize n boids with random positions and velocities.
2. For each frame:
   - Identify nearby neighbors.
   - Apply the three base rules:
       • Separation - avoid crowding neighbors.
       • Alignment - align direction with nearby boids.
       • Cohesion - move toward the average position of neighbors.
   - Update position and direction.
3. Render updated positions in real time.
      </code></pre>

      <h3>Inputs & Outputs</h3>
      <ul>
        <li><strong>Inputs:</strong> Number of boids, separation, alignment, and cohesion parameters, optional import of initial positions.</li>
        <li><strong>Outputs:</strong> Real-time visualization of boid motion, exportable state for later import.</li>
      </ul>

      <h3>User Interface</h3>
      <p>
        The simulation is built as a WPF desktop application featuring:
      </p>
      <ul>
        <li>A live render area for the simulation.</li>
        <li>Controls: <em>Start</em>, <em>Reset</em>, <em>Import</em>, and <em>Export</em>.</li>
        <li>Sliders for adjusting behavioral parameters (separation, alignment, cohesion).</li>
      </ul>
    `,
    tech: ["C#", ".NET", "WPF", "Object-Oriented Programming", "Simulation"],
    images: [
      "images/boids/0.png",
      "images/boids/1.png",
      "images/boids/2.png"
    ],
    links: {
      github: "https://github.com/stiborlukas/boids"
    }
  },

  chatapp: {
    title: "Client-Server Chat Application",
    description: "A Python-based client-server chat application featuring real-time communication, private messaging, and a modern GUI built with CustomTkinter.",
    overview: `
      <p><strong>Client-Server Chat Application</strong> is a Python project demonstrating socket-based networking with a graphical interface.
      It enables multiple users to connect to a shared server, exchange messages in real time, and use commands for chat management and private messaging.</p>

      <h3>Server-Side Features</h3>
      <ul>
        <li><strong>Socket Setup:</strong> Listens for incoming connections on <code>127.0.0.1:9090</code>.</li>
        <li><strong>Client Management:</strong> Handles broadcasting, private messaging (<code>@username</code>), and user commands (<code>/help</code>, <code>/users</code>, <code>/clear</code>).</li>
        <li><strong>Logging:</strong> Records events and errors with timestamps to <code>server_logs.log</code>.</li>
        <li><strong>Concurrency:</strong> Uses threading to manage multiple clients simultaneously.</li>
      </ul>

      <h3>Client-Side Features</h3>
      <ul>
        <li>Modern GUI built with <code>CustomTkinter</code>.</li>
        <li>Real-time message display and input box with send button or Ctrl+Enter shortcut.</li>
        <li>Nickname prompt and unique name enforcement.</li>
        <li>Graceful disconnection handling and error recovery.</li>
      </ul>

      <h3>How It Works</h3>
      <pre><code>
Server:
  1. Accept client connections and assign nicknames.
  2. Broadcast or direct messages between clients.
  3. Log events and manage connections in threads.

Client:
  1. Connect to the server and open GUI.
  2. Send and receive messages in real time.
  3. Use commands and private messaging features.
      </code></pre>

      <h3>Running the Application</h3>
      <pre><code>
# Start the server
python server.py

# Start a client
python client.py
      </code></pre>

      <p>Enter a nickname when prompted and start chatting in real time.</p>
    `,
    tech: ["Python", "socket", "threading", "CustomTkinter", "Networking"],
    images: [
      "images/chatapp/0.png",
      "images/chatapp/1.png",
      "images/chatapp/2.png"
    ],
    links: {
      github: "https://github.com/stiborlukas/Client-Server-Chat-Application"
    }
  },

  racing_game: {
    title: "SurrealRacing - Racing Game in Unity",
    description: "An offline single-player racing game built in Unity featuring three unique levels, a vehicle and map unlocking system, save/load progression, and surreal visual effects.",
    overview: `
      <p><strong>SurrealRacing</strong> is a high-school graduation project focused on creating an arcade-style racing simulator. 
      The player races against time across three thematically distinct tracks (Tutorial - post-apocalyptic city, Surrealistic Madness - twisted forest with flying objects, Winnie The Pooh - foggy, absurd world with eye-tracking visuals). 
      The goal is to achieve the best time possible, earn in-game currency, and unlock new cars and maps as progress is made.</p>

      <h3>Features</h3>
      <ul>
        <li><strong>Main Menu:</strong> Play, Garage, Settings, Quit.</li>
        <li><strong>Garage:</strong> Car selection and purchase system (8 models with unique driving characteristics).</li>
        <li><strong>Map Selection:</strong> Progressive unlocking of 3 levels with a loading screen and progress bar.</li>
        <li><strong>Gameplay Mechanics:</strong> Checkpoint system, countdown start, timer, speedometer, minimap, and pause menu with restart.</li>
        <li><strong>Sense of Speed:</strong> Dynamic camera (FOV, position, shake), motion blur, engine sounds, and environmental elements passing quickly by.</li>
        <li><strong>Save System:</strong> Progress, money, unlocked cars/maps (BinaryFormatter + PlayerPrefs for settings).</li>
        <li><strong>Post-Processing:</strong> Motion Blur, Grain, Vignette, Chromatic Aberration, Bloom, and Color Grading - each level with a unique post-processing profile.</li>
        <li><strong>Audio:</strong> Menu music, SFX (countdown, UI, engine), adjustable volume controls.</li>
        <li><strong>Settings:</strong> Resolution, minimap position, music/SFX volume, pixelation (custom shader).</li>
        <li><strong>AI Opponent:</strong> Waypoint Circuit for a ghost car (race against your best time).</li>
      </ul>

      <h3>Usage</h3>
      <pre><code># Keyboard Controls
W/S - Accelerate / Brake / Reverse
A/D - Steer
ESC - Pause Menu
Space - Handbrake (drift)</code></pre>

    `,
    tech: [
      "Unity",
      "C# scripting",
      "Post-Processing Stack",
      "JSON / BinaryFormatter / PlayerPrefs",
      "Shader Graph",
      "UI Canvas",
      "Async Scene Loading",
      "Optimization (LOD, Profiler)"
    ],
    images: [
      "images/racing_game/0.png",
      "images/racing_game/1.png",
      "images/racing_game/2.png",
      "images/racing_game/3.png",
      "images/racing_game/4.png"
    ],
    links: {
      download: "?"
    }
  },

  tripline: {
    title: "Tripline - Multi-Day Bikepacking Trip Visualizer",
    description: "A browser-based tool that merges daily GPX files from a multi-day bikepacking trip into one continuous route, elevation profile, and set of trip statistics - plus a shareable export card.",
    overview: `
      <p><strong>Tripline</strong> solves a problem every multi-day bikepacker runs into: a GPS device produces
      one GPX file per day, and most tools treat each file as a separate activity. A four-day trip becomes four
      disconnected rides with no single view of the trip as a whole. Tripline merges them entirely client-side
      into one continuous route, one elevation profile, and one set of trip-wide statistics - no server, no
      upload, no account required.</p>

      <p>The project grew out of a real gap: after finishing a first bikepacking trip, there was no
      straightforward way to turn several days of GPX files into one shareable summary of the trip - so this
      became a small tool to fix that.</p>

      <h3>Features</h3>
      <ul>
        <li>Drag-and-drop import of multiple GPX files, auto-sorted by recorded start time (with manual
        reordering available for files missing reliable timestamps).</li>
        <li>Interactive Leaflet map with each day drawn in its own color and a numbered start marker.</li>
        <li>One continuous elevation profile spanning the whole trip by cumulative distance, rather than a
        separate chart per day.</li>
        <li>Trip statistics grouped by category:
          <ul>
            <li><strong>Route</strong> - distance, days, longest day, N-S / E-W span</li>
            <li><strong>Elevation</strong> - gain, loss, highest/lowest point, net elevation change, longest
            climb and biggest climb tracked as two separate stats (often two different days entirely)</li>
            <li><strong>Time</strong> - moving time, elapsed time, moving %, longest stop</li>
            <li><strong>Speed</strong> - average (moving and total), max speed</li>
          </ul>
        </li>
        <li>Per-day breakdown table with manual reorder/remove.</li>
        <li>A shareable summary card - route, key stats, elevation silhouette - exportable as PNG in several
        formats (Instagram Story, Post, Square, landscape social, or print-ready A4/A5).</li>
      </ul>

      <h3>Technical Highlights</h3>
      <ul>
        <li>Elevation gain/loss uses a hysteresis algorithm over a smoothing window sized from the GPX file's
        actual recording interval (not point count), tuned to reject sensor/GPS noise while preserving real
        terrain texture - validated against a synthetic ground-truth elevation profile before shipping.</li>
        <li>Climb detection reuses the same hysteresis walk to isolate individual contiguous climbing segments,
        so "longest climb" (by distance) and "biggest climb" (by meters gained) are tracked independently.</li>
        <li>The shareable card's map is not a screenshot of the live Leaflet map - it's hand-drawn onto a
        <code>&lt;canvas&gt;</code> using the same Web Mercator tile math real map servers use, since
        <code>html2canvas</code> cannot reliably capture a live, CSS-transformed Leaflet view (async tile
        loading, transform-positioned panes).</li>
        <li>Card export formats reflow the actual layout via flexbox rather than just cropping an aspect
        ratio - the map claims whatever vertical space is left after the title, stats, and elevation chart,
        and a CSS container query (not a viewport media query) handles the stat grid's column count, since a
        narrow Story-format card can exist on a wide desktop screen.</li>
        <li>Defensive engineering born from real bugs: all array min/max operations use a plain loop rather
        than <code>Math.max(...array)</code>, which throws a stack-size error on the point counts a multi-day,
        1Hz-recorded GPX file can easily produce.</li>
      </ul>

      <h3>Stack</h3>
      <p>Plain HTML/CSS/JavaScript - no framework, no build step, no backend. Leaflet for the interactive map,
      html2canvas for PNG export, hand-built SVG for the elevation chart, and the Canvas API for the
      export card's map.</p>
    `,
    tech: [
      "JavaScript",
      "HTML/CSS",
      "Leaflet.js",
      "Canvas API",
      "html2canvas",
      "GPX / GIS data processing",
      "Web Mercator projection"
    ],
    images: [
      "images/tripline/0.png",
      "images/tripline/1.png",
    ],
    links: {
      github: "https://github.com/stiborlukas/tripline",
      demo: "https://stiborlukas.github.io/tripline/"
    }
  }
};