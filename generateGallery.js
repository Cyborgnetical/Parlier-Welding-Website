import { google } from "googleapis";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const drive = google.drive({ version: "v3", auth: process.env.GOOGLE_API_KEY });

const oauth2Client = new google.auth.GoogleAuth({
    keyFile: "secrets/loginStuff.json",
    scopes: ["https://www.googleapis.com/auth/documents.readonly"],
});
const docs = google.docs({ version: "v1", auth: oauth2Client });

console.log(process.env.GOOGLE_API_KEY);

let galleryPath = path.join(process.cwd(), "data", "gallery", "gallery.json");
let galleryData = [];

/**
 *
 * @param {string} file The full name of a file, for example: "Hello.png"
 * @returns {string} The file name without the extension
 */
function getFileName(file = "") {
    return file.split(".").slice(0, -1).join(".");
}
/**
 * Takes in the goolgle drive response and returns weather its empty or not.
 *
 * True if empty.
 *
 * False if contains something.
 * @param {GaxiosResponse<drive_v3.Schema$FileList>} response
 * @returns {boolean}
 */
function emptyresponse(response) {
    return (
        !response.data ||
        !response.data.files ||
        response.data.files.length === 0
    );
}

async function fetchFiles(token = "") {
    // List files in the public folder
    const response = await drive.files.list({
        q: `'${process.env.GOOGLE_FOLDER_ID}' in parents AND (mimeType='image/jpeg' OR mimeType='image/jpg' OR mimeType='image/png')`,
        pageSize: 5,
        pageToken: token,
        key: process.env.GOOGLE_API_KEY,
    });

    const files = response.data.files;
    if (files.length) {
        console.log("Files:");
        await files.forEach(async (file) => {
            let data = {
                name: file.name || "",
                url: `https://lh3.googleusercontent.com/d/${file.id}`,
                id:file.id,
                video: ``,
                desc: "",
            };
            const relatedResponse = await drive.files.list({
                q: `'${
                    process.env.GOOGLE_FOLDER_ID
                }' in parents and name contains '${getFileName(
                    file.name
                )}' and trashed = false`,
                fields: "files(id, name, mimeType)",
            });
            relatedResponse.data.files.forEach((file) => {
                if (
                    file.mimeType.startsWith(
                        "application/vnd.google-apps.document"
                    )
                ) {
                    console.log(file.id);
                    docs.documents
                        .get({
                            documentId: file.id,
                            fields: "body.content",
                        })
                        .then((val) => {
                            let txt = "";
                            val.data.body.content.forEach((el) => {
                                if (el.paragraph && el.paragraph.elements) {
                                    el.paragraph.elements.forEach((elm) => {
                                        if (elm.textRun) {
                                            txt += elm.textRun.content;
                                        }
                                    });
                                }
                            });
                            data.desc = txt;
                        });
                }
            });
            galleryData.push(data);
        });
    } else {
        console.log("No files found.");
    }
    if (response.data.nextPageToken) {
        await fetchFiles(response.data.nextPageToken);
    }
}

// Call the function to fetch images from the public folder
await fetchFiles().then();
setTimeout(()=>{
    fs.writeFile(galleryPath, JSON.stringify(galleryData, null, 4), (err) => {
        console.log(err);
    });
    console.log("do it work")
    console.log("it do!!!!!!")
},2000)
