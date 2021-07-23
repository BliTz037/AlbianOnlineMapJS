const axios = require('axios');
const HTMLParser = require('node-html-parser');

let config = {
    url: "http://albianonline.fr",
    path: "/map"
}

function getBuildingInfo(arrayID)
{
    let requestArr = new Array;

    return new Promise((resolve, reject) => {
        for (const element of arrayID)
            requestArr.push(axios.get(element));
        axios.all(requestArr)
        .then(axios.spread((...response) => {
            let dataArr = new Array;
            for (const element of response)
                dataArr.push(element.data);
                resolve(dataArr);
            }))
        .catch(error => {
            reject(error)
        })
    });
}

console.log("AlbianOnlineMapJS started !");
console.log("Recherche de parcelle présente sur le serveur...");
axios.get(`${config.url}${config.path}`)
    .then(function(res) {
        const root = HTMLParser.parse(res.data);
        const arrayLocation = root.querySelectorAll('a.marker')
        const arrayID = new Array;
        for (const element of arrayLocation) {
            if (element._rawAttrs.hasOwnProperty("building-id"))
                arrayID.push(`${config.url}${config.path}/caption/building/${element._rawAttrs["building-id"]}`);
            if (element._rawAttrs.hasOwnProperty("monobuilding-id"))
                arrayID.push(`${config.url}${config.path}/caption/monobuilding/${element._rawAttrs["monobuilding-id"]}`);
        }
        console.log(`${arrayID.length} parcelles présentes sur le serveur !`);
        console.log("Recherche des parcelles disponible...");
        console.log(arrayID);
        getBuildingInfo(arrayID)
        .then(result => {
            console.log(result);
            console.log(result.length);
        })
        .catch(error => {
            console.error(error);
        });
    })
    .catch(function(error) {
        console.error(error)
        // if (error.response.status === 404)
        //     console.log("404 Page not found");
        // else
        //     console.log(error.response.status);
    });