const article_container = document.getElementById("article-container");
const image_video_container = document.getElementById("image-video-container");
const switch_video = document.getElementById("switch-video");
const switch_image = document.getElementById("switch-image");

const image_content = document.getElementById("image-content");
const video_content = document.getElementById("video-content");

const animalContainer = document.getElementById("animal-container");
const animalImage = document.getElementById("animal-image");
const animalVideo = document.getElementById("animal-video");
const creditsOwner = document.getElementById("ctto");
const animalNameText = document.getElementById("animal-name");
const locationText = document.getElementById("location-text");
const descText = document.getElementById("desc-text");
const triviaText = document.getElementById("trivia-text");
const funfactText = document.getElementById("funfact-text");
const imageContainer = document.querySelector(".image-container");
imageContainer.innerHTML = "";

const params = new URLSearchParams(window.location.search);
const animalName = params.get("name");

let player;

function onYouTubeIframeAPIReady() {
  const iframe = document.getElementById("animal-video");
  if (iframe) {
    player = new YT.Player("animal-video");
  }
}

fetch("assets/data/animal.json")
  .then((response) => response.json())
  .then((data) => {
    const habitats = Object.values(data);
    let animal = null;

    for (let h of habitats) {
      animal = h.find((a) => a.name === animalName);
      if (animal) break;
    }

    if (animal) {
      animalContainer.style.backgroundImage = `url(${animal.image})`;

      document.title = animal.name;
      animalNameText.textContent = animal.name;
      animalImage.src = animal.image;
      animalImage.alt = animal.name;

      creditsOwner.textContent = "Video Credit: [" + animal.credits + "]";
      locationText.textContent = animal.location;
      descText.textContent = animal.description;
      triviaText.textContent = animal.trivia;
      funfactText.textContent = animal.fun_fact;

      switch_video.addEventListener("click", () => {
        video_content.style.width = "100%";
        image_content.style.width = "0%";

        video_content.style.visibility = "visible";
        image_content.style.visibility = "hidden";

        article_container.style.display = "flex";
        article_container.style.flexDirection = "column";

        image_video_container.style.width = "90%";
      });

      switch_image.addEventListener("click", () => {
        if (player) player.pauseVideo();

        video_content.style.width = "0%";
        image_content.style.width = "100%";

        video_content.style.visibility = "hidden";
        image_content.style.visibility = "visible";

        article_container.style.flexDirection = "row";
        image_video_container.style.width = "30%";
      });

      const currentHabitat = Object.keys(data).find((h) =>
        data[h].some((a) => a.name === animalName)
      );
      const habitatAnimals = data[currentHabitat].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      habitatAnimals.forEach((a) => {
        const div = document.createElement("div");
        div.classList.add("image-content");

        const img = document.createElement("img");
        img.src = a.image;
        img.alt = a.name;

        if (a.name === animalName) {
          img.style.boxShadow = "0 0 10px white";
          img.style.transform = "translateY(-10px)";
        }

        img.addEventListener("click", () => {
          window.location.href = `animal-content.html?name=${encodeURIComponent(
            a.name
          )}`;
        });

        div.appendChild(img);
        imageContainer.appendChild(div);
      });

      if (animal.video) {
        animalVideo.src = animal.video + "?enablejsapi=1";
        player = new YT.Player("animal-video");
      } else {
        video_content.style.display = "none";
        switch_video.style.display = "none";
      }
    } else {
      animalNameText.textContent = "Animal not found!";
    }
  })
  .catch((err) => {
    console.error("Failed to load JSON:", err);
  });
