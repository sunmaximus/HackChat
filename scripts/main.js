/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const API_KEY = "AIzaSyBOHmgokLOaN-k-CfYWFJSZLsUbs0DG6Z0";
const translateText_API = `https://www.googleapis.com/language/translate/v2?key=${API_KEY}`;
const detectLanguage_API = `https://www.googleapis.com/language/translate/v2/detect?key=${API_KEY}`;

var isMicOn = false;
var targetLanguage = "en";
var targetSpeechSpeaker = "US English Female";
var langs =
[['Deutsch',         ['de'],['Dutch Female']],
 ['English',         ['en'],['US English Female']],
 ['Español',         ['es'],['Spanish Latin American Female']],
 ['Français',        ['fr'],['French Female']],
 ['Italiano',        ['it'],['Italian Female']],
 ['Polski',          ['pl'],['Polish Female']],
 ['Português',       ['pt'],['Brazilian Portuguese Female']],
 ['Svenska',         ['sv'],['Swedish Female']],
 ['Türkçe',          ['tr'],['Turkish Female']],
 ['Pусский',         ['ru'],['Russian Female']],
 ['Српски',          ['sr'],['Serbian Male']],
 ['한국어',            ['ko'],['Korean Female']],
 ['中文',             ['zh-TW'],['Chinese Female']],
 ['日本語',           ['ja'],['Japanese Female']],
 ['Lingua latīna',   ['la'],['Latin Female']]];

var final_transcript = '';
var recognizing = false;
var ignore_onend;
var start_timestamp;
var recognition;
// Initializes FriendlyChat.
function FriendlyChat() {
  this.checkSetup();

  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  this.userPic = document.getElementById('user-pic');
  this.userName = document.getElementById('user-name');
  this.signInButton = document.getElementById('sign-in');
  this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');
  this.micButton = document.getElementById('start_button');

  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
  this.signOutButton.addEventListener('click', this.signOut.bind(this));
  this.signInButton.addEventListener('click', this.signIn.bind(this));
  this.micButton.addEventListener('click', this.startButton);

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  for (var i = 0; i < langs.length; i++) {
    select_language.options[i] = new Option(langs[i][0], i);
  }
  select_language.selectedIndex = 1;

  if (!('webkitSpeechRecognition' in window)) {
    console.log("Calling Upgrade");
  } else {
    start_button.style.display = 'inline-block';
    recognition = new webkitSpeechRecognition();
    recognition.continuous     = true;
    recognition.interimResults = true;

    recognition.onstart = function() {
      recognizing = true;
      start_img.src = 'mic-animate.gif';
      console.log("Recognition started");
    };
    recognition.onresult = function(event){
      console.log("Speech On Result");
      console.log(event.results);
    };
    recognition.onerror = function(e) {
      start_img.src = 'mic.gif';
      ignore_onend = true;
      console.log("Error");
    };

    recognition.onend = function() {
      console.log("Speech recognition ended");
    };
  }
  this.initFirebase();
}

function updateCountry() {
  targetLanguage = langs[select_language.selectedIndex][1].toString();
  targetSpeechSpeaker = langs[select_language.selectedIndex][2].toString();
}

var startButton = function(event) {
  if (recognizing) {
    recognition.stop();
    return;
  }
  final_transcript = '';
  //recognition.lang = select_dialect.value;
  recognition.start();
  ignore_onend = false;
  start_img.src = '/images/mic-slash.gif';
  start_timestamp = event.timeStamp;
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
FriendlyChat.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  this.storage = firebase.storage();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Loads chat messages history and listens for upcoming ones.
FriendlyChat.prototype.loadMessages = function() {
  // Reference to the /messages/ database path.
  this.messagesRef = this.database.ref('messages');
  // Make sure we remove all previous listeners.
  this.messagesRef.off();

  // Loads the last 12 messages and listen for new ones.
  var setMessage = function(data) {
    var val = data.val();
    if (val.sourceLanguage === targetLanguage){
      this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl)
    } else {
      axios.get(translateText_API,{
          params: {
              q:val.text,
              source:val.sourceLanguage,
              target:targetLanguage
          }
      }).then(res => {
          console.log();
          this.displayMessage(data.key, val.name, res.data.data.translations[0].translatedText, val.photoUrl, val.imageUrl);
      }).catch( (error) => console.log('error', error));
    }
  }.bind(this);
  this.messagesRef.limitToLast(12).on('child_added', setMessage);
  this.messagesRef.limitToLast(12).on('child_changed', setMessage);

  this.messagesRef.limitToLast(1).on('child_added', function(snapshot){
    console.log(snapshot.val().text);
    if ((snapshot.val().uid !== firebase.auth().currentUser.uid)){
      if (snapshot.val().sourceLanguage === targetLanguage){
        responsiveVoice.speak(snapshot.val().text, targetSpeechSpeaker, {volume: 7});
      } else {
        axios.get(translateText_API,{
            params: {
                q:snapshot.val().text,
                source:snapshot.val().sourceLanguage,
                target:targetLanguage
            }
        }).then(res => {
            responsiveVoice.speak(res.data.data.translations[0].translatedText, targetSpeechSpeaker, {volume: 7});
            console.log(res.data.data.translations[0].translatedText);
            //return res.data.data.translations[0].translatedText;
        }).catch( (error) => console.log('error', error));
      }
      
      console.log('What is happening?');
    }

  });

  // this.messagesRef.limitToLast(1).on('child_added',
  //   snapshot => responsiveVoice.speak(snapshot.val().text, "UK English Male", {volume: 5}));

  // responsiveVoice.speak(this.messageInput.value, "UK English Male", {volume: 5});

  // this.messagesRef.limitToLast(1).on('child_changed', snapshot => console.log('WWWW', snapshot.val()));
};

// Saves a new message on the Firebase DB.
FriendlyChat.prototype.saveMessage = function(e) {
  e.preventDefault();

  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && this.checkSignedInWithMessage()) {
    var currentUser = this.auth.currentUser;

    axios.get(detectLanguage_API, {
        params: {
            q:this.messageInput.value
        }
    }).then(res => {
      // Add a new message entry to the Firebase Database.
      this.messagesRef.push({
        uid: this.auth.currentUser.uid,
        name: currentUser.displayName,
        text: this.messageInput.value,
        photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
        sourceLanguage: ((res.data.data.detections[0])[0]).language //get the language that is being used in this text
      }).then(function() {
        // Clear message text field and SEND button state.
        FriendlyChat.resetMaterialTextfield(this.messageInput);
        this.toggleButton();
      }.bind(this)).catch(function(error) {
        console.error('Error writing new message to Firebase Database', error);
      });

    }).catch( (error) => console.log('error', error));

  }
};

// Signs-in Friendly Chat.
FriendlyChat.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
FriendlyChat.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
FriendlyChat.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + (profilePicUrl || '/images/profile_placeholder.png') + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadMessages();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
FriendlyChat.prototype.checkSignedInWithMessage = function() {
  // Return true if the user is signed in Firebase
  if (this.auth.currentUser) {
    return true;
  }

  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Resets the given MaterialTextField.
FriendlyChat.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Template for messages.
FriendlyChat.MESSAGE_TEMPLATE =
    '<div class="message-container">' +
      '<div class="spacing"><div class="pic"></div></div>' +
      '<div class="message"></div>' +
      '<div class="name"></div>' +
    '</div>';

// A loading image URL.
FriendlyChat.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
FriendlyChat.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
  
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
  div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  this.messageInput.focus();
};

// Enables or disables the submit button depending on the values of the input
// fields.
FriendlyChat.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
FriendlyChat.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !window.config) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions.');
  } else if (config.storageBucket === '') {
    window.alert('Your Firebase Storage bucket has not been enabled. Sorry about that. This is ' +
        'actually a Firebase bug that occurs rarely. ' +
        'Please go and re-generate the Firebase initialisation snippet (step 4 of the codelab) ' +
        'and make sure the storageBucket attribute is not empty. ' +
        'You may also need to visit the Storage tab and paste the name of your bucket which is ' +
        'displayed there.');
  }
};

window.onload = function() {
  window.friendlyChat = new FriendlyChat();
};

