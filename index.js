"use strict";

/*
 * Name: Yvonne Wang
 * Date: October 30, 2024
 * Section: CSE 154 AA
 *
 * This is the JS implementation for my Guess the Art! page. It requests and displays
 * images of artwork from the Institute of Chicago API, takes in user's input on
 * their answers, and requests and generates hints (descriptions of a random word) from
 * the Free Dictionary API.
 */
(function() {

  window.addEventListener("load", init);
  const ART_BASE_URL_FRONT = "https://api.artic.edu/api/v1/artworks/";
  const ART_BASE_URL_END = "?fields=id,title,description,iiif_url,image_id/";
  const ART_IMG_END = "/full/843,/0/default.jpg";
  const HINT_BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
  const ART_ID_MIN = 10000;
  const ART_ID_ADD = 90000;
  const HALF_A_SEC = 500;
  const FOUR_O_FOUR = 404;
  let artTitle = [];

  /**
   * This function adds an event listener to the start button to request and show
   * image of art, adds an event listener to the hint button to request and
   * generate hint (description of a random word), and adds an event listener to
   * checks the input answer from the user.
   */
  function init() {
    id("start-btn").addEventListener("click", requestArt);
    id("hint-btn").addEventListener("click", requestHint);

    qs("input").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        checkAnswer();
      }
    });
  }

  /**
   * This function makes a request to the Institute of Chicago API to generate
   * a random image for users to guess.
   */
  async function requestArt() {
    id("result-message-box").innerHTML = "";
    qs("#enter-answer article").innerHTML = "";

    let randomId = ART_ID_MIN + Math.floor(Math.random() * ART_ID_ADD);

    let url = ART_BASE_URL_FRONT + randomId + ART_BASE_URL_END;

    try {
      let result = await fetch(url);
      await statusCheck(result);
      result = await result.json();
      processArt(result);
    } catch (err) {
      if (err.message.includes(FOUR_O_FOUR)) {
        handleError();
        requestArt();
      } else {
        handleError();
      }
    }

    id("enter-answer").classList.remove("hidden");
  }

  /**
   * This function processes the requested data and shows the generated art image on
   * the page.
   * @param {JSON} result - the json object from the Institute of Chicago API
   */
  function processArt(result) {
    id("img-box").innerHTML = "";

    artTitle = result["data"]["title"].split(" ");

    let imgUrl = result["config"]["iiif_url"] + "/" + result["data"]["image_id"] + ART_IMG_END;
    let theArt = gen("img");

    theArt.src = imgUrl;
    theArt.alt = artTitle.join(" ");

    id("img-box").appendChild(theArt);
  }

  /**
   * This function randomly chooses a word in the name of the art and makes a
   * request to the Free Dictionary API for the definition of the word to show as
   * a hint to the user.
   */
  async function requestHint() {
    let randomIndex = Math.floor(Math.random() * artTitle.length);
    let theWord = artTitle[randomIndex];
    theWord = theWord.replace(/^[^\w]+|[^\w]+$/g, '');

    let url = HINT_BASE_URL + theWord;
    try {
      let result = await fetch(url);
      await statusCheck(result);
      result = await result.json();
      processHint(result, theWord);
    } catch (err) {
      handleError();
    }
  }

  /**
   * This function processes the requested data and shows the hint on the page.
   * If the word is not found in the dictionary, it shows a message with the random
   * word directly.
   * @param {JSON} result - the json object from the Free Dictionary API
   * @param {string} theWord - the randomly selected word from the name of the art
   */
  function processHint(result, theWord) {
    let theHint = gen("p");
    if (result["title"]) {
      theHint.textContent = "Sorry, we can't find a definition for one of the words, so we will" +
      " just give it to you. Here: " + theWord;
    } else {
      let definition = result[0]["meanings"][0]["definitions"][0]["definition"];
      theHint.textContent = definition;
    }

    qs("#enter-answer article").innerHTML = "";
    setTimeout(() => {
      qs("#enter-answer article").appendChild(theHint);

      let anotherHintMessage = gen("p");
      anotherHintMessage.textContent = "(Need another hint? Push the button again!)";
      qs("#enter-answer article").appendChild(anotherHintMessage);
    }, HALF_A_SEC);
  }

  /**
   * This function checks the user input to see if the answer matches the name of
   * the art. It accept correct answers with or without punctuation. It tells users
   * whether their answer is correct or not.
   */
  function checkAnswer() {
    let theirAnswer = qs("input").value;
    let correctAnswerWithPunch = artTitle.join(" ");
    let correctAnswerWithoutPunch = "";
    for (let i = 0; i < artTitle.length; i++) {
      correctAnswerWithoutPunch += artTitle[i].replace(/^[^\w]+|[^\w]+$/g, '');
      if (i !== (artTitle.length - 1)) {
        correctAnswerWithoutPunch += " ";
      }
    }
    let resultMessage = gen("p");
    if (theirAnswer === correctAnswerWithPunch || theirAnswer === correctAnswerWithoutPunch) {
      resultMessage.textContent = "Correct!";
    } else {
      resultMessage.textContent = "Incorrect :( Try again!";
    }
    resultMessage.classList.add("result");
    id("result-message-box").innerHTML = "";
    setTimeout(() => {
      id("result-message-box").appendChild(resultMessage);
    }, HALF_A_SEC);
  }

  /**
   * This function handles error of the functions requestArt and requestHint.
   * It shows the error message "Ooops, something when wrong... Wait or refresh!"
   * in the image box.
   */
  function handleError() {
    let errorMessage = gen("p");
    errorMessage.textContent = "Ooops, something when wrong... Wait or refresh!";
    id("img-box").innerHTML = "";
    id("img-box").appendChild(errorMessage);
  }

  /**
   * This function checks the status of the result of a request. It
   * throws an error if the status is not ok.
   * @param {Response} res - the response object from a fetch request
   * @returns {Response} the original response object if the request is successful
   */
  async function statusCheck(res) {
    if (!res.ok) {
      throw new Error(await res.text());
    }
    return res;
  }

  /**
   * This function returns the DOM object with the given id
   * @param {String} id - the given id
   * @return {node} the first node that matches the CSS selector String
   * or null if the id doesn't exist
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * This function returns the first element that matches the CSS selector String
   * @param {String} selector - the CSS selector String
   * @return {node} the first node that matches the CSS selector String or null
   * if no element matches
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * This function creates and returns a new empty DOM node representing an
   * element of the given type
   * @param {String} tagName - the given type
   * @return {node} - an empty node of the given type
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
}
)();