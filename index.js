const axios = require('axios');
const HTMLParser = require('node-html-parser');
const tabletojson = require('tabletojson').Tabletojson;
const fs = require('fs');

let config = {
    url: "http://albianonline.fr",
    path: "/map"
}

function getListParcel(selector, root)
{
    let data = {
        length: 0,
        lengthAvailable: 0,
        available: []
    };
    let tab = root.querySelectorAll(selector)
    let tabData = tabletojson.convert(tab.toString())[0];

    if (typeof(tabData) == 'undefined')
        tabData = [];
    data["length"] = tabData.length;
    for (const element of tabData) {
        if (element['location'] != "INDISPONIBLE" ||
            element['achat'] != "INDISPONIBLE")
            data["available"].push(element);
    }
    data["lengthAvailable"] = data["available"].length;
    return data;
}

function getBuildingInfo(buffer)
{
    const root = HTMLParser.parse(buffer);
    let building = { name: root.querySelector('p.caption-view').childNodes[0]._rawText };
    
    if (root.querySelector('#caption-shops') == null &&
        root.querySelector('#caption-apartments') == null) {
            let data = {
                length: 1,
                lengthAvailable: 0,
                available: []
            };
            const buttonArr = root.querySelectorAll("button");
            if (buttonArr[0]._attrs.hasOwnProperty("onclick") ||
                buttonArr[1]._attrs.hasOwnProperty("onclick")) {
                data.available.push({
                    nom: building.name,
                    'étage': '0e',
                    location: root.querySelector("span.value").childNodes[0]._rawText,
                    achat: 'INDISPONIBLE'
                });
                data.lengthAvailable++;
            }
            building["shops"] = data;
    }
    else {
        building["apartements"] = getListParcel("#caption-apartments", root);
        building["shops"] = getListParcel("#caption-shops", root);
    }
    return building;
}

function getAllBuildingPage(arrayID)
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
        let result = new Array;
        for (const element of arrayLocation) {
            if (element._rawAttrs.hasOwnProperty("building-id"))
                arrayID.push(`${config.url}${config.path}/caption/building/${element._rawAttrs["building-id"]}`);
            if (element._rawAttrs.hasOwnProperty("monobuilding-id"))
                arrayID.push(`${config.url}${config.path}/caption/monobuilding/${element._rawAttrs["monobuilding-id"]}`);
        }
        console.log(`${arrayID.length} parcelles présentes sur le serveur !`);
        console.log("Recherche des parcelles disponible...");
        console.log(arrayID);
        getAllBuildingPage(arrayID)
        .then(res => {
            for (const element of res)
                result.push(getBuildingInfo(element));
            console.log(JSON.stringify(result, null, 2));
            let json = JSON.stringify(result, null, 2);
            fs.writeFile('result.json', json, 'utf8', function (err) {
                if (err)
                    console.error(err);
            });
        })
        .catch(error => {
            console.error(error.code);
        });
    })
    .catch(function(error) {
        console.error(error)
    });