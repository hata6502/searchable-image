const fileInput = document.querySelector("#file-input");
const submitButton = document.querySelector("#submit-button");
const result = document.querySelector("#result");

const ocrForm = document.getElementById("ocr-form");
ocrForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitButton.disabled = true;
  submitButton.textContent = "Converting...";
  try {
    const file = fileInput.files[0];
    if (!file) {
      alert("No file selected.");
      return;
    }

    const dataURL = await new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        resolve(event.target.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
      fileReader.readAsDataURL(file);
    });

    const response = await fetch(
      "https://us-central1-searchable-image.cloudfunctions.net/ocr",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: dataURL.split(",")[1] }),
      }
    );
    if (!response.ok) {
      alert("Error uploading file.");
      return;
    }
    const { html } = await response.json();

    result.replaceChildren();
    const resultHTML = document.createElement("pre");
    resultHTML.textContent = html;
    result.append(resultHTML);
    result.insertAdjacentHTML("beforeend", html);
    const searchableImage = result.querySelector("s-img");
    searchableImage.alt = "";
    searchableImage.src = URL.createObjectURL(file);
    searchableImage.classList.add("mt-4");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Convert";
  }
});
