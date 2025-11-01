// js/project-page.js
function getProjectId() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");

  return projectId;
}

function applyProjectColors() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("id");

  const hero = document.querySelector(".hero");
  const headline = document.getElementById("project-title");

  // Hero background
  const heroGradients = {
    mytar: "linear-gradient(135deg, #ece9e6, #ffffff)",
    boids: "linear-gradient(135deg, #e0f7fa, #b2ebf2)",
    racing_game: "linear-gradient(135deg, #fff3e0, #ffe0b2)",
    chatapp: "linear-gradient(135deg, #fff3e0, #ffe0b2)"
  };

  if (heroGradients[projectId]) {
    hero.style.background = heroGradients[projectId];
  }

  // Headline text gradient
  const headlineGradients = {
    mytar: "linear-gradient(90deg, #222, #0078ff)",
    boids: "linear-gradient(90deg, #0060cc, #00c6ff)",
    racing_game: "linear-gradient(90deg, #ff6b00, #ffd700)",
    chatapp: "linear-gradient(90deg, #222, #0078ff)",
  };

  if (headlineGradients[projectId]) {
    headline.style.background = headlineGradients[projectId];
    headline.style.webkitBackgroundClip = "text";
    headline.style.webkitTextFillColor = "transparent";
    headline.style.backgroundClip = "text";
  }

  // Set CSS variables for the rest of the page
  const root = document.documentElement;
  const themeColors = {
    mytar: { primary: "#0078ff", glow: "#00aaff" },
    boids: { primary: "#00c6ff", glow: "#0060cc" },
    racing_game: { primary: "#ffd700", glow: "#ff6b00" },
    chatapp: { primary: "#0078ff", glow: "#00aaff" },
  };

  if (themeColors[projectId]) {
    root.style.setProperty("--primary", themeColors[projectId].primary);
    root.style.setProperty("--primary-glow", themeColors[projectId].glow);
  }
}

window.addEventListener("DOMContentLoaded", applyProjectColors);


function renderProject(project) {
  if (!project) {
    document.querySelector("main").innerHTML = "<p>Project not found.</p>";
    return;
  }

  document.title = `${project.title} | Portfolio`;

  document.getElementById("project-title").textContent = project.title;
  document.getElementById("project-description").textContent = project.description;
  document.getElementById("project-overview").innerHTML = project.overview;

  // tech list
  const techList = document.getElementById("project-tech");
  techList.innerHTML = "";
  project.tech.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    techList.appendChild(li);
  });

  // gallery
  const gallery = document.getElementById("project-gallery");
  gallery.innerHTML = "";
  project.images.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = project.title;
    gallery.appendChild(img);
  });

  // links
  const links = document.getElementById("project-links");
  links.innerHTML = "";
  for (const [key, url] of Object.entries(project.links)) {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = `${key.charAt(0).toUpperCase() + key.slice(1)}`;
    a.target = "_blank";
    links.appendChild(a);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const id = getProjectId();
  renderProject(projects[id]);
});
