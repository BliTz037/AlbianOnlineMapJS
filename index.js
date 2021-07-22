const axios = require('axios');
const HTMLParser = require('node-html-parser');

let config = {
    url: "http://albianonline.fr",
    path: "/map"
}

axios.get(`${config.url}${config.path}`)
    .then(function(res) {
        const root = HTMLParser.parse(res.data);
        const arrayLocation = root.querySelectorAll('a.marker')
        const arrayID = new Array;
        for (const element of arrayLocation) {
            if (element._rawAttrs.hasOwnProperty("building-id"))
                arrayID.push({type: "building", id: element._rawAttrs["building-id"]});
            if (element._rawAttrs.hasOwnProperty("monobuilding-id"))
                arrayID.push({type: "monobuilding", id: element._rawAttrs["monobuilding-id"]});
        }
        console.log(arrayID.length);
        console.log(arrayID);
    })
    .catch(function(error) {
        console.error(error)
        // if (error.response.status === 404)
        //     console.log("404 Page not found");
        // else
        //     console.log(error.response.status);
    });