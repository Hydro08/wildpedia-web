function animateElements(
  selector,
  animationName = "fade-in-up",
  duration = "1500ms"
) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((el) => {
    el.style.animation = "none";
    el.offsetHeight;
    el.style.animation = `${animationName} ${duration} ease forwards`;
  });
}

const habitats = {
  air: document.getElementById("air-habitat"),
  forest: document.getElementById("forest-habitat"),
  jungle: document.getElementById("jungle-habitat"),
  desert: document.getElementById("desert-habitat"),
  sea: document.getElementById("sea-habitat"),
};

const container = document.getElementById("home-container");

container?.addEventListener("click", (e) => {
  const card = e.target.closest(".cards");
  if (!card) return;

  Object.values(habitats).forEach((h) => {
    h.style.width = "0%";
    h.style.opacity = "0";
    h.style.visibility = "hidden";
  });

  let targetHabitat = null;
  switch (card.id) {
    case "air-card":
      targetHabitat = "air";
      break;
    case "forest-card":
      targetHabitat = "forest";
      break;
    case "jungle-card":
      targetHabitat = "jungle";
      break;
    case "desert-card":
      targetHabitat = "desert";
      break;
    case "sea-card":
      targetHabitat = "sea";
      break;
  }

  if (targetHabitat && habitats[targetHabitat]) {
    const h = habitats[targetHabitat];
    h.style.width = "100%";
    h.style.opacity = "1";
    h.style.visibility = "visible";

    animateElements(`#${h.id} .left-content p`);
    animateElements(`#${h.id} .left-content button`);
    animateElements(`#${h.id} .right-content .cards`);
  }
});

const habitat_block_content = document.getElementById("habitat-block-content");

const topicAir = document.getElementById("topic-air-bg");
const topicForest = document.getElementById("topic-forest-bg");
const topicJungle = document.getElementById("topic-jungle-bg");
const topicDesert = document.getElementById("topic-desert-bg");
const topicSea = document.getElementById("topic-sea-bg");

const backgrounds = {
  "topic-air-bg": "url('assets/images/background/bg-air.webp')",
  "topic-forest-bg": "url('assets/images/background/bg-forest.webp')",
  "topic-jungle-bg": "url('assets/images/background/bg-jungle.webp')",
  "topic-desert-bg": "url('assets/images/background/bg-desert.webp')",
  "topic-sea-bg": "url('assets/images/background/bg-sea.webp')",
};

Object.entries(backgrounds).forEach(([id, url]) => {
  const el = document.getElementById(id);
  el?.addEventListener("mouseover", () => {
    if (habitat_block_content) {
      habitat_block_content.style.backgroundImage = url;
      habitat_block_content.classList.add("background-change");
    }
  });
});

const animal_block_content = document.getElementById("animal-block-content");
const air_habitat_content = document.getElementById("air-habitat-content");
const forest_habitat_content = document.getElementById(
  "forest-habitat-content"
);
const jungle_habitat_content = document.getElementById(
  "jungle-habitat-content"
);
const desert_habitat_content = document.getElementById(
  "desert-habitat-content"
);
const sea_habitat_content = document.getElementById("sea-habitat-content");
const back_habitat = document.querySelectorAll(".back-habitat");
let habitat_text = null;

back_habitat.forEach((back_only) => {
  back_only.addEventListener("click", () => animal_to_habitat());
});

topicAir?.addEventListener("click", () => {
  habitat_text = "air";
  habitat_to_animal();
});
topicForest?.addEventListener("click", () => {
  habitat_text = "forest";
  habitat_to_animal();
});
topicJungle?.addEventListener("click", () => {
  habitat_text = "jungle";
  habitat_to_animal();
});
topicDesert?.addEventListener("click", () => {
  habitat_text = "desert";
  habitat_to_animal();
});
topicSea?.addEventListener("click", () => {
  habitat_text = "sea";
  habitat_to_animal();
});

function habitat_to_animal() {
  if (!habitat_block_content || !animal_block_content) return;

  habitat_block_content.style.width = "0%";
  animal_block_content.style.width = "100%";

  habitat_block_content.style.visibility = "hidden";
  animal_block_content.style.visibility = "visible";

  habitat_block_content.style.opacity = "0";
  animal_block_content.style.opacity = "1";

  if (habitat_text === "air") {
    air_habitat_content.style.width = "100%";
    air_habitat_content.style.visibility = "visible";
    air_habitat_content.style.opacity = "1";
  } else if (habitat_text === "forest") {
    forest_habitat_content.style.width = "100%";
    forest_habitat_content.style.visibility = "visible";
    forest_habitat_content.style.opacity = "1";
  } else if (habitat_text === "jungle") {
    jungle_habitat_content.style.width = "100%";
    jungle_habitat_content.style.visibility = "visible";
    jungle_habitat_content.style.opacity = "1";
  } else if (habitat_text === "desert") {
    desert_habitat_content.style.width = "100%";
    desert_habitat_content.style.visibility = "visible";
    desert_habitat_content.style.opacity = "1";
  } else if (habitat_text === "sea") {
    sea_habitat_content.style.width = "100%";
    sea_habitat_content.style.visibility = "visible";
    sea_habitat_content.style.opacity = "1";
  }
}

function animal_to_habitat() {
  if (!habitat_block_content || !animal_block_content) return;

  habitat_block_content.style.width = "100%";
  animal_block_content.style.width = "0%";

  animal_block_content.style.visibility = "hidden";
  habitat_block_content.style.visibility = "visible";

  habitat_block_content.style.opacity = "1";
  animal_block_content.style.opacity = "0";

  if (habitat_text === "air") {
    air_habitat_content.style.width = "0%";
    air_habitat_content.style.visibility = "hidden";
    air_habitat_content.style.opacity = "0";
    habitat_text = null;
  } else if (habitat_text === "forest") {
    forest_habitat_content.style.width = "0%";
    forest_habitat_content.style.visibility = "hidden";
    forest_habitat_content.style.opacity = "0";
  } else if (habitat_text === "jungle") {
    jungle_habitat_content.style.width = "0%";
    jungle_habitat_content.style.visibility = "hidden";
    jungle_habitat_content.style.opacity = "0";
  } else if (habitat_text === "desert") {
    desert_habitat_content.style.width = "0%";
    desert_habitat_content.style.visibility = "hidden";
    desert_habitat_content.style.opacity = "0";
  } else if (habitat_text === "sea") {
    sea_habitat_content.style.width = "0%";
    sea_habitat_content.style.visibility = "hidden";
    sea_habitat_content.style.opacity = "0";
  }
}
