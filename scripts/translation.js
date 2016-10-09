'use strict';

const API_KEY = "AIzaSyBOHmgokLOaN-k-CfYWFJSZLsUbs0DG6Z0";
const translateText_API = `https://www.googleapis.com/language/translate/v2?key=${API_KEY}`;
const detectLanguage_API = `https://www.googleapis.com/language/translate/v2/detect?key=${API_KEY}`;

var translate = function(text, source, destination){

        if (text === '') {
            text = 'Say Something';
        }
        axios.get(translateText_API,{
            params: {
                q:text,
                source:source,
                target:destination
            }
        }).then(res => {
            console.log(res.data.data.translations[0].translatedText);
            return res.data.data.translations[0].translatedText;
        }).catch( (error) => console.log('error', error));

};

var detectLanguage = function(text) {
    console.log('what?????');
    if (text === '') {
        text = "Say Something";
    }
    axios.get(detectLanguage_API, {
        params: {
            q:text
        }
    }).then(res => {
        console.log(((res.data.data.detections[0])[0]).language);
        return ((res.data.data.detections[0])[0]).language;
    }).catch( (error) => console.log('error', error));
};
