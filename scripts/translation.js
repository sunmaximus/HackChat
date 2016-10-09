'use strict';

var translate = function(text, source, destination){
    
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

var detectLanguage = function(text, callback, uid, name, photo, defaultPhoto, messagesRef) {
    console.log("Called");
    axios.get(detectLanguage_API, {
        params: {
            q:text.value
        }
    }).then(res => {
        console.log(((res.data.data.detections[0])[0]).language);
        callback(((res.data.data.detections[0])[0]).language, uid, name, text, photo, defaultPhoto, messagesRef);
    }).catch( (error) => console.log('error', error));
};

