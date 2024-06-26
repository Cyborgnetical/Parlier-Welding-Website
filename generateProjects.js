import { google } from "googleapis";
import fs from "fs";
import path from "path";
import crypto from "crypto"
import * as dotenv from "dotenv";
dotenv.config();

const drive = google.drive({ version: "v3", auth: process.env.GOOGLE_API_KEY });
const oauth2Client = new google.auth.GoogleAuth({
    keyFile: "secrets/moarloginStuff.json",
    scopes: ["https://www.googleapis.com/auth/documents.readonly"],
});

const docs = google.docs({ version: "v1", auth: oauth2Client });

let projectJSON = []

function getFileName(file = "") {
    return file.split(".").slice(0, -1).join(".");
}
let lineee = 0;
function isImage(element) {
    // Check if the element is a table (which images are represented as)
    if (!element.table) return false;

    // Iterate through rows in the table
    for (let row of element.table.rows) {
        // Iterate through cells in the row
        for (let cell of row.cells) {
            // Check if the cell contains an image
            if (cell.image) {
                return true; // Found an image
            }
        }
    }

    return false; // No image found
}

async function getDocData(id=""){
    let txt = ""
    await docs.documents.get({
        documentId: id,
        fields: 'body.content'
    }).then((val) => {
        val.data.body.content.forEach((el) => {
            if (el.paragraph && el.paragraph.elements) {
                el.paragraph.elements.forEach((elm) => {
                    let text = []
                    if(elm.horizontalRule){
                        text="<hr>"
                    }
                    else if (elm.textRun) {
                        let style = ""
                        text.push(elm.textRun.content)
                        if(elm.textRun.content=="\n"){

                        }else{
                            // handles font size and familiy
                            if(elm.textRun.textStyle){
                                if(elm.textRun.textStyle.fontSize){
                                    style += `font-size:${elm.textRun.textStyle.fontSize.magnitude}px; `
                                }
                                if(elm.textRun.textStyle.weightedFontFamily){
                                    style += `font-family:"${elm.textRun.textStyle.weightedFontFamily.fontFamily}"`
                                }
                            }
                            text.unshift(`<p style="${style}">`)
                            text.push(`</p>`)
                            if(elm.textRun.textStyle.bold){
                                text.unshift("<b>")
                                text.push("</b>")
                            }
                            if(elm.textRun.textStyle.italic){
                                text.unshift("<i>")
                                text.push("</i>")
                            }
                        }
                        let finalText = text.join('')
                        txt+=" "+finalText+" "
                    }
                });
            }
        });
    });
    return txt

}
async function fetchFiles(token = "") {
    // List files in the public folder
    const response = await drive.files.list({
        q: `'${process.env.GOOLGE_FOLDER_ID_PROJECTS}' in parents`,
        pageSize: 1000,
        //pageToken: token,
        key: process.env.GOOGLE_API_KEY,
        fields: 'nextPageToken, files(id, name, createdTime)'
    });
    // if folder exists
    if(response.data.files){
        let folders = response.data.files
        for(let i=0;i<folders.length;i++){
            let folder = folders[i]
            let date = new Date(folder.createdTime)
            let data = {
                slug:folder.id,
                name:folder.name,
                dateAdded:date.getMonth()+"-"+date.getDay()+"-"+date.getFullYear(),
                desc:"",
                displayURL:"",
                text:"",
                images:[]
            }
            let folderData = await drive.files.list({
                q:`'${folder.id}' in parents`,
                pageSize:200,
                key: process.env.GOOGLE_API_KEY
            })
            for(let o=0;o<folderData.data.files.length;o++){
                let folderfile = folderData.data.files[o]
                // if it doc
                if(folderfile.mimeType.startsWith("application/vnd.google-apps.document")){
                    if(folderfile.name == "Post"){
                        data.text = await getDocData(folderfile.id)
                    }else if(folderfile.name == "Desc"){
                        data.desc = await getDocData(folderfile.id)
                    }
                }else if(folderfile.mimeType.startsWith("image/") && getFileName(folderfile.name).toLowerCase() == "display" ){
                    data.displayURL = `https://lh3.googleusercontent.com/d/${folderfile.id}`
                }else if(folderfile.mimeType.startsWith("image/")){
                    data.images.push(`https://lh3.googleusercontent.com/d/${folderfile.id}`)
                }
            }

            //console.log(images.data.files)
            projectJSON.push(data)
        }
    }
}

await fetchFiles()

await fs.writeFileSync(path.join(process.cwd(),"data","projects","projects.json"),JSON.stringify(projectJSON,null,4),(err)=>{
    if(err){
        console.log("Faliure to write file")
        console.log("error:\n--------------------------------\n"+err)
    }else{
        console.log("writing file successful")
    }
})

console.log("End of execution")